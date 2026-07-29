import type { Catalog, Category, Product } from '../types/catalog'
import { safeFilename } from './format'

type Cell = string | number | boolean | Date | null

const normalize = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9@]+/g, '')

const aliases: Record<string, string[]> = {
  name: ['nombreproducto', 'producto', 'nombre'],
  code: ['codigo', 'cod', 'sku'],
  price: ['precio', 'price'],
  category: ['categoria', 'linea', 'rubro'],
  measurements: ['medidas', 'medida', 'dimensiones'],
  capacity: ['capacidad'],
  material: ['material'],
  packaging: ['embalaje', 'caja'],
  pack: ['pack', 'cantidadporpack'],
  master: ['master', 'cantidadporbulto', 'bulto'],
  model: ['modelo'],
  color: ['color', 'colores'],
  image: ['@image', 'imagen', 'image', 'foto'],
  featured: ['destacado', 'producto destacado', 'featured'],
  order: ['orden', 'order'],
}

const getColumnIndex = (headers: Cell[], key: keyof typeof aliases) => {
  const normalizedHeaders = headers.map(normalize)
  return normalizedHeaders.findIndex((header) => aliases[key].some((alias) => normalize(alias) === header))
}

const valueAt = (row: Cell[], index: number) => (index >= 0 ? row[index] : null)

const parsePrice = (value: Cell) => {
  if (typeof value === 'number') return value
  const clean = String(value ?? '')
    .replace(/[^\d.,-]/g, '')
    .trim()
  if (!clean) return 0

  const lastComma = clean.lastIndexOf(',')
  const lastDot = clean.lastIndexOf('.')
  let normalized = clean

  if (lastComma > -1 && lastDot > -1) {
    normalized =
      lastComma > lastDot
        ? clean.replaceAll('.', '').replace(',', '.')
        : clean.replaceAll(',', '')
  } else if (lastComma > -1) {
    normalized = clean.length - lastComma <= 3 ? clean.replace(',', '.') : clean.replaceAll(',', '')
  }

  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

const parseBoolean = (value: Cell) => ['si', 'sí', 'true', '1', 'x'].includes(String(value ?? '').toLowerCase())

const readCsv = async (file: File): Promise<Cell[][]> => {
  const text = await file.text()
  const delimiter = text.split('\n')[0]?.includes(';') ? ';' : ','
  return text
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const values: string[] = []
      let current = ''
      let quoted = false
      for (let index = 0; index < line.length; index += 1) {
        const character = line[index]
        if (character === '"') {
          if (quoted && line[index + 1] === '"') {
            current += '"'
            index += 1
          } else {
            quoted = !quoted
          }
        } else if (character === delimiter && !quoted) {
          values.push(current.trim())
          current = ''
        } else {
          current += character
        }
      }
      values.push(current.trim())
      return values
    })
}

export interface ImportResult {
  products: Product[]
  warnings: string[]
}

export const importProductsFile = async (
  file: File,
  catalogId: string,
  categories: Category[],
): Promise<ImportResult> => {
  let rows: Cell[][]
  if (file.name.toLowerCase().endsWith('.csv')) {
    rows = await readCsv(file)
  } else {
    const { readSheet } = await import('read-excel-file/browser')
    rows = (await readSheet(file, 1)) as Cell[][]
  }

  if (rows.length < 2) throw new Error('La planilla no contiene productos.')
  const headers = rows[0]
  const columns = Object.fromEntries(
    (Object.keys(aliases) as Array<keyof typeof aliases>).map((key) => [key, getColumnIndex(headers, key)]),
  ) as Record<keyof typeof aliases, number>

  if (columns.name < 0 || columns.code < 0 || columns.price < 0) {
    throw new Error('La planilla debe incluir Nombre producto, Código y Precio.')
  }

  const defaultCategory = categories[0]
  if (!defaultCategory) throw new Error('Crea al menos una categoría antes de importar.')
  const warnings: string[] = []
  const now = new Date().toISOString()

  const products = rows
    .slice(1)
    .filter((row) => valueAt(row, columns.name) || valueAt(row, columns.code))
    .map((row, index): Product => {
      const categoryName = String(valueAt(row, columns.category) ?? '')
      const category =
        categories.find((item) => normalize(item.name) === normalize(categoryName)) ?? defaultCategory
      if (categoryName && category.id === defaultCategory.id && normalize(categoryName) !== normalize(defaultCategory.name)) {
        warnings.push(`“${categoryName}” no existe; sus productos se asignaron a ${defaultCategory.name}.`)
      }

      const imageName = String(valueAt(row, columns.image) ?? '').trim()
      return {
        id: `product-${crypto.randomUUID()}`,
        catalogId,
        categoryId: category.id,
        name: String(valueAt(row, columns.name) ?? '').trim(),
        code: String(valueAt(row, columns.code) ?? '').trim(),
        price: parsePrice(valueAt(row, columns.price)),
        currency: 'ARS',
        measurements: String(valueAt(row, columns.measurements) ?? '').trim(),
        capacity: String(valueAt(row, columns.capacity) ?? '').trim() || undefined,
        material: String(valueAt(row, columns.material) ?? '').trim(),
        packaging: String(valueAt(row, columns.packaging) ?? '').trim(),
        pack: String(valueAt(row, columns.pack) ?? '').trim(),
        master: String(valueAt(row, columns.master) ?? '').trim(),
        model: String(valueAt(row, columns.model) ?? '').trim() || undefined,
        color: String(valueAt(row, columns.color) ?? '').trim() || undefined,
        image: imageName ? { name: imageName } : {},
        featured: parseBoolean(valueAt(row, columns.featured)),
        order: Number(valueAt(row, columns.order)) || index + 1,
        createdAt: now,
        updatedAt: now,
      }
    })

  if (columns.category < 0) warnings.push(`La planilla no incluye Categoría; se utilizó “${defaultCategory.name}”.`)
  if (columns.image >= 0) {
    warnings.push('Los nombres de imagen se importaron como referencia; carga los archivos para vincularlos.')
  }

  return { products, warnings: [...new Set(warnings)] }
}

const headerCell = (value: string) => ({
  value,
  fontWeight: 'bold' as const,
  backgroundColor: '#C81D1D',
  textColor: '#FFFFFF',
  align: 'center' as const,
  height: 28,
})

const columns = (widths: number[]) => widths.map((width) => ({ width }))

export const downloadCatalogWorkbook = async (
  catalog: Catalog,
  categories: Category[],
  products: Product[],
  blank = false,
) => {
  const writeXlsxFile = (await import('write-excel-file/browser')).default
  const productHeaders = [
    'Nombre producto',
    'Código',
    'Precio',
    'Categoría',
    'Medidas',
    'Capacidad',
    'Material',
    'Embalaje',
    'Pack',
    'Master',
    'Modelo',
    'Color',
    '@Image',
    'Destacado',
    'Orden',
  ]
  const productRows = blank
    ? []
    : products.map((product) => {
        const category = categories.find((item) => item.id === product.categoryId)
        return [
          product.name,
          product.code,
          product.price,
          category?.name ?? '',
          product.measurements,
          product.capacity ?? '',
          product.material,
          product.packaging,
          product.pack,
          product.master,
          product.model ?? '',
          product.color ?? '',
          product.image.name ?? '',
          product.featured ? 'Sí' : 'No',
          product.order,
        ]
      })

  const result = writeXlsxFile(
    [
      {
        sheet: 'Productos',
        data: [productHeaders.map(headerCell), ...productRows],
        columns: columns([30, 15, 14, 20, 20, 14, 20, 18, 12, 12, 18, 16, 22, 12, 10]),
        stickyRowsCount: 1,
      },
      {
        sheet: 'Categorías',
        data: [
          ['Categoría', 'Descripción', 'Imagen promocional', 'Orden'].map(headerCell),
          ...categories.map((category) => [
            category.name,
            category.description,
            category.heroImage.name ?? '',
            category.order,
          ]),
        ],
        columns: columns([24, 42, 28, 10]),
        stickyRowsCount: 1,
      },
      {
        sheet: 'Catálogo',
        data: [
          ['Campo', 'Valor'].map(headerCell),
          ['Nombre', catalog.name],
          ['Título', catalog.settings.title],
          ['Subtítulo', catalog.settings.subtitle],
          ['Campaña', catalog.settings.campaignLabel],
          ['Promoción', catalog.settings.discountLabel],
          ['Sitio web', catalog.settings.website],
          ['WhatsApp', catalog.settings.whatsapp],
          ['Instagram', catalog.settings.instagram],
        ],
        columns: columns([24, 48]),
      },
    ],
    { fontFamily: 'Arial', fontSize: 10 },
  )

  await result.toFile(`${safeFilename(catalog.name)}-${blank ? 'plantilla' : 'datos'}.xlsx`)
}
