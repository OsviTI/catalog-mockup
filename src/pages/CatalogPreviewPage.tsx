import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileText,
  LoaderCircle,
  Maximize2,
  Minus,
  Plus,
  RotateCcw,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from '../lib/router'
import CatalogDocument from '../components/catalog/CatalogDocument'
import SourcePdfCatalogDocument from '../components/catalog/SourcePdfCatalogDocument'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import { downloadCatalogPdf } from '../lib/pdf'
import { sourcePdfDocumentPageCount } from '../lib/sourcePdfLayout'
import { validateProducts } from '../lib/validation'
import { useCatalogStore } from '../store/catalogStore'

export default function CatalogPreviewPage() {
  const { catalogId = '' } = useParams()
  const workspace = useCatalogStore((state) => state.workspace)
  const createVersion = useCatalogStore((state) => state.createVersion)
  const documentRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(0.72)
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [exportError, setExportError] = useState('')
  const [sourceReady, setSourceReady] = useState(false)

  const catalog = workspace.catalogs.find((item) => item.id === catalogId)
  const template = workspace.templates.find((item) => item.id === catalog?.templateId)
  const categories = workspace.categories
    .filter((item) => item.catalogId === catalogId)
    .sort((a, b) => a.order - b.order)
  const products = workspace.products.filter((item) => item.catalogId === catalogId)
  const pdfSessions = workspace.importSessions
    .filter(
      (session) =>
        session.catalogId === catalogId &&
        session.source === 'pdf' &&
        session.sourceAssetId &&
        session.pdfDiagnostics,
    )
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  const baseSession =
    pdfSessions.find((session) => session.isBaseDocument) ?? pdfSessions[0]
  const usesSourcePdf = Boolean(baseSession)
  const sourceTemplateMapped =
    baseSession?.pdfDiagnostics?.templateHint === 'template-crystal-official'
  const issues = useMemo(() => validateProducts(products), [products])
  const blockingIssues = issues.filter((item) => item.level === 'error')
  const warningIssues = issues.filter((item) => item.level === 'warning')

  useEffect(() => {
    setSourceReady(!usesSourcePdf)
  }, [baseSession?.id, usesSourcePdf])

  if (!catalog || !template) return null

  const exportPdf = async () => {
    if (!documentRef.current || exporting) return
    setExporting(true)
    setExportError('')
    try {
      await downloadCatalogPdf(documentRef.current, catalog.name, (current, total) =>
        setProgress({ current, total }),
      )
      createVersion(catalog.id)
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'No pudimos generar el PDF.')
    } finally {
      setExporting(false)
    }
  }

  const estimatedPages = baseSession
    ? sourcePdfDocumentPageCount(baseSession, products)
    :
    (2 +
      categories.reduce((total, category) => {
        const count = products.filter((item) => item.categoryId === category.id).length
        return total + (count ? 1 + Math.ceil(Math.max(0, count - 1) / catalog.settings.productsPerPage) : 0)
      }, 0))

  return (
    <div className="grid gap-5 2xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="surface-card min-w-0 overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-bold text-text">Vista previa del PDF</h2>
              <Badge tone="neutral">A4 digital</Badge>
              <Badge tone="primary">{estimatedPages} páginas</Badge>
              {usesSourcePdf ? <Badge tone="success">PDF original preservado</Badge> : null}
            </div>
            <p className="mt-1 text-xs text-text-tertiary">
              {usesSourcePdf
                ? 'Las páginas conservan el PDF base y superponen únicamente los datos o fotografías actualizados.'
                : 'Representación exacta utilizada para la descarga.'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-xl border border-border bg-white p-1">
              <button
                type="button"
                onClick={() => setZoom((value) => Math.max(0.4, value - 0.08))}
                className="rounded-lg p-2 text-text-secondary hover:bg-slate-100"
                aria-label="Reducir zoom"
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <span className="min-w-12 text-center text-xs font-bold text-text-secondary">
                {Math.round(zoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoom((value) => Math.min(1, value + 0.08))}
                className="rounded-lg p-2 text-text-secondary hover:bg-slate-100"
                aria-label="Aumentar zoom"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setZoom(0.72)}
              className="rounded-xl border border-border p-2.5 text-text-secondary hover:bg-slate-50"
              aria-label="Restablecer zoom"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="catalog-preview-stage">
          <div
            className="catalog-preview-zoom"
            style={{
              width: `${794 * zoom}px`,
              height: `${estimatedPages * 1147 * zoom}px`,
            }}
          >
            <div
              className="catalog-preview-document"
              style={{
                transform: `scale(${zoom})`,
              }}
            >
              {baseSession ? (
                <SourcePdfCatalogDocument
                  session={baseSession}
                  products={products}
                  renderScale={1.2}
                />
              ) : (
                <CatalogDocument
                  catalog={catalog}
                  categories={categories}
                  products={products}
                  template={template}
                />
              )}
            </div>
          </div>
        </div>
        <div aria-hidden="true" className="pointer-events-none fixed left-[-10000px] top-0">
          <div ref={documentRef}>
            {baseSession ? (
              <SourcePdfCatalogDocument
                session={baseSession}
                products={products}
                renderScale={2}
                onReady={() => setSourceReady(true)}
              />
            ) : (
              <CatalogDocument
                catalog={catalog}
                categories={categories}
                products={products}
                template={template}
              />
            )}
          </div>
        </div>
      </section>

      <aside className="space-y-5">
        <section className="surface-card p-5">
          <h3 className="font-bold text-text">Preparación del documento</h3>
          {usesSourcePdf && !sourceTemplateMapped ? (
            <div className="mt-4 rounded-2xl border border-warning/20 bg-warning/5 p-3 text-xs leading-5 text-warning">
              El documento original está preservado, pero esta plantilla todavía no
              tiene zonas editables mapeadas. Sus páginas se mostrarán sin alterar.
            </div>
          ) : null}
          <div className="mt-4 space-y-3">
            {[
              {
                label: 'Datos y productos',
                detail: `${products.length} productos`,
                ok: !blockingIssues.length,
              },
              {
                label: 'Plantilla',
                detail: usesSourcePdf ? 'PDF base original' : template.name,
                ok: true,
              },
              {
                label: 'Imágenes',
                detail: warningIssues.length ? `${warningIssues.length} avisos` : 'Completas',
                ok: !warningIssues.length,
              },
              {
                label: 'Formato',
                detail: `A4 · ${estimatedPages} páginas`,
                ok: true,
              },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                {item.ok ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-text">{item.label}</p>
                  <p className="truncate text-[11px] text-text-tertiary">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="surface-card p-5">
          <div className="flex items-center gap-3">
            <span className="rounded-2xl bg-primary/10 p-2.5 text-primary">
              <FileText className="h-5 w-5" />
            </span>
            <div>
              <h3 className="font-bold text-text">Generar nueva versión</h3>
              <p className="text-xs text-text-tertiary">Snapshot inmutable</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-text-secondary">
            La descarga guardará una copia exacta de datos, imágenes y configuración.
          </p>
          {exporting ? (
            <div className="mt-4 rounded-2xl border border-primary/15 bg-primary/5 p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-primary">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Procesando página {progress.current} de {progress.total}
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-primary/10">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${progress.total ? (progress.current / progress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          ) : null}
          {exportError ? (
            <div className="mt-4 rounded-2xl border border-error/20 bg-error/5 p-3 text-xs leading-5 text-error">
              {exportError}
            </div>
          ) : null}
          <Button
            className="mt-5 w-full"
            size="lg"
            icon={<Download className="h-4 w-4" />}
            loading={exporting}
            disabled={blockingIssues.length > 0 || !sourceReady}
            onClick={() => void exportPdf()}
          >
            {!sourceReady && usesSourcePdf
              ? 'Preparando páginas originales…'
              : 'Descargar PDF y versionar'}
          </Button>
          {blockingIssues.length ? (
            <Link
              to={`/catalogos/${catalog.id}/datos`}
              className="mt-3 flex items-center justify-center gap-2 text-xs font-bold text-error"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              Corrige {blockingIssues.length} errores para continuar
            </Link>
          ) : null}
        </section>

        <Link
          to={`/catalogos/${catalog.id}/plantilla`}
          className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-white px-4 py-3 text-sm font-bold text-text-secondary hover:bg-slate-50"
        >
          <RotateCcw className="h-4 w-4" />
          Volver al editor
        </Link>
      </aside>
    </div>
  )
}
