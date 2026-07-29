import type { ImportSession, PdfCandidate, Product } from '../types/catalog'

const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')

export const matchSourceCandidatesToProducts = (
  candidates: PdfCandidate[],
  products: Product[],
) => {
  const mapping = new Map<string, Product | undefined>()
  const used = new Set<string>()
  if (!products.length) return { mapping, used }
  candidates.forEach((candidate) => {
    const candidateCode = normalize(candidate.product.code)
    const byCode = products.find(
      (product) =>
        candidateCode &&
        normalize(product.code) === candidateCode &&
        !used.has(product.id),
    )
    const candidateName = normalize(candidate.product.name)
    const byName = products.find(
      (product) =>
        candidateName &&
        normalize(product.name) === candidateName &&
        !used.has(product.id),
    )
    const byOrder = products.find(
      (product) => product.order === candidate.product.order && !used.has(product.id),
    )
    const product = byCode ?? byName ?? byOrder
    if (product) used.add(product.id)
    mapping.set(candidate.id, product)
  })
  return { mapping, used }
}

export const sourcePdfDocumentPageCount = (
  session: ImportSession,
  products: Product[],
) => {
  const candidates = [...(session.pdfCandidates ?? [])].sort(
    (a, b) => a.product.order - b.product.order,
  )
  const { used } = matchSourceCandidatesToProducts(candidates, products)
  const extras = products.filter((product) => !used.has(product.id)).length
  return (session.pdfDiagnostics?.pageCount ?? 0) + Math.ceil(extras / 4)
}
