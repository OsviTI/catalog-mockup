import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type { PDFDocumentProxy } from 'pdfjs-dist'
import { addProvisionalCropRegions } from './pdfCropRegions'
import type {
  Category,
  ImportableProductField,
  PdfCandidate,
  PdfCropAdjustments,
  PdfCropRegion,
  PdfDiagnostics,
  Product,
} from '../types/catalog'

interface TextItemLike {
  str: string
  transform: number[]
}

const currencyPattern = /(?:\$|ars|precio)\s*[:.]?\s*([0-9][0-9.,]*)/i
const labeledCodePattern = /(?:c[oó]d(?:igo)?|sku)\s*[:.#-]?\s*([A-Z0-9][A-Z0-9./_-]{3,})/i
const standaloneCodePattern = /^[A-Z0-9][A-Z0-9./_-]{4,}$/
const ignoredNamePattern =
  /^(precio|c[oó]digo|sku|medidas?|material|pack|master|embalaje|capacidad|modelo|color|www\.|p[aá]gina)/i
const pdfWasmUrl = `${import.meta.env.BASE_URL}pdfjs-wasm/`
const documentCache = new WeakMap<Blob, Promise<PDFDocumentProxy>>()

const loadPdf = async (blob: Blob) => {
  const pdfjs = await import('pdfjs-dist')
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl
  return pdfjs.getDocument({
    data: new Uint8Array(await blob.arrayBuffer()),
    wasmUrl: pdfWasmUrl,
  }).promise
}

const openPdf = (blob: Blob) => {
  const cached = documentCache.get(blob)
  if (cached) return cached
  const pending = loadPdf(blob).catch((error) => {
    documentCache.delete(blob)
    throw error
  })
  documentCache.set(blob, pending)
  return pending
}

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')

const parsePrice = (value: string) => {
  const cleanValue = value.replace(/[.,]+$/, '')
  const lastComma = cleanValue.lastIndexOf(',')
  const lastDot = cleanValue.lastIndexOf('.')
  const normalized =
    lastComma > -1 && lastDot > -1
      ? lastComma > lastDot
        ? cleanValue.replaceAll('.', '').replace(',', '.')
        : cleanValue.replaceAll(',', '')
      : lastComma > -1
        ? cleanValue.length - lastComma <= 3
          ? cleanValue.replace(',', '.')
          : cleanValue.replaceAll(',', '')
        : lastDot > -1 && cleanValue.length - lastDot === 4
          ? cleanValue.replaceAll('.', '')
          : cleanValue
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

const otherFieldPattern =
  /\s+(?=(?:(?:c[oó]d(?:igo)?|sku|medidas?|capacidad|material|embalaje|pack|master|modelo|colou?r|precio)\b|ud\.?\s*\$))/i

const cleanFieldValue = (value: string) =>
  value
    .replace(/^[\s:.-]+/, '')
    .split(otherFieldPattern)[0]
    ?.trim() ?? ''

const valueForLabel = (lines: string[], index: number, label: RegExp) => {
  const offsets = [
    ...Array.from({ length: 13 }, (_, offset) => offset),
    ...Array.from({ length: 5 }, (_, offset) => -(offset + 1)),
  ]
  for (const offset of offsets) {
    const line = lines[index + offset]
    if (!line) continue
    const match = line.match(label)
    if (!match || match.index === undefined) continue

    const before = cleanFieldValue(line.slice(0, match.index))
    const after = cleanFieldValue(line.slice(match.index + match[0].length))
    if (before) return before
    if (after) return after

    const previous = cleanFieldValue(lines[index + offset - 1] ?? '')
    if (previous && !ignoredNamePattern.test(previous)) return previous
    const next = cleanFieldValue(lines[index + offset + 1] ?? '')
    if (next && !ignoredNamePattern.test(next)) return next
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
  const nearby = lines.slice(Math.max(0, codeIndex - 4), codeIndex + 13)
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
    measurements: valueForLabel(lines, codeIndex, /medidas?/i),
    capacity: valueForLabel(lines, codeIndex, /capacidad/i) || undefined,
    material: valueForLabel(lines, codeIndex, /material/i),
    packaging: valueForLabel(lines, codeIndex, /embalaje/i),
    pack: valueForLabel(lines, codeIndex, /pack/i),
    master: valueForLabel(lines, codeIndex, /master/i),
    model: valueForLabel(lines, codeIndex, /modelo/i) || undefined,
    color: valueForLabel(lines, codeIndex, /colou?r/i) || undefined,
    image: {},
    featured: false,
    order,
    createdAt: now,
    updatedAt: now,
  }
}

const assessCandidate = (product: Product, templateRule: boolean) => {
  const checks: Array<{
    field: ImportableProductField
    weight: number
    present: boolean
  }> = [
    {
      field: 'name',
      weight: 0.17,
      present: Boolean(product.name && !product.name.startsWith('Producto ')),
    },
    { field: 'code', weight: 0.18, present: Boolean(product.code) },
    { field: 'price', weight: 0.17, present: product.price > 0 },
    { field: 'measurements', weight: 0.1, present: Boolean(product.measurements) },
    { field: 'material', weight: 0.1, present: Boolean(product.material) },
    { field: 'packaging', weight: 0.08, present: Boolean(product.packaging) },
    { field: 'pack', weight: 0.08, present: Boolean(product.pack) },
    { field: 'master', weight: 0.08, present: Boolean(product.master) },
    { field: 'categoryId', weight: 0.04, present: Boolean(product.categoryId) },
  ]
  const missingFields = checks.filter((check) => !check.present).map((check) => check.field)
  const completeness = checks.reduce(
    (total, check) => total + (check.present ? check.weight : 0),
    0,
  )

  return {
    confidence: Math.min(templateRule ? 0.98 : 0.86, completeness),
    missingFields,
    extractionMethod: templateRule
      ? ('template-rule' as const)
      : ('native-generic' as const),
  }
}

export const analyzePdfCatalog = async (
  file: File,
  catalogId: string,
  categories: Category[],
  onProgress?: (currentPage: number, pageCount: number) => void,
) => {
  const document = await openPdf(file)
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
    const templateRule =
      ['medidas', 'material', 'embalaje', 'pack', 'master'].filter((label) =>
        normalizedPage.includes(label),
      ).length >= 4
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
      const assessment = assessCandidate(product, templateRule)
      candidates.push({
        id: `candidate-${crypto.randomUUID()}`,
        pageNumber,
        confidence: assessment.confidence,
        originalText: lines
          .slice(Math.max(0, codeIndex - 5), codeIndex + 13)
          .join('\n'),
        product,
        sourceProduct: structuredClone(product),
        selected: true,
        reviewed: false,
        extractionMethod: assessment.extractionMethod,
        missingFields: assessment.missingFields,
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

  return {
    diagnostics,
    candidates: addProvisionalCropRegions(candidates, Boolean(diagnostics.templateHint)),
    warnings,
  }
}

export const renderPdfPage = async (
  blob: Blob,
  pageNumber: number,
  canvas: HTMLCanvasElement,
  scale = 1.15,
) => {
  const document = await openPdf(blob)
  const page = await document.getPage(Math.min(Math.max(1, pageNumber), document.numPages))
  const viewport = page.getViewport({ scale })
  const context = canvas.getContext('2d')
  if (!context) return
  canvas.width = viewport.width
  canvas.height = viewport.height
  await page.render({ canvasContext: context, canvas, viewport }).promise
}

export const renderPdfPageBlob = async (
  blob: Blob,
  pageNumber: number,
  scale = 2.4,
) => {
  const document = await openPdf(blob)
  const page = await document.getPage(Math.min(Math.max(1, pageNumber), document.numPages))
  const viewport = page.getViewport({ scale })
  const canvas = window.document.createElement('canvas')
  const context = canvas.getContext('2d')
  if (!context) throw new Error('El navegador no pudo preparar la imagen de la página.')
  canvas.width = Math.ceil(viewport.width)
  canvas.height = Math.ceil(viewport.height)
  await page.render({ canvasContext: context, canvas, viewport }).promise
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (pageBlob) =>
        pageBlob
          ? resolve(pageBlob)
          : reject(new Error('No se pudo convertir la página del PDF en imagen.')),
      'image/png',
    )
  })
}

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(Math.max(value, minimum), maximum)

export const effectivePdfCrop = (
  region: PdfCropRegion,
  adjustments: PdfCropAdjustments,
): PdfCropRegion => {
  const zoom = clamp(adjustments.zoom, 0.6, 3)
  const width = clamp(region.width / zoom, 0.04, 1)
  const height = clamp(region.height / zoom, 0.04, 1)
  const centerX =
    region.x + region.width / 2 + clamp(adjustments.offsetX, -1, 1) * region.width * 0.45
  const centerY =
    region.y + region.height / 2 + clamp(adjustments.offsetY, -1, 1) * region.height * 0.45

  return {
    x: clamp(centerX - width / 2, 0, 1 - width),
    y: clamp(centerY - height / 2, 0, 1 - height),
    width,
    height,
  }
}
