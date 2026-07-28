import type { ProductItem } from '../types/catalog'

export const mockProducts: ProductItem[] = [
  {
    id: 'p-001',
    name: 'Copa Gin Tonic 590 ML',
    code: 'CGT-590',
    price: '$24.900',
    material: 'Cristal soplado',
    measurements: '12 x 9 cm',
    category: 'Copas',
    image: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=800&q=80',
    stock: 'En stock'
  },
  {
    id: 'p-002',
    name: 'Copa Degustación Premium 615 ML',
    code: 'CDP-615',
    price: '$31.200',
    material: 'Cristal fino',
    measurements: '15 x 10 cm',
    category: 'Copas',
    image: 'https://images.unsplash.com/photo-1598910772488-ef0c43d9105d?auto=format&fit=crop&w=800&q=80',
    stock: 'En stock'
  },
  {
    id: 'p-003',
    name: 'Sacacorcho Doble Aleta',
    code: 'SDA-01',
    price: '$18.500',
    material: 'Acero inoxidable',
    measurements: '28 cm',
    category: 'Accesorios',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e8a6?auto=format&fit=crop&w=800&q=80',
    stock: 'Últimas unidades'
  },
  {
    id: 'p-004',
    name: 'Set de Copas 4 Unidades',
    code: 'SET-004',
    price: '$87.900',
    material: 'Cristal premium',
    measurements: '4 x 12 cm',
    category: 'Sets',
    image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80',
    stock: 'En stock'
  }
]
