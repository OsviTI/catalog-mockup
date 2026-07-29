import { ImagePlus, Palette, Save, SlidersHorizontal, Sparkles, Upload } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import ProductImage from '../components/catalog/ProductImage'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { useAssetUrl } from '../hooks/useAssetUrl'
import { persistBlob } from '../lib/database'
import { useParams } from '../lib/router'
import { useCatalogStore } from '../store/catalogStore'
import type { CreativeAsset, Product } from '../types/catalog'

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('No se pudo cargar la imagen.'))
    image.src = src
  })

const canvasBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('No se pudo procesar la imagen.'))),
      'image/jpeg',
      0.9,
    ),
  )

const escapeXml = (value: string) =>
  value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

function PhotoEditor({ product }: { product: Product }) {
  const catalogId = product.catalogId
  const originalUrl = useAssetUrl(product.image)
  const addCreativeAsset = useCatalogStore((state) => state.addCreativeAsset)
  const applyToProduct = useCatalogStore((state) => state.applyCreativeAssetToProduct)
  const [localUrl, setLocalUrl] = useState('')
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [saturation, setSaturation] = useState(100)
  const [apply, setApply] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const sourceUrl = localUrl || originalUrl

  useEffect(
    () => () => {
      if (localUrl.startsWith('blob:')) URL.revokeObjectURL(localUrl)
    },
    [localUrl],
  )

  const save = async () => {
    if (!sourceUrl) return
    setSaving(true)
    setMessage('')
    try {
      const image = await loadImage(sourceUrl)
      const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
      const context = canvas.getContext('2d')
      if (!context) throw new Error('El navegador no admite edición con canvas.')
      context.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
      const blob = await canvasBlob(canvas)
      const name = `${product.code || 'producto'}-mejorada.jpg`
      const stored = await persistBlob(blob, name)
      addCreativeAsset({
        id: `creative-${crypto.randomUUID()}`,
        catalogId,
        assetId: stored.id,
        name,
        kind: 'enhanced-product',
        sourceProductId: product.id,
        createdAt: new Date().toISOString(),
      })
      if (apply) applyToProduct(product.id, stored.id, name)
      setMessage(
        apply
          ? 'La versión mejorada se guardó y se vinculó al producto.'
          : 'La versión mejorada se guardó en el historial creativo.',
      )
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo procesar la imagen.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="surface-card overflow-hidden">
        <div className="border-b border-border p-5">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-blue-50 p-2 text-blue-700">
              <SlidersHorizontal className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-bold text-text">Mejora de fotografía real</h2>
              <p className="text-xs text-text-tertiary">
                Procesamiento local, conserva el original y crea un recurso nuevo.
              </p>
            </div>
          </div>
        </div>
        <div className="flex min-h-[460px] items-center justify-center bg-slate-100 p-6">
          {sourceUrl ? (
            <img
              src={sourceUrl}
              alt={product.name}
              className="max-h-[560px] max-w-full rounded-2xl object-contain shadow-xl"
              style={{
                filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
              }}
            />
          ) : (
            <label className="cursor-pointer rounded-3xl border-2 border-dashed border-slate-300 bg-white p-10 text-center hover:border-primary/40">
              <ImagePlus className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-3 text-sm font-bold">Carga una fotografía del producto</p>
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) setLocalUrl(URL.createObjectURL(file))
                }}
              />
            </label>
          )}
        </div>
      </div>

      <aside className="surface-card self-start p-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-sm font-bold text-text">{product.name}</p>
            <p className="mt-1 font-mono text-xs text-text-tertiary">{product.code}</p>
          </div>
          <Badge tone="primary">No destructivo</Badge>
        </div>

        <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-slate-50">
          <Upload className="h-4 w-4" /> Usar otra fotografía
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (!file) return
              if (localUrl.startsWith('blob:')) URL.revokeObjectURL(localUrl)
              setLocalUrl(URL.createObjectURL(file))
            }}
          />
        </label>

        {[
          ['Iluminación', brightness, setBrightness],
          ['Contraste', contrast, setContrast],
          ['Saturación', saturation, setSaturation],
        ].map(([label, value, setter]) => (
          <label key={String(label)} className="mt-5 block text-xs font-semibold text-text-secondary">
            <span className="flex justify-between">
              {String(label)}
              <span>{Number(value)}%</span>
            </span>
            <input
              type="range"
              min="50"
              max="160"
              value={Number(value)}
              onChange={(event) => (setter as (value: number) => void)(Number(event.target.value))}
              className="mt-2 w-full accent-primary"
            />
          </label>
        ))}

        <label className="mt-6 flex items-start gap-3 rounded-xl bg-slate-50 p-3 text-xs leading-5 text-text-secondary">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-primary"
            checked={apply}
            onChange={(event) => setApply(event.target.checked)}
          />
          Vincular el resultado al producto. El original seguirá disponible en versiones anteriores.
        </label>
        <Button
          className="mt-4 w-full"
          icon={<Save className="h-4 w-4" />}
          loading={saving}
          disabled={!sourceUrl}
          onClick={() => void save()}
        >
          Guardar versión mejorada
        </Button>
        {message ? <p className="mt-3 text-xs leading-5 text-primary">{message}</p> : null}
      </aside>
    </section>
  )
}

export default function CatalogCreativePage() {
  const { catalogId = '' } = useParams()
  const workspace = useCatalogStore((state) => state.workspace)
  const addCreativeAsset = useCatalogStore((state) => state.addCreativeAsset)
  const products = useMemo(
    () => workspace.products.filter((product) => product.catalogId === catalogId),
    [catalogId, workspace.products],
  )
  const creativeAssets = workspace.creativeAssets.filter((asset) => asset.catalogId === catalogId)
  const [productId, setProductId] = useState(products[0]?.id ?? '')
  const [prompt, setPrompt] = useState('Mesa elegante con cristalería, iluminación cálida y fondo editorial')
  const [palette, setPalette] = useState('#1e3a8a')
  const [message, setMessage] = useState('')
  const selectedProduct = products.find((product) => product.id === productId) ?? products[0]

  const generateConcept = async () => {
    const title = escapeXml(prompt.trim() || 'Concepto editorial')
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${palette}"/><stop offset="1" stop-color="#0f172a"/></linearGradient></defs>
      <rect width="1200" height="800" fill="url(#g)"/>
      <circle cx="1040" cy="90" r="280" fill="white" opacity=".08"/>
      <circle cx="1040" cy="90" r="180" fill="none" stroke="white" stroke-width="2" opacity=".22"/>
      <path d="M120 590 C330 440 470 690 690 510 S1010 470 1120 350" fill="none" stroke="white" stroke-width="5" opacity=".25"/>
      <text x="90" y="610" fill="white" font-family="Arial, sans-serif" font-size="24" opacity=".7">CONCEPTO VISUAL</text>
      <foreignObject x="85" y="640" width="1000" height="120"><div xmlns="http://www.w3.org/1999/xhtml" style="color:white;font:700 42px Arial;line-height:1.15">${title}</div></foreignObject>
    </svg>`
    const blob = new Blob([svg], { type: 'image/svg+xml' })
    const name = `concepto-${Date.now()}.svg`
    const stored = await persistBlob(blob, name)
    const asset: CreativeAsset = {
      id: `creative-${crypto.randomUUID()}`,
      catalogId,
      assetId: stored.id,
      name,
      kind: 'concept-cover',
      prompt,
      createdAt: new Date().toISOString(),
    }
    addCreativeAsset(asset)
    setMessage('Concepto guardado. El conector de IA podrá sustituir este generador local sin cambiar el flujo.')
  }

  return (
    <div className="space-y-5">
      <section className="surface-card p-5 sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex items-start gap-4">
            <span className="rounded-2xl bg-violet-50 p-3 text-violet-700">
              <Sparkles className="h-6 w-6" />
            </span>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold">Estudio creativo</h1>
                <Badge tone="warning">Adaptador IA pendiente</Badge>
              </div>
              <p className="mt-1 max-w-2xl text-sm leading-6 text-text-secondary">
                Ya permite mejorar fotografías de forma local y preparar conceptos visuales. La futura IA usará este mismo historial, referencias y aprobación manual.
              </p>
            </div>
          </div>
          <select
            className="field-control max-w-sm"
            value={selectedProduct?.id ?? ''}
            onChange={(event) => setProductId(event.target.value)}
          >
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.code} · {product.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      {selectedProduct ? <PhotoEditor product={selectedProduct} /> : null}

      <section className="surface-card p-5 sm:p-6">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-violet-50 p-2 text-violet-700">
            <Palette className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-bold">Concepto de portada o categoría</h2>
            <p className="text-xs text-text-tertiary">Prototipo local preparado para un proveedor generativo.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_90px_auto]">
          <textarea
            className="field-control min-h-24 resize-y"
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Describe ambiente, luz, estilo, composición y restricciones de marca…"
          />
          <label className="text-xs font-semibold text-text-secondary">
            Paleta
            <input
              type="color"
              value={palette}
              onChange={(event) => setPalette(event.target.value)}
              className="mt-1 h-14 w-full cursor-pointer rounded-xl border border-border bg-white p-1"
            />
          </label>
          <Button
            className="self-end"
            icon={<Sparkles className="h-4 w-4" />}
            onClick={() => void generateConcept()}
          >
            Crear concepto
          </Button>
        </div>
        {message ? <p className="mt-3 text-sm font-medium text-primary">{message}</p> : null}
      </section>

      {creativeAssets.length ? (
        <section className="surface-card p-5 sm:p-6">
          <h2 className="font-bold">Historial creativo</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {creativeAssets.map((asset) => (
              <article key={asset.id} className="overflow-hidden rounded-2xl border border-border">
                <ProductImage
                  image={{ assetId: asset.assetId }}
                  alt={asset.name}
                  className="aspect-[4/3] h-auto w-full object-cover"
                />
                <div className="p-3">
                  <p className="truncate text-sm font-bold">{asset.name}</p>
                  <p className="mt-1 text-xs text-text-tertiary">
                    {asset.kind === 'enhanced-product' ? 'Fotografía mejorada' : 'Concepto visual'}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
