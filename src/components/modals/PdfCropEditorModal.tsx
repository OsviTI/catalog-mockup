import { Crop, ImagePlus, Move, RotateCcw, ZoomIn } from 'lucide-react'
import { useEffect, useState } from 'react'
import type {
  PdfCandidate,
  PdfCropAdjustments,
} from '../../types/catalog'
import PdfCropPreview from '../pdf/PdfCropPreview'
import Button from '../ui/Button'
import Modal from '../ui/Modal'

interface PdfCropEditorModalProps {
  open: boolean
  assetId?: string
  candidate?: PdfCandidate
  saving?: boolean
  onClose: () => void
  onSave: (adjustments: PdfCropAdjustments) => void
}

const defaultAdjustments: PdfCropAdjustments = {
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
}

export default function PdfCropEditorModal({
  open,
  assetId,
  candidate,
  saving,
  onClose,
  onSave,
}: PdfCropEditorModalProps) {
  const [adjustments, setAdjustments] = useState(defaultAdjustments)

  useEffect(() => {
    if (!open) return
    setAdjustments(candidate?.cropAdjustments ?? defaultAdjustments)
  }, [candidate?.id, candidate?.cropAdjustments, open])

  const disabled = !assetId || !candidate?.cropRegion
  const setValue = (field: keyof PdfCropAdjustments, value: number) =>
    setAdjustments((current) => ({ ...current, [field]: value }))

  return (
    <Modal
      open={open}
      onClose={saving ? () => undefined : onClose}
      size="lg"
      title="Ajustar imagen del producto"
      description="El recorte se obtiene de la página original. Amplía y desplaza hasta aislar el producto."
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            icon={<ImagePlus className="h-4 w-4" />}
            loading={saving}
            disabled={disabled}
            onClick={() => onSave(adjustments)}
          >
            Guardar como imagen
          </Button>
        </>
      }
    >
      {assetId && candidate?.cropRegion ? (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(240px,0.75fr)]">
          <div>
            <div className="overflow-hidden rounded-2xl border border-border bg-slate-100">
              <PdfCropPreview
                assetId={assetId}
                pageNumber={candidate.pageNumber}
                region={candidate.cropRegion}
                adjustments={adjustments}
                outputWidth={900}
              />
            </div>
            <p className="mt-3 flex items-center gap-2 text-xs leading-5 text-text-secondary">
              <Crop className="h-4 w-4 shrink-0 text-primary" />
              Recorte provisional de la página {candidate.pageNumber}. La página fuente no se modifica.
            </p>
          </div>

          <div className="space-y-5 rounded-2xl border border-border bg-slate-50 p-4">
            <div>
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="crop-zoom" className="flex items-center gap-2 text-sm font-bold">
                  <ZoomIn className="h-4 w-4 text-primary" /> Escala
                </label>
                <span className="text-xs font-semibold text-text-secondary">
                  {Math.round(adjustments.zoom * 100)}%
                </span>
              </div>
              <input
                id="crop-zoom"
                type="range"
                min="0.6"
                max="3"
                step="0.02"
                value={adjustments.zoom}
                onChange={(event) => setValue('zoom', Number(event.target.value))}
                className="mt-3 w-full accent-primary"
              />
              <p className="mt-1 text-xs text-text-tertiary">
                Menos escala muestra más contexto; más escala acerca el producto.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="crop-horizontal" className="flex items-center gap-2 text-sm font-bold">
                  <Move className="h-4 w-4 text-primary" /> Movimiento horizontal
                </label>
                <span className="text-xs font-semibold text-text-secondary">
                  {Math.round(adjustments.offsetX * 100)}
                </span>
              </div>
              <input
                id="crop-horizontal"
                type="range"
                min="-1"
                max="1"
                step="0.01"
                value={adjustments.offsetX}
                onChange={(event) => setValue('offsetX', Number(event.target.value))}
                className="mt-3 w-full accent-primary"
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <label htmlFor="crop-vertical" className="flex items-center gap-2 text-sm font-bold">
                  <Move className="h-4 w-4 rotate-90 text-primary" /> Movimiento vertical
                </label>
                <span className="text-xs font-semibold text-text-secondary">
                  {Math.round(adjustments.offsetY * 100)}
                </span>
              </div>
              <input
                id="crop-vertical"
                type="range"
                min="-1"
                max="1"
                step="0.01"
                value={adjustments.offsetY}
                onChange={(event) => setValue('offsetY', Number(event.target.value))}
                className="mt-3 w-full accent-primary"
              />
            </div>

            <Button
              type="button"
              variant="secondary"
              className="w-full"
              icon={<RotateCcw className="h-4 w-4" />}
              onClick={() => setAdjustments(defaultAdjustments)}
            >
              Restablecer recorte
            </Button>
          </div>
        </div>
      ) : (
        <p className="text-sm text-text-secondary">
          Este candidato todavía no tiene una zona visual detectada.
        </p>
      )}
    </Modal>
  )
}
