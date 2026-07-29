import type { CatalogStatus } from '../types/catalog'

export const formatCurrency = (value: number, currency: 'ARS' | 'USD' = 'ARS') =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value)

export const formatDate = (value: string, options?: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat('es-AR', options ?? { day: '2-digit', month: 'short', year: 'numeric' }).format(
    new Date(value),
  )

export const formatRelativeDate = (value: string) => {
  const date = new Date(value)
  const diffDays = Math.round((date.getTime() - Date.now()) / 86_400_000)
  if (Math.abs(diffDays) < 1) return 'Hoy'
  return new Intl.RelativeTimeFormat('es-AR', { numeric: 'auto' }).format(diffDays, 'day')
}

export const statusLabel: Record<CatalogStatus, string> = {
  draft: 'En edición',
  review: 'Listo para revisar',
  published: 'Publicado',
}

export const safeFilename = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .toLowerCase()
