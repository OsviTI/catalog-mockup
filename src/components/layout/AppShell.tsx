import {
  BookOpenText,
  ChevronDown,
  LayoutDashboard,
  Library,
  PanelLeftClose,
  Settings,
  Sparkles,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { NavLink } from '../../lib/router'
import { useCatalogStore } from '../../store/catalogStore'

interface AppShellProps {
  children: ReactNode
}

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/plantillas', label: 'Plantillas', icon: Library },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
]

export default function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false)
  const saving = useCatalogStore((state) => state.saving)
  const lastSavedAt = useCatalogStore((state) => state.lastSavedAt)

  return (
    <div className="min-h-screen bg-app-bg text-text">
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden border-r border-slate-800 bg-sidebar text-white transition-all lg:flex lg:flex-col ${
          collapsed ? 'w-[84px]' : 'w-[260px]'
        }`}
      >
        <div className="flex h-20 items-center gap-3 border-b border-white/10 px-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary text-white shadow-lg shadow-primary/25">
            <BookOpenText className="h-5 w-5" />
          </div>
          {!collapsed ? (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">Catalog Studio</p>
              <p className="truncate text-xs text-slate-400">Automatización editorial</p>
            </div>
          ) : null}
        </div>

        <nav className="flex-1 space-y-1.5 px-3 py-6" aria-label="Navegación principal">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                `flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${
                  isActive
                    ? 'bg-white/12 text-white ring-1 ring-white/10'
                    : 'text-slate-400 hover:bg-white/7 hover:text-white'
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed ? <span>{label}</span> : null}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          {!collapsed ? (
            <div className="mb-3 rounded-2xl bg-white/7 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                <Sparkles className="h-4 w-4 text-amber-300" />
                Demo persistente
              </div>
              <p className="mt-1.5 text-[11px] leading-4 text-slate-400">
                Los cambios se guardan automáticamente en este navegador.
              </p>
            </div>
          ) : null}
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-slate-400 hover:bg-white/7 hover:text-white"
            aria-label={collapsed ? 'Expandir navegación' : 'Contraer navegación'}
          >
            <PanelLeftClose className={`h-4 w-4 transition ${collapsed ? 'rotate-180' : ''}`} />
            {!collapsed ? 'Contraer' : null}
          </button>
        </div>
      </aside>

      <div className={`transition-all ${collapsed ? 'lg:pl-[84px]' : 'lg:pl-[260px]'}`}>
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-white/88 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <NavLink to="/" className="flex items-center gap-2 lg:hidden">
            <span className="rounded-xl bg-primary p-2 text-white">
              <BookOpenText className="h-4 w-4" />
            </span>
            <span className="text-sm font-bold">Catalog Studio</span>
          </NavLink>

          <div className="hidden items-center gap-2 text-xs text-text-secondary lg:flex">
            <span className={`h-2 w-2 rounded-full ${saving ? 'animate-pulse bg-warning' : 'bg-success'}`} />
            {saving
              ? 'Guardando cambios…'
              : lastSavedAt
                ? `Guardado ${new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit' }).format(new Date(lastSavedAt))}`
                : 'Preparando guardado…'}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-bold text-text">Espacio de demostración</p>
              <p className="text-[11px] text-text-tertiary">Crystal Rock</p>
            </div>
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl border border-border bg-white p-1.5 pr-2.5 text-sm font-semibold hover:bg-slate-50"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-xs text-white">
                CR
              </span>
              <ChevronDown className="h-4 w-4 text-text-tertiary" />
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>

      <nav
        className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-3 rounded-2xl border border-white/10 bg-slate-950/94 p-1.5 text-white shadow-2xl backdrop-blur-xl lg:hidden"
        aria-label="Navegación móvil"
      >
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-[10px] font-semibold transition ${
                isActive ? 'bg-primary text-white' : 'text-slate-400'
              }`
            }
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
