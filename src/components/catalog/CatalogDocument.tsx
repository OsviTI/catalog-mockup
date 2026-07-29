import type { CSSProperties } from 'react'
import { formatCurrency, formatDate } from '../../lib/format'
import type { Catalog, CatalogTemplate, Category, Product } from '../../types/catalog'
import ProductImage from './ProductImage'

interface CatalogDocumentProps {
  catalog: Catalog
  categories: Category[]
  products: Product[]
  template: CatalogTemplate
  pageClassName?: string
}

const chunks = <Value,>(items: Value[], size: number) => {
  const output: Value[][] = []
  for (let index = 0; index < items.length; index += size) output.push(items.slice(index, index + size))
  return output
}

const PageBrand = () => (
  <div className="catalog-brand-row">
    <span className="catalog-brand-name">CRYSTAL ROCK</span>
    <span className="catalog-brand-line" />
    <span>PARA CASAS REALES</span>
  </div>
)

const CoverPage = ({
  catalog,
  category,
  pageClassName,
}: {
  catalog: Catalog
  category?: Category
  pageClassName?: string
}) => (
  <article
    data-pdf-page
    className={`catalog-page catalog-cover catalog-cover-${catalog.coverVariant} ${pageClassName ?? ''}`}
  >
    <div className="catalog-cover-art">
      {category ? (
        <ProductImage
          image={category.heroImage}
          alt={category.name}
          className="catalog-cover-image"
          loading="eager"
        />
      ) : null}
      <div className="catalog-cover-overlay" />
    </div>
    <div className="catalog-promotion">
      <span>
        <small>Hacé tu compra por la web y obtené un</small>
        <b>{catalog.settings.website}</b>
      </span>
      <strong>{catalog.settings.discountLabel}</strong>
    </div>
    <div className="catalog-updated">ACTUALIZADO: {formatDate(catalog.settings.validFrom)}</div>
    <div className="catalog-cover-title">
      <span className="catalog-logo">CRYSTAL ROCK</span>
      <small className="catalog-cover-kicker">{catalog.settings.campaignLabel}</small>
      <h1>{catalog.settings.title}</h1>
      <p>{catalog.settings.subtitle}</p>
    </div>
  </article>
)

const FeaturedPage = ({
  catalog,
  category,
  product,
  pageClassName,
}: {
  catalog: Catalog
  category: Category
  product: Product
  pageClassName?: string
}) => (
  <article data-pdf-page className={`catalog-page catalog-featured ${pageClassName ?? ''}`}>
    <div className="catalog-section-heading">
      <span>{category.name}</span>
      <strong>Producto destacado</strong>
    </div>
    <ProductImage
      image={category.heroImage}
      alt={`Ambientación ${category.name}`}
      className="catalog-featured-hero"
      loading="eager"
    />
    <div className="catalog-featured-main">
      <h2>{product.name}</h2>
      <ProductImage
        image={product.image}
        alt={product.name}
        className="catalog-featured-product"
        loading="eager"
      />
    </div>
    <div className="catalog-featured-data">
      <dl>
        <div>
          <dt>Medidas</dt>
          <dd>{product.measurements || '—'}</dd>
        </div>
        <div>
          <dt>Material</dt>
          <dd>{product.material || '—'}</dd>
        </div>
        <div>
          <dt>Embalaje</dt>
          <dd>{product.packaging || '—'}</dd>
        </div>
        <div>
          <dt>Pack</dt>
          <dd>{product.pack || '—'}</dd>
        </div>
        <div>
          <dt>Master</dt>
          <dd>{product.master || '—'}</dd>
        </div>
      </dl>
      <div className="catalog-code-price">
        {catalog.settings.showCodes ? (
          <p>
            <strong>Cod.</strong> {product.code}
          </p>
        ) : null}
        {catalog.settings.showPrices ? (
          <strong className="catalog-price">Ud. {formatCurrency(product.price, product.currency)}</strong>
        ) : null}
      </div>
    </div>
        <PageBrand />
  </article>
)

const ProductGridPage = ({
  catalog,
  category,
  products,
  pageClassName,
}: {
  catalog: Catalog
  category: Category
  products: Product[]
  pageClassName?: string
}) => (
  <article data-pdf-page className={`catalog-page catalog-grid-page ${pageClassName ?? ''}`}>
    <div className="catalog-grid-heading">
      <span>{category.name}</span>
      <small>{products.length} productos</small>
    </div>
    <div className={`catalog-product-grid catalog-product-grid-${catalog.settings.productsPerPage}`}>
      {products.map((product) => (
        <div key={product.id} className="catalog-product-card">
          <div className="catalog-product-copy">
            <h3>{product.name}</h3>
            {catalog.settings.showTechnicalData ? (
              <dl>
                <div>
                  <dt>Medidas</dt>
                  <dd>{product.measurements || '—'}</dd>
                </div>
                <div>
                  <dt>Material</dt>
                  <dd>{product.material || '—'}</dd>
                </div>
                <div>
                  <dt>Embalaje</dt>
                  <dd>{product.packaging || '—'}</dd>
                </div>
                <div>
                  <dt>Pack</dt>
                  <dd>{product.pack || '—'}</dd>
                </div>
                <div>
                  <dt>Master</dt>
                  <dd>{product.master || '—'}</dd>
                </div>
              </dl>
            ) : null}
          </div>
          <div className="catalog-product-meta">
            <ProductImage
              image={product.image}
              alt={product.name}
              className="catalog-product-image"
              loading="eager"
            />
            {catalog.settings.showCodes ? <span>Cod. {product.code}</span> : null}
            {catalog.settings.showPrices ? (
              <strong>Ud. {formatCurrency(product.price, product.currency)}</strong>
            ) : null}
          </div>
        </div>
      ))}
    </div>
        <PageBrand />
  </article>
)

const ClosingPage = ({
  catalog,
  pageClassName,
}: {
  catalog: Catalog
  pageClassName?: string
}) => (
  <article data-pdf-page className={`catalog-page catalog-closing ${pageClassName ?? ''}`}>
    <div className="catalog-closing-logo">CRYSTAL ROCK</div>
    <div className="catalog-order-box">
      <h2>{catalog.settings.closingTitle}</h2>
      <div>
        <span>Por nuestra web</span>
        <strong>{catalog.settings.website}</strong>
        <small>¡Obtenés un {catalog.settings.discountLabel}!</small>
      </div>
      <div>
        <span>Por WhatsApp</span>
        <strong>{catalog.settings.whatsapp}</strong>
      </div>
    </div>
    <div className="catalog-social">
      <p>¡Sumate a nuestra comunidad en las redes!</p>
      <strong>{catalog.settings.instagram}</strong>
    </div>
  </article>
)

export default function CatalogDocument({
  catalog,
  categories,
  products,
  template,
  pageClassName,
}: CatalogDocumentProps) {
  const sortedCategories = [...categories].sort((a, b) => a.order - b.order)
  const style = {
    '--catalog-primary': catalog.settings.theme.primary,
    '--catalog-secondary': catalog.settings.theme.secondary,
    '--catalog-bg': catalog.settings.theme.background,
    '--catalog-text': catalog.settings.theme.text,
    '--catalog-muted': template.preview.muted,
  } as CSSProperties

  return (
    <div className={`catalog-document catalog-layout-${template.layout}`} style={style}>
      <CoverPage catalog={catalog} category={sortedCategories[0]} pageClassName={pageClassName} />
      {sortedCategories.flatMap((category) => {
        const categoryProducts = products
          .filter((item) => item.categoryId === category.id)
          .sort((a, b) => a.order - b.order)
        if (!categoryProducts.length) return []
        const featured = categoryProducts.find((item) => item.featured) ?? categoryProducts[0]
        const gridProducts = categoryProducts.filter((item) => item.id !== featured.id)
        const grids = chunks(gridProducts, catalog.settings.productsPerPage)
        return [
          <FeaturedPage
            key={`${category.id}-featured`}
            catalog={catalog}
            category={category}
            product={featured}
            pageClassName={pageClassName}
          />,
          ...grids.map((items, index) => (
            <ProductGridPage
              key={`${category.id}-grid-${index}`}
              catalog={catalog}
              category={category}
              products={items}
              pageClassName={pageClassName}
            />
          )),
        ]
      })}
      <ClosingPage catalog={catalog} pageClassName={pageClassName} />
    </div>
  )
}
