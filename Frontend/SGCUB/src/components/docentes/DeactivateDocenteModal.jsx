import { Button, Group, Modal, Text } from '@mantine/core'

function DeactivateDocenteModal({ opened, onClose, onConfirm, docente, loading, error }) {
  const nombreCompleto = [docente?.persona_detalle?.nombre, docente?.persona_detalle?.apellido]
    .filter(Boolean)
    .join(' ') || 'este docente'

  return (
    <Modal opened={opened} onClose={onClose} title={
    <Text fw={700} size="xl" >
      Confirmar baja de docente
    </Text>
    } centered>
      <Text size="md">
        ¿Seguro que desea dar de baja al docente <strong>{nombreCompleto}</strong>?
      </Text>
      {error && (
        <Text color="red" size="base" mt="md">
          {error}
        </Text>
      )}
      <Group position="right" mt="xl">
        <Button variant="default" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button color="red" onClick={onConfirm} loading={loading}>
          Dar de baja
        </Button>
      </Group>
    </Modal>
  )
}

export default DeactivateDocenteModal
