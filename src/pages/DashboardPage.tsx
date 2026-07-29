import {
  ArrowRight,
  BookOpenCheck,
  Clock3,
  Copy,
  FileText,
  MoreHorizontal,
  PackageCheck,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from '../lib/router'
import CreateCatalogModal from '../components/modals/CreateCatalogModal'
import Badge from '../components/ui/Badge'
import Button from '../components/ui/Button'
import Modal from '../components/ui/Modal'
import { formatDate, formatRelativeDate, statusLabel } from '../lib/format'
import { useCatalogStore } from '../store/catalogStore'
import type { CatalogStatus } from '../types/catalog'

const statusTone = {
  draft: 'warning',
  review: 'primary',
  published: 'success',
} as const

export default function DashboardPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'all' | CatalogStatus>('all')
  const [menuId, setMenuId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const workspace = useCatalogStore((state) => state.workspace)
  const duplicateCatalog = useCatalogStore((state) => state.duplicateCatalog)
  const deleteCatalog = useCatalogStore((state) => state.deleteCatalog)
  const navigate = useNavigate()

  const filtered = useMemo(
    () =>
      workspace.catalogs.filter((catalog) => {
        const matchesSearch = catalog.name.toLowerCase().includes(search.toLowerCase())
        const matchesStatus = status === 'all' || catalog.status === status
        return matchesSearch && matchesStatus
      }),
    [search, status, workspace.catalogs],
  )

  const totalProducts = workspace.products.length
  const published = workspace.catalogs.filter((item) => item.status === 'published').length
  const currentDelete = workspace.catalogs.find((item) => item.id === deleteId)

  return (
    <div className="space-y-7">
      <CreateCatalogModal open={createOpen} onClose={() => setCreateOpen(false)} />
      <Modal
        open={Boolean(deleteId)}
        onClose={() => setDeleteId(null)}
        title="Eliminar catálogo"
        description={`Se eliminarán el borrador, sus productos y versiones${currentDelete ? ` de “${currentDelete.name}”` : ''}.`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                if (deleteId) deleteCatalog(deleteId)
                setDeleteId(null)
              }}
            >
              Eliminar definitivamente
            </Button>
          </>
        }
      >
        <div className="rounded-2xl border border-error/15 bg-error/5 p-4 text-sm leading-6 text-text-secondary">
          Esta acción no puede deshacerse. Las imágenes compartidas con otros catálogos no serán eliminadas.
        </div>
      </Modal>

      <section className="overflow-hidden rounded-[30px] bg-hero px-6 py-7 text-white shadow-xl shadow-slate-950/10 sm:px-8 lg:flex lg:items-end lg:justify-between lg:px-10 lg:py-9">
        <div className="relative z-10">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-amber-300" />
            Espacio editorial automatizado
          </div>
          <h1 className="max-w-2xl text-3xl font-bold tracking-[-0.035em] sm:text-4xl">
            Convierte datos de producto en catálogos listos para compartir.
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Importa, valida, diseña, versiona y exporta sin volver a maquetar cada actualización.
          </p>
        </div>
        <Button
          variant="secondary"
          size="lg"
          icon={<Plus className="h-4 w-4" />}
          onClick={() => setCreateOpen(true)}
          className="relative z-10 mt-6 border-white/20 shadow-xl lg:mt-0"
        >
          Nuevo catálogo
        </Button>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Resumen">
        {[
          {
            label: 'Catálogos',
            value: workspace.catalogs.length,
            helper: 'espacios de trabajo',
            icon: FileText,
            tone: 'bg-blue-50 text-blue-700',
          },
          {
            label: 'Productos',
            value: totalProducts,
            helper: 'registros normalizados',
            icon: PackageCheck,
            tone: 'bg-emerald-50 text-emerald-700',
          },
          {
            label: 'Versiones',
            value: workspace.versions.length,
            helper: 'PDF conservados',
            icon: BookOpenCheck,
            tone: 'bg-violet-50 text-violet-700',
          },
          {
            label: 'Publicados',
            value: published,
            helper: 'versiones aprobadas',
            icon: Clock3,
            tone: 'bg-amber-50 text-amber-700',
          },
        ].map(({ label, value, helper, icon: Icon, tone }) => (
          <article key={label} className="surface-card flex items-center gap-4 p-5">
            <span className={`rounded-2xl p-3 ${tone}`}>
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-2xl font-bold tracking-tight text-text">{value}</p>
              <p className="text-sm font-semibold text-text">{label}</p>
              <p className="mt-0.5 text-xs text-text-tertiary">{helper}</p>
            </div>
          </article>
        ))}
      </section>

      <section className="surface-card overflow-visible">
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-text">Tus catálogos</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Continúa un borrador o crea una nueva versión.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar catálogo"
                className="h-10 w-full rounded-xl border border-border bg-white pl-9 pr-3 text-sm outline-none transition focus:border-primary/50 focus:ring-4 focus:ring-primary/8 sm:w-56"
              />
            </label>
            <select
              value={status}
              onChange={(event) => setStatus(event.target.value as typeof status)}
              className="h-10 rounded-xl border border-border bg-white px-3 text-sm font-medium text-text-secondary outline-none focus:border-primary/50"
              aria-label="Filtrar por estado"
            >
              <option value="all">Todos los estados</option>
              <option value="draft">En edición</option>
              <option value="review">Listo para revisar</option>
              <option value="published">Publicado</option>
            </select>
          </div>
        </div>

        <div className="grid gap-5 p-5 md:grid-cols-2 2xl:grid-cols-3 sm:p-6">
          {filtered.map((catalog) => {
            const template = workspace.templates.find((item) => item.id === catalog.templateId)
            const productsCount = workspace.products.filter((item) => item.catalogId === catalog.id).length
            const versionsCount = workspace.versions.filter((item) => item.catalogId === catalog.id).length
            return (
              <article
                key={catalog.id}
                className="group relative overflow-visible rounded-3xl border border-border bg-white transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-950/7"
              >
                <Link to={`/catalogos/${catalog.id}/datos`} className="block">
                  <div
                    className="relative h-44 overflow-hidden rounded-t-[23px] p-5"
                    style={{
                      background: `linear-gradient(135deg, ${catalog.settings.theme.secondary}, ${catalog.settings.theme.primary})`,
                    }}
                  >
                    <div className="absolute -right-8 -top-12 h-36 w-36 rounded-full border-[22px] border-white/10" />
                    <div className="absolute bottom-0 right-6 h-28 w-20 rounded-t-full border border-white/25 bg-white/8" />
                    <Badge tone={statusTone[catalog.status]} dot>
                      {statusLabel[catalog.status]}
                    </Badge>
                    <div className="absolute bottom-5 left-5 right-5 text-white">
                      <p className="text-[10px] font-bold uppercase tracking-[0.28em] text-white/60">
                        {catalog.settings.campaignLabel}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xl font-bold tracking-tight">{catalog.settings.title}</p>
                    </div>
                  </div>
                </Link>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        to={`/catalogos/${catalog.id}/datos`}
                        className="line-clamp-1 font-bold text-text hover:text-primary"
                      >
                        {catalog.name}
                      </Link>
                      <p className="mt-1 line-clamp-1 text-xs text-text-tertiary">
                        {template?.name ?? 'Plantilla editorial'} · Actualizado {formatRelativeDate(catalog.updatedAt)}
                      </p>
                    </div>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setMenuId(menuId === catalog.id ? null : catalog.id)}
                        className="rounded-xl p-2 text-text-tertiary hover:bg-slate-100 hover:text-text"
                        aria-label={`Opciones de ${catalog.name}`}
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                      {menuId === catalog.id ? (
                        <div className="absolute right-0 top-10 z-20 w-44 rounded-2xl border border-border bg-white p-1.5 shadow-xl">
                          <button
                            type="button"
                            onClick={() => {
                              const id = duplicateCatalog(catalog.id)
                              setMenuId(null)
                              if (id) navigate(`/catalogos/${id}/datos`)
                            }}
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-slate-50"
                          >
                            <Copy className="h-4 w-4" /> Duplicar
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteId(catalog.id)
                              setMenuId(null)
                            }}
                            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-error hover:bg-error/5"
                          >
                            <Trash2 className="h-4 w-4" /> Eliminar
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs">
                    <div className="flex gap-4 text-text-secondary">
                      <span>
                        <strong className="text-text">{productsCount}</strong> productos
                      </span>
                      <span>
                        <strong className="text-text">{versionsCount}</strong> versiones
                      </span>
                    </div>
                    <Link
                      to={`/catalogos/${catalog.id}/datos`}
                      className="inline-flex items-center gap-1 font-bold text-primary"
                    >
                      Abrir <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="surface-card p-6">
          <h2 className="text-lg font-bold">Actividad reciente</h2>
          <div className="mt-5 space-y-1">
            {workspace.activity.slice(0, 5).map((item) => {
              const catalog = workspace.catalogs.find((entry) => entry.id === item.catalogId)
              return (
                <div key={item.id} className="flex items-start gap-3 rounded-2xl px-2 py-3 hover:bg-slate-50">
                  <span className="mt-1.5 h-2 w-2 rounded-full bg-primary ring-4 ring-primary/10" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-text">
                      {item.message}{' '}
                      {catalog ? <span className="font-semibold text-text-secondary">{catalog.name}</span> : null}
                    </p>
                    <p className="mt-1 text-xs text-text-tertiary">{formatDate(item.createdAt)}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <aside className="surface-card overflow-hidden bg-slate-950 p-6 text-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <h2 className="mt-5 text-lg font-bold">Flujo recomendado</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Importa la plantilla, corrige avisos, elige el diseño y genera una versión inmutable.
          </p>
          <div className="mt-5 grid grid-cols-4 gap-2">
            {['Datos', 'Validar', 'Diseñar', 'PDF'].map((item, index) => (
              <div key={item}>
                <div className="h-1.5 rounded-full bg-primary" style={{ opacity: 1 - index * 0.18 }} />
                <p className="mt-2 text-[10px] font-semibold text-slate-400">{item}</p>
              </div>
            ))}
          </div>
        </aside>
      </section>
    </div>
  )
}
