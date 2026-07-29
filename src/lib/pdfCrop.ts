import { loadAsset } from './database'
import { effectivePdfCrop, renderPdfPageBlob } from './pdfImport'
import type { PdfCropAdjustments, PdfCropRegion } from '../types/catalog'

interface PageRaster {
  image: HTMLImageElement
  width: number
  height: number
}

const pageRasterCache = new Map<string, Promise<PageRaster>>()

const imageFromBlob = (blob: Blob) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(blob)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('No se pudo abrir la imagen renderizada.'))
    }
    image.src = url
  })

const getPageRaster = (assetId: string, pageNumber: number) => {
  const key = `${assetId}:${pageNumber}`
  const cached = pageRasterCache.get(key)
  if (cached) return cached

  const pending = loadAsset(assetId).then(async (asset) => {
    if (!asset) throw new Error('No se encontró el PDF de origen.')
    const pageBlob = await renderPdfPageBlob(asset.blob, pageNumber)
    const image = await imageFromBlob(pageBlob)
    return { image, width: image.naturalWidth, height: image.naturalHeight }
  })
  pageRasterCache.set(key, pending)
  pending.catch(() => pageRasterCache.delete(key))
  return pending
}

const drawCrop = (
  canvas: HTMLCanvasElement,
  raster: PageRaster,
  region: PdfCropRegion,
  adjustments: PdfCropAdjustments,
  outputWidth: number,
) => {
  const crop = effectivePdfCrop(region, adjustments)
  const sourceX = Math.round(crop.x * raster.width)
  const sourceY = Math.round(crop.y * raster.height)
  const sourceWidth = Math.max(1, Math.round(crop.width * raster.width))
  const sourceHeight = Math.max(1, Math.round(crop.height * raster.height))
  const width = Math.max(120, outputWidth)
  const height = Math.max(80, Math.round(width * (sourceHeight / sourceWidth)))
  const context = canvas.getContext('2d')
  if (!context) throw new Error('No se pudo preparar el recorte.')
  canvas.width = width
  canvas.height = height
  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, width, height)
  context.drawImage(
    raster.image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    width,
    height,
  )
}

export const drawPdfCropPreview = async (
  canvas: HTMLCanvasElement,
  assetId: string,
  pageNumber: number,
  region: PdfCropRegion,
  adjustments: PdfCropAdjustments,
  outputWidth: number,
) => {
  const raster = await getPageRaster(assetId, pageNumber)
  drawCrop(canvas, raster, region, adjustments, outputWidth)
}

export const exportPdfCrop = async (
  assetId: string,
  pageNumber: number,
  region: PdfCropRegion,
  adjustments: PdfCropAdjustments,
) => {
  const raster = await getPageRaster(assetId, pageNumber)
  const canvas = window.document.createElement('canvas')
  drawCrop(canvas, raster, region, adjustments, 1400)
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error('No se pudo guardar el recorte como imagen.')),
      'image/webp',
      0.94,
    )
  })
}
