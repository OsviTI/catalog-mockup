import { useState } from 'react'
import { mockProducts } from '../data/mockProducts'
import Badge from '../components/ui/Badge'

export default function PreviewPage() {
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = () => {
    setIsGenerating(true)
    window.setTimeout(() => setIsGenerating(false), 1400)
  }

  return (
    <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-[28px] border border-border bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Previsualización</p>
            <h2 className="mt-2 text-3xl font-semibold text-text">Vista previa del catálogo</h2>
          </div>
          <div className="flex gap-2">
            <button className="rounded-full border border-border px-3 py-1.5 text-sm text-text-secondary hover:bg-bg">
              Descargar PDF
            </button>
            <button onClick={handleGenerate} className="rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-white hover:bg-primary-hover">
              {isGenerating ? 'Procesando...' : 'Regenerar'}
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-[24px] border border-border bg-bg p-4">
          {isGenerating ? (
            <div className="rounded-[20px] border border-dashed border-primary/30 bg-primary/5 p-8 text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Generando vista previa</p>
              <p className="mt-2 text-sm text-text-secondary">Actualizando portada, bloques de producto y versión del PDF.</p>
              <div className="mx-auto mt-4 h-2 w-full max-w-xs rounded-full bg-border">
                <div className="h-2 w-2/3 rounded-full bg-primary transition-all" />
              </div>
            </div>
          ) : (
            <div className="rounded-[20px] bg-white p-4 shadow-inner">
            <div className="rounded-[18px] bg-gradient-to-br from-primary/15 via-white to-bg p-6">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Colección</p>
                  <h3 className="mt-2 text-2xl font-semibold text-text">Cristalería Premium</h3>
                  <p className="mt-2 max-w-xl text-sm text-text-secondary">
                    Catálogo digital con portada institucional, productos destacados, categorías y cierre comercial.
                  </p>
                </div>
                <Badge tone="primary">v3 · 28/07/2026</Badge>
              </div>
            </div>

            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {mockProducts.slice(0, 2).map((product) => (
                <div key={product.id} className="rounded-[20px] border border-border bg-bg p-4">
                  <img src={product.image} alt={product.name} className="h-32 w-full rounded-[14px] object-cover" />
                  <div className="mt-3">
                    <p className="text-sm font-semibold text-text">{product.name}</p>
                    <p className="mt-1 text-sm text-text-secondary">{product.material}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-sm font-semibold text-primary">{product.price}</span>
                      <Badge tone="success">{product.stock}</Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-[28px] border border-border bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-text">Resumen de generación</h3>
        <ul className="mt-4 space-y-3 text-sm text-text-secondary">
          <li>• 18 páginas generadas</li>
          <li>• 3 categorías incluidas</li>
          <li>• 24 productos con precio actualizado</li>
          <li>• Versionado automático activado</li>
        </ul>

        <div className="mt-6 rounded-2xl border border-border bg-bg p-4">
          <p className="text-sm font-semibold text-text">Última versión</p>
          <p className="mt-1 text-sm text-text-secondary">v3 · 28/07/2026 · Generado a las 16:45</p>
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-bg p-4">
          <p className="text-sm font-semibold text-text">Productos destacados</p>
          <div className="mt-3 space-y-2">
            {mockProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between rounded-xl bg-white px-3 py-2">
                <span className="text-sm text-text">{product.name}</span>
                <span className="text-sm font-semibold text-primary">{product.price}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
