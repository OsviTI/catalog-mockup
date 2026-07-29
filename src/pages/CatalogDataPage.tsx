import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Filter,
  ImageIcon,
  LoaderCircle,
  PackagePlus,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
  Upload,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useParams } from '../lib/router'
import ProductImage from '../components/catalog/ProductImage'
import ProductCreativeModal from '../components/modals/ProductCreativeModal'
import ProductEditorModal from '../components/modals/ProductEditorModal'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import { downloadCatalogWorkbook, importProductsFile, type ImportResult } from '../lib/excel'
import { persistAsset } from '../lib/database'
import { formatCurrency } from '../lib/format'
import { validateProducts } from '../lib/validation'
import { useCatalogStore } from '../store/catalogStore'

export default function CatalogDataPage() {
  const { catalogId = '' } = useParams()
  const workspace = useCatalogStore((state) => state.workspace)
  const addProduct = useCatalogStore((state) => state.addProduct)
  const deleteProduct = useCatalogStore((state) => state.deleteProduct)
  const updateProduct = useCatalogStore((state) => state.updateProduct)
  const createExcelImportSession = useCatalogStore((state) => state.createExcelImportSession)
  const addCategory = useCatalogStore((state) => state.addCategory)
  const flushSave = useCatalogStore((state) => state.flushSave)
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [editorId, setEditorId] = useState<string | null>(null)
  const [newProductId, setNewProductId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importError, setImportError] = useState('')
  const [importing, setImporting] = useState(false)
  const [categoryName, setCategoryName] = useState('')
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [creativeId, setCreativeId] = useState<string | null>(null)
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null)
  const [imageMessage, setImageMessage] = useState('')
  const [imageError, setImageError] = useState('')

  const catalog = workspace.catalogs.find((item) => item.id === catalogId)
  const categories = workspace.categories
    .filter((item) => item.catalogId === catalogId)
    .sort((a, b) => a.order - b.order)
  const products = workspace.products
    .filter((item) => item.catalogId === catalogId)
    .sort((a, b) => a.order - b.order)
  const issues = useMemo(() => validateProducts(products), [products])
  const errors = issues.filter((item) => item.level === 'error')
  const warnings = issues.filter((item) => item.level === 'warning')

  const filtered = products.filter((product) => {
    const term = search.toLowerCase()
    const matchesSearch =
      product.name.toLowerCase().includes(term) || product.code.toLowerCase().includes(term)
    return matchesSearch && (categoryFilter === 'all' || product.categoryId === categoryFilter)
  })

  if (!catalog) return null

  const handleAddProduct = () => {
    const categoryId = categoryFilter === 'all' ? categories[0]?.id : categoryFilter
    if (!categoryId) return
    const productId = addProduct(catalogId, categoryId)
    setNewProductId(productId)
    setEditorId(productId)
  }

  const replaceProductImage = async (productId: string, file?: File) => {
    if (!file) return
    setImageMessage('')
    setImageError('')
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setImageError('Utiliza una imagen JPG, PNG o WebP.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setImageError('La imagen supera el máximo de 10 MB.')
      return
    }
    setUploadingImageId(productId)
    try {
      const asset = await persistAsset(file)
      updateProduct(productId, {
        image: { assetId: asset.id, name: asset.name, focalPoint: 'center' },
      })
      setImageMessage('La fotografía se actualizó y ya se refleja en el catálogo.')
    } catch {
      setImageError('No pudimos guardar la fotografía. Intenta nuevamente.')
    } finally {
      setUploadingImageId(null)
    }
  }

  const parseImport = async (file: File) => {
    setImportFile(file)
    setImportResult(null)
    setImportError('')
    setImporting(true)
    try {
      setImportResult(await importProductsFile(file, catalogId, categories))
    } catch (error) {
      setImportError(error instanceof Error ? error.message : 'No pudimos leer esta planilla.')
    } finally {
      setImporting(false)
    }
  }

  const closeImport = () => {
    setImportOpen(false)
    setImportFile(null)
    setImportResult(null)
    setImportError('')
  }

  const confirmImport = async () => {
    if (!importResult || !importFile) return
    createExcelImportSession(
      catalogId,
      importFile.name,
      importResult.products,
      importResult.warnings,
      importResult.importedFields,
    )
    await flushSave()
    closeImport()
    navigate(`/catalogos/${catalogId}/importaciones`)
  }

  return (
    <div className="grid gap-5 2xl:grid-cols-[1fr_320px]">
      <ProductEditorModal
        open={Boolean(editorId)}
        productId={editorId}
        onClose={(saved) => {
          if (!saved && editorId === newProductId) deleteProduct(editorId)
          setNewProductId(null)
          setEditorId(null)
        }}
      />
      <ProductCreativeModal
        open={Boolean(creativeId)}
        productId={creativeId}
        onClose={() => setCreativeId(null)}
      />
      <Modal
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        title="Eliminar producto"
        description="El producto dejará de aparecer en la vista previa del catálogo."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleteId) deleteProduct(deleteId)
                setDeleteId(null)
              }}
            >
              Eliminar
            </Button>
          </>
        }
      >
        <p className="text-sm leading-6 text-text-secondary">
          Esta modificación se guardará automáticamente. Las versiones PDF anteriores conservarán el producto.
        </p>
      </Modal>

      <Modal
        open={importOpen}
        onClose={closeImport}
        title="Importar productos"
        description="Compatible con la plantilla oficial Excel y archivos CSV."
        size="lg"
        footer={
          <>
            <Button variant="ghost" onClick={closeImport}>
              Cancelar
            </Button>
            <Button
              onClick={() => void confirmImport()}
              disabled={!importResult?.products.length}
            >
              Comparar {importResult?.products.length ?? 0} productos
            </Button>
          </>
        }
      >
        <label
          className={`flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed px-6 py-10 text-center transition ${
            importFile ? 'border-primary/40 bg-primary/5' : 'border-slate-300 hover:border-primary/40 hover:bg-slate-50'
          }`}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            const file = event.dataTransfer.files[0]
            if (file) void parseImport(file)
          }}
        >
          <span className="rounded-2xl bg-white p-3 text-primary shadow-sm ring-1 ring-slate-200">
            <Upload className="h-6 w-6" />
          </span>
          <p className="mt-4 text-sm font-bold text-text">
            {importFile ? importFile.name : 'Selecciona o arrastra una planilla'}
          </p>
          <p className="mt-1 text-xs text-text-tertiary">XLSX, XLS o CSV · primera hoja: Productos</p>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0]
              if (file) void parseImport(file)
            }}
          />
        </label>

        {importing ? (
          <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-text-secondary">
            Analizando columnas y normalizando productos…
          </div>
        ) : null}
        {importError ? (
          <div className="mt-4 flex gap-3 rounded-2xl border border-error/20 bg-error/5 p-4 text-sm text-error">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            {importError}
          </div>
        ) : null}
        {importResult ? (
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-success/20 bg-success/5 p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-success" />
                <div>
                  <p className="text-sm font-bold text-text">Planilla lista para comparar</p>
                  <p className="text-xs text-text-secondary">
                    {importResult.products.length} productos detectados
                  </p>
                </div>
              </div>
              <Badge tone="success">Validada</Badge>
            </div>
            {importResult.warnings.map((warning) => (
              <div
                key={warning}
                className="flex gap-3 rounded-2xl border border-warning/20 bg-warning/5 p-3 text-xs leading-5 text-warning-strong"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {warning}
              </div>
            ))}
            {products.length ? (
              <p className="text-xs text-text-tertiary">
                Al confirmar se abrirá una revisión detallada. Ningún producto se reemplaza o elimina automáticamente.
              </p>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <section className="surface-card min-w-0 overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:p-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">Productos</h2>
              <Badge tone={errors.length ? 'danger' : warnings.length ? 'warning' : 'success'}>
                {errors.length ? `${errors.length} errores` : warnings.length ? `${warnings.length} avisos` : 'Todo listo'}
              </Badge>
            </div>
            <p className="mt-1 text-sm text-text-secondary">
              Administra el contenido que alimentará las páginas del catálogo.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              icon={<Download className="h-4 w-4" />}
              onClick={() => void downloadCatalogWorkbook(catalog, categories, products, true)}
            >
              Plantilla Excel
            </Button>
            <Button
              variant="secondary"
              icon={<Upload className="h-4 w-4" />}
              onClick={() => setImportOpen(true)}
            >
              Importar
            </Button>
            <Button icon={<Plus className="h-4 w-4" />} onClick={handleAddProduct}>
              Agregar producto
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-b border-border bg-slate-50/60 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row">
            <label className="relative max-w-sm flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por nombre o código"
                className="h-10 w-full rounded-xl border border-border bg-white pl-9 pr-3 text-sm outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/8"
              />
            </label>
            <label className="relative">
              <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
              <select
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
                className="h-10 rounded-xl border border-border bg-white pl-9 pr-8 text-sm outline-none focus:border-primary/50"
                aria-label="Filtrar categoría"
              >
                <option value="all">Todas las categorías</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="text-xs font-medium text-text-tertiary">{filtered.length} resultados</p>
        </div>

        {imageMessage || imageError ? (
          <div
            className={`border-b px-5 py-3 text-xs font-medium sm:px-6 ${
              imageError
                ? 'border-error/15 bg-error/5 text-error'
                : 'border-success/15 bg-success/5 text-success-strong'
            }`}
          >
            {imageError || imageMessage}
          </div>
        ) : null}

        {filtered.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-[1120px] w-full text-left text-sm">
              <thead className="border-b border-border bg-white text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
                <tr>
                  <th className="px-6 py-3">Producto</th>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3">Datos técnicos</th>
                  <th className="px-6 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((product) => {
                  const category = categories.find((item) => item.id === product.categoryId)
                  const productIssues = issues.filter((item) => item.productId === product.id)
                  return (
                    <tr key={product.id} className="group bg-white transition hover:bg-slate-50/80">
                      <td className="px-6 py-4">
                        <button
                          type="button"
                          onClick={() => setEditorId(product.id)}
                          className="flex max-w-xs items-center gap-3 text-left"
                        >
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-border bg-slate-100">
                            <ProductImage image={product.image} alt={product.name} className="h-full w-full object-cover" />
                            {product.featured ? (
                              <span className="absolute right-1 top-1 rounded-md bg-amber-400 p-0.5 text-white">
                                <Star className="h-2.5 w-2.5 fill-current" />
                              </span>
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <p className="line-clamp-2 font-bold text-text group-hover:text-primary">{product.name}</p>
                            <div className="mt-1 flex gap-1">
                              {productIssues.slice(0, 1).map((issue) => (
                                <Badge key={issue.id} tone={issue.level === 'error' ? 'danger' : 'warning'}>
                                  {issue.level === 'error' ? 'Revisar' : 'Aviso'}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </button>
                      </td>
                      <td className="px-4 py-4 font-mono text-xs text-text-secondary">{product.code || '—'}</td>
                      <td className="px-4 py-4">
                        <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-text-secondary">
                          {category?.name ?? 'Sin categoría'}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-bold text-text">
                        {formatCurrency(product.price, product.currency)}
                      </td>
                      <td className="px-4 py-4">
                        <p className="text-xs font-medium text-text">{product.material || 'Sin material'}</p>
                        <p className="mt-1 text-xs text-text-tertiary">{product.measurements || 'Sin medidas'}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap justify-end gap-1">
                          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-text-secondary hover:bg-slate-100">
                            {uploadingImageId === product.id ? (
                              <LoaderCircle className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ImageIcon className="h-3.5 w-3.5" />
                            )}
                            Actualizar foto
                            <input
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              className="sr-only"
                              disabled={Boolean(uploadingImageId)}
                              onChange={(event) => {
                                const file = event.target.files?.[0]
                                event.target.value = ''
                                void replaceProductImage(product.id, file)
                              }}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setCreativeId(product.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold text-violet-700 hover:bg-violet-50"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            Mejorar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditorId(product.id)}
                            className="rounded-xl px-3 py-2 text-xs font-bold text-primary hover:bg-primary/7"
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteId(product.id)}
                            className="rounded-xl p-2 text-text-tertiary hover:bg-error/5 hover:text-error"
                            aria-label={`Eliminar ${product.name}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6">
            <EmptyState
              icon={PackagePlus}
              title={products.length ? 'No hay coincidencias' : 'Aún no hay productos'}
              description={
                products.length
                  ? 'Ajusta la búsqueda o el filtro de categoría.'
                  : 'Importa una planilla o agrega el primer producto manualmente.'
              }
              action={
                !products.length ? (
                  <Button icon={<Plus className="h-4 w-4" />} onClick={handleAddProduct}>
                    Agregar producto
                  </Button>
                ) : undefined
              }
            />
          </div>
        )}
      </section>

      <aside className="space-y-5">
        <section className="surface-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-text">Categorías</h3>
              <p className="mt-0.5 text-xs text-text-tertiary">Orden editorial</p>
            </div>
            <button
              type="button"
              onClick={() => setShowCategoryForm((value) => !value)}
              className="rounded-xl p-2 text-primary hover:bg-primary/7"
              aria-label="Agregar categoría"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          {showCategoryForm ? (
            <form
              className="mt-4 flex gap-2"
              onSubmit={(event) => {
                event.preventDefault()
                if (!categoryName.trim()) return
                addCategory(catalogId, categoryName.trim())
                setCategoryName('')
                setShowCategoryForm(false)
              }}
            >
              <input
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                placeholder="Nombre"
                className="h-9 min-w-0 flex-1 rounded-xl border border-border px-3 text-sm outline-none focus:border-primary/50"
                autoFocus
              />
              <Button size="sm" type="submit" disabled={!categoryName.trim()}>
                Añadir
              </Button>
            </form>
          ) : null}
          <div className="mt-4 space-y-2">
            {categories.map((category) => {
              const count = products.filter((item) => item.categoryId === category.id).length
              return (
                <button
                  type="button"
                  key={category.id}
                  onClick={() => setCategoryFilter(category.id)}
                  className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                    categoryFilter === category.id
                      ? 'border-primary/25 bg-primary/5'
                      : 'border-border hover:bg-slate-50'
                  }`}
                >
                  <span className="h-9 w-9 overflow-hidden rounded-xl bg-slate-100">
                    <ProductImage
                      image={category.heroImage}
                      alt={category.name}
                      className="h-full w-full object-cover"
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-text">{category.name}</span>
                    <span className="text-xs text-text-tertiary">{count} productos</span>
                  </span>
                  <ChevronRight className="h-4 w-4 text-text-tertiary" />
                </button>
              )
            })}
          </div>
        </section>

        <section className="surface-card p-5">
          <div className="flex items-center gap-3">
            <span
              className={`rounded-xl p-2 ${
                errors.length ? 'bg-error/10 text-error' : warnings.length ? 'bg-warning/10 text-warning-strong' : 'bg-success/10 text-success'
              }`}
            >
              {errors.length || warnings.length ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
            </span>
            <div>
              <h3 className="font-bold text-text">Validación</h3>
              <p className="text-xs text-text-tertiary">
                {errors.length} errores · {warnings.length} avisos
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            {issues.slice(0, 4).map((issue) => (
              <button
                type="button"
                key={issue.id}
                onClick={() => issue.productId && setEditorId(issue.productId)}
                className="flex w-full items-start gap-2 rounded-xl bg-slate-50 p-3 text-left text-xs leading-5 text-text-secondary hover:bg-slate-100"
              >
                {issue.level === 'success' ? (
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" />
                ) : issue.level === 'error' ? (
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-error" />
                ) : (
                  <ImageIcon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-warning" />
                )}
                {issue.message}
              </button>
            ))}
          </div>
          {issues.length > 4 ? (
            <p className="mt-3 text-center text-xs font-semibold text-text-tertiary">
              + {issues.length - 4} observaciones
            </p>
          ) : null}
        </section>

        <Button
          variant="secondary"
          className="w-full"
          icon={<FileSpreadsheet className="h-4 w-4" />}
          onClick={() => void downloadCatalogWorkbook(catalog, categories, products)}
        >
          Exportar datos actuales
        </Button>
      </aside>
    </div>
  )
}
