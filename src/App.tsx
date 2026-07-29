import { FileQuestion } from 'lucide-react'
import { useEffect } from 'react'
import CatalogWorkspaceLayout from './components/catalog/CatalogWorkspaceLayout'
import AppShell from './components/layout/AppShell'
import LoadingScreen from './components/layout/LoadingScreen'
import EmptyState from './components/ui/EmptyState'
import { Link, RouterProvider, useRouter } from './lib/router'
import CatalogDataPage from './pages/CatalogDataPage'
import CatalogCreativePage from './pages/CatalogCreativePage'
import CatalogImportsPage from './pages/CatalogImportsPage'
import CatalogPreviewPage from './pages/CatalogPreviewPage'
import CatalogPricesPage from './pages/CatalogPricesPage'
import CatalogTemplatePage from './pages/CatalogTemplatePage'
import CatalogVersionsPage from './pages/CatalogVersionsPage'
import DashboardPage from './pages/DashboardPage'
import SettingsPage from './pages/SettingsPage'
import TemplatesPage from './pages/TemplatesPage'
import { useCatalogStore } from './store/catalogStore'

function NotFoundPage() {
  return (
    <EmptyState
      icon={FileQuestion}
      title="Esta página no existe"
      description="Revisa el enlace o regresa al dashboard para continuar."
      action={
        <Link to="/" className="font-bold text-primary">
          Volver al dashboard
        </Link>
      }
    />
  )
}

function Application() {
  const hydrated = useCatalogStore((state) => state.hydrated)
  const hydrate = useCatalogStore((state) => state.hydrate)
  const { path, navigate } = useRouter()

  useEffect(() => {
    void hydrate()
  }, [hydrate])

  useEffect(() => {
    const catalogRoot = path.match(/^\/catalogos\/([^/]+)\/?$/)
    if (catalogRoot) navigate(`/catalogos/${catalogRoot[1]}/datos`, { replace: true })
  }, [navigate, path])

  if (!hydrated) return <LoadingScreen />

  let page
  if (path === '/') page = <DashboardPage />
  else if (path === '/plantillas') page = <TemplatesPage />
  else if (path === '/configuracion') page = <SettingsPage />
  else {
    const catalogRoute = path.match(
      /^\/catalogos\/([^/]+)\/(datos|importaciones|precios|creativo|plantilla|preview|versiones)\/?$/,
    )
    if (catalogRoute) {
      const section = catalogRoute[2]
      const content =
        section === 'datos' ? (
          <CatalogDataPage />
        ) : section === 'importaciones' ? (
          <CatalogImportsPage />
        ) : section === 'precios' ? (
          <CatalogPricesPage />
        ) : section === 'creativo' ? (
          <CatalogCreativePage />
        ) : section === 'plantilla' ? (
          <CatalogTemplatePage />
        ) : section === 'preview' ? (
          <CatalogPreviewPage />
        ) : (
          <CatalogVersionsPage />
        )
      page = <CatalogWorkspaceLayout>{content}</CatalogWorkspaceLayout>
    } else {
      page = <NotFoundPage />
    }
  }

  return (
    <AppShell>
      {page}
    </AppShell>
  )
}

export default function App() {
  return (
    <RouterProvider>
      <Application />
    </RouterProvider>
  )
}
