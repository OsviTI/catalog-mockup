import {
  ImagePlus,
  RotateCcw,
  Save,
  SlidersHorizontal,
  Sparkles,
  Upload,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAssetUrl } from '../../hooks/useAssetUrl'
import { persistBlob } from '../../lib/database'
import type { ImageReference } from '../../types/catalog'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import Modal from '../ui/Modal'

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('No se pudo cargar la fotografía.'))
    image.src = src
  })

const canvasBlob = (canvas: HTMLCanvasElement) =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error('No se pudo procesar la fotografía.')),
      'image/jpeg',
      0.92,
    ),
  )

interface CreativeImageEditorModalProps {
  open: boolean
  subjectName: string
  subjectCode: string
  image: ImageReference
  onClose: () => void
  onApply: (assetId: string, name: string, prompt: string) => void | Promise<void>
}

export default function CreativeImageEditorModal({
  open,
  subjectName,
  subjectCode,
  image,
  onClose,
  onApply,
}: CreativeImageEditorModalProps) {
  const originalUrl = useAssetUrl(image)
  const [localUrl, setLocalUrl] = useState('')
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [saturation, setSaturation] = useState(100)
  const [prompt, setPrompt] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const sourceUrl = localUrl || originalUrl

  useEffect(() => {
    if (!open) return
    setLocalUrl((current) => {
      if (current.startsWith('blob:')) URL.revokeObjectURL(current)
      return ''
    })
    setBrightness(100)
    setContrast(100)
    setSaturation(100)
    setPrompt('')
    setMessage('')
    setError('')
  }, [open, subjectCode])

  useEffect(
    () => () => {
      if (localUrl.startsWith('blob:')) URL.revokeObjectURL(localUrl)
    },
    [localUrl],
  )

  const selectFile = (file?: File) => {
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Utiliza una imagen JPG, PNG o WebP.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('La imagen supera el máximo de 10 MB.')
      return
    }
    if (localUrl.startsWith('blob:')) URL.revokeObjectURL(localUrl)
    setLocalUrl(URL.createObjectURL(file))
    setError('')
    setMessage('')
  }

  const reset = () => {
    setBrightness(100)
    setContrast(100)
    setSaturation(100)
  }

  const simulateSuggestion = () => {
    const instruction = prompt.toLocaleLowerCase('es')
    if (/c[aá]lid|dorado|hogar|ambient/.test(instruction)) {
      setBrightness(108)
      setContrast(106)
      setSaturation(118)
    } else if (/premium|elegante|lujo|dram[aá]tic/.test(instruction)) {
      setBrightness(92)
      setContrast(128)
      setSaturation(92)
    } else if (/limpi|blanco|ecommerce|producto/.test(instruction)) {
      setBrightness(118)
      setContrast(108)
      setSaturation(96)
    } else {
      setBrightness(106)
      setContrast(112)
      setSaturation(108)
    }
    setMessage(
      'Propuesta simulada localmente. Un proveedor de IA podrá reemplazar este paso más adelante.',
    )
    setError('')
  }

  const save = async () => {
    if (!sourceUrl) return
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const sourceImage = await loadImage(sourceUrl)
      const scale = Math.min(
        1,
        1800 / Math.max(sourceImage.naturalWidth, sourceImage.naturalHeight),
      )
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(sourceImage.naturalWidth * scale))
      canvas.height = Math.max(1, Math.round(sourceImage.naturalHeight * scale))
      const context = canvas.getContext('2d')
      if (!context) throw new Error('El navegador no admite edición con canvas.')
      context.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`
      context.drawImage(sourceImage, 0, 0, canvas.width, canvas.height)
      const blob = await canvasBlob(canvas)
      const name = `${subjectCode || 'producto'}-mejorada.jpg`
      const stored = await persistBlob(blob, name)
      await onApply(stored.id, name, prompt.trim())
      setMessage('La fotografía mejorada se guardó y ya forma parte de este borrador.')
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : 'No se pudo procesar la fotografía.',
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={saving ? () => undefined : onClose}
      title={`Estudio creativo · ${subjectName}`}
      description="Mejora o reemplaza la fotografía con un flujo local preparado para integrar IA real más adelante."
      size="xl"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cerrar
          </Button>
          <Button
            icon={<Save className="h-4 w-4" />}
            loading={saving}
            disabled={!sourceUrl}
            onClick={() => void save()}
          >
            Guardar y usar en el borrador
          </Button>
        </>
      }
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="overflow-hidden rounded-2xl border border-border bg-slate-100">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-white p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-violet-600" />
              <p className="text-sm font-bold">Previsualización de la fotografía</p>
            </div>
            <Badge tone="warning">Mockup local · sin IA real</Badge>
          </div>
          <div className="flex min-h-[480px] items-center justify-center p-6">
            {sourceUrl ? (
              <img
                src={sourceUrl}
                alt={subjectName}
                className="max-h-[560px] max-w-full rounded-2xl object-contain shadow-xl"
                style={{
                  filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
                }}
              />
            ) : (
              <label className="cursor-pointer rounded-3xl border-2 border-dashed border-slate-300 bg-white p-10 text-center hover:border-primary/40">
                <ImagePlus className="mx-auto h-8 w-8 text-primary" />
                <p className="mt-3 text-sm font-bold">Agregar fotografía</p>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => selectFile(event.target.files?.[0])}
                />
              </label>
            )}
          </div>
        </div>

        <aside className="rounded-2xl border border-border bg-white p-5">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-violet-50 p-2 text-violet-700">
              <SlidersHorizontal className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-bold">Ajustes de imagen</p>
              <p className="font-mono text-xs text-text-tertiary">{subjectCode}</p>
            </div>
          </div>

          <label className="mt-5 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:bg-slate-50">
            <Upload className="h-4 w-4" />
            {sourceUrl ? 'Usar otra fotografía' : 'Agregar fotografía'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => selectFile(event.target.files?.[0])}
            />
          </label>

          <div className="mt-5 rounded-2xl border border-violet-100 bg-violet-50/60 p-4">
            <div className="flex items-center gap-2 text-violet-800">
              <Sparkles className="h-4 w-4" />
              <p className="text-xs font-bold">Asistencia creativa simulada</p>
            </div>
            <textarea
              className="field-control mt-3 min-h-20 resize-y bg-white"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Ej.: fotografía limpia, más luminosa y con acabado premium…"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="mt-3 w-full"
              icon={<Sparkles className="h-4 w-4" />}
              onClick={simulateSuggestion}
            >
              Simular propuesta
            </Button>
          </div>

          {[
            ['Iluminación', brightness, setBrightness],
            ['Contraste', contrast, setContrast],
            ['Saturación', saturation, setSaturation],
          ].map(([label, value, setter]) => (
            <label
              key={String(label)}
              className="mt-5 block text-xs font-semibold text-text-secondary"
            >
              <span className="flex justify-between">
                {String(label)}
                <span>{Number(value)}%</span>
              </span>
              <input
                type="range"
                min="50"
                max="160"
                value={Number(value)}
                onChange={(event) =>
                  (setter as (value: number) => void)(Number(event.target.value))
                }
                className="mt-2 w-full accent-primary"
              />
            </label>
          ))}

          <Button
            type="button"
            variant="secondary"
            className="mt-5 w-full"
            icon={<RotateCcw className="h-4 w-4" />}
            onClick={reset}
          >
            Restablecer ajustes
          </Button>
          {error ? <p className="mt-4 text-xs leading-5 text-error">{error}</p> : null}
          {message ? (
            <p className="mt-4 rounded-xl bg-success/5 p-3 text-xs leading-5 text-success-strong">
              {message}
            </p>
          ) : null}
        </aside>
      </div>
    </Modal>
  )
}
