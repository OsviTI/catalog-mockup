interface CreateCatalogModalProps {
  open: boolean
  onClose: () => void
}

export default function CreateCatalogModal({ open, onClose }: CreateCatalogModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-3xl border border-border bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Nuevo catálogo</p>
            <h3 className="mt-2 text-xl font-semibold text-text">Crear catálogo desde datos</h3>
          </div>
          <button onClick={onClose} className="rounded-full border border-border px-3 py-1 text-sm text-text-secondary">
            Cerrar
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="text-sm font-medium text-text">Nombre del catálogo</label>
            <input className="mt-2 w-full rounded-2xl border border-border bg-bg px-4 py-3 text-sm outline-none" placeholder="Ej. Colección Otoño 2026" />
          </div>
          <div>
            <label className="text-sm font-medium text-text">Fuente de datos</label>
            <select className="mt-2 w-full rounded-2xl border border-border bg-bg px-4 py-3 text-sm outline-none">
              <option>Excel / CSV</option>
              <option>Datos mock</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-text">Observaciones</label>
            <textarea className="mt-2 min-h-[90px] w-full rounded-2xl border border-border bg-bg px-4 py-3 text-sm outline-none" placeholder="Ajustes de edición, promociones o campañas" />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-full border border-border px-4 py-2 text-sm text-text-secondary">
            Cancelar
          </button>
          <button className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover">
            Crear catálogo
          </button>
        </div>
      </div>
    </div>
  )
}
