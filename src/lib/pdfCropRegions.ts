import type { PdfCandidate } from '../types/catalog'

export const addProvisionalCropRegions = (
  candidates: PdfCandidate[],
  recognizedTemplate: boolean,
) => {
  const byPage = candidates.reduce<Map<number, PdfCandidate[]>>((pages, candidate) => {
    const page = pages.get(candidate.pageNumber) ?? []
    page.push(candidate)
    pages.set(candidate.pageNumber, page)
    return pages
  }, new Map())

  byPage.forEach((pageCandidates) => {
    pageCandidates.forEach((candidate, index) => {
      if (candidate.cropRegion) return
      const isFeaturedLayout = recognizedTemplate && pageCandidates.length === 1
      const rowHeight = 0.88 / Math.max(pageCandidates.length, 1)
      candidate.cropRegion = isFeaturedLayout
        ? { x: 0.085, y: 0.15, width: 0.83, height: 0.43 }
        : recognizedTemplate
          ? {
              x: 0.615,
              y: 0.06 + index * rowHeight,
              width: 0.3,
              height: Math.max(0.12, rowHeight - 0.012),
            }
          : {
              x: 0.5,
              y: Math.max(0.02, index / pageCandidates.length),
              width: 0.47,
              height: Math.min(0.92, 0.94 / pageCandidates.length),
            }
      candidate.cropAdjustments ??= { zoom: 1, offsetX: 0, offsetY: 0 }
      candidate.imageConfidence ??= recognizedTemplate ? 0.84 : 0.52
      candidate.imageStatus ??= candidate.product.image.assetId ? 'saved' : 'provisional'
    })
  })

  return candidates
}
