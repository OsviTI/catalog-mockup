import { safeFilename } from './format'

const waitForImages = async (container: HTMLElement) => {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (!container.querySelector('[data-asset-pending="true"]')) break
    await new Promise((resolve) => window.setTimeout(resolve, 50))
  }
  const images = Array.from(container.querySelectorAll('img'))
  await Promise.all(
    images.map((image) => {
      if (image.complete) return Promise.resolve()
      return new Promise<void>((resolve) => {
        image.addEventListener('load', () => resolve(), { once: true })
        image.addEventListener('error', () => resolve(), { once: true })
      })
    }),
  )
}

export const downloadCatalogPdf = async (
  container: HTMLElement,
  catalogName: string,
  onProgress?: (current: number, total: number) => void,
) => {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ])
  await document.fonts.ready
  await waitForImages(container)

  const pages = Array.from(container.querySelectorAll<HTMLElement>('[data-pdf-page]'))
  if (!pages.length) throw new Error('No hay páginas para exportar.')

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
    putOnlyUsedFonts: true,
  })

  for (let index = 0; index < pages.length; index += 1) {
    onProgress?.(index + 1, pages.length)
    const canvas = await html2canvas(pages[index], {
      scale: 2,
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      imageTimeout: 12_000,
    })
    if (index > 0) pdf.addPage('a4', 'portrait')
    pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, 210, 297, undefined, 'FAST')
  }

  pdf.setProperties({
    title: catalogName,
    subject: 'Catálogo comercial digital',
    author: 'Catalog Studio',
    creator: 'Catalog Studio',
  })
  pdf.save(`${safeFilename(catalogName)}.pdf`)
}
