import { openDB, type DBSchema } from 'idb'
import type { StoredAsset, WorkspaceData } from '../types/catalog'

interface CatalogMockupDB extends DBSchema {
  workspace: {
    key: 'current'
    value: WorkspaceData
  }
  assets: {
    key: string
    value: StoredAsset
  }
}

const database = openDB<CatalogMockupDB>('catalog-studio', 1, {
  upgrade(db) {
    db.createObjectStore('workspace')
    db.createObjectStore('assets', { keyPath: 'id' })
  },
})

export const loadWorkspace = async () => {
  const db = await database
  return db.get('workspace', 'current')
}

export const persistWorkspace = async (workspace: WorkspaceData) => {
  const db = await database
  await db.put('workspace', workspace, 'current')
}

export const persistAsset = async (file: File) => {
  const asset: StoredAsset = {
    id: `asset-${crypto.randomUUID()}`,
    blob: file,
    name: file.name,
    type: file.type,
    size: file.size,
    createdAt: new Date().toISOString(),
  }
  const db = await database
  await db.put('assets', asset)
  return asset
}

export const persistBlob = async (blob: Blob, name: string) => {
  const asset: StoredAsset = {
    id: `asset-${crypto.randomUUID()}`,
    blob,
    name,
    type: blob.type || 'application/octet-stream',
    size: blob.size,
    createdAt: new Date().toISOString(),
  }
  const db = await database
  await db.put('assets', asset)
  return asset
}

export const loadAsset = async (id: string) => {
  const db = await database
  return db.get('assets', id)
}

export const removeAsset = async (id: string) => {
  const db = await database
  await db.delete('assets', id)
}

export const clearAssets = async () => {
  const db = await database
  await db.clear('assets')
}

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(blob)
  })

const dataUrlToBlob = async (dataUrl: string) => (await fetch(dataUrl)).blob()

export const createWorkspaceBackup = async (workspace: WorkspaceData) => {
  const db = await database
  const assets = await db.getAll('assets')
  const serializedAssets = await Promise.all(
    assets.map(async (asset) => ({
      ...asset,
      blob: await blobToDataUrl(asset.blob),
    })),
  )
  return new Blob(
    [
      JSON.stringify(
        {
          format: 'catalog-studio-backup',
          version: 1,
          exportedAt: new Date().toISOString(),
          workspace,
          assets: serializedAssets,
        },
        null,
        2,
      ),
    ],
    { type: 'application/json' },
  )
}

export const restoreWorkspaceBackup = async (file: File) => {
  const backup = JSON.parse(await file.text()) as {
    format: string
    version: number
    workspace: WorkspaceData
    assets: Array<Omit<StoredAsset, 'blob'> & { blob: string }>
  }
  if (backup.format !== 'catalog-studio-backup' || backup.version !== 1 || !backup.workspace) {
    throw new Error('Este archivo no es una copia válida de Catalog Studio.')
  }
  const restoredAssets = await Promise.all(
    (backup.assets ?? []).map(async (asset) => ({
      ...asset,
      blob: await dataUrlToBlob(asset.blob),
    })),
  )
  const db = await database
  const transaction = db.transaction(['workspace', 'assets'], 'readwrite')
  await transaction.objectStore('assets').clear()
  for (const asset of restoredAssets) {
    await transaction.objectStore('assets').put(asset)
  }
  await transaction.objectStore('workspace').put(backup.workspace, 'current')
  await transaction.done
  return backup.workspace
}

export const requestPersistentStorage = async () => {
  if (!navigator.storage?.persist) return false
  return navigator.storage.persist()
}

export const storageEstimate = async () => {
  if (!navigator.storage?.estimate) return null
  return navigator.storage.estimate()
}
