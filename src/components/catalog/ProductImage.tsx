import { ImageIcon } from 'lucide-react'
import { useAssetUrl } from '../../hooks/useAssetUrl'
import type { ImageReference } from '../../types/catalog'

interface ProductImageProps {
  image?: ImageReference
  alt: string
  className?: string
  loading?: 'eager' | 'lazy'
}

export default function ProductImage({
  image,
  alt,
  className = '',
  loading = 'lazy',
}: ProductImageProps) {
  const url = useAssetUrl(image)
  if (!url) {
    return (
      <div
        className={`flex items-center justify-center bg-slate-100 text-slate-400 ${className}`}
        aria-label={`Sin imagen para ${alt}`}
        data-asset-pending={image?.assetId ? 'true' : undefined}
      >
        <ImageIcon className="h-6 w-6" />
      </div>
    )
  }
  return <img src={url} alt={alt} className={className} loading={loading} />
}
