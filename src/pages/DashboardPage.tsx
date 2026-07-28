import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mockCatalogs } from '../data/mockCatalogs'
import Badge from '../components/ui/Badge'
import CreateCatalogModal from '../components/modals/CreateCatalogModal'

export default function DashboardPage() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <section className="space-y-6">
      <CreateCatalogModal open={open} onClose={() => setOpen(false)} />

      <div className="rounded-[28px] border border-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Dashboard</p>
            <h2 className="mt-2 text-3xl font-semibold text-text">Catálogos activos</h2>
            <p className="mt-2 max-w-2xl text-sm text-text-secondary">
              Centro de operación para crear, revisar y generar catálogos digitales con datos simulados y flujo de publicación visual.
            </p>
          </div>
          <button onClick={() => setOpen(true)} className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-hover">
            + Nuevo catálogo
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {mockCatalogs.map((catalog) => (
          <article key={catalog.id} className="overflow-hidden rounded-[24px] border border-border bg-white shadow-sm">
            <img src={catalog.cover} alt={catalog.name} className="h-36 w-full object-cover" />
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-text">{catalog.name}</h3>
                  <p className="mt-1 text-sm text-text-secondary">{catalog.updatedAt}</p>
                </div>
                <Badge tone={catalog.status === 'Publicado' ? 'success' : catalog.status === 'Listo para revisar' ? 'primary' : 'warning'}>
                  {catalog.status}
                </Badge>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-text-secondary">
                <span>{catalog.productsCount} productos</span>
                <span>Versión {catalog.version}</span>
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => navigate(`/detalle/${catalog.id}`)}
                  className="rounded-full border border-border px-3 py-1.5 text-sm text-text-secondary hover:bg-bg"
                >
                  Ver detalle
                </button>
                <button className="rounded-full bg-primary px-3 py-1.5 text-sm text-white hover:bg-primary-hover">
                  Generar PDF
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
