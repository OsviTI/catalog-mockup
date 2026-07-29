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
        changes: current
          ? productDifferences(current, incoming, includedFields, skipEmpty)
          : [],
        selected: false,
        conflictResolution: 'pending',
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

export const invalidConflictResolutionIds = (
  changes: ImportChange[],
  currentProducts: Product[],
) => {
  const invalid = new Set<string>()
  const claims = new Map<string, string>(
    currentProducts
      .map((product) => [
        normalizeProductCode(product.code),
        `product:${product.id}`,
      ] as const)
      .filter(([code]) => Boolean(code)),
  )
  const appliedConflicts = changes.filter(
    (change) =>
      change.kind === 'conflict' &&
      change.conflictResolution === 'apply-incoming' &&
      change.productId &&
      change.incoming,
  )
  const appliedByProduct = new Map<string, string>()
  appliedConflicts.forEach((change) => {
    const previous = appliedByProduct.get(change.productId ?? '')
    if (previous) {
      invalid.add(previous)
      invalid.add(change.id)
    } else if (change.productId) {
      appliedByProduct.set(change.productId, change.id)
    }
  })

  appliedConflicts.forEach((change) => {
    const current = currentProducts.find((product) => product.id === change.productId)
    const oldCode = normalizeProductCode(current?.code ?? '')
    if (claims.get(oldCode) === `product:${change.productId}`) claims.delete(oldCode)
  })

  const claim = (change: ImportChange) => {
    const code = normalizeProductCode(change.incoming?.code ?? '')
    if (!code) {
      invalid.add(change.id)
      return
    }
    const owner = claims.get(code)
    if (owner) {
      invalid.add(change.id)
      if (owner.startsWith('change:')) invalid.add(owner.slice('change:'.length))
      return
    }
    claims.set(code, `change:${change.id}`)
  }

  changes
    .filter((change) => change.kind === 'new' && change.selected && change.incoming)
    .forEach(claim)
  appliedConflicts.forEach(claim)
  changes
    .filter(
      (change) =>
        change.kind === 'conflict' &&
        change.conflictResolution === 'add-new' &&
        change.incoming,
    )
    .forEach(claim)

  return invalid
}
