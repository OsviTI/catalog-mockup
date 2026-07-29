import { Calculator, Check, Percent, Search, Undo2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import Button from '../components/ui/Button'
import { formatCurrency } from '../lib/format'
import { useParams } from '../lib/router'
import { useCatalogStore } from '../store/catalogStore'

const parseDraftPrice = (value: string) => {
  const normalized = value.replaceAll('.', '').replace(',', '.').replace(/[^\d.-]/g, '')
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

export default function CatalogPricesPage() {
  const { catalogId = '' } = useParams()
  const workspace = useCatalogStore((state) => state.workspace)
  const updatePrices = useCatalogStore((state) => state.updateProductPrices)
  const products = useMemo(
    () =>
      workspace.products
        .filter((product) => product.catalogId === catalogId)
        .sort((a, b) => a.order - b.order),
    [catalogId, workspace.products],
  )
  const [drafts, setDrafts] = useState<Record<string, string>>({})
  const [search, setSearch] = useState('')
  const [percentage, setPercentage] = useState('10')
  const [message, setMessage] = useState('')

  useEffect(() => {
    setDrafts(
      Object.fromEntries(products.map((product) => [product.id, String(product.price)])),
    )
  }, [products])

  const filtered = products.filter((product) => {
    const term = search.trim().toLowerCase()
    return (
      !term ||
      product.name.toLowerCase().includes(term) ||
      product.code.toLowerCase().includes(term)
    )
  })
  const changedIds = products
    .filter((product) => parseDraftPrice(drafts[product.id] ?? '') !== product.price)
    .map((product) => product.id)

  const applyPercentage = (direction: 1 | -1) => {
    const value = Number(percentage.replace(',', '.'))
    if (!Number.isFinite(value)) return
    const factor = 1 + (value / 100) * direction
    setDrafts((current) => ({
      ...current,
      ...Object.fromEntries(
        filtered.map((product) => [
          product.id,
          String(Math.max(0, Math.round(parseDraftPrice(current[product.id] ?? '') * factor * 100) / 100)),
        ]),
      ),
    }))
    setMessage(`Se calculó ${direction > 0 ? 'un aumento' : 'una reducción'} del ${value}% sobre la vista filtrada.`)
  }

  return (
    <div className="space-y-5">
      <section className="surface-card overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:p-6 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="rounded-2xl bg-emerald-50 p-2.5 text-emerald-700">
                <Calculator className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Edición rápida de precios</h2>
                <p className="mt-1 text-sm text-text-secondary">
                  Cambia valores en una sola grilla y confirma únicamente cuando estén listos.
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              icon={<Undo2 className="h-4 w-4" />}
              disabled={!changedIds.length}
              onClick={() =>
                setDrafts(Object.fromEntries(products.map((product) => [product.id, String(product.price)])))
              }
            >
              Descartar
            </Button>
            <Button
              icon={<Check className="h-4 w-4" />}
              disabled={!changedIds.length}
              onClick={() => {
                updatePrices(
                  catalogId,
                  Object.fromEntries(
                    changedIds.map((id) => [id, parseDraftPrice(drafts[id] ?? '')]),
                  ),
                )
                setMessage(`${changedIds.length} precios guardados correctamente.`)
              }}
            >
              Guardar {changedIds.length || ''} cambios
            </Button>
          </div>
        </div>

        <div className="grid gap-3 border-b border-border bg-slate-50/70 p-4 lg:grid-cols-[1fr_auto]">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
            <input
              className="field-control pl-9"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar nombre o código"
            />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <Percent className="h-4 w-4 text-text-tertiary" />
            <input
              className="field-control w-24"
              inputMode="decimal"
              value={percentage}
              onChange={(event) => setPercentage(event.target.value)}
              aria-label="Porcentaje"
            />
            <Button variant="secondary" onClick={() => applyPercentage(1)}>
              Aumentar
            </Button>
            <Button variant="secondary" onClick={() => applyPercentage(-1)}>
              Reducir
            </Button>
          </div>
        </div>

        {message ? (
          <div className="border-b border-primary/10 bg-primary/5 px-5 py-3 text-sm font-medium text-primary">
            {message}
          </div>
        ) : null}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border text-[11px] font-bold uppercase tracking-wider text-text-tertiary">
              <tr>
                <th className="px-6 py-3">Producto</th>
                <th className="px-4 py-3">Código estable</th>
                <th className="px-4 py-3">Precio actual</th>
                <th className="px-4 py-3">Nuevo precio</th>
                <th className="px-6 py-3">Variación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((product) => {
                const next = parseDraftPrice(drafts[product.id] ?? '')
                const difference = product.price ? ((next - product.price) / product.price) * 100 : 0
                const changed = next !== product.price
                return (
                  <tr key={product.id} className={changed ? 'bg-amber-50/45' : 'bg-white'}>
                    <td className="px-6 py-4 font-bold text-text">{product.name}</td>
                    <td className="px-4 py-4 font-mono text-xs text-text-secondary">{product.code}</td>
                    <td className="px-4 py-4 text-text-secondary">
                      {formatCurrency(product.price, product.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative w-44">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">$</span>
                        <input
                          className="field-control pl-7 font-semibold"
                          inputMode="decimal"
                          value={drafts[product.id] ?? ''}
                          onChange={(event) =>
                            setDrafts((current) => ({ ...current, [product.id]: event.target.value }))
                          }
                        />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={changed ? (difference >= 0 ? 'font-bold text-success-strong' : 'font-bold text-error') : 'text-text-tertiary'}>
                        {changed ? `${difference >= 0 ? '+' : ''}${difference.toFixed(1)}%` : 'Sin cambio'}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
