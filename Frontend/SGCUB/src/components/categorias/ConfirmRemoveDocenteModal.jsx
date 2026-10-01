import { useState } from 'react'
import { Button, Group, Modal, Text } from '@mantine/core'
import { getErrorMessage } from '../personas/format'

function ConfirmRemoveDocenteModal({ opened, onClose, onConfirm, docenteCategoria, categoria }) {
  const [error, setError] = useState('')
  const [isRemoving, setIsRemoving] = useState(false)

  if (!docenteCategoria) return null

  const docente = docenteCategoria.docente
  const persona = docente?.persona_detalle

  const handleConfirm = async () => {
    setIsRemoving(true)
    setError('')
    try {
      await onConfirm()
      onClose()
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'No se pudo quitar el docente de la categoría.'))
      setIsRemoving(false)
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={() => !isRemoving && onClose()}
      centered
      title={<Text fw={700} size="xl">¿Quitar a este docente de la categoría?</Text>}
    >
      <div className="p-3 bg-surface-container-low rounded-lg space-y-1">
        <p className="text-base font-semibold text-on-surface">
          {persona ? `${persona.nombre} ${persona.apellido}` : 'Docente sin nombre'}
        </p>
        <p className="text-sm text-on-surface-variant">Legajo: <span className="font-medium text-on-surface">{docente?.legajo ? `#${docente.legajo}` : '—'}</span></p>
        <p className="text-sm text-on-surface-variant">Cargo: <span className="font-medium text-on-surface">{docenteCategoria.cargo?.nombre ?? '—'}</span></p>
      </div>
      <Text size="md" mt="md">
        Va a dejar de figurar en el cuerpo técnico de {categoria.nombre}. No se puede quitar si es la única categoría del docente.
      </Text>
      {error && <Text color="red" size="sm" mt="md">{error}</Text>}
      <Group position="right" mt="xl">
        <Button variant="default" onClick={onClose} disabled={isRemoving}>
          Cancelar
        </Button>
        <Button color="red" onClick={handleConfirm} loading={isRemoving}>
          Quitar docente
        </Button>
      </Group>
    </Modal>
  )
}

export default ConfirmRemoveDocenteModal
