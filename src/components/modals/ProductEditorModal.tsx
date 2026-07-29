import { ImagePlus, Star, Upload } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { persistAsset } from '../../lib/database'
import { useCatalogStore } from '../../store/catalogStore'
import type { Product } from '../../types/catalog'
import ProductImage from '../catalog/ProductImage'
import Button from '../ui/Button'
import { InputField, SelectField } from '../ui/FormField'
import Modal from '../ui/Modal'

interface ProductEditorModalProps {
  productId: string | null
  open: boolean
  onClose: (saved?: boolean) => void
}

export default function ProductEditorModal({ productId, open, onClose }: ProductEditorModalProps) {
  const product = useCatalogStore((state) =>
    state.workspace.products.find((item) => item.id === productId),
  )
  const allCategories = useCatalogStore(
    (state) => state.workspace.categories,
  )
  const categories = useMemo(
    () => allCategories.filter((item) => item.catalogId === product?.catalogId),
    [allCategories, product?.catalogId],
  )
  const updateProduct = useCatalogStore((state) => state.updateProduct)
  const [draft, setDraft] = useState<Product | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [fileError, setFileError] = useState('')
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    setDraft(product ? structuredClone(product) : null)
    setPendingFile(null)
    setFileError('')
    setSaveError('')
  }, [product, open])

  const pendingUrl = useMemo(() => (pendingFile ? URL.createObjectURL(pendingFile) : ''), [pendingFile])
  useEffect(() => () => pendingUrl && URL.revokeObjectURL(pendingUrl), [pendingUrl])

  if (!draft) return null

  const change = <Key extends keyof Product>(key: Key, value: Product[Key]) =>
    setDraft((current) => (current ? { ...current, [key]: value } : current))

  const handleFile = (file?: File) => {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFileError('Utiliza una imagen JPG, PNG o WebP.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setFileError('La imagen supera el máximo de 10 MB.')
      return
    }
    setPendingFile(file)
    setFileError('')
  }

  const handleSave = async () => {
    if (!draft.name.trim() || !draft.code.trim()) return
    setSaving(true)
    setSaveError('')
    try {
      let image = draft.image
      if (pendingFile) {
        const asset = await persistAsset(pendingFile)
        image = { assetId: asset.id, name: asset.name, focalPoint: 'center' }
      }
      updateProduct(draft.id, { ...draft, image })
      onClose(true)
    } catch {
      setSaveError('No pudimos guardar la imagen. Intenta nuevamente.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => onClose(false)}
      title={draft.name === 'Nuevo producto' ? 'Agregar producto' : 'Editar producto'}
      description="Los cambios se reflejan inmediatamente en todas las vistas del catálogo."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={() => onClose(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} loading={saving} disabled={!draft.name.trim() || !draft.code.trim()}>
            Guardar producto
          </Button>
        </>
      }
    >
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <div>
          <div className="aspect-square overflow-hidden rounded-3xl border border-border bg-slate-50">
            {pendingUrl ? (
              <img src={pendingUrl} alt="Vista previa" className="h-full w-full object-cover" />
            ) : (
              <ProductImage image={draft.image} alt={draft.name} className="h-full w-full object-cover" />
            )}
          </div>
          <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border bg-white px-3 py-2.5 text-sm font-semibold text-text-secondary transition hover:bg-slate-50">
            <Upload className="h-4 w-4" />
            {draft.image.src || draft.image.assetId ? 'Reemplazar imagen' : 'Cargar imagen'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
          </label>
          {fileError ? <p className="mt-2 text-xs font-medium text-error">{fileError}</p> : null}
          {saveError ? <p className="mt-2 text-xs font-medium text-error">{saveError}</p> : null}
          <p className="mt-3 text-xs leading-5 text-text-tertiary">
            JPG, PNG o WebP · máximo 10 MB. El sistema conserva el original.
          </p>
          <button
            type="button"
            onClick={() => change('featured', !draft.featured)}
            className={`mt-4 flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
              draft.featured
                ? 'border-amber-300 bg-amber-50 text-amber-800'
                : 'border-border text-text-secondary hover:bg-slate-50'
            }`}
          >
            <Star className={`h-4 w-4 ${draft.featured ? 'fill-current' : ''}`} />
            {draft.featured ? 'Producto destacado' : 'Marcar como destacado'}
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <InputField
              label="Nombre del producto"
              value={draft.name}
              onChange={(event) => change('name', event.target.value)}
              required
            />
          </div>
          <InputField
            label="Código"
            value={draft.code}
            onChange={(event) => change('code', event.target.value)}
            required
          />
          <InputField
            label="Precio"
            type="number"
            min="0"
            step="0.01"
            value={draft.price}
            onChange={(event) => change('price', Number(event.target.value))}
          />
          <SelectField
            label="Categoría"
            value={draft.categoryId}
            onChange={(event) => change('categoryId', event.target.value)}
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </SelectField>
          <InputField
            label="Orden"
            type="number"
            min="1"
            value={draft.order}
            onChange={(event) => change('order', Number(event.target.value))}
          />
          <InputField
            label="Medidas"
            value={draft.measurements}
            onChange={(event) => change('measurements', event.target.value)}
            placeholder="Ej. Ø9 cm × 18 cm"
          />
          <InputField
            label="Capacidad"
            value={draft.capacity ?? ''}
            onChange={(event) => change('capacity', event.target.value)}
            placeholder="Ej. 590 ml"
          />
          <InputField
            label="Material"
            value={draft.material}
            onChange={(event) => change('material', event.target.value)}
          />
          <InputField
            label="Color"
            value={draft.color ?? ''}
            onChange={(event) => change('color', event.target.value)}
          />
          <InputField
            label="Embalaje"
            value={draft.packaging}
            onChange={(event) => change('packaging', event.target.value)}
          />
          <InputField
            label="Modelo"
            value={draft.model ?? ''}
            onChange={(event) => change('model', event.target.value)}
          />
          <InputField
            label="Pack"
            value={draft.pack}
            onChange={(event) => change('pack', event.target.value)}
          />
          <InputField
            label="Master / bulto"
            value={draft.master}
            onChange={(event) => change('master', event.target.value)}
          />
          <div className="sm:col-span-2 rounded-2xl border border-border bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-text">
              <ImagePlus className="h-4 w-4 text-primary" />
              Imagen editorial
            </div>
            <p className="mt-1 text-xs leading-5 text-text-secondary">
              El recorte y punto focal podrán ajustarse en el editor de plantilla sin alterar el archivo original.
            </p>
          </div>
        </div>
      </div>
    </Modal>
  )
}
