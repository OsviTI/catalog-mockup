export type CatalogStatus = 'draft' | 'review' | 'published'
export type ValidationLevel = 'success' | 'warning' | 'error'
export type TemplateLayout = 'crystal-official' | 'editorial' | 'minimal' | 'bold'
export type CoverVariant = 'campaign' | 'image-split' | 'signature'
export type ImportSource = 'excel' | 'pdf'
export type ImportStatus = 'analyzing' | 'needs-review' | 'ready' | 'applied' | 'failed'
export type ImportChangeKind = 'unchanged' | 'updated' | 'new' | 'missing' | 'conflict'
export type MissingResolution = 'pending' | 'keep' | 'remove'
export type ConflictResolution = 'pending' | 'keep-current' | 'apply-incoming' | 'add-new'
export type ImportableProductField =
  | 'name'
  | 'code'
  | 'price'
  | 'categoryId'
  | 'measurements'
  | 'capacity'
  | 'material'
  | 'packaging'
  | 'pack'
  | 'master'
  | 'model'
  | 'color'
  | 'featured'
  | 'order'

export interface ImageReference {
  assetId?: string
  src?: string
  name?: string
  focalPoint?: 'center' | 'top' | 'bottom'
}

export interface Product {
  id: string
  catalogId: string
  categoryId: string
  name: string
  code: string
  price: number
  currency: 'ARS' | 'USD'
  measurements: string
  capacity?: string
  material: string
  packaging: string
  pack: string
  master: string
  model?: string
  color?: string
  image: ImageReference
  featured: boolean
  order: number
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  catalogId: string
  name: string
  description: string
  order: number
  heroImage: ImageReference
  accent: string
}

export interface CatalogTheme {
  primary: string
  secondary: string
  background: string
  text: string
  headingFont: 'modern' | 'editorial' | 'compact'
}

export interface CatalogSettings {
  title: string
  subtitle: string
  campaignLabel: string
  discountLabel: string
  validFrom: string
  website: string
  whatsapp: string
  instagram: string
  closingTitle: string
  showPrices: boolean
  showCodes: boolean
  showTechnicalData: boolean
  productsPerPage: 2 | 4 | 6
  theme: CatalogTheme
}

export interface Catalog {
  id: string
  name: string
  description: string
  status: CatalogStatus
  templateId: string
  coverVariant: CoverVariant
  settings: CatalogSettings
  createdAt: string
  updatedAt: string
  publishedVersionId?: string
}

export interface CatalogTemplate {
  id: string
  name: string
  description: string
  layout: TemplateLayout
  coverVariants: CoverVariant[]
  recommendedFor: string
  accent: string
  preview: {
    surface: string
    ink: string
    muted: string
  }
  origin?: 'client' | 'system'
  defaultCoverVariant?: CoverVariant
  defaultProductsPerPage?: 2 | 4 | 6
  defaultTheme?: Partial<CatalogTheme>
}

export interface CatalogSnapshot {
  catalog: Catalog
  categories: Category[]
  products: Product[]
}

export interface CatalogVersion {
  id: string
  catalogId: string
  number: number
  label: string
  createdAt: string
  status: 'generated' | 'published'
  snapshot: CatalogSnapshot
}

export interface ProductFieldChange {
  field: ImportableProductField
  before?: string | number | boolean
  after?: string | number | boolean
  selected: boolean
}

export interface PdfCandidate {
  id: string
  pageNumber: number
  confidence: number
  originalText: string
  product: Product
  selected: boolean
  reviewed: boolean
  extractionMethod?: 'template-rule' | 'native-generic'
  missingFields?: ImportableProductField[]
}

export interface PdfDiagnostics {
  pageCount: number
  pagesWithText: number
  textItems: number
  documentKind: 'digital' | 'mixed' | 'scanned'
  templateHint?: string
  pageTexts: Array<{
    pageNumber: number
    text: string
    textItemCount: number
  }>
}

export interface ImportChange {
  id: string
  kind: ImportChangeKind
  code: string
  productId?: string
  incoming?: Product
  changes: ProductFieldChange[]
  selected: boolean
  missingResolution?: MissingResolution
  conflictResolution?: ConflictResolution
  note?: string
}

export interface ImportSession {
  id: string
  catalogId: string
  source: ImportSource
  sourceName: string
  sourceAssetId?: string
  status: ImportStatus
  createdAt: string
  updatedAt: string
  warnings: string[]
  importedFields?: ImportableProductField[]
  changes: ImportChange[]
  pdfDiagnostics?: PdfDiagnostics
  pdfCandidates?: PdfCandidate[]
}

export interface CreativeAsset {
  id: string
  catalogId: string
  assetId: string
  name: string
  kind: 'enhanced-product' | 'concept-cover' | 'concept-category'
  prompt?: string
  sourceProductId?: string
  createdAt: string
}

export interface ActivityItem {
  id: string
  catalogId: string
  type:
    | 'created'
    | 'updated'
    | 'generated'
    | 'published'
    | 'restored'
    | 'imported'
    | 'scanned'
    | 'reconciled'
    | 'creative'
  message: string
  createdAt: string
}

export interface WorkspaceSettings {
  organizationName: string
  locale: 'es-AR'
  persistenceRequested: boolean
}

export interface WorkspaceData {
  schemaVersion: number
  catalogs: Catalog[]
  categories: Category[]
  products: Product[]
  templates: CatalogTemplate[]
  versions: CatalogVersion[]
  importSessions: ImportSession[]
  creativeAssets: CreativeAsset[]
  activity: ActivityItem[]
  settings: WorkspaceSettings
}

export interface ValidationIssue {
  id: string
  level: ValidationLevel
  message: string
  productId?: string
  field?: keyof Product
}

export interface StoredAsset {
  id: string
  blob: Blob
  name: string
  type: string
  size: number
  createdAt: string
}
