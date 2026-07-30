import { useCatalogStore } from '../../store/catalogStore'
import CreativeImageEditorModal from './CreativeImageEditorModal'

interface ProductCreativeModalProps {
  open: boolean
  productId: string | null
  onClose: () => void
}

export default function ProductCreativeModal({
  open,
  productId,
  onClose,
}: ProductCreativeModalProps) {
  const product = useCatalogStore((state) =>
    state.workspace.products.find((item) => item.id === productId),
  )
  const addCreativeAsset = useCatalogStore((state) => state.addCreativeAsset)
  const applyToProduct = useCatalogStore((state) => state.applyCreativeAssetToProduct)

  if (!product) return null

  return (
    <CreativeImageEditorModal
      open={open}
      subjectName={product.name}
      subjectCode={product.code}
      image={product.image}
      onClose={onClose}
      onApply={(assetId, name, prompt) => {
        addCreativeAsset({
          id: `creative-${crypto.randomUUID()}`,
          catalogId: product.catalogId,
          assetId,
          name,
          kind: 'enhanced-product',
          prompt: prompt || undefined,
          sourceProductId: product.id,
          createdAt: new Date().toISOString(),
        })
        applyToProduct(product.id, assetId, name)
      }}
    />
  )
}
