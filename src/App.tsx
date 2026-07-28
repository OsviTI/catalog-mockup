import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom'
import DashboardPage from './pages/DashboardPage'
import ConfigPage from './pages/ConfigPage'
import PreviewPage from './pages/PreviewPage'
import CatalogDetailPage from './pages/CatalogDetailPage'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-bg text-text">
        <header className="border-b border-border bg-white/90 backdrop-blur">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
                Catalog Mockup
              </p>
              <h1 className="text-xl font-semibold text-text">
                Automatización de catálogos PDF
              </h1>
            </div>
            <nav className="flex flex-wrap gap-2 rounded-full border border-border bg-bg p-1">
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-primary text-white shadow' : 'text-text-secondary hover:bg-white'
                  }`
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/configuracion"
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-primary text-white shadow' : 'text-text-secondary hover:bg-white'
                  }`
                }
              >
                Configuración
              </NavLink>
              <NavLink
                to="/preview"
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-primary text-white shadow' : 'text-text-secondary hover:bg-white'
                  }`
                }
              >
                Previsualización
              </NavLink>
              <NavLink
                to="/detalle"
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition ${
                    isActive ? 'bg-primary text-white shadow' : 'text-text-secondary hover:bg-white'
                  }`
                }
              >
                Detalle
              </NavLink>
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 py-8">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/configuracion" element={<ConfigPage />} />
            <Route path="/preview" element={<PreviewPage />} />
            <Route path="/detalle/:catalogId" element={<CatalogDetailPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  )
}

export default App
