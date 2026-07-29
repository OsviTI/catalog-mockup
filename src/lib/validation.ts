import { z } from 'zod'
import type { Product, ValidationIssue } from '../types/catalog'

export const productSchema = z.object({
  name: z.string().trim().min(2, 'El nombre es obligatorio'),
  code: z.string().trim().min(1, 'El código es obligatorio'),
  price: z.number().nonnegative('El precio no puede ser negativo'),
  categoryId: z.string().min(1, 'La categoría es obligatoria'),
})

export const validateProducts = (products: Product[]): ValidationIssue[] => {
  const issues: ValidationIssue[] = []
  const codes = new Map<string, string[]>()

  products.forEach((product) => {
    const result = productSchema.safeParse(product)
    if (!result.success) {
      result.error.issues.forEach((issue) => {
        issues.push({
          id: `${product.id}-${issue.path.join('.')}`,
          level: 'error',
          productId: product.id,
          field: issue.path[0] as keyof Product,
          message: `${product.name || 'Producto sin nombre'}: ${issue.message}`,
        })
      })
    }

    if (!product.image.assetId && !product.image.src) {
      issues.push({
        id: `${product.id}-image`,
        level: 'warning',
        productId: product.id,
        field: 'image',
        message: `${product.name}: falta una imagen de producto.`,
      })
    }

    const matches = codes.get(product.code) ?? []
    matches.push(product.id)
    codes.set(product.code, matches)
  })

  codes.forEach((productIds, code) => {
    if (code && productIds.length > 1) {
      productIds.forEach((productId) =>
        issues.push({
          id: `${productId}-duplicate-code`,
          level: 'warning',
          productId,
          field: 'code',
          message: `El código ${code} está repetido en ${productIds.length} productos.`,
        }),
      )
    }
  })

  if (!issues.length) {
    issues.push({
      id: 'products-ok',
      level: 'success',
      message: 'Todos los productos están listos para generar el catálogo.',
    })
  }

  return issues
}
