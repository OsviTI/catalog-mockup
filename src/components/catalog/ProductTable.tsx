import { mockProducts } from '../../data/mockProducts'

export default function ProductTable() {
  return (
    <div className="overflow-hidden rounded-[24px] border border-border bg-white shadow-sm">
      <div className="border-b border-border bg-bg px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Datos de producto</p>
            <h3 className="mt-1 text-xl font-semibold text-text">Vista editable simulada</h3>
          </div>
          <button className="rounded-full border border-border px-3 py-1.5 text-sm text-text-secondary hover:bg-white">
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white text-text-secondary">
            <tr>
              <th className="px-5 py-3">Producto</th>
              <th className="px-5 py-3">Código</th>
              <th className="px-5 py-3">Precio</th>
              <th className="px-5 py-3">Categoría</th>
              <th className="px-5 py-3">Stock</th>
            </tr>
          </thead>
          <tbody>
            {mockProducts.map((product) => (
              <tr key={product.id} className="border-t border-border bg-white/70 hover:bg-bg">
                <td className="px-5 py-3 font-medium text-text">{product.name}</td>
                <td className="px-5 py-3 text-text-secondary">{product.code}</td>
                <td className="px-5 py-3 text-text-secondary">{product.price}</td>
                <td className="px-5 py-3 text-text-secondary">{product.category}</td>
                <td className="px-5 py-3 text-text-secondary">{product.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
