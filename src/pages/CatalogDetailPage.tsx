import { useParams, Link } from 'react-router-dom'
import ProductTable from '../components/catalog/ProductTable'
import ProgressPanel from '../components/catalog/ProgressPanel'
import { mockProducts } from '../data/mockProducts'
import { mockCatalogs } from '../data/mockCatalogs'

export default function CatalogDetailPage() {
  const { catalogId } = useParams()
  const catalog = mockCatalogs.find((item) => item.id === catalogId) ?? mockCatalogs[0]

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Detalle de catálogo</p>
            <h2 className="mt-2 text-3xl font-semibold text-text">{catalog.name}</h2>
            <p className="mt-2 text-sm text-text-secondary">Revisión de productos, precios, stock y estado de generación para la versión digital del PDF.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/" className="rounded-full border border-border px-4 py-2 text-sm text-text-secondary hover:bg-bg">
              Volver
            </Link>
            <button className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover">
              Generar nueva versión
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <ProductTable />
        <div className="space-y-6">
          <ProgressPanel title="Progreso de generación" steps={['Importando datos', 'Validando productos', 'Aplicando plantilla', 'Generando PDF']} />
          <div className="rounded-[24px] border border-border bg-white p-5 shadow-sm">
            <h3 className="font-semibold text-text">Resumen rápido</h3>
            <div className="mt-4 space-y-3 text-sm text-text-secondary">
              <div className="flex items-center justify-between rounded-2xl bg-bg px-3 py-3">
                <span>Productos cargados</span>
                <span className="font-semibold text-text">{mockProducts.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-bg px-3 py-3">
                <span>Última actualización</span>
                <span className="font-semibold text-text">{catalog.updatedAt}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-bg px-3 py-3">
                <span>Versión PDF</span>
                <span className="font-semibold text-text">{catalog.version}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
