import { useCatalogStore } from '../../store/catalogStore'
import CreativeImageEditorModal from './CreativeImageEditorModal'

interface CandidateCreativeModalProps {
  open: boolean
  sessionId: string
  candidateId: string | null
  onClose: () => void
}

export default function CandidateCreativeModal({
  open,
  sessionId,
  candidateId,
  onClose,
}: CandidateCreativeModalProps) {
  const candidate = useCatalogStore((state) =>
    state.workspace.importSessions
      .find((session) => session.id === sessionId)
      ?.pdfCandidates?.find((item) => item.id === candidateId),
  )
  const addCreativeAsset = useCatalogStore((state) => state.addCreativeAsset)
  const updateCandidate = useCatalogStore((state) => state.updatePdfCandidate)

  if (!candidate) return null

  return (
    <CreativeImageEditorModal
      open={open}
      subjectName={candidate.product.name}
      subjectCode={candidate.product.code}
      image={candidate.product.image}
      onClose={onClose}
      onApply={(assetId, name, prompt) => {
        addCreativeAsset({
          id: `creative-${crypto.randomUUID()}`,
          catalogId: candidate.product.catalogId,
          assetId,
          name,
          kind: 'enhanced-product',
          prompt: prompt || undefined,
          sourceProductId: candidate.product.id,
          createdAt: new Date().toISOString(),
        })
        updateCandidate(sessionId, candidate.id, {
          imageStatus: 'saved',
          imageConfidence: 1,
          reviewed: true,
          product: {
            image: { assetId, name, focalPoint: 'center' },
          },
        })
      }}
    />
  )
}
