import type { CatalogItem } from '../types/catalog'

export const mockCatalogs: CatalogItem[] = [
  {
    id: 'cat-001',
    name: 'Catálogo Verano 2026',
    status: 'Listo para revisar',
    updatedAt: 'Hoy, 16:45',
    cover: 'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=800&q=80',
    productsCount: 24,
    version: 'v3'
  },
  {
    id: 'cat-002',
    name: 'Catálogo Premium',
    status: 'En edición',
    updatedAt: 'Ayer, 14:20',
    cover: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=800&q=80',
    productsCount: 18,
    version: 'v2'
  },
  {
    id: 'cat-003',
    name: 'Colección Cristalería',
    status: 'Publicado',
    updatedAt: 'Hace 3 días',
    cover: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80',
    productsCount: 36,
    version: 'v1'
  }
]
