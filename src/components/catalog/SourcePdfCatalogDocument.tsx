import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { loadAsset } from '../../lib/database'
import { renderPdfPage } from '../../lib/pdfImport'
import { matchSourceCandidatesToProducts } from '../../lib/sourcePdfLayout'
import type { ImportSession, PdfCandidate, Product } from '../../types/catalog'
import ProductImage from './ProductImage'

interface SourcePdfCatalogDocumentProps {
  session: ImportSession
  products: Product[]
  renderScale?: number
  onReady?: () => void
}

const chunks = <Value,>(items: Value[], size: number) => {
  const output: Value[][] = []
  for (let index = 0; index < items.length; index += size) {
    output.push(items.slice(index, index + size))
  }
  return output
}

const sourcePrice = (product: Product) =>
  `$${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(product.price)}`

const productChangedFromSource = (
  candidate: PdfCandidate,
  product?: Product,
) => {
  if (!product) return true
  const source = candidate.sourceProduct ?? candidate.product
  return (
    source.name !== product.name ||
    source.code !== product.code ||
    source.price !== product.price ||
    source.measurements !== product.measurements ||
    source.capacity !== product.capacity ||
    source.material !== product.material ||
    source.packaging !== product.packaging ||
    source.pack !== product.pack ||
    source.master !== product.master ||
    source.model !== product.model ||
    source.color !== product.color ||
    source.image.assetId !== product.image.assetId ||
    source.image.src !== product.image.src
  )
}

function TechnicalData({ product }: { product: Product }) {
  const fields = [
    ['Medidas', product.measurements],
    ['Capacidad', product.capacity],
    ['Material', product.material],
    ['Embalaje', product.packaging],
    ['Pack', product.pack],
    ['Master', product.master],
    ['Modelo', product.model],
    ['Color', product.color],
  ].filter((field): field is [string, string] => Boolean(field[1]))

  return (
    <dl className={`source-pdf-tech ${fields.length > 5 ? 'is-dense' : ''}`}>
      {fields.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function FeaturedOverlay({ product }: { product?: Product }) {
  return (
    <>
      <div className="source-pdf-featured-name">
        {product ? <h2>{product.name}</h2> : null}
      </div>
      <div
        className={`source-pdf-featured-image ${
          product?.image.assetId || product?.image.src
            ? 'has-image'
            : product
              ? ''
              : 'is-empty'
        }`}
      >
        {product?.image.assetId || product?.image.src ? (
          <ProductImage image={product.image} alt={product.name} />
        ) : null}
      </div>
      <div className="source-pdf-featured-tech">
        {product ? <TechnicalData product={product} /> : null}
      </div>
      <div className="source-pdf-featured-commercial">
        {product ? (
          <>
            <p><strong>Cod.</strong> {product.code}</p>
            <div>Ud. {sourcePrice(product)}</div>
          </>
        ) : null}
      </div>
    </>
  )
}

function GridOverlay({
  product,
  index,
  count,
}: {
  product?: Product
  index: number
  count: number
}) {
  const rowHeight = 88 / Math.max(1, count)
  const top = 6 + index * rowHeight
  return (
    <div
      className={`source-pdf-grid-row ${product ? '' : 'is-empty'}`}
      style={{ top: `${top}%`, height: `${rowHeight}%` }}
    >
      <div className="source-pdf-grid-copy">
        <div className="source-pdf-grid-name">{product ? product.name : ''}</div>
        <div className="source-pdf-grid-bottom">
          <div>{product ? <TechnicalData product={product} /> : null}</div>
          <div className="source-pdf-grid-commercial">
            {product ? (
              <>
                <p><strong>Cod.</strong> {product.code}</p>
                <strong>Ud. {sourcePrice(product)}</strong>
              </>
            ) : null}
          </div>
        </div>
      </div>
      <div
        className={`source-pdf-grid-image ${
          product?.image.assetId || product?.image.src ? 'has-image' : ''
        }`}
      >
        {product?.image.assetId || product?.image.src ? (
          <ProductImage image={product.image} alt={product.name} />
        ) : null}
      </div>
    </div>
  )
}

function SourcePdfPage({
  blob,
  pageNumber,
  pageCandidates,
  productForCandidate,
  recognizedTemplate,
  renderScale,
  onRendered,
}: {
  blob: Blob
  pageNumber: number
  pageCandidates: PdfCandidate[]
  productForCandidate: Map<string, Product | undefined>
  recognizedTemplate: boolean
  renderScale: number
  onRendered: (pageNumber: number) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let active = true
    const canvas = canvasRef.current
    if (!canvas) return
    renderPdfPage(blob, pageNumber, canvas, renderScale)
      .then(() => {
        if (active) onRendered(pageNumber)
      })
      .catch(() => {
        if (active) onRendered(pageNumber)
      })
    return () => {
      active = false
    }
  }, [blob, onRendered, pageNumber, renderScale])

  return (
    <article data-pdf-page className="source-pdf-page">
      <canvas ref={canvasRef} className="source-pdf-page-canvas" />
      {recognizedTemplate &&
      pageCandidates.length === 1 &&
      productChangedFromSource(
        pageCandidates[0],
        productForCandidate.get(pageCandidates[0].id),
      ) ? (
        <FeaturedOverlay product={productForCandidate.get(pageCandidates[0].id)} />
      ) : null}
      {recognizedTemplate && pageCandidates.length > 1
        ? pageCandidates.map((candidate, index) => {
            const product = productForCandidate.get(candidate.id)
            return productChangedFromSource(candidate, product) ? (
              <GridOverlay
                key={candidate.id}
                product={product}
                index={index}
                count={pageCandidates.length}
              />
            ) : null
          })
        : null}
    </article>
  )
}

function AddedProductsPage({ products }: { products: Product[] }) {
  return (
    <article data-pdf-page className="source-pdf-page source-pdf-added-page">
      <header>
        <span>CRYSTAL ROCK</span>
        <strong>Productos agregados</strong>
      </header>
      {products.map((product, index) => (
        <GridOverlay
          key={product.id}
          product={product}
          index={index}
          count={4}
        />
      ))}
      <footer>
        <span>CRYSTAL ROCK</span>
        <i />
        <span>PARA CASAS REALES</span>
      </footer>
    </article>
  )
}

export default function SourcePdfCatalogDocument({
  session,
  products,
  renderScale = 1.25,
  onReady,
}: SourcePdfCatalogDocumentProps) {
  const [blob, setBlob] = useState<Blob>()
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set())
  const pageCount = session.pdfDiagnostics?.pageCount ?? 0
  const candidates = useMemo(
    () => [...(session.pdfCandidates ?? [])].sort((a, b) => a.product.order - b.product.order),
    [session.pdfCandidates],
  )

  useEffect(() => {
    let active = true
    setBlob(undefined)
    setRenderedPages(new Set())
    if (!session.sourceAssetId) return
    loadAsset(session.sourceAssetId).then((asset) => {
      if (active) setBlob(asset?.blob)
    })
    return () => {
      active = false
    }
  }, [session.sourceAssetId])

  const match = useMemo(
    () => matchSourceCandidatesToProducts(candidates, products),
    [candidates, products],
  )
  const productForCandidate = match.mapping
  const addedProductPages = useMemo(
    () =>
      chunks(
        products.filter((product) => !match.used.has(product.id)),
        4,
      ),
    [match.used, products],
  )

  const candidatesByPage = useMemo(
    () =>
      candidates.reduce<Map<number, PdfCandidate[]>>((pages, candidate) => {
        const page = pages.get(candidate.pageNumber) ?? []
        page.push(candidate)
        pages.set(candidate.pageNumber, page)
        return pages
      }, new Map()),
    [candidates],
  )

  const markRendered = useCallback((pageNumber: number) => {
    setRenderedPages((current) => {
      if (current.has(pageNumber)) return current
      const next = new Set(current)
      next.add(pageNumber)
      return next
    })
  }, [])

  useEffect(() => {
    if (pageCount && renderedPages.size >= pageCount) onReady?.()
  }, [onReady, pageCount, renderedPages])

  if (!blob || !pageCount) {
    return <div className="source-pdf-document source-pdf-loading">Cargando PDF base…</div>
  }

  const recognizedTemplate =
    session.pdfDiagnostics?.templateHint === 'template-crystal-official' &&
    products.length > 0

  return (
    <div className="source-pdf-document">
      {Array.from({ length: pageCount }, (_, index) => {
        const pageNumber = index + 1
        return (
          <div key={pageNumber} className="contents">
            {pageNumber === pageCount
              ? addedProductPages.map((pageProducts, pageIndex) => (
                  <AddedProductsPage
                    key={`added-${pageIndex}`}
                    products={pageProducts}
                  />
                ))
              : null}
            <SourcePdfPage
              blob={blob}
              pageNumber={pageNumber}
              pageCandidates={candidatesByPage.get(pageNumber) ?? []}
              productForCandidate={productForCandidate}
              recognizedTemplate={recognizedTemplate}
              renderScale={renderScale}
              onRendered={markRendered}
            />
          </div>
        )
      })}
    </div>
  )
}
