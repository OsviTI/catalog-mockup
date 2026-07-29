import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { createCatalogSeed, seedWorkspace } from '../data/seed'
import {
  clearAssets,
  loadWorkspace,
  persistWorkspace,
  requestPersistentStorage,
} from '../lib/database'
import type {
  Catalog,
  CatalogSettings,
  CatalogVersion,
  Category,
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
          const workspace = saved?.schemaVersion === seedWorkspace.schemaVersion ? saved : cloneSeed()

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
          catalog.templateId = templateId
          catalog.coverVariant = template.coverVariants[0]
          catalog.settings.theme.primary = template.accent
          catalog.settings.theme.background = template.preview.surface
          catalog.settings.theme.text = template.preview.ink
          catalog.updatedAt = new Date().toISOString()
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
        set({
          workspace,
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
