import { seedWorkspace } from '../data/seed'
import type { WorkspaceData } from '../types/catalog'

export const migrateWorkspace = (value: WorkspaceData): WorkspaceData => {
  const workspace = structuredClone(value)
  const previousVersion = workspace.schemaVersion ?? 1

  workspace.importSessions ??= []
  workspace.creativeAssets ??= []
  workspace.settings ??= structuredClone(seedWorkspace.settings)
  const existingTemplateIds = new Set(workspace.templates.map((template) => template.id))
  workspace.templates.push(
    ...seedWorkspace.templates
      .filter((template) => !existingTemplateIds.has(template.id))
      .map((template) => structuredClone(template)),
  )
  if (previousVersion < 3) {
    const referenceCatalog = workspace.catalogs.find(
      (catalog) => catalog.id === 'catalog-crystal-2026',
    )
    if (referenceCatalog?.templateId === 'template-editorial') {
      const official = seedWorkspace.templates.find(
        (template) => template.id === 'template-crystal-official',
      )
      referenceCatalog.templateId = 'template-crystal-official'
      referenceCatalog.coverVariant = official?.defaultCoverVariant ?? 'image-split'
      referenceCatalog.settings.productsPerPage = official?.defaultProductsPerPage ?? 4
      referenceCatalog.settings.theme = {
        ...referenceCatalog.settings.theme,
        ...official?.defaultTheme,
      }
    }
  }
  workspace.schemaVersion = seedWorkspace.schemaVersion

  return workspace
}
