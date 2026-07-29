import type {
  Catalog,
  CatalogTemplate,
  Category,
  Product,
  WorkspaceData,
} from '../types/catalog'

const now = '2026-07-28T18:45:00.000Z'

const artwork = (label: string, color: string, kind: 'glass' | 'wine' | 'abstract' = 'glass') => {
  const illustration =
    kind === 'wine'
      ? `<path d="M118 56h84l-9 48c-3 17-17 29-34 29s-31-12-34-29l-7-48Zm41 77v50m-29 0h58" fill="none" stroke="white" stroke-width="8" stroke-linecap="round"/><path d="M126 92h66" stroke="white" stroke-width="8" opacity=".7"/>`
      : kind === 'abstract'
        ? `<circle cx="160" cy="104" r="62" fill="none" stroke="white" stroke-width="8" opacity=".9"/><path d="m119 150 82-92M102 104h116" stroke="white" stroke-width="8" stroke-linecap="round" opacity=".65"/>`
        : `<path d="M122 51h76l-7 59c-2 18-16 31-31 31s-29-13-31-31l-7-59Zm38 90v43m-30 0h60" fill="none" stroke="white" stroke-width="8" stroke-linecap="round"/><path d="M129 102h62" stroke="white" stroke-width="7" opacity=".65"/>`

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="460" viewBox="0 0 320 230">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${color}"/><stop offset="1" stop-color="#111827"/></linearGradient></defs>
    <rect width="320" height="230" rx="28" fill="url(#g)"/>
    <circle cx="270" cy="28" r="78" fill="white" opacity=".08"/>
    ${illustration}
    <text x="20" y="211" font-family="Arial, sans-serif" font-size="14" font-weight="700" fill="white">${label.replaceAll('&', '&amp;')}</text>
  </svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

export const seedTemplates: CatalogTemplate[] = [
  {
    id: 'template-crystal-official',
    name: 'Crystal Rock · Plantilla oficial',
    description:
      'Reconstrucción web reutilizable del catálogo de referencia: portada de campaña, aperturas por categoría, producto destacado, grillas comerciales y cierre.',
    layout: 'crystal-official',
    coverVariants: ['image-split', 'campaign', 'signature'],
    recommendedFor: 'Continuidad del catálogo actual de Crystal Rock',
    accent: '#c51522',
    preview: { surface: '#fffaf5', ink: '#161616', muted: '#f0d6d2' },
    origin: 'client',
    defaultCoverVariant: 'image-split',
    defaultProductsPerPage: 4,
    defaultTheme: {
      primary: '#c51522',
      secondary: '#111111',
      background: '#fffaf5',
      text: '#202020',
      headingFont: 'modern',
    },
  },
  {
    id: 'template-editorial',
    name: 'Editorial Rojo',
    description: 'La propuesta más cercana al catálogo actual de Crystal Rock.',
    layout: 'editorial',
    coverVariants: ['campaign', 'image-split', 'signature'],
    recommendedFor: 'Campañas, lanzamientos y listas comerciales',
    accent: '#c81d1d',
    preview: { surface: '#fff7f1', ink: '#171717', muted: '#f3ded2' },
  },
  {
    id: 'template-minimal',
    name: 'Minimal Arena',
    description: 'Más aire, tipografía protagonista y fichas de lectura rápida.',
    layout: 'minimal',
    coverVariants: ['image-split', 'signature'],
    recommendedFor: 'Colecciones premium y presentaciones ejecutivas',
    accent: '#8b5e3c',
    preview: { surface: '#f5efe6', ink: '#28231f', muted: '#ded2c1' },
  },
  {
    id: 'template-bold',
    name: 'Nocturna Premium',
    description: 'Contraste alto y composición visual para campañas digitales.',
    layout: 'bold',
    coverVariants: ['campaign', 'image-split'],
    recommendedFor: 'Promociones y catálogos con fuerte impacto visual',
    accent: '#2563eb',
    preview: { surface: '#111827', ink: '#ffffff', muted: '#243047' },
  },
]

const baseSettings = {
  subtitle: 'Calidad real para casas reales',
  campaignLabel: 'Cristalería',
  discountLabel: '10% OFF',
  validFrom: '2026-03-25',
  website: 'www.crystalrock.com.ar',
  whatsapp: 'Atención personalizada',
  instagram: '@crystalrock',
  closingTitle: '¿Cómo hacer tu pedido?',
  showPrices: true,
  showCodes: true,
  showTechnicalData: true,
  productsPerPage: 4 as const,
  theme: {
    primary: '#c81d1d',
    secondary: '#111111',
    background: '#fff7f1',
    text: '#202020',
    headingFont: 'modern' as const,
  },
}

export const seedCatalogs: Catalog[] = [
  {
    id: 'catalog-crystal-2026',
    name: 'Cristalería · Colección 2026',
    description: 'Catálogo digital basado en el material de referencia del cliente.',
    status: 'review',
      templateId: 'template-crystal-official',
    coverVariant: 'image-split',
    settings: { ...baseSettings, title: 'Cristalería' },
    createdAt: '2026-07-24T13:10:00.000Z',
    updatedAt: now,
  },
  {
    id: 'catalog-premium',
    name: 'Selección Premium',
    description: 'Propuesta alternativa para productos destacados.',
    status: 'draft',
    templateId: 'template-minimal',
    coverVariant: 'signature',
    settings: {
      ...baseSettings,
      title: 'Selección Premium',
      campaignLabel: 'Crystal Rock',
      discountLabel: 'Edición especial',
      theme: {
        primary: '#8b5e3c',
        secondary: '#28231f',
        background: '#f5efe6',
        text: '#28231f',
        headingFont: 'editorial',
      },
    },
    createdAt: '2026-07-26T09:00:00.000Z',
    updatedAt: '2026-07-27T14:20:00.000Z',
  },
]

export const seedCategories: Category[] = [
  {
    id: 'category-glassware',
    catalogId: 'catalog-crystal-2026',
    name: 'Cristalería',
    description: 'Copas y piezas de vidrio para la mesa.',
    order: 1,
    heroImage: {
      src: artwork('Momento Crystal Rock', '#b91c1c', 'abstract'),
      name: 'cristaleria-hero.svg',
      focalPoint: 'center',
    },
    accent: '#c81d1d',
  },
  {
    id: 'category-wine',
    catalogId: 'catalog-crystal-2026',
    name: 'Accesorios de vino',
    description: 'Herramientas y accesorios para servir y disfrutar el vino.',
    order: 2,
    heroImage: {
      src: artwork('Accesorios de vino', '#7f1d1d', 'wine'),
      name: 'accesorios-vino-hero.svg',
      focalPoint: 'center',
    },
    accent: '#9f1717',
  },
  {
    id: 'category-premium',
    catalogId: 'catalog-premium',
    name: 'Destacados',
    description: 'Selección curada de productos premium.',
    order: 1,
    heroImage: {
      src: artwork('Selección Premium', '#8b5e3c', 'abstract'),
      name: 'premium-hero.svg',
      focalPoint: 'center',
    },
    accent: '#8b5e3c',
  },
]

const product = (
  id: string,
  categoryId: string,
  order: number,
  data: Partial<Product> & Pick<Product, 'name' | 'code' | 'price'>,
): Product => ({
  id,
  catalogId: 'catalog-crystal-2026',
  categoryId,
  name: data.name,
  code: data.code,
  price: data.price,
  currency: 'ARS',
  measurements: data.measurements ?? '',
  capacity: data.capacity,
  material: data.material ?? '',
  packaging: data.packaging ?? '',
  pack: data.pack ?? '',
  master: data.master ?? '',
  model: data.model,
  color: data.color,
  image: {
    src:
      data.image?.src ??
      artwork(data.name, categoryId === 'category-wine' ? '#7f1d1d' : '#c81d1d', categoryId === 'category-wine' ? 'wine' : 'glass'),
    name: data.image?.name ?? `${order}.svg`,
    focalPoint: 'center',
  },
  featured: data.featured ?? order === 1,
  order,
  createdAt: now,
  updatedAt: now,
})

export const seedProducts: Product[] = [
  product('product-1', 'category-glassware', 1, {
    name: 'Copas Gin Tonic 590 ML',
    code: '6676159',
    price: 2526.72,
    measurements: '8.1 cm × 21.8 cm',
    material: 'Vidrio',
    packaging: 'Caja color',
    pack: '6 u',
    master: '24 u',
    featured: true,
  }),
  product('product-2', 'category-glassware', 2, {
    name: 'Copas Degustación 465 ML',
    code: '6677029',
    price: 1642.32,
    measurements: '7 cm × 22.5 cm',
    material: 'Vidrio',
    packaging: 'Caja color',
    pack: '6 u',
    master: '48 u',
  }),
  product('product-3', 'category-glassware', 3, {
    name: 'Copas Degustación 435 ML',
    code: '6675202',
    price: 1925.47,
    measurements: '7.5 cm × 22.3 cm',
    material: 'Vidrio',
    packaging: 'Caja color',
    pack: '6 u',
    master: '24 u',
  }),
  product('product-4', 'category-glassware', 4, {
    name: 'Copas Degustación Premium 615 ML',
    code: '6675749',
    price: 3726.91,
    measurements: '7 cm × 24.5 cm',
    material: 'Vidrio',
    packaging: 'Caja color',
    pack: '6 u',
    master: '24 u',
  }),
  product('product-5', 'category-wine', 1, {
    name: 'Sacacorcho a pilas',
    code: '57913854',
    price: 3158.4,
    measurements: '26 cm',
    material: 'Acrílico',
    packaging: 'Caja color',
    pack: 'Unidad',
    master: '30 u',
    featured: true,
  }),
  product('product-6', 'category-wine', 2, {
    name: 'Sacacorcho por aire',
    code: '57913855',
    price: 3158.4,
    measurements: '26 cm',
    material: 'Acrílico',
    packaging: 'Caja color',
    pack: 'Unidad',
    master: '30 u',
  }),
  product('product-7', 'category-wine', 3, {
    name: 'Sacacorcho doble aleta',
    code: '57913856',
    price: 3158.4,
    measurements: '26 cm',
    material: 'Acero inoxidable',
    packaging: 'Caja color',
    pack: 'Unidad',
    master: '30 u',
  }),
  product('product-8', 'category-wine', 4, {
    name: 'Set accesorios de vino',
    code: '57913280',
    price: 4150.0,
    measurements: '22 cm',
    material: 'Plástico · acero inoxidable',
    packaging: 'Caja blanca',
    pack: 'Unidad',
    master: '48 u',
  }),
]

export const seedWorkspace: WorkspaceData = {
  schemaVersion: 3,
  catalogs: seedCatalogs,
  categories: seedCategories,
  products: seedProducts,
  templates: seedTemplates,
  versions: [],
  importSessions: [],
  creativeAssets: [],
  activity: [
    {
      id: 'activity-1',
      catalogId: 'catalog-crystal-2026',
      type: 'updated',
      message: 'Se normalizaron los datos de la muestra del cliente.',
      createdAt: now,
    },
  ],
  settings: {
    organizationName: 'Crystal Rock',
    locale: 'es-AR',
    persistenceRequested: false,
  },
}

export const createCatalogSeed = (name: string): {
  catalog: Catalog
  categories: Category[]
} => {
  const id = `catalog-${crypto.randomUUID()}`
  const categoryId = `category-${crypto.randomUUID()}`
  const createdAt = new Date().toISOString()
  const officialTemplate = seedTemplates.find(
    (template) => template.id === 'template-crystal-official',
  )

  return {
    catalog: {
      id,
      name,
      description: 'Nuevo catálogo en preparación.',
      status: 'draft',
      templateId: 'template-crystal-official',
      coverVariant: officialTemplate?.defaultCoverVariant ?? 'image-split',
      settings: {
        ...structuredClone(baseSettings),
        title: name,
        productsPerPage: officialTemplate?.defaultProductsPerPage ?? 4,
        theme: {
          ...structuredClone(baseSettings.theme),
          ...officialTemplate?.defaultTheme,
        },
      },
      createdAt,
      updatedAt: createdAt,
    },
    categories: [
      {
        id: categoryId,
        catalogId: id,
        name: 'Sin categoría',
        description: 'Productos pendientes de organización.',
        order: 1,
        heroImage: {
          src: artwork('Nueva colección', '#c81d1d', 'abstract'),
          name: 'nueva-coleccion.svg',
        },
        accent: '#c81d1d',
      },
    ],
  }
}
