import {
  Archive,
  CheckCircle2,
  Download,
  Eye,
  FileClock,
  GitBranch,
  History,
  RotateCcw,
  Send,
} from 'lucide-react'
import { useRef, useState } from 'react'
import { useParams } from '../lib/router'
import CatalogDocument from '../components/catalog/CatalogDocument'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import EmptyState from '../components/ui/EmptyState'
import Modal from '../components/ui/Modal'
import { formatDate } from '../lib/format'
import { downloadCatalogPdf } from '../lib/pdf'
import { useCatalogStore } from '../store/catalogStore'
import type { CatalogVersion } from '../types/catalog'

export default function CatalogVersionsPage() {
  const { catalogId = '' } = useParams()
  const workspace = useCatalogStore((state) => state.workspace)
  const createVersion = useCatalogStore((state) => state.createVersion)
  const publishVersion = useCatalogStore((state) => state.publishVersion)
  const restoreVersion = useCatalogStore((state) => state.restoreVersion)
  const [selected, setSelected] = useState<CatalogVersion | null>(null)
  const [restoreTarget, setRestoreTarget] = useState<CatalogVersion | null>(null)
  const [exporting, setExporting] = useState(false)
  const snapshotRef = useRef<HTMLDivElement>(null)

  const catalog = workspace.catalogs.find((item) => item.id === catalogId)
  const versions = workspace.versions
    .filter((item) => item.catalogId === catalogId)
    .sort((a, b) => b.number - a.number)
  const published = versions.find((item) => item.status === 'published')
  const selectedTemplate = workspace.templates.find(
    (item) => item.id === selected?.snapshot.catalog.templateId,
  )

  if (!catalog) return null

  return (
    <div className="space-y-5">
      <Modal
        open={Boolean(restoreTarget)}
        onClose={() => setRestoreTarget(null)}
        title={`Restaurar versión v${restoreTarget?.number ?? ''}`}
        description="Se utilizará como nuevo borrador sin eliminar las versiones posteriores."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRestoreTarget(null)}>
              Cancelar
            </Button>
            <Button
              icon={<RotateCcw className="h-4 w-4" />}
              onClick={() => {
                if (restoreTarget) restoreVersion(restoreTarget.id)
                setRestoreTarget(null)
              }}
            >
              Restaurar borrador
            </Button>
          </>
        }
      >
        <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm leading-6 text-text-secondary">
          El borrador actual será sustituido por el contenido de esta versión. El historial completo se conservará.
        </div>
      </Modal>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={`Versión v${selected?.number ?? ''}`}
        description={
          selected ? `${selected.label} · ${formatDate(selected.createdAt, { dateStyle: 'long', timeStyle: 'short' })}` : ''
        }
        size="xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSelected(null)}>
              Cerrar
            </Button>
            <Button
              icon={<Download className="h-4 w-4" />}
              loading={exporting}
              onClick={async () => {
                if (!selected || !snapshotRef.current) return
                setExporting(true)
                try {
                  await downloadCatalogPdf(
                    snapshotRef.current,
                    `${selected.snapshot.catalog.name}-v${selected.number}`,
                  )
                } finally {
                  setExporting(false)
                }
              }}
            >
              Descargar esta versión
            </Button>
          </>
        }
      >
        {selected && selectedTemplate ? (
          <div className="max-h-[60vh] overflow-auto rounded-2xl bg-slate-200 p-6">
            <div className="mx-auto w-[397px]">
              <div className="origin-top-left scale-50">
                <CatalogDocument
                  catalog={selected.snapshot.catalog}
                  categories={selected.snapshot.categories}
                  products={selected.snapshot.products}
                  template={selectedTemplate}
                />
              </div>
            </div>
          </div>
        ) : null}
        {selected && selectedTemplate ? (
          <div aria-hidden="true" className="pointer-events-none fixed left-[-10000px] top-0">
            <div ref={snapshotRef}>
              <CatalogDocument
                catalog={selected.snapshot.catalog}
                categories={selected.snapshot.categories}
                products={selected.snapshot.products}
                template={selectedTemplate}
              />
            </div>
          </div>
        ) : null}
      </Modal>

      <section className="surface-card flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          <span className="rounded-2xl bg-violet-50 p-3 text-violet-700">
            <History className="h-6 w-6" />
          </span>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-text">Historial de versiones</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-text-secondary">
              Cada generación conserva una fotografía inmutable de datos, diseño e imágenes.
            </p>
          </div>
        </div>
        <Button
          variant="secondary"
          icon={<Archive className="h-4 w-4" />}
          onClick={() => createVersion(catalog.id, 'Snapshot manual')}
        >
          Guardar snapshot
        </Button>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Versiones generadas', value: versions.length, icon: GitBranch },
          { label: 'Versión publicada', value: published ? `v${published.number}` : '—', icon: Send },
          {
            label: 'Última generación',
            value: versions[0] ? formatDate(versions[0].createdAt) : 'Sin versiones',
            icon: FileClock,
          },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="surface-card flex items-center gap-4 p-5">
            <span className="rounded-2xl bg-slate-100 p-3 text-slate-600">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-lg font-bold text-text">{value}</p>
              <p className="text-xs text-text-tertiary">{label}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="surface-card overflow-hidden">
        <div className="border-b border-border px-5 py-4 sm:px-6">
          <h3 className="font-bold text-text">Versiones del catálogo</h3>
        </div>
        {versions.length ? (
          <div className="divide-y divide-border">
            {versions.map((version, index) => (
              <article
                key={version.id}
                className="flex flex-col gap-4 p-5 transition hover:bg-slate-50/70 sm:p-6 lg:flex-row lg:items-center"
              >
                <div
                  className="flex h-16 w-14 shrink-0 items-center justify-center rounded-xl border border-border bg-white text-sm font-black text-primary shadow-sm"
                  aria-hidden="true"
                >
                  v{version.number}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-bold text-text">{version.label}</h4>
                    {version.status === 'published' ? (
                      <Badge tone="success" dot>
                        Publicada
                      </Badge>
                    ) : index === 0 ? (
                      <Badge tone="primary">Más reciente</Badge>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-text-tertiary">
                    {formatDate(version.createdAt, { dateStyle: 'long', timeStyle: 'short' })} ·{' '}
                    {version.snapshot.products.length} productos · {version.snapshot.categories.length} categorías
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<Eye className="h-4 w-4" />}
                    onClick={() => setSelected(version)}
                  >
                    Ver
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<RotateCcw className="h-4 w-4" />}
                    onClick={() => setRestoreTarget(version)}
                  >
                    Restaurar
                  </Button>
                  {version.status !== 'published' ? (
                    <Button
                      size="sm"
                      icon={<CheckCircle2 className="h-4 w-4" />}
                      onClick={() => publishVersion(version.id)}
                    >
                      Publicar
                    </Button>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="p-6">
            <EmptyState
              icon={History}
              title="Todavía no hay versiones"
              description="Genera el primer PDF o guarda un snapshot manual para comenzar el historial."
              action={
                <Button onClick={() => createVersion(catalog.id, 'Primera versión')}>
                  Crear primera versión
                </Button>
              }
            />
          </div>
        )}
      </section>
    </div>
  )
}
