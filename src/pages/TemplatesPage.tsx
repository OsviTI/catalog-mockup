import { Check, LayoutTemplate, Sparkles } from 'lucide-react'
import Badge from '../components/ui/Badge'
import { useCatalogStore } from '../store/catalogStore'

export default function TemplatesPage() {
  const templates = useCatalogStore((state) => state.workspace.templates)
  const catalogs = useCatalogStore((state) => state.workspace.catalogs)

  return (
    <div className="space-y-6">
      <section className="surface-card p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="rounded-2xl bg-primary/10 p-3 text-primary">
            <LayoutTemplate className="h-6 w-6" />
          </span>
          <div>
            <Badge tone="primary">Biblioteca</Badge>
            <h1 className="mt-3 text-3xl font-bold tracking-tight text-text">Plantillas editoriales</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
              Diseños reutilizables con reglas de composición seguras. Cada catálogo puede personalizar colores, portada, densidad y contenido.
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-3">
        {templates.map((template) => {
          const usage = catalogs.filter((item) => item.templateId === template.id).length
          return (
            <article key={template.id} className="surface-card overflow-hidden">
              <div
                className="relative h-64 overflow-hidden p-8"
                style={{ background: template.preview.surface, color: template.preview.ink }}
              >
                <div
                  className="absolute -right-16 -top-20 h-64 w-64 rounded-full opacity-15"
                  style={{ background: template.accent }}
                />
                <div className="relative flex h-full flex-col justify-between rounded-[26px] border border-current/15 p-6">
                  <div className="flex items-center justify-between">
                    <span
                      className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
                      style={{ background: template.accent }}
                    >
                      Crystal Rock
                    </span>
                    <Sparkles className="h-4 w-4 opacity-50" />
                  </div>
                  <div>
                    <div className="h-3 w-32 rounded-full bg-current opacity-90" />
                    <div className="mt-3 h-2 w-44 rounded-full bg-current opacity-25" />
                    <div className="mt-2 h-2 w-36 rounded-full bg-current opacity-15" />
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-text">{template.name}</h2>
                    <p className="mt-1 text-xs text-text-tertiary">{template.recommendedFor}</p>
                  </div>
                  <Badge tone="neutral">{usage} usos</Badge>
                </div>
                <p className="mt-4 text-sm leading-6 text-text-secondary">{template.description}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {template.coverVariants.map((variant) => (
                    <span
                      key={variant}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600"
                    >
                      <Check className="h-3 w-3 text-success" />
                      {variant}
                    </span>
                  ))}
                </div>
              </div>
            </article>
          )
        })}
      </section>
    </div>
  )
}
