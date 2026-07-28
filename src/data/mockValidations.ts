import type { ValidationIssue } from '../types/catalog'

export const mockValidation: ValidationIssue[] = [
  { type: 'success', message: 'Archivo Excel cargado correctamente' },
  { type: 'success', message: '24 productos detectados y mapeados' },
  { type: 'warning', message: '2 imágenes sin resolución recomendada' },
  { type: 'success', message: 'Precios actualizados para la versión actual' }
]
