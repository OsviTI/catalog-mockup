import { useEffect, useState } from 'react'
import { loadAsset } from '../lib/database'
import type { ImageReference } from '../types/catalog'

export const useAssetUrl = (image?: ImageReference) => {
  const [url, setUrl] = useState(image?.src ?? '')

  useEffect(() => {
    let objectUrl: string | undefined
    let active = true

    if (!image?.assetId) {
      setUrl(image?.src ?? '')
      return
    }

    loadAsset(image.assetId)
      .then((asset) => {
        if (!asset || !active) return
        objectUrl = URL.createObjectURL(asset.blob)
        setUrl(objectUrl)
      })
      .catch(() => setUrl(image.src ?? ''))

    return () => {
      active = false
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [image?.assetId, image?.src])

  return url
}
