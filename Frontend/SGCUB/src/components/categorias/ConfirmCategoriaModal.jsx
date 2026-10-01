import { useState } from 'react'
import { Button, Group, Modal, Text } from '@mantine/core'
import { getErrorMessage } from '../personas/format'
import { getGeneroLabel } from './categoriaFormat'

function ConfirmCategoriaModal({ opened, onClose, onConfirm, categoria }) {
  const [error, setError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  if (!categoria) return null

  const handleConfirm = async () => {
    setIsDeleting(true)
    setError('')
    try {
      await onConfirm()
      onClose()
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'No se pudo eliminar la categoría.'))
      setIsDeleting(false)
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={() => !isDeleting && onClose()}
      centered
      title={<Text fw={700} size="xl">¿Eliminar esta categoría?</Text>}
    >
      <div className="p-3 bg-surface-container-low rounded-lg space-y-1">
        <p className="text-base font-semibold text-on-surface">{categoria.nombre}</p>
        <p className="text-sm text-on-surface-variant">Año vigente: <span className="font-medium text-on-surface">{categoria.anio_vigente ?? '—'}</span></p>
        <p className="text-sm text-on-surface-variant">Género: <span className="font-medium text-on-surface">{getGeneroLabel(categoria.genero)}</span></p>
      </div>
      <Text size="md" mt="md">
        También se quitarán los docentes asignados. No se puede eliminar si tiene jugadores o si es la única categoría de algún docente.
      </Text>
      {error && <Text color="red" size="sm" mt="md">{error}</Text>}
      <Group position="right" mt="xl">
        <Button variant="default" onClick={onClose} disabled={isDeleting}>
          Cancelar
        </Button>
        <Button color="red" onClick={handleConfirm} loading={isDeleting}>
          Eliminar categoría
        </Button>
      </Group>
    </Modal>
  )
}

export default ConfirmCategoriaModal
