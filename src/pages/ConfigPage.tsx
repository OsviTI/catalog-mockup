import { useState } from 'react'
import { mockValidation } from '../data/mockValidations'
import Badge from '../components/ui/Badge'
import ProgressCard from '../components/ui/ProgressCard'

export default function ConfigPage() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSimulateLoad = () => {
    setIsLoading(true)
    window.setTimeout(() => setIsLoading(false), 1200)
  }

  return (
    <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <div className="rounded-[28px] border border-border bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Configuración</p>
        <h2 className="mt-2 text-3xl font-semibold text-text">Preparación del catálogo</h2>
        <p className="mt-3 text-sm text-text-secondary">
          Carga de datos, validación visual y selección de plantilla para preparar la generación del PDF.
        </p>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <ProgressCard label="Archivo cargado" value="catalogo.xlsx" hint="Fuente: Excel / CSV" />
          <ProgressCard label="Productos detectados" value="24" hint="Incluye precios y categorías" />
          <ProgressCard label="Plantilla activa" value="Plantilla base" hint="Portada + categorías + cierre" />
          <ProgressCard label="Estado de exportación" value="Listo" hint="Preparado para preview" />
        </div>

        <div className="mt-6 space-y-3">
          {mockValidation.map((item, index) => (
            <div key={index} className="flex items-center justify-between rounded-2xl border border-border bg-bg px-4 py-3">
              <span className="text-sm text-text-secondary">{item.message}</span>
              <Badge tone={item.type === 'warning' ? 'warning' : item.type === 'error' ? 'warning' : 'success'}>{item.type === 'success' ? 'OK' : item.type === 'warning' ? 'Aviso' : 'Error'}</Badge>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[28px] border border-border bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-text">Resumen de proceso</h3>
        <ul className="mt-4 space-y-3 text-sm text-text-secondary">
          <li>• Datos importados correctamente</li>
          <li>• 2 imágenes con ajuste recomendado</li>
          <li>• Plantilla fija aplicada</li>
          <li>• Previsualización disponible</li>
        </ul>

        <div className="mt-6 rounded-2xl border border-border bg-bg p-4">
          <p className="text-sm font-semibold text-text">Próximo paso</p>
          <p className="mt-2 text-sm text-text-secondary">Revisar la vista previa del catálogo y validar la distribución digital del PDF.</p>
        </div>

        <button
          onClick={handleSimulateLoad}
          className="mt-6 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          {isLoading ? 'Validando...' : 'Generar catálogo'}
        </button>

        {isLoading ? (
          <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-3 text-sm text-primary">
            Validación en curso: comprobando datos, plantilla y estado de exportación.
          </div>
        ) : null}
      </div>
    </section>
  )
}
