import {
  ArchiveRestore,
  Database,
  Download,
  HardDrive,
  RotateCcw,
  Save,
  ShieldCheck,
  Upload,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import Button from '../components/ui/Button'
import { InputField } from '../components/ui/FormField'
import Modal from '../components/ui/Modal'
import {
  createWorkspaceBackup,
  restoreWorkspaceBackup,
  storageEstimate,
} from '../lib/database'
import { safeFilename } from '../lib/format'
import { useCatalogStore } from '../store/catalogStore'

const formatBytes = (value = 0) => {
  if (value < 1024) return `${value} B`
  if (value < 1024 ** 2) return `${(value / 1024).toFixed(1)} KB`
  if (value < 1024 ** 3) return `${(value / 1024 ** 2).toFixed(1)} MB`
  return `${(value / 1024 ** 3).toFixed(1)} GB`
}

export default function SettingsPage() {
  const workspace = useCatalogStore((state) => state.workspace)
  const updateSettings = useCatalogStore((state) => state.updateWorkspaceSettings)
  const replaceWorkspace = useCatalogStore((state) => state.replaceWorkspace)
  const resetWorkspace = useCatalogStore((state) => state.resetWorkspace)
  const [organization, setOrganization] = useState(workspace.settings.organizationName)
  const [estimate, setEstimate] = useState<StorageEstimate | null>(null)
  const [resetOpen, setResetOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    void storageEstimate().then(setEstimate)
  }, [workspace])

  const exportBackup = async () => {
    setBusy(true)
    setMessage('')
    try {
      const blob = await createWorkspaceBackup(workspace)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${safeFilename(workspace.settings.organizationName)}-catalog-studio-backup.json`
      anchor.click()
      URL.revokeObjectURL(url)
      setMessage('Copia de seguridad exportada correctamente.')
    } catch {
      setMessage('No pudimos crear la copia de seguridad.')
    } finally {
      setBusy(false)
    }
  }

  const importBackup = async (file?: File) => {
    if (!file) return
    setBusy(true)
    setMessage('')
    try {
      const restored = await restoreWorkspaceBackup(file)
      replaceWorkspace(restored)
      setOrganization(restored.settings.organizationName)
      setMessage('Copia restaurada. Todos los catálogos e imágenes están disponibles.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No pudimos restaurar la copia.')
    } finally {
      setBusy(false)
    }
  }

  const usedPercent =
    estimate?.usage && estimate?.quota ? Math.min(100, (estimate.usage / estimate.quota) * 100) : 0

  return (
    <div className="space-y-6">
      <Modal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Restablecer demostración"
        description="Se recuperarán los catálogos originales incluidos en la aplicación."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setResetOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onClick={async () => {
                await resetWorkspace()
                setResetOpen(false)
                setMessage('La demostración volvió a su estado inicial.')
              }}
            >
              Restablecer datos
            </Button>
          </>
        }
      >
        <p className="text-sm leading-6 text-text-secondary">
          Antes de continuar, exporta una copia si deseas conservar tus cambios actuales.
        </p>
      </Modal>

      <section className="surface-card p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <span className="rounded-2xl bg-primary/10 p-3 text-primary">
            <Database className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-text">Configuración del espacio</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">
              Administra identidad, almacenamiento local y copias portables de la demostración.
            </p>
          </div>
        </div>
      </section>

      {message ? (
        <div className="rounded-2xl border border-primary/15 bg-primary/5 px-4 py-3 text-sm font-medium text-primary">
          {message}
        </div>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="surface-card p-6">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-slate-100 p-2 text-slate-600">
              <Save className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-bold text-text">Identidad del espacio</h2>
              <p className="text-xs text-text-tertiary">Visible en la navegación y respaldos</p>
            </div>
          </div>
          <div className="mt-6">
            <InputField
              label="Organización"
              value={organization}
              onChange={(event) => setOrganization(event.target.value)}
            />
          </div>
          <Button
            className="mt-4"
            onClick={() => {
              updateSettings({ organizationName: organization.trim() || 'Catalog Studio' })
              setMessage('Configuración guardada.')
            }}
          >
            Guardar configuración
          </Button>
        </section>

        <section className="surface-card p-6">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
              <HardDrive className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-bold text-text">Almacenamiento persistente</h2>
              <p className="text-xs text-text-tertiary">IndexedDB · guardado automático</p>
            </div>
          </div>
          <div className="mt-6 rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-text-secondary">{formatBytes(estimate?.usage)} utilizados</span>
              <span className="text-text-tertiary">{formatBytes(estimate?.quota)} disponibles</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-success" style={{ width: `${Math.max(1, usedPercent)}%` }} />
            </div>
          </div>
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-success/15 bg-success/5 p-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <p className="text-xs leading-5 text-text-secondary">
              {workspace.settings.persistenceRequested
                ? 'El navegador concedió almacenamiento persistente para este sitio.'
                : 'El navegador utiliza almacenamiento de mejor esfuerzo. Conserva una copia portable.'}
            </p>
          </div>
        </section>

        <section className="surface-card p-6">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-blue-50 p-2 text-blue-700">
              <ArchiveRestore className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-bold text-text">Copia portable</h2>
              <p className="text-xs text-text-tertiary">Datos, versiones e imágenes</p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-text-secondary">
            Utiliza una copia para trasladar la demostración a otro navegador o conservar un punto seguro.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Button
              variant="secondary"
              icon={<Download className="h-4 w-4" />}
              loading={busy}
              onClick={() => void exportBackup()}
            >
              Exportar copia
            </Button>
            <label className="inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-text hover:bg-slate-50">
              <Upload className="h-4 w-4" />
              Importar copia
              <input
                type="file"
                accept=".json,application/json"
                className="sr-only"
                onChange={(event) => void importBackup(event.target.files?.[0])}
              />
            </label>
          </div>
        </section>

        <section className="surface-card border-error/15 p-6">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-error/10 p-2 text-error">
              <RotateCcw className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-bold text-text">Restablecer demostración</h2>
              <p className="text-xs text-text-tertiary">Acción protegida por confirmación</p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-6 text-text-secondary">
            Elimina los cambios del espacio y recupera los datos de muestra basados en el material de Crystal Rock.
          </p>
          <Button variant="danger" className="mt-5" onClick={() => setResetOpen(true)}>
            Restablecer datos iniciales
          </Button>
        </section>
      </div>
    </div>
  )
}
