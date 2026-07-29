import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { createCatalogSeed, seedWorkspace } from '../data/seed'
import {
  clearAssets,
  loadWorkspace,
  persistWorkspace,
  removeAsset,
  requestPersistentStorage,
} from '../lib/database'
import {
  buildImportComparison,
  invalidConflictResolutionIds,
  normalizeProductCode,
  productDifferences,
} from '../lib/reconciliation'
import { migrateWorkspace } from '../lib/workspaceMigration'
import type {
  Catalog,
  CatalogSettings,
  CatalogTemplate,
  CatalogVersion,
  Category,
  CreativeAsset,
  ConflictResolution,
  ImportableProductField,
  ImportSession,
  MissingResolution,
  PdfCandidate,
  PdfDiagnostics,
  Product,
  WorkspaceData,
} from '../types/catalog'

interface CatalogStore {
  workspace: WorkspaceData
  hydrated: boolean
  saving: boolean
  lastSavedAt?: string
  hydrate: () => Promise<void>
  createCatalog: (name: string) => string
  duplicateCatalog: (catalogId: string) => string | null
  deleteCatalog: (catalogId: string) => void
  updateCatalog: (catalogId: string, patch: Partial<Omit<Catalog, 'id' | 'settings'>>) => void
  updateCatalogSettings: (catalogId: string, patch: Partial<CatalogSettings>) => void
  selectTemplate: (catalogId: string, templateId: string) => void
  addCategory: (catalogId: string, name: string) => string
  updateCategory: (categoryId: string, patch: Partial<Omit<Category, 'id' | 'catalogId'>>) => void
  deleteCategory: (categoryId: string) => void
  addProduct: (catalogId: string, categoryId: string) => string
  updateProduct: (productId: string, patch: Partial<Omit<Product, 'id' | 'catalogId'>>) => void
  deleteProduct: (productId: string) => void
  replaceProducts: (catalogId: string, products: Product[]) => void
  createExcelImportSession: (
    catalogId: string,
    sourceName: string,
    products: Product[],
    warnings: string[],
    importedFields: ImportableProductField[],
  ) => string
  createPdfImportSession: (catalogId: string, sourceName: string, sourceAssetId: string) => string
  completePdfAnalysis: (
    sessionId: string,
    diagnostics: PdfDiagnostics,
    candidates: PdfCandidate[],
    warnings: string[],
  ) => void
  failImportSession: (sessionId: string, message: string) => void
  updatePdfCandidate: (
    sessionId: string,
    candidateId: string,
    patch: Partial<Omit<PdfCandidate, 'id' | 'product'>> & { product?: Partial<Product> },
  ) => void
  preparePdfComparison: (sessionId: string) => void
  setImportChangeSelected: (sessionId: string, changeId: string, selected: boolean) => void
  setImportFieldSelected: (
    sessionId: string,
    changeId: string,
    field: ImportableProductField,
    selected: boolean,
  ) => void
  selectImportFieldAcrossSession: (
    sessionId: string,
    field: ImportableProductField,
    selected: boolean,
  ) => void
  setMissingResolution: (
    sessionId: string,
    changeId: string,
    resolution: MissingResolution,
  ) => void
  updateImportChangeIncoming: (
    sessionId: string,
    changeId: string,
    patch: Partial<Product>,
  ) => void
  setConflictResolution: (
    sessionId: string,
    changeId: string,
    resolution: ConflictResolution,
  ) => void
  applyImportSession: (sessionId: string) => void
  deleteImportSession: (sessionId: string) => void
  updateProductPrices: (catalogId: string, prices: Record<string, number>) => void
  addCreativeAsset: (asset: CreativeAsset) => void
  applyCreativeAssetToProduct: (productId: string, assetId: string, name: string) => void
  createVersion: (catalogId: string, label?: string) => CatalogVersion | null
  publishVersion: (versionId: string) => void
  restoreVersion: (versionId: string) => void
  updateWorkspaceSettings: (patch: Partial<WorkspaceData['settings']>) => void
  replaceWorkspace: (workspace: WorkspaceData) => void
  resetWorkspace: () => Promise<void>
}

let saveTimer: number | undefined

const cloneSeed = () => structuredClone(seedWorkspace)

const activity = (
  catalogId: string,
  type: WorkspaceData['activity'][number]['type'],
  message: string,
) => ({
  id: `activity-${crypto.randomUUID()}`,
  catalogId,
  type,
  message,
  createdAt: new Date().toISOString(),
})

const applyTemplateDefaults = (catalog: Catalog, template: CatalogTemplate) => {
  catalog.templateId = template.id
  catalog.coverVariant = template.defaultCoverVariant ?? template.coverVariants[0]
  catalog.settings.productsPerPage =
    template.defaultProductsPerPage ?? catalog.settings.productsPerPage
  catalog.settings.theme = {
    ...catalog.settings.theme,
    primary: template.accent,
    background: template.preview.surface,
    text: template.preview.ink,
    ...template.defaultTheme,
  }
  catalog.updatedAt = new Date().toISOString()
}

const refreshImportSessionStatus = (session: ImportSession) => {
  if (session.status === 'applied' || session.status === 'failed' || session.status === 'analyzing') {
    return
  }
  const hasPendingMissing = session.changes.some(
    (change) => change.kind === 'missing' && (change.missingResolution ?? 'pending') === 'pending',
  )
  const hasPendingConflict = session.changes.some(
    (change) =>
      change.kind === 'conflict' &&
      (change.conflictResolution ?? 'pending') === 'pending',
  )
  session.status = hasPendingMissing || hasPendingConflict ? 'needs-review' : 'ready'
  session.updatedAt = new Date().toISOString()
}

export const useCatalogStore = create<CatalogStore>()(
  subscribeWithSelector((set, get) => {
    const commit = (mutate: (workspace: WorkspaceData) => void) => {
      const workspace = structuredClone(get().workspace)
      mutate(workspace)
      set({ workspace, saving: true })

      window.clearTimeout(saveTimer)
      saveTimer = window.setTimeout(async () => {
        try {
          await persistWorkspace(workspace)
          set({ saving: false, lastSavedAt: new Date().toISOString() })
        } catch (error) {
          console.error('No se pudo guardar el espacio de trabajo', error)
          set({ saving: false })
        }
      }, 450)
    }

    return {
      workspace: cloneSeed(),
      hydrated: false,
      saving: false,

      hydrate: async () => {
        try {
          const saved = await loadWorkspace()
          const workspace = saved ? migrateWorkspace(saved) : cloneSeed()

          if (!saved) await persistWorkspace(workspace)

          let persistenceRequested = workspace.settings.persistenceRequested
          if (!persistenceRequested) {
            persistenceRequested = await requestPersistentStorage()
            workspace.settings.persistenceRequested = persistenceRequested
            await persistWorkspace(workspace)
          }

          set({
            workspace,
            hydrated: true,
            saving: false,
            lastSavedAt: new Date().toISOString(),
          })
        } catch (error) {
          console.error('No se pudo hidratar el espacio de trabajo', error)
          set({ workspace: cloneSeed(), hydrated: true, saving: false })
        }
      },

      createCatalog: (name) => {
        const created = createCatalogSeed(name)
        commit((workspace) => {
          workspace.catalogs.unshift(created.catalog)
          workspace.categories.push(...created.categories)
          workspace.activity.unshift(activity(created.catalog.id, 'created', `Se creó “${name}”.`))
        })
        return created.catalog.id
      },

      duplicateCatalog: (catalogId) => {
        const source = get().workspace.catalogs.find((item) => item.id === catalogId)
        if (!source) return null

        const newId = `catalog-${crypto.randomUUID()}`
        const createdAt = new Date().toISOString()
        const categoryMap = new Map<string, string>()
        const categories = get().workspace.categories
          .filter((item) => item.catalogId === catalogId)
          .map((item) => {
            const categoryId = `category-${crypto.randomUUID()}`
            categoryMap.set(item.id, categoryId)
            return { ...structuredClone(item), id: categoryId, catalogId: newId }
          })
        const products = get().workspace.products
          .filter((item) => item.catalogId === catalogId)
          .map((item) => ({
            ...structuredClone(item),
            id: `product-${crypto.randomUUID()}`,
            catalogId: newId,
            categoryId: categoryMap.get(item.categoryId) ?? categories[0]?.id ?? '',
            createdAt,
            updatedAt: createdAt,
          }))
        const catalog: Catalog = {
          ...structuredClone(source),
          id: newId,
          name: `${source.name} · Copia`,
          status: 'draft',
          publishedVersionId: undefined,
          createdAt,
          updatedAt: createdAt,
        }

        commit((workspace) => {
          workspace.catalogs.unshift(catalog)
          workspace.categories.push(...categories)
          workspace.products.push(...products)
          workspace.activity.unshift(activity(newId, 'created', `Se duplicó “${source.name}”.`))
        })
        return newId
      },

      deleteCatalog: (catalogId) =>
        commit((workspace) => {
          workspace.catalogs = workspace.catalogs.filter((item) => item.id !== catalogId)
          workspace.categories = workspace.categories.filter((item) => item.catalogId !== catalogId)
          workspace.products = workspace.products.filter((item) => item.catalogId !== catalogId)
          workspace.versions = workspace.versions.filter((item) => item.catalogId !== catalogId)
          workspace.importSessions = workspace.importSessions.filter(
            (item) => item.catalogId !== catalogId,
          )
          workspace.creativeAssets = workspace.creativeAssets.filter(
            (item) => item.catalogId !== catalogId,
          )
          workspace.activity = workspace.activity.filter((item) => item.catalogId !== catalogId)
        }),

      updateCatalog: (catalogId, patch) =>
        commit((workspace) => {
          const catalog = workspace.catalogs.find((item) => item.id === catalogId)
          if (!catalog) return
          Object.assign(catalog, patch, { updatedAt: new Date().toISOString() })
          workspace.activity.unshift(activity(catalogId, 'updated', 'Se actualizó la información del catálogo.'))
        }),

      updateCatalogSettings: (catalogId, patch) =>
        commit((workspace) => {
          const catalog = workspace.catalogs.find((item) => item.id === catalogId)
          if (!catalog) return
          catalog.settings = {
            ...catalog.settings,
            ...patch,
            theme: patch.theme ? { ...catalog.settings.theme, ...patch.theme } : catalog.settings.theme,
          }
          catalog.updatedAt = new Date().toISOString()
        }),

      selectTemplate: (catalogId, templateId) =>
        commit((workspace) => {
          const catalog = workspace.catalogs.find((item) => item.id === catalogId)
          const template = workspace.templates.find((item) => item.id === templateId)
          if (!catalog || !template) return
          applyTemplateDefaults(catalog, template)
        }),

      addCategory: (catalogId, name) => {
        const id = `category-${crypto.randomUUID()}`
        commit((workspace) => {
          const order = workspace.categories.filter((item) => item.catalogId === catalogId).length + 1
          workspace.categories.push({
            id,
            catalogId,
            name,
            description: 'Nueva sección del catálogo.',
            order,
            heroImage: {},
            accent: '#c81d1d',
          })
        })
        return id
      },

      updateCategory: (categoryId, patch) =>
        commit((workspace) => {
          const category = workspace.categories.find((item) => item.id === categoryId)
          if (category) Object.assign(category, patch)
        }),

      deleteCategory: (categoryId) =>
        commit((workspace) => {
          const category = workspace.categories.find((item) => item.id === categoryId)
          if (!category) return
          const fallback = workspace.categories.find(
            (item) => item.catalogId === category.catalogId && item.id !== categoryId,
          )
          if (!fallback) return
          workspace.products.forEach((product) => {
            if (product.categoryId === categoryId) product.categoryId = fallback.id
          })
          workspace.categories = workspace.categories.filter((item) => item.id !== categoryId)
        }),

      addProduct: (catalogId, categoryId) => {
        const id = `product-${crypto.randomUUID()}`
        const createdAt = new Date().toISOString()
        commit((workspace) => {
          const order = workspace.products.filter((item) => item.categoryId === categoryId).length + 1
          workspace.products.push({
            id,
            catalogId,
            categoryId,
            name: 'Nuevo producto',
            code: '',
            price: 0,
            currency: 'ARS',
            measurements: '',
            material: '',
            packaging: '',
            pack: '',
            master: '',
            image: {},
            featured: false,
            order,
            createdAt,
            updatedAt: createdAt,
          })
        })
        return id
      },

      updateProduct: (productId, patch) =>
        commit((workspace) => {
          const product = workspace.products.find((item) => item.id === productId)
          if (!product) return
          Object.assign(product, patch, { updatedAt: new Date().toISOString() })
        }),

      deleteProduct: (productId) =>
        commit((workspace) => {
          workspace.products = workspace.products.filter((item) => item.id !== productId)
        }),

      replaceProducts: (catalogId, products) =>
        commit((workspace) => {
          workspace.products = workspace.products.filter((item) => item.catalogId !== catalogId)
          workspace.products.push(...products)
          workspace.activity.unshift(
            activity(catalogId, 'imported', `Se importaron ${products.length} productos desde una planilla.`),
          )
          const catalog = workspace.catalogs.find((item) => item.id === catalogId)
          if (catalog) catalog.updatedAt = new Date().toISOString()
        }),

      createExcelImportSession: (catalogId, sourceName, products, warnings, importedFields) => {
        const id = `import-${crypto.randomUUID()}`
        const createdAt = new Date().toISOString()
        const currentProducts = get().workspace.products.filter(
          (product) => product.catalogId === catalogId,
        )
        const changes = buildImportComparison(currentProducts, products, importedFields)
        commit((workspace) => {
          const session: ImportSession = {
            id,
            catalogId,
            source: 'excel',
            sourceName,
            status: 'needs-review',
            createdAt,
            updatedAt: createdAt,
            warnings,
            importedFields,
            changes,
          }
          refreshImportSessionStatus(session)
          workspace.importSessions.unshift(session)
          workspace.activity.unshift(
            activity(catalogId, 'imported', `Se comparó la planilla “${sourceName}”.`),
          )
        })
        return id
      },

      createPdfImportSession: (catalogId, sourceName, sourceAssetId) => {
        const id = `import-${crypto.randomUUID()}`
        const createdAt = new Date().toISOString()
        commit((workspace) => {
          workspace.importSessions.unshift({
            id,
            catalogId,
            source: 'pdf',
            sourceName,
            sourceAssetId,
            status: 'analyzing',
            createdAt,
            updatedAt: createdAt,
            warnings: [],
            changes: [],
          })
          workspace.activity.unshift(
            activity(catalogId, 'scanned', `Se cargó el catálogo PDF “${sourceName}”.`),
          )
        })
        return id
      },

      completePdfAnalysis: (sessionId, diagnostics, candidates, warnings) =>
        commit((workspace) => {
          const session = workspace.importSessions.find((item) => item.id === sessionId)
          if (!session) return
          session.pdfDiagnostics = diagnostics
          session.pdfCandidates = candidates
          session.warnings = warnings
          session.status = 'needs-review'
          session.updatedAt = new Date().toISOString()
          if (diagnostics.templateHint) {
            const catalog = workspace.catalogs.find((item) => item.id === session.catalogId)
            const template = workspace.templates.find(
              (item) => item.id === diagnostics.templateHint,
            )
            if (catalog && template) applyTemplateDefaults(catalog, template)
          }
        }),

      failImportSession: (sessionId, message) =>
        commit((workspace) => {
          const session = workspace.importSessions.find((item) => item.id === sessionId)
          if (!session) return
          session.status = 'failed'
          session.warnings = [...session.warnings, message]
          session.updatedAt = new Date().toISOString()
        }),

      updatePdfCandidate: (sessionId, candidateId, patch) =>
        commit((workspace) => {
          const candidate = workspace.importSessions
            .find((item) => item.id === sessionId)
            ?.pdfCandidates?.find((item) => item.id === candidateId)
          if (!candidate) return
          const { product, ...candidatePatch } = patch
          Object.assign(candidate, candidatePatch)
          if (product) Object.assign(candidate.product, product, { updatedAt: new Date().toISOString() })
        }),

      preparePdfComparison: (sessionId) =>
        commit((workspace) => {
          const session = workspace.importSessions.find((item) => item.id === sessionId)
          if (!session?.pdfCandidates) return
          const incoming = session.pdfCandidates
            .filter((candidate) => candidate.selected)
            .map((candidate) => candidate.product)
          const current = workspace.products.filter(
            (product) => product.catalogId === session.catalogId,
          )
          session.changes = buildImportComparison(current, incoming, undefined, true)
          refreshImportSessionStatus(session)
        }),

      setImportChangeSelected: (sessionId, changeId, selected) =>
        commit((workspace) => {
          const change = workspace.importSessions
            .find((item) => item.id === sessionId)
            ?.changes.find((item) => item.id === changeId)
          if (change) change.selected = selected
        }),

      setImportFieldSelected: (sessionId, changeId, field, selected) =>
        commit((workspace) => {
          const change = workspace.importSessions
            .find((item) => item.id === sessionId)
            ?.changes.find((item) => item.id === changeId)
          const fieldChange = change?.changes.find((item) => item.field === field)
          if (!change || !fieldChange) return
          fieldChange.selected = selected
          change.selected = change.changes.some((item) => item.selected)
        }),

      selectImportFieldAcrossSession: (sessionId, field, selected) =>
        commit((workspace) => {
          const session = workspace.importSessions.find((item) => item.id === sessionId)
          if (!session) return
          session.changes.forEach((change) => {
            const fieldChange = change.changes.find((item) => item.field === field)
            if (!fieldChange) return
            fieldChange.selected = selected
            change.selected = change.changes.some((item) => item.selected)
          })
        }),

      setMissingResolution: (sessionId, changeId, resolution) =>
        commit((workspace) => {
          const session = workspace.importSessions.find((item) => item.id === sessionId)
          const change = session?.changes.find((item) => item.id === changeId)
          if (!change || change.kind !== 'missing') return
          change.missingResolution = resolution
          change.selected = resolution === 'remove'
          if (session) refreshImportSessionStatus(session)
        }),

      updateImportChangeIncoming: (sessionId, changeId, patch) =>
        commit((workspace) => {
          const session = workspace.importSessions.find((item) => item.id === sessionId)
          const change = session?.changes.find((item) => item.id === changeId)
          if (!session || !change?.incoming || change.kind !== 'conflict') return
          Object.assign(change.incoming, patch, { updatedAt: new Date().toISOString() })
          change.code = change.incoming.code
          if (change.productId) {
            const current = workspace.products.find((product) => product.id === change.productId)
            if (current) {
              change.changes = productDifferences(
                current,
                change.incoming,
                session.importedFields,
                session.source === 'pdf',
              )
            }
          }
          session.updatedAt = new Date().toISOString()
        }),

      setConflictResolution: (sessionId, changeId, resolution) =>
        commit((workspace) => {
          const session = workspace.importSessions.find((item) => item.id === sessionId)
          const change = session?.changes.find((item) => item.id === changeId)
          if (!session || !change || change.kind !== 'conflict') return
          if (resolution === 'apply-incoming' && !change.productId) return

          if (resolution === 'apply-incoming') {
            const current = workspace.products.find(
              (product) => product.id === change.productId,
            )
            if (current && change.incoming) {
              change.changes = productDifferences(
                current,
                change.incoming,
                session.importedFields,
                session.source === 'pdf',
              )
            }
            const code = normalizeProductCode(change.code)
            session.changes.forEach((candidate) => {
              if (
                candidate.id !== change.id &&
                candidate.kind === 'conflict' &&
                (normalizeProductCode(candidate.code) === code ||
                  candidate.productId === change.productId)
              ) {
                candidate.conflictResolution = 'keep-current'
                candidate.selected = false
              }
            })
          }

          change.conflictResolution = resolution
          change.selected = resolution === 'apply-incoming' || resolution === 'add-new'
          refreshImportSessionStatus(session)
        }),

      applyImportSession: (sessionId) =>
        commit((workspace) => {
          const session = workspace.importSessions.find((item) => item.id === sessionId)
          if (!session || session.status === 'applied') return
          const hasPendingDecisions = session.changes.some(
            (change) =>
              (change.kind === 'missing' &&
                (change.missingResolution ?? 'pending') === 'pending') ||
              (change.kind === 'conflict' &&
                (change.conflictResolution ?? 'pending') === 'pending'),
          )
          if (hasPendingDecisions) return

          const currentProducts = workspace.products.filter(
            (product) => product.catalogId === session.catalogId,
          )
          if (invalidConflictResolutionIds(session.changes, currentProducts).size) return

          let applied = 0

          session.changes.forEach((change) => {
            if (change.kind === 'missing' && change.missingResolution === 'remove' && change.productId) {
              workspace.products = workspace.products.filter((product) => product.id !== change.productId)
              applied += 1
              return
            }
            if (!change.selected || !change.incoming) return

            if (
              (change.kind === 'updated' ||
                (change.kind === 'conflict' &&
                  change.conflictResolution === 'apply-incoming')) &&
              change.productId
            ) {
              const current = workspace.products.find((product) => product.id === change.productId)
              if (!current) return
              change.changes.forEach((fieldChange) => {
                if (!fieldChange.selected) return
                Object.assign(current, {
                  [fieldChange.field]: change.incoming?.[fieldChange.field],
                })
              })
              current.updatedAt = new Date().toISOString()
              applied += 1
            } else if (
              change.kind === 'new' ||
              (change.kind === 'conflict' && change.conflictResolution === 'add-new')
            ) {
              workspace.products.push({
                ...structuredClone(change.incoming),
                id: `product-${crypto.randomUUID()}`,
                catalogId: session.catalogId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              })
              applied += 1
            }
          })

          session.status = 'applied'
          session.updatedAt = new Date().toISOString()
          const catalog = workspace.catalogs.find((item) => item.id === session.catalogId)
          if (catalog) catalog.updatedAt = session.updatedAt
          workspace.activity.unshift(
            activity(
              session.catalogId,
              'reconciled',
              `Se aplicaron ${applied} decisiones de “${session.sourceName}”.`,
            ),
          )
        }),

      deleteImportSession: (sessionId) =>
        commit((workspace) => {
          const session = workspace.importSessions.find((item) => item.id === sessionId)
          if (session?.sourceAssetId) void removeAsset(session.sourceAssetId)
          workspace.importSessions = workspace.importSessions.filter((item) => item.id !== sessionId)
        }),

      updateProductPrices: (catalogId, prices) =>
        commit((workspace) => {
          let changed = 0
          workspace.products.forEach((product) => {
            if (product.catalogId !== catalogId || prices[product.id] === undefined) return
            const price = prices[product.id]
            if (!Number.isFinite(price) || price < 0 || product.price === price) return
            product.price = price
            product.updatedAt = new Date().toISOString()
            changed += 1
          })
          if (!changed) return
          const catalog = workspace.catalogs.find((item) => item.id === catalogId)
          if (catalog) catalog.updatedAt = new Date().toISOString()
          workspace.activity.unshift(
            activity(catalogId, 'updated', `Se actualizaron ${changed} precios en edición rápida.`),
          )
        }),

      addCreativeAsset: (asset) =>
        commit((workspace) => {
          workspace.creativeAssets.unshift(asset)
          workspace.activity.unshift(
            activity(asset.catalogId, 'creative', `Se creó el recurso “${asset.name}”.`),
          )
        }),

      applyCreativeAssetToProduct: (productId, assetId, name) =>
        commit((workspace) => {
          const product = workspace.products.find((item) => item.id === productId)
          if (!product) return
          product.image = { assetId, name, focalPoint: 'center' }
          product.updatedAt = new Date().toISOString()
        }),

      createVersion: (catalogId, label) => {
        const state = get().workspace
        const catalog = state.catalogs.find((item) => item.id === catalogId)
        if (!catalog) return null
        const currentVersions = state.versions.filter((item) => item.catalogId === catalogId)
        const version: CatalogVersion = {
          id: `version-${crypto.randomUUID()}`,
          catalogId,
          number: Math.max(0, ...currentVersions.map((item) => item.number)) + 1,
          label: label ?? 'PDF generado',
          createdAt: new Date().toISOString(),
          status: 'generated',
          snapshot: {
            catalog: structuredClone(catalog),
            categories: structuredClone(
              state.categories.filter((item) => item.catalogId === catalogId),
            ),
            products: structuredClone(state.products.filter((item) => item.catalogId === catalogId)),
          },
        }

        commit((workspace) => {
          workspace.versions.unshift(version)
          const target = workspace.catalogs.find((item) => item.id === catalogId)
          if (target) {
            target.status = 'review'
            target.updatedAt = version.createdAt
          }
          workspace.activity.unshift(
            activity(catalogId, 'generated', `Se generó la versión v${version.number}.`),
          )
        })
        return version
      },

      publishVersion: (versionId) =>
        commit((workspace) => {
          const version = workspace.versions.find((item) => item.id === versionId)
          if (!version) return
          workspace.versions.forEach((item) => {
            if (item.catalogId === version.catalogId) item.status = 'generated'
          })
          version.status = 'published'
          const catalog = workspace.catalogs.find((item) => item.id === version.catalogId)
          if (catalog) {
            catalog.status = 'published'
            catalog.publishedVersionId = version.id
            catalog.updatedAt = new Date().toISOString()
          }
          workspace.activity.unshift(
            activity(version.catalogId, 'published', `Se publicó la versión v${version.number}.`),
          )
        }),

      restoreVersion: (versionId) =>
        commit((workspace) => {
          const version = workspace.versions.find((item) => item.id === versionId)
          if (!version) return
          const snapshot = structuredClone(version.snapshot)
          const catalogIndex = workspace.catalogs.findIndex((item) => item.id === version.catalogId)
          if (catalogIndex < 0) return
          workspace.catalogs[catalogIndex] = {
            ...snapshot.catalog,
            status: 'draft',
            publishedVersionId: workspace.catalogs[catalogIndex].publishedVersionId,
            updatedAt: new Date().toISOString(),
          }
          workspace.categories = workspace.categories
            .filter((item) => item.catalogId !== version.catalogId)
            .concat(snapshot.categories)
          workspace.products = workspace.products
            .filter((item) => item.catalogId !== version.catalogId)
            .concat(snapshot.products)
          workspace.activity.unshift(
            activity(version.catalogId, 'restored', `Se restauró v${version.number} como borrador.`),
          )
        }),

      updateWorkspaceSettings: (patch) =>
        commit((workspace) => {
          workspace.settings = { ...workspace.settings, ...patch }
        }),

      replaceWorkspace: (workspace) => {
        const migrated = migrateWorkspace(workspace)
        void persistWorkspace(migrated)
        set({
          workspace: migrated,
          hydrated: true,
          saving: false,
          lastSavedAt: new Date().toISOString(),
        })
      },

      resetWorkspace: async () => {
        const workspace = cloneSeed()
        await clearAssets()
        await persistWorkspace(workspace)
        set({ workspace, hydrated: true, saving: false, lastSavedAt: new Date().toISOString() })
      },
    }
  }),
)
