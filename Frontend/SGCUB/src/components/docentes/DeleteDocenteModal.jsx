import { Button, Group, Modal, Text } from '@mantine/core'

function DeleteDocenteModal({ opened, onClose, onConfirm, docente, loading, error }) {
  const nombreCompleto = [docente?.persona_detalle?.nombre, docente?.persona_detalle?.apellido]
    .filter(Boolean)
    .join(' ') || 'este docente'

  return (
    <Modal opened={opened} onClose={onClose} title="Eliminar docente" centered>
      <Text>
        ¿Seguro que querés eliminar al docente <strong>{nombreCompleto}</strong>?
      </Text>
      {error && (
        <Text color="red" size="sm" mt="md">
          {error}
        </Text>
      )}
      <Group position="right" mt="xl">
        <Button variant="default" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button color="red" onClick={onConfirm} loading={loading}>
          Eliminar
        </Button>
      </Group>
    </Modal>
  )
}

export default DeleteDocenteModal