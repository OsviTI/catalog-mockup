import type {
  ImportChange,
  ImportableProductField,
  Product,
  ProductFieldChange,
} from '../types/catalog'

const comparableFields: ImportableProductField[] = [
  'name',
  'code',
  'price',
  'categoryId',
  'measurements',
  'capacity',
  'material',
  'packaging',
  'pack',
  'master',
  'model',
  'color',
  'featured',
  'order',
]

export const normalizeProductCode = (code: string) =>
  code
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')

const comparableValue = (value: unknown) => (value === undefined ? '' : value)

export const productDifferences = (
  current: Product,
  incoming: Product,
  includedFields: ImportableProductField[] = comparableFields,
  skipEmpty = false,
): ProductFieldChange[] =>
  includedFields.flatMap((field) => {
    const before = comparableValue(current[field])
    const after = comparableValue(incoming[field])
    if (before === after || (skipEmpty && after === '')) return []
    return [{ field, before, after, selected: true } as ProductFieldChange]
  })

export const buildImportComparison = (
  currentProducts: Product[],
  incomingProducts: Product[],
  includedFields: ImportableProductField[] = comparableFields,
  skipEmpty = false,
): ImportChange[] => {
  const currentByCode = new Map(
    currentProducts
      .filter((product) => normalizeProductCode(product.code))
      .map((product) => [normalizeProductCode(product.code), product]),
  )
  const incomingCounts = incomingProducts.reduce<Map<string, number>>((counts, product) => {
    const code = normalizeProductCode(product.code)
    counts.set(code, (counts.get(code) ?? 0) + 1)
    return counts
  }, new Map())
  const matchedIds = new Set<string>()

  const changes = incomingProducts.map((incoming): ImportChange => {
    const code = normalizeProductCode(incoming.code)
    const current = currentByCode.get(code)

    if (!code || (incomingCounts.get(code) ?? 0) > 1) {
      if (current) matchedIds.add(current.id)
      return {
        id: `change-${crypto.randomUUID()}`,
        kind: 'conflict',
        code: incoming.code,
        productId: current?.id,
        incoming,
        changes: [],
        selected: false,
        note: code
          ? 'El código está repetido en la planilla y requiere una decisión manual.'
          : 'El producto no tiene código estable para poder compararlo.',
      }
    }

    if (!current) {
      return {
        id: `change-${crypto.randomUUID()}`,
        kind: 'new',
        code: incoming.code,
        incoming,
        changes: [],
        selected: true,
      }
    }

    matchedIds.add(current.id)
    const differences = productDifferences(current, incoming, includedFields, skipEmpty)
    return {
      id: `change-${crypto.randomUUID()}`,
      kind: differences.length ? 'updated' : 'unchanged',
      code: incoming.code,
      productId: current.id,
      incoming,
      changes: differences,
      selected: differences.length > 0,
    }
  })

  currentProducts.forEach((product) => {
    if (matchedIds.has(product.id)) return
    changes.push({
      id: `change-${crypto.randomUUID()}`,
      kind: 'missing',
      code: product.code,
      productId: product.id,
      changes: [],
      selected: false,
      missingResolution: 'pending',
      note: 'Está en el catálogo actual pero no aparece en la fuente oficial.',
    })
  })

  return changes
}

export const importSummary = (changes: ImportChange[]) =>
  changes.reduce<Record<ImportChange['kind'], number>>(
    (summary, change) => {
      summary[change.kind] += 1
      return summary
    },
    { unchanged: 0, updated: 0, new: 0, missing: 0, conflict: 0 },
  )
