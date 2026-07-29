import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type { Category, PdfCandidate, PdfDiagnostics, Product } from '../types/catalog'

interface TextItemLike {
  str: string
  transform: number[]
}

const currencyPattern = /(?:\$|ars|precio)\s*[:.]?\s*([\d.]+(?:,\d{1,2})?)/i
const labeledCodePattern = /(?:c[oó]d(?:igo)?|sku)\s*[:.#-]?\s*([A-Z0-9][A-Z0-9./_-]{3,})/i
const standaloneCodePattern = /^[A-Z0-9][A-Z0-9./_-]{4,}$/
const ignoredNamePattern =
  /^(precio|c[oó]digo|sku|medidas?|material|pack|master|embalaje|capacidad|modelo|color|www\.|p[aá]gina)/i

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')

const parsePrice = (value: string) => {
  const lastComma = value.lastIndexOf(',')
  const lastDot = value.lastIndexOf('.')
  const normalized =
    lastComma > -1 && lastDot > -1
      ? lastComma > lastDot
        ? value.replaceAll('.', '').replace(',', '.')
        : value.replaceAll(',', '')
      : lastComma > -1
        ? value.length - lastComma <= 3
          ? value.replace(',', '.')
          : value.replaceAll(',', '')
        : value
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

const toLines = (items: TextItemLike[]) => {
  const rows = new Map<number, TextItemLike[]>()
  items.forEach((item) => {
    const y = Math.round(item.transform[5] ?? 0)
    const row = rows.get(y) ?? []
    row.push(item)
    rows.set(y, row)
  })
  return [...rows.entries()]
    .sort(([a], [b]) => b - a)
    .map(([, row]) =>
      row
        .sort((a, b) => (a.transform[4] ?? 0) - (b.transform[4] ?? 0))
        .map((item) => item.str.trim())
        .filter(Boolean)
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    .filter(Boolean)
}

const codeFromLine = (line: string) => {
  const labeled = line.match(labeledCodePattern)?.[1]
  if (labeled) return labeled
  const compact = line.trim().toUpperCase()
  return standaloneCodePattern.test(compact) && /\d/.test(compact) ? compact : ''
}

const valueForLabel = (lines: string[], index: number, label: RegExp) => {
  for (let offset = -4; offset <= 5; offset += 1) {
    const line = lines[index + offset]
    if (!line) continue
    const match = line.match(label)
    if (match?.[1]) return match[1].trim()
  }
  return ''
}

const inferName = (lines: string[], codeIndex: number) => {
  let boundary = -1
  for (let index = codeIndex - 1; index >= Math.max(0, codeIndex - 18); index -= 1) {
    if (/^(?:master|producto|destacado|para casas|cristaler[ií]a|accesorios)/i.test(lines[index])) {
      boundary = index
      break
    }
  }
  const block = lines.slice(boundary + 1, codeIndex)
  const technicalIndex = block.findIndex(
    (line) =>
      /^(?:medidas?|material|embalaje|pack|master|capacidad)/i.test(line) ||
      /^\d+(?:[.,]\d+)?\s*(?:cm|mm|ml|l\b)/i.test(line),
  )
  const nameLines = (technicalIndex >= 0 ? block.slice(0, technicalIndex) : block.slice(-3))
    .filter(
      (line) =>
        line.length >= 2 &&
        (line !== line.toUpperCase() || !/[A-ZÁÉÍÓÚÑ]/.test(line)) &&
        !ignoredNamePattern.test(line) &&
        !currencyPattern.test(line) &&
        !codeFromLine(line),
    )
  return nameLines.join(' ').replace(/\s+/g, ' ').trim()
}

const productFromCode = (
  catalogId: string,
  categoryId: string,
  lines: string[],
  codeIndex: number,
  code: string,
  order: number,
): Product => {
  const nearby = lines.slice(Math.max(0, codeIndex - 5), codeIndex + 7)
  const priceMatch = nearby.map((line) => line.match(currencyPattern)).find(Boolean)
  const name = inferName(lines, codeIndex) || `Producto ${code}`
  const now = new Date().toISOString()

  return {
    id: `product-${crypto.randomUUID()}`,
    catalogId,
    categoryId,
    name,
    code,
    price: priceMatch?.[1] ? parsePrice(priceMatch[1]) : 0,
    currency: 'ARS',
    measurements: valueForLabel(lines, codeIndex, /medidas?\s*[:.]?\s*(.+)/i),
    capacity: valueForLabel(lines, codeIndex, /capacidad\s*[:.]?\s*(.+)/i) || undefined,
    material: valueForLabel(lines, codeIndex, /material\s*[:.]?\s*(.+)/i),
    packaging: valueForLabel(lines, codeIndex, /(?:embalaje|caja)\s*[:.]?\s*(.+)/i),
    pack: valueForLabel(lines, codeIndex, /pack\s*[:.]?\s*(.+)/i),
    master: valueForLabel(lines, codeIndex, /master\s*[:.]?\s*(.+)/i),
    model: valueForLabel(lines, codeIndex, /modelo\s*[:.]?\s*(.+)/i) || undefined,
    color: valueForLabel(lines, codeIndex, /colou?r\s*[:.]?\s*(.+)/i) || undefined,
    image: {},
    featured: false,
    order,
    createdAt: now,
    updatedAt: now,
  }
}

export const analyzePdfCatalog = async (
  file: File,
  catalogId: string,
  categories: Category[],
  onProgress?: (currentPage: number, pageCount: number) => void,
) => {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl
  const document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise
  const pageTexts: PdfDiagnostics['pageTexts'] = []
  const candidates: PdfCandidate[] = []
  const defaultCategoryId = categories[0]?.id ?? ''
  let currentCategoryId = defaultCategoryId

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber)
    const content = await page.getTextContent()
    const items = content.items
      .filter((item) => 'str' in item && Boolean(item.str.trim()))
      .map((item) => ({
        str: 'str' in item ? item.str : '',
        transform: 'transform' in item ? [...item.transform] : [],
      }))
    const lines = toLines(items)
    const normalizedPage = normalizeText(lines.join(' '))
    const detectedCategory = categories.find((category) =>
      normalizedPage.includes(normalizeText(category.name)),
    )
    if (detectedCategory) currentCategoryId = detectedCategory.id
    pageTexts.push({
      pageNumber,
      text: lines.join('\n'),
      textItemCount: items.length,
    })

    lines.forEach((line, codeIndex) => {
      const code = codeFromLine(line)
      if (!code) return
      const product = productFromCode(
        catalogId,
        currentCategoryId,
        lines,
        codeIndex,
        code,
        candidates.length + 1,
      )
      const confidence =
        0.45 +
        (product.name.startsWith('Producto ') ? 0 : 0.2) +
        (product.price > 0 ? 0.2 : 0) +
        (product.material || product.measurements ? 0.1 : 0)
      candidates.push({
        id: `candidate-${crypto.randomUUID()}`,
        pageNumber,
        confidence: Math.min(0.95, confidence),
        originalText: lines
          .slice(Math.max(0, codeIndex - 4), codeIndex + 7)
          .join('\n'),
        product,
        selected: true,
        reviewed: false,
      })
    })

    onProgress?.(pageNumber, document.numPages)
  }

  const pagesWithText = pageTexts.filter((page) => page.textItemCount > 0).length
  const diagnostics: PdfDiagnostics = {
    pageCount: document.numPages,
    pagesWithText,
    textItems: pageTexts.reduce((total, page) => total + page.textItemCount, 0),
    documentKind:
      pagesWithText === 0
        ? 'scanned'
        : pagesWithText === document.numPages
          ? 'digital'
          : 'mixed',
    templateHint: (() => {
      const normalizedDocument = normalizeText(pageTexts.map((page) => page.text).join(' '))
      return normalizedDocument.includes('cristaleria') &&
        normalizedDocument.includes('paracasasreales')
        ? 'template-crystal-official'
        : undefined
    })(),
    pageTexts,
  }
  const warnings: string[] = []
  if (diagnostics.documentKind === 'scanned') {
    warnings.push(
      'No se detectó texto nativo. El archivo necesita el futuro conector OCR antes de extraer productos automáticamente.',
    )
  } else if (diagnostics.documentKind === 'mixed') {
    warnings.push('Algunas páginas no contienen texto nativo y deberán revisarse manualmente.')
  }
  if (!candidates.length && diagnostics.documentKind !== 'scanned') {
    warnings.push(
      'Hay texto digital, pero no se reconocieron códigos estables. Revisa la estructura o agrega candidatos manualmente.',
    )
  }

  return { diagnostics, candidates, warnings }
}

export const renderPdfPage = async (blob: Blob, pageNumber: number, canvas: HTMLCanvasElement) => {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl
  const document = await pdfjs.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise
  const page = await document.getPage(Math.min(Math.max(1, pageNumber), document.numPages))
  const viewport = page.getViewport({ scale: 1.15 })
  const context = canvas.getContext('2d')
  if (!context) return
  canvas.width = viewport.width
  canvas.height = viewport.height
  await page.render({ canvasContext: context, canvas, viewport }).promise
}
