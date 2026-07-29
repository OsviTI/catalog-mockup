import {
  AlertTriangle,
  Check,
  ChevronRight,
  FileSearch,
  FileSpreadsheet,
  FileText,
  History,
  LoaderCircle,
  ScanSearch,
  Trash2,
  Upload,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import { loadAsset, persistAsset } from '../lib/database'
import { importProductsFile } from '../lib/excel'
import { formatCurrency, formatRelativeDate } from '../lib/format'
import { analyzePdfCatalog, renderPdfPage } from '../lib/pdfImport'
import { importSummary } from '../lib/reconciliation'
import { useParams } from '../lib/router'
import { useCatalogStore } from '../store/catalogStore'
import type {
  ImportChange,
  ImportChangeKind,
  ImportSession,
  PdfCandidate,
} from '../types/catalog'

const changeLabels: Record<ImportChangeKind, string> = {
  unchanged: 'Sin cambios',
  updated: 'Actualizado',
  new: 'Nuevo',
  missing: 'Fuera del Excel',
  conflict: 'Conflicto',
}

const changeTones: Record<ImportChangeKind, 'neutral' | 'primary' | 'success' | 'warning' | 'danger'> = {
  unchanged: 'neutral',
  updated: 'primary',
  new: 'success',
  missing: 'warning',
  conflict: 'danger',
}

const fieldLabels: Record<string, string> = {
  name: 'Nombre',
  code: 'Código',
  price: 'Precio',
  categoryId: 'Categoría',
  measurements: 'Medidas',
  capacity: 'Capacidad',
  material: 'Material',
  packaging: 'Embalaje',
  pack: 'Pack',
  master: 'Master',
  model: 'Modelo',
  color: 'Color',
  featured: 'Destacado',
  order: 'Orden',
}

function PdfPagePreview({ session, pageNumber }: { session: ImportSession; pageNumber: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    if (!session.sourceAssetId || !canvasRef.current) return
    loadAsset(session.sourceAssetId)
      .then((asset) => {
        if (!active || !asset || !canvasRef.current) return
        return renderPdfPage(asset.blob, pageNumber, canvasRef.current)
      })
      .catch(() => active && setError('No se pudo renderizar esta página.'))
    return () => {
      active = false
    }
  }, [pageNumber, session.sourceAssetId])

  return (
    <div className="overflow-auto rounded-2xl border border-slate-300 bg-slate-200 p-3">
      {error ? <p className="p-5 text-sm text-error">{error}</p> : null}
      <canvas ref={canvasRef} className="mx-auto h-auto max-w-full bg-white shadow-lg" />
    </div>
  )
}

function CandidateEditor({
  candidate,
  sessionId,
  onActivate,
}: {
  candidate: PdfCandidate
  sessionId: string
  onActivate: () => void
}) {
  const updateCandidate = useCatalogStore((state) => state.updatePdfCandidate)
  const workspace = useCatalogStore((state) => state.workspace)
  const categories = workspace.categories.filter(
    (category) => category.catalogId === candidate.product.catalogId,
  )
  return (
    <article
      onClick={onActivate}
      onFocusCapture={onActivate}
      className={`rounded-2xl border p-4 ${
        candidate.selected ? 'border-primary/25 bg-primary/3' : 'border-border bg-slate-50'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-3 text-sm font-bold">
          <input
            type="checkbox"
            className="h-4 w-4 accent-primary"
            checked={candidate.selected}
            onChange={(event) =>
              updateCandidate(sessionId, candidate.id, { selected: event.target.checked })
            }
          />
          Página {candidate.pageNumber}
        </label>
        <Badge tone={candidate.confidence >= 0.8 ? 'success' : candidate.confidence >= 0.6 ? 'warning' : 'danger'}>
          {Math.round(candidate.confidence * 100)}% confianza
        </Badge>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-semibold text-text-secondary">
          Nombre
          <input
            className="field-control mt-1"
            value={candidate.product.name}
            onChange={(event) =>
              updateCandidate(sessionId, candidate.id, {
                product: { name: event.target.value },
                reviewed: true,
              })
            }
          />
        </label>
        <label className="text-xs font-semibold text-text-secondary">
          Código
          <input
            className="field-control mt-1 font-mono"
            value={candidate.product.code}
            onChange={(event) =>
              updateCandidate(sessionId, candidate.id, {
                product: { code: event.target.value },
                reviewed: true,
              })
            }
          />
        </label>
        <label className="text-xs font-semibold text-text-secondary">
          Precio
          <input
            className="field-control mt-1"
            type="number"
            min="0"
            step="0.01"
            value={candidate.product.price}
            onChange={(event) =>
              updateCandidate(sessionId, candidate.id, {
                product: { price: Number(event.target.value) },
                reviewed: true,
              })
            }
          />
        </label>
        <label className="text-xs font-semibold text-text-secondary">
          Material
          <input
            className="field-control mt-1"
            value={candidate.product.material}
            onChange={(event) =>
              updateCandidate(sessionId, candidate.id, {
                product: { material: event.target.value },
                reviewed: true,
              })
            }
          />
        </label>
        <label className="text-xs font-semibold text-text-secondary">
          Categoría
          <select
            className="field-control mt-1"
            value={candidate.product.categoryId}
            onChange={(event) =>
              updateCandidate(sessionId, candidate.id, {
                product: { categoryId: event.target.value },
                reviewed: true,
              })
            }
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-semibold text-text-secondary">
          Medidas
          <input
            className="field-control mt-1"
            value={candidate.product.measurements}
            onChange={(event) =>
              updateCandidate(sessionId, candidate.id, {
                product: { measurements: event.target.value },
                reviewed: true,
              })
            }
          />
        </label>
      </div>
      <details className="mt-3 rounded-xl bg-white px-3 py-2 text-xs text-text-secondary ring-1 ring-border">
        <summary className="cursor-pointer font-semibold">Ver texto de evidencia</summary>
        <pre className="mt-2 whitespace-pre-wrap font-sans leading-5">{candidate.originalText}</pre>
      </details>
    </article>
  )
}

function ChangeRow({
  change,
  session,
}: {
  change: ImportChange
  session: ImportSession
}) {
  const workspace = useCatalogStore((state) => state.workspace)
  const setSelected = useCatalogStore((state) => state.setImportChangeSelected)
  const setFieldSelected = useCatalogStore((state) => state.setImportFieldSelected)
  const setMissingResolution = useCatalogStore((state) => state.setMissingResolution)
  const current = change.productId
    ? workspace.products.find((product) => product.id === change.productId)
    : undefined
  const name = change.incoming?.name ?? current?.name ?? 'Producto sin identificar'

  return (
    <article className="rounded-2xl border border-border bg-white p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          {change.kind !== 'missing' && change.kind !== 'conflict' && change.kind !== 'unchanged' ? (
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0 accent-primary"
              checked={change.selected}
              onChange={(event) => setSelected(session.id, change.id, event.target.checked)}
              aria-label={`Aplicar cambio en ${name}`}
            />
          ) : null}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-bold text-text">{name}</h4>
              <Badge tone={changeTones[change.kind]}>{changeLabels[change.kind]}</Badge>
            </div>
            <p className="mt-1 font-mono text-xs text-text-tertiary">{change.code || 'Sin código'}</p>
          </div>
        </div>
        {change.incoming?.price !== undefined ? (
          <p className="shrink-0 font-bold text-text">
            {formatCurrency(change.incoming.price, change.incoming.currency)}
          </p>
        ) : null}
      </div>

      {change.changes.length ? (
        <div className="mt-3 grid gap-2 lg:grid-cols-2">
          {change.changes.map((fieldChange) => (
            <label key={fieldChange.field} className="flex cursor-pointer gap-2 rounded-xl bg-slate-50 p-3 text-xs">
              <input
                type="checkbox"
                className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-primary"
                checked={fieldChange.selected}
                onChange={(event) =>
                  setFieldSelected(session.id, change.id, fieldChange.field, event.target.checked)
                }
              />
              <span>
              <span className="block font-bold text-text-secondary">{fieldLabels[fieldChange.field]}</span>
              <div className="mt-1 flex items-center gap-2">
                <span className="line-through text-text-tertiary">{String(fieldChange.before || '—')}</span>
                <ChevronRight className="h-3 w-3 shrink-0 text-primary" />
                <span className="font-semibold text-text">{String(fieldChange.after || '—')}</span>
              </div>
              </span>
            </label>
          ))}
        </div>
      ) : null}

      {change.kind === 'missing' ? (
        <div className="mt-4 rounded-xl border border-warning/20 bg-warning/5 p-3">
          <p className="text-xs leading-5 text-warning-strong">
            No se eliminará automáticamente. Elige qué debe ocurrir con este producto.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={change.missingResolution === 'keep' ? 'primary' : 'secondary'}
              onClick={() => setMissingResolution(session.id, change.id, 'keep')}
            >
              Mantener en catálogo
            </Button>
            <Button
              size="sm"
              variant={change.missingResolution === 'remove' ? 'danger' : 'secondary'}
              onClick={() => setMissingResolution(session.id, change.id, 'remove')}
            >
              Quitar del catálogo
            </Button>
          </div>
        </div>
      ) : null}
      {change.note ? <p className="mt-3 text-xs leading-5 text-text-secondary">{change.note}</p> : null}
    </article>
  )
}

export default function CatalogImportsPage() {
  const { catalogId = '' } = useParams()
  const workspace = useCatalogStore((state) => state.workspace)
  const createExcelSession = useCatalogStore((state) => state.createExcelImportSession)
  const createPdfSession = useCatalogStore((state) => state.createPdfImportSession)
  const completePdfAnalysis = useCatalogStore((state) => state.completePdfAnalysis)
  const failImportSession = useCatalogStore((state) => state.failImportSession)
  const preparePdfComparison = useCatalogStore((state) => state.preparePdfComparison)
  const applySession = useCatalogStore((state) => state.applyImportSession)
  const selectTemplate = useCatalogStore((state) => state.selectTemplate)
  const selectFieldAcrossSession = useCatalogStore(
    (state) => state.selectImportFieldAcrossSession,
  )
  const deleteSession = useCatalogStore((state) => state.deleteImportSession)
  const categories = workspace.categories.filter((category) => category.catalogId === catalogId)
  const catalog = workspace.catalogs.find((item) => item.id === catalogId)
  const sessions = workspace.importSessions
    .filter((session) => session.catalogId === catalogId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  const [selectedId, setSelectedId] = useState(sessions[0]?.id ?? '')
  const [busy, setBusy] = useState<'excel' | 'pdf' | ''>('')
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const [filter, setFilter] = useState<ImportChangeKind | 'all'>('all')
  const [pdfPage, setPdfPage] = useState(1)
  const selected = sessions.find((session) => session.id === selectedId) ?? sessions[0]
  const summary = useMemo(
    () => (selected ? importSummary(selected.changes) : null),
    [selected],
  )
  const visibleChanges =
    selected?.changes.filter((change) => filter === 'all' || change.kind === filter) ?? []
  const pendingMissing =
    selected?.changes.filter(
      (change) => change.kind === 'missing' && change.missingResolution === 'pending',
    ).length ?? 0
  const firstCandidatePage = selected?.pdfCandidates?.[0]?.pageNumber ?? 1

  useEffect(() => {
    setPdfPage(firstCandidatePage)
  }, [firstCandidatePage, selected?.id])

  const handleExcel = async (file?: File) => {
    if (!file) return
    setBusy('excel')
    setError('')
    try {
      const result = await importProductsFile(file, catalogId, categories)
      const id = createExcelSession(
        catalogId,
        file.name,
        result.products,
        result.warnings,
        result.importedFields,
      )
      setSelectedId(id)
      setProgress('Planilla comparada. Revisa las decisiones antes de aplicar.')
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No pudimos leer la planilla.')
    } finally {
      setBusy('')
    }
  }

  const handlePdf = async (file?: File) => {
    if (!file) return
    let sessionId = ''
    setBusy('pdf')
    setError('')
    setProgress('Guardando el documento de origen…')
    try {
      const asset = await persistAsset(file)
      sessionId = createPdfSession(catalogId, file.name, asset.id)
      setSelectedId(sessionId)
      const result = await analyzePdfCatalog(file, catalogId, categories, (page, total) =>
        setProgress(`Analizando texto y estructura · página ${page} de ${total}`),
      )
      completePdfAnalysis(sessionId, result.diagnostics, result.candidates, result.warnings)
      setProgress(
        result.candidates.length
          ? `${result.candidates.length} candidatos detectados. Revisa sus campos.`
          : 'Diagnóstico terminado; no se detectaron candidatos automáticos.',
      )
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : 'No pudimos analizar el PDF.'
      if (sessionId) failImportSession(sessionId, message)
      setError(message)
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-4 lg:grid-cols-2">
        <label className="surface-card group cursor-pointer p-5 transition hover:border-primary/30 hover:shadow-sm">
          <div className="flex items-start gap-4">
            <span className="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
              {busy === 'excel' ? <LoaderCircle className="h-6 w-6 animate-spin" /> : <FileSpreadsheet className="h-6 w-6" />}
            </span>
            <div>
              <h2 className="font-bold text-text">Comparar Excel oficial</h2>
              <p className="mt-1 text-sm leading-6 text-text-secondary">
                Detecta precios y datos modificados, productos nuevos y productos ausentes.
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary">
                <Upload className="h-4 w-4" /> Seleccionar planilla
              </span>
            </div>
          </div>
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            className="sr-only"
            disabled={Boolean(busy)}
            onChange={(event) => void handleExcel(event.target.files?.[0])}
          />
        </label>

        <label className="surface-card group cursor-pointer p-5 transition hover:border-primary/30 hover:shadow-sm">
          <div className="flex items-start gap-4">
            <span className="rounded-2xl bg-blue-50 p-3 text-blue-700">
              {busy === 'pdf' ? <LoaderCircle className="h-6 w-6 animate-spin" /> : <ScanSearch className="h-6 w-6" />}
            </span>
            <div>
              <h2 className="font-bold text-text">Escanear catálogo PDF</h2>
              <p className="mt-1 text-sm leading-6 text-text-secondary">
                Diagnostica el archivo de InDesign, extrae texto nativo y propone productos editables.
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary">
                <Upload className="h-4 w-4" /> Seleccionar PDF
              </span>
            </div>
          </div>
          <input
            type="file"
            accept=".pdf,application/pdf"
            className="sr-only"
            disabled={Boolean(busy)}
            onChange={(event) => void handlePdf(event.target.files?.[0])}
          />
        </label>
      </section>

      {progress || error ? (
        <div
          className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
            error
              ? 'border-error/20 bg-error/5 text-error'
              : 'border-primary/15 bg-primary/5 text-primary'
          }`}
        >
          {error || progress}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="surface-card self-start overflow-hidden">
          <div className="border-b border-border p-4">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-text-tertiary" />
              <h3 className="font-bold">Historial de fuentes</h3>
            </div>
          </div>
          {sessions.length ? (
            <div className="divide-y divide-border">
              {sessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => setSelectedId(session.id)}
                  className={`w-full p-4 text-left transition ${
                    selected?.id === session.id ? 'bg-primary/5' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-lg bg-slate-100 p-1.5 text-text-secondary">
                      {session.source === 'excel' ? <FileSpreadsheet className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                    </span>
                    <Badge tone={session.status === 'applied' ? 'success' : session.status === 'failed' ? 'danger' : session.status === 'analyzing' ? 'warning' : 'primary'}>
                      {session.status === 'applied' ? 'Aplicada' : session.status === 'failed' ? 'Error' : session.status === 'analyzing' ? 'Analizando' : 'En revisión'}
                    </Badge>
                  </div>
                  <p className="mt-3 truncate text-sm font-bold text-text">{session.sourceName}</p>
                  <p className="mt-1 text-xs text-text-tertiary">{formatRelativeDate(session.createdAt)}</p>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-sm leading-6 text-text-secondary">
              Las comparaciones y escaneos aparecerán aquí y sobrevivirán al recargar.
            </div>
          )}
        </aside>

        {!selected ? (
          <EmptyState
            icon={FileSearch}
            title="Carga la primera fuente"
            description="Puedes comenzar desde el PDF actual o comparar directamente el Excel oficial."
          />
        ) : (
          <section className="surface-card min-w-0 overflow-hidden">
            <header className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold">{selected.sourceName}</h2>
                  <Badge tone={selected.source === 'excel' ? 'success' : 'primary'}>
                    {selected.source.toUpperCase()}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-text-secondary">
                  La fuente se conserva como evidencia; los cambios sólo se aplican después de revisarlos.
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                icon={<Trash2 className="h-4 w-4" />}
                onClick={() => {
                  deleteSession(selected.id)
                  setSelectedId('')
                }}
              >
                Quitar sesión
              </Button>
            </header>

            {selected.warnings.length ? (
              <div className="space-y-2 border-b border-border bg-warning/5 p-4">
                {selected.warnings.map((warning) => (
                  <p key={warning} className="flex gap-2 text-xs leading-5 text-warning-strong">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    {warning}
                  </p>
                ))}
              </div>
            ) : null}

            {selected.source === 'pdf' && selected.pdfDiagnostics && !selected.changes.length ? (
              <div className="space-y-5 p-5">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-text-tertiary">Diagnóstico</p>
                    <p className="mt-1 font-bold capitalize text-text">{selected.pdfDiagnostics.documentKind}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-text-tertiary">Páginas con texto</p>
                    <p className="mt-1 font-bold text-text">
                      {selected.pdfDiagnostics.pagesWithText} / {selected.pdfDiagnostics.pageCount}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-text-tertiary">Candidatos</p>
                    <p className="mt-1 font-bold text-text">{selected.pdfCandidates?.length ?? 0}</p>
                  </div>
                  <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
                    <p className="text-xs font-semibold text-primary">Plantilla detectada</p>
                    <p className="mt-1 font-bold text-text">
                      {workspace.templates.find(
                        (template) => template.id === selected.pdfDiagnostics?.templateHint,
                      )?.name ?? 'Sin coincidencia'}
                    </p>
                    {selected.pdfDiagnostics.templateHint ? (
                      catalog?.templateId === selected.pdfDiagnostics.templateHint ? (
                        <Badge tone="success">Aplicada automáticamente</Badge>
                      ) : (
                        <button
                          type="button"
                          className="mt-2 text-xs font-bold text-primary hover:underline"
                          onClick={() =>
                            selectTemplate(catalogId, selected.pdfDiagnostics?.templateHint ?? '')
                          }
                        >
                          Usar esta plantilla
                        </button>
                      )
                    ) : null}
                  </div>
                </div>

                {selected.pdfCandidates?.length ? (
                  <>
                    <div className="grid gap-5 2xl:grid-cols-[minmax(300px,0.85fr)_minmax(380px,1.15fr)]">
                      <div className="2xl:sticky 2xl:top-4 2xl:self-start">
                        <PdfPagePreview
                          session={selected}
                          pageNumber={pdfPage}
                        />
                      </div>
                      <div className="space-y-3">
                        {selected.pdfCandidates.map((candidate) => (
                          <CandidateEditor
                            key={candidate.id}
                            candidate={candidate}
                            sessionId={selected.id}
                            onActivate={() => setPdfPage(candidate.pageNumber)}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button
                        icon={<ChevronRight className="h-4 w-4" />}
                        onClick={() => preparePdfComparison(selected.id)}
                        disabled={!selected.pdfCandidates.some((candidate) => candidate.selected)}
                      >
                        Comparar candidatos con el catálogo
                      </Button>
                    </div>
                  </>
                ) : (
                  <EmptyState
                    icon={ScanSearch}
                    title="El PDF requiere otra estrategia"
                    description="Si es una imagen escaneada necesitará OCR. Si contiene texto, revisaremos reglas específicas de su plantilla de InDesign."
                  />
                )}
              </div>
            ) : selected.changes.length ? (
              <>
                <div className="grid grid-cols-2 gap-2 border-b border-border bg-slate-50/60 p-4 sm:grid-cols-5">
                  {(Object.keys(changeLabels) as ImportChangeKind[]).map((kind) => (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => setFilter(filter === kind ? 'all' : kind)}
                      className={`rounded-xl border p-3 text-left transition ${
                        filter === kind ? 'border-primary/30 bg-primary/5' : 'border-border bg-white'
                      }`}
                    >
                      <p className="text-xl font-bold text-text">{summary?.[kind] ?? 0}</p>
                      <p className="mt-0.5 text-[11px] font-semibold text-text-tertiary">{changeLabels[kind]}</p>
                    </button>
                  ))}
                </div>
                <div className="space-y-3 p-5">
                  {visibleChanges.map((change) => (
                    <ChangeRow key={change.id} change={change} session={selected} />
                  ))}
                </div>
                <footer className="sticky bottom-0 flex flex-col gap-3 border-t border-border bg-white/95 p-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-text">
                      {selected.changes.filter((change) => change.selected).length} cambios seleccionados
                    </p>
                    <p className="text-xs text-text-tertiary">
                      {pendingMissing
                        ? `${pendingMissing} productos fuera del Excel todavía necesitan decisión.`
                        : 'Todas las ausencias fueron revisadas.'}
                    </p>
                  </div>
                  {summary?.updated ? (
                    <Button
                      variant="secondary"
                      onClick={() => selectFieldAcrossSession(selected.id, 'price', true)}
                    >
                      Seleccionar todos los precios
                    </Button>
                  ) : null}
                  <Button
                    icon={<Check className="h-4 w-4" />}
                    disabled={selected.status === 'applied' || pendingMissing > 0}
                    onClick={() => applySession(selected.id)}
                  >
                    {selected.status === 'applied' ? 'Cambios aplicados' : 'Aplicar decisiones'}
                  </Button>
                </footer>
              </>
            ) : (
              <div className="p-6">
                <EmptyState
                  icon={FileText}
                  title={selected.status === 'analyzing' ? 'Analizando documento…' : selected.status === 'failed' ? 'El análisis no se completó' : 'Sin cambios detectados'}
                  description={selected.status === 'failed' ? 'Consulta el aviso de la sesión, elimínala y vuelve a intentar con otro archivo.' : 'La sesión permanece guardada para consulta.'}
                />
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
