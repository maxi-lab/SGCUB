import { Button, Group, Modal, Text } from '@mantine/core'

function ActivateDocenteModal({ opened, onClose, onConfirm, docente, loading, error }) {
  const nombreCompleto = [docente?.persona_detalle?.nombre, docente?.persona_detalle?.apellido]
    .filter(Boolean)
    .join(' ') || 'este docente'

  return (
    <Modal opened={opened} onClose={onClose} title={
    <Text fw={700} size="xl" >
      Confirmar alta de docente
    </Text>
    } centered>
      <Text size="md">
        ¿Seguro que desea dar de alta al docente <strong>{nombreCompleto}</strong>?
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
        <Button color="teal" onClick={onConfirm} loading={loading}>
          Dar de alta
        </Button>
      </Group>
    </Modal>
  )
}

export default ActivateDocenteModal
