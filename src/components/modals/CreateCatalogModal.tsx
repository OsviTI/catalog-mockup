import { useState } from 'react'
import { useNavigate } from '../../lib/router'
import { InputField, TextareaField } from '../ui/FormField'
import Button from '../ui/Button'
import Modal from '../ui/Modal'
import { useCatalogStore } from '../../store/catalogStore'

interface CreateCatalogModalProps {
  open: boolean
  onClose: () => void
}

export default function CreateCatalogModal({ open, onClose }: CreateCatalogModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const createCatalog = useCatalogStore((state) => state.createCatalog)
  const updateCatalog = useCatalogStore((state) => state.updateCatalog)
  const navigate = useNavigate()

  const handleCreate = () => {
    const cleanName = name.trim()
    if (!cleanName) return
    const catalogId = createCatalog(cleanName)
    if (description.trim()) updateCatalog(catalogId, { description: description.trim() })
    setName('')
    setDescription('')
    onClose()
    navigate(`/catalogos/${catalogId}/datos`)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Crear nuevo catálogo"
      description="Comienza con una estructura lista para importar productos y aplicar una plantilla."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim()}>
            Crear y configurar
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <InputField
          label="Nombre del catálogo"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ej. Colección Invierno 2026"
          autoFocus
        />
        <TextareaField
          label="Descripción"
          hint="Opcional"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Objetivo, campaña o notas internas del catálogo."
        />
        <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
          <p className="text-sm font-semibold text-primary">El sistema preparará automáticamente</p>
          <ul className="mt-2 grid gap-2 text-sm text-text-secondary sm:grid-cols-2">
            <li>• Borrador persistente</li>
            <li>• Categoría inicial</li>
            <li>• Plantilla editorial</li>
            <li>• Validación de productos</li>
          </ul>
        </div>
      </div>
    </Modal>
  )
}
