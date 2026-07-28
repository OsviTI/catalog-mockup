export type CatalogStatus = 'En edición' | 'Listo para revisar' | 'Publicado'

export interface CatalogItem {
  id: string
  name: string
  status: CatalogStatus
  updatedAt: string
  cover: string
  productsCount: number
  version: string
}

export interface ProductItem {
  id: string
  name: string
  code: string
  price: string
  material: string
  measurements: string
  category: string
  image: string
  stock: string
}

export interface ValidationIssue {
  type: 'warning' | 'error' | 'success'
  message: string
}
