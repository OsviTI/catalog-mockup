import { CheckCircle2, FileText, Upload } from 'lucide-react'
import { useState } from 'react'
import { persistAsset } from '../../lib/database'
import { analyzePdfCatalog } from '../../lib/pdfImport'
import { useNavigate } from '../../lib/router'
import { InputField, TextareaField } from '../ui/FormField'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { useCatalogStore } from '../../store/catalogStore'

interface CreateCatalogModalProps {
  open: boolean
  onClose: () => void
}

export default function CreateCatalogModal({ open, onClose }: CreateCatalogModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [pdfFile, setPdfFile] = useState<File>()
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState('')
  const createCatalog = useCatalogStore((state) => state.createCatalog)
  const updateCatalog = useCatalogStore((state) => state.updateCatalog)
  const createPdfSession = useCatalogStore((state) => state.createPdfImportSession)
  const completePdfAnalysis = useCatalogStore((state) => state.completePdfAnalysis)
  const failImportSession = useCatalogStore((state) => state.failImportSession)
  const navigate = useNavigate()

  const reset = () => {
    setName('')
    setDescription('')
    setPdfFile(undefined)
    setProgress('')
    setError('')
  }

  const close = () => {
    if (busy) return
    reset()
    onClose()
  }

  const handlePdfSelected = (file?: File) => {
    setError('')
    if (!file) {
      setPdfFile(undefined)
      return
    }
    if (file.type && file.type !== 'application/pdf') {
      setError('Selecciona un archivo PDF válido.')
      return
    }
    setPdfFile(file)
    if (!name.trim()) {
      setName(
        file.name
          .replace(/\.pdf$/i, '')
          .replace(/[_-]+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim(),
      )
    }
  }

  const handleCreate = async () => {
    const cleanName = name.trim()
    if (!cleanName || !pdfFile) return
    let catalogId = ''
    let sessionId = ''
    setBusy(true)
    setError('')
    setProgress('Guardando el PDF como documento base…')
    try {
      catalogId = createCatalog(cleanName)
      if (description.trim()) {
        updateCatalog(catalogId, { description: description.trim() })
      }
      const asset = await persistAsset(pdfFile)
      sessionId = createPdfSession(catalogId, pdfFile.name, asset.id, true)
      const categories = useCatalogStore
        .getState()
        .workspace.categories.filter((category) => category.catalogId === catalogId)
      const result = await analyzePdfCatalog(
        pdfFile,
        catalogId,
        categories,
        (page, total) =>
          setProgress(`Construyendo catálogo base · página ${page} de ${total}`),
      )
      completePdfAnalysis(sessionId, result.diagnostics, result.candidates, result.warnings)
      reset()
      onClose()
      navigate(`/catalogos/${catalogId}/importaciones`)
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : 'No pudimos crear el catálogo desde este PDF.'
      if (sessionId) failImportSession(sessionId, message)
      setError(message)
      setProgress('')
      if (catalogId) {
        reset()
        onClose()
        navigate(`/catalogos/${catalogId}/importaciones`)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={close}
      title="Crear catálogo desde PDF"
      description="El documento original será la base visual y la evidencia para reconstruir productos, imágenes y plantilla."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={close} disabled={busy}>
            Cancelar
          </Button>
          <Button
            onClick={() => void handleCreate()}
            disabled={!name.trim() || !pdfFile}
            loading={busy}
          >
            Crear y analizar PDF
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <label
          className={`block cursor-pointer rounded-2xl border-2 border-dashed p-5 transition ${
            pdfFile
              ? 'border-success/35 bg-success/5'
              : 'border-primary/25 bg-primary/5 hover:border-primary/45'
          }`}
        >
          <div className="flex items-start gap-4">
            <span
              className={`rounded-2xl p-3 ${
                pdfFile ? 'bg-success/10 text-success' : 'bg-white text-primary'
              }`}
            >
              {pdfFile ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : (
                <Upload className="h-6 w-6" />
              )}
            </span>
            <div className="min-w-0">
              <p className="font-bold text-text">
                {pdfFile ? 'PDF base seleccionado' : 'Selecciona primero el catálogo PDF'}
              </p>
              <p className="mt-1 truncate text-sm text-text-secondary">
                {pdfFile
                  ? `${pdfFile.name} · ${(pdfFile.size / 1024 / 1024).toFixed(1)} MB`
                  : 'Preferentemente exportado desde InDesign con texto seleccionable.'}
              </p>
              <span className="mt-3 inline-flex items-center gap-2 text-xs font-bold text-primary">
                <FileText className="h-4 w-4" />
                {pdfFile ? 'Cambiar archivo' : 'Buscar PDF'}
              </span>
            </div>
          </div>
          <input
            type="file"
            accept=".pdf,application/pdf"
            className="sr-only"
            disabled={busy}
            onChange={(event) => handlePdfSelected(event.target.files?.[0])}
          />
        </label>
        <InputField
          label="Nombre del catálogo"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ej. Colección Invierno 2026"
          autoFocus
        />
        <TextareaField
          label="Descripción"
          hint="Opcional"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Objetivo, campaña o notas internas del catálogo."
        />
        {progress || error ? (
          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-medium ${
              error
                ? 'border-error/20 bg-error/5 text-error'
                : 'border-primary/15 bg-primary/5 text-primary'
            }`}
          >
            {error || progress}
          </div>
        ) : null}
        <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
          <p className="text-sm font-semibold text-primary">A partir del PDF, el sistema preparará</p>
          <ul className="mt-2 grid gap-2 text-sm text-text-secondary sm:grid-cols-2">
            <li>• Documento base persistente</li>
            <li>• Productos editables detectados</li>
            <li>• Plantilla editorial compatible</li>
            <li>• Recortes visuales revisables</li>
          </ul>
        </div>
      </div>
    </Modal>
  )
}
