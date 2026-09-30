import { Button, Group, Modal, Text } from '@mantine/core'

function DeactivateSocioModal({ opened, onClose, onConfirm, socio, loading, error }) {
  const nombreCompleto = socio
    ? `${socio.nombre} ${socio.apellido}`.trim()
    : 'este socio'

  return (
    <Modal opened={opened} onClose={onClose} title={
    <Text fw={700} size="xl" >
      Confirmar baja de socio
    </Text>
    } centered>
      <Text size="md">
        ¿Seguro que desea dar de baja a <strong>{nombreCompleto}</strong>?
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

export default DeactivateSocioModal