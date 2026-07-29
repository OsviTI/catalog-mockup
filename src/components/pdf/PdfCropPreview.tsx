import { ImageOff, LoaderCircle } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { drawPdfCropPreview } from '../../lib/pdfCrop'
import type { PdfCropAdjustments, PdfCropRegion } from '../../types/catalog'

interface PdfCropPreviewProps {
  assetId: string
  pageNumber: number
  region: PdfCropRegion
  adjustments: PdfCropAdjustments
  outputWidth?: number
  className?: string
}

export default function PdfCropPreview({
  assetId,
  pageNumber,
  region,
  adjustments,
  outputWidth = 480,
  className = '',
}: PdfCropPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [visible, setVisible] = useState(false)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    const container = containerRef.current
    if (!container || typeof IntersectionObserver === 'undefined') {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        setVisible(true)
        observer.disconnect()
      },
      { rootMargin: '320px' },
    )
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (!visible) return
    let active = true
    const canvas = canvasRef.current
    if (!canvas) return
    setStatus('loading')
    drawPdfCropPreview(
      canvas,
      assetId,
      pageNumber,
      region,
      adjustments,
      outputWidth,
    )
      .then(() => {
        if (!active) return
        setStatus('ready')
      })
      .catch(() => active && setStatus('error'))
    return () => {
      active = false
    }
  }, [adjustments, assetId, outputWidth, pageNumber, region, visible])

  return (
    <div
      ref={containerRef}
      className={`relative flex min-h-32 items-center justify-center overflow-hidden bg-slate-100 ${className}`}
    >
      {!visible || status === 'loading' ? (
        <LoaderCircle className="absolute h-5 w-5 animate-spin text-primary" />
      ) : null}
      {status === 'error' ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-3 text-center text-xs text-text-tertiary">
          <ImageOff className="h-5 w-5" />
          No se pudo mostrar el recorte
        </div>
      ) : null}
      <canvas
        ref={canvasRef}
        className={`h-auto w-full ${status === 'ready' ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  )
}
