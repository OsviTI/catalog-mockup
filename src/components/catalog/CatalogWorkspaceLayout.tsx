import {
  ArrowLeft,
  BadgeDollarSign,
  CheckCircle2,
  FileSpreadsheet,
  Files,
  LayoutTemplate,
  ScanSearch,
  Settings2,
  Sparkles,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Link, NavLink, useParams } from '../../lib/router'
import { formatRelativeDate, statusLabel } from '../../lib/format'
import { useCatalogStore } from '../../store/catalogStore'
import Badge from '../ui/Badge'
import EmptyState from '../ui/EmptyState'

const tabs = [
  { path: 'datos', label: 'Datos y productos', icon: FileSpreadsheet },
  { path: 'importaciones', label: 'Importaciones', icon: ScanSearch },
  { path: 'precios', label: 'Precios', icon: BadgeDollarSign },
  { path: 'creativo', label: 'Estudio creativo', icon: Sparkles },
  { path: 'plantilla', label: 'Diseño y plantilla', icon: LayoutTemplate },
  { path: 'preview', label: 'Vista previa', icon: CheckCircle2 },
  { path: 'versiones', label: 'Versiones', icon: Files },
]

const statusTone = {
  draft: 'warning',
  review: 'primary',
  published: 'success',
} as const

export default function CatalogWorkspaceLayout({ children }: { children: ReactNode }) {
  const { catalogId } = useParams()
  const catalog = useCatalogStore((state) =>
    state.workspace.catalogs.find((item) => item.id === catalogId),
  )

  if (!catalog) {
    return (
      <EmptyState
        icon={Settings2}
        title="No encontramos este catálogo"
        description="Puede haber sido eliminado o el enlace no es válido."
        action={
          <Link to="/" className="font-semibold text-primary">
            Volver al dashboard
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-5">
      <header className="surface-card overflow-hidden">
        <div className="flex flex-col gap-5 p-5 sm:p-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-start gap-4">
            <Link
              to="/"
              className="mt-0.5 rounded-xl border border-border p-2 text-text-secondary transition hover:bg-slate-50 hover:text-text"
              aria-label="Volver al dashboard"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-text">{catalog.name}</h1>
                <Badge tone={statusTone[catalog.status]} dot>
                  {statusLabel[catalog.status]}
                </Badge>
              </div>
              <p className="mt-1.5 text-sm text-text-secondary">
                {catalog.description} · Actualizado {formatRelativeDate(catalog.updatedAt)}
              </p>
            </div>
          </div>
          <Link
            to={`/catalogos/${catalog.id}/preview`}
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-primary/20 hover:bg-primary-hover"
          >
            <CheckCircle2 className="h-4 w-4" />
            Revisar catálogo
          </Link>
        </div>

        <nav className="flex gap-1 overflow-x-auto border-t border-border bg-slate-50/65 px-3 py-2 sm:px-5" aria-label="Flujo del catálogo">
          {tabs.map(({ path, label, icon: Icon }, index) => (
            <NavLink
              key={path}
              to={`/catalogos/${catalog.id}/${path}`}
              className={({ isActive }) =>
                `flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-white text-primary shadow-sm ring-1 ring-slate-200'
                    : 'text-text-secondary hover:bg-white/70 hover:text-text'
                }`
              }
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200/70 text-[10px] text-slate-600">
                {index + 1}
              </span>
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      {children}
    </div>
  )
}
