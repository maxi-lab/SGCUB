import { Button, Group, Modal, Text } from '@mantine/core'

function DeactivateJugadorModal({ opened, onClose, onConfirm, jugador, loading, error }) {
  const nombreCompleto = jugador?.socio
    ? `${jugador.socio.nombre} ${jugador.socio.apellido}`.trim()
    : 'este jugador'

  return (
    <Modal opened={opened} onClose={onClose} title={
    <Text fw={700} size="xl" >
      Confirmar baja de jugador
    </Text>
    } centered>
      <Text size="md">
        ¿Seguro que desea dar de baja al jugador <strong>{nombreCompleto}</strong>?
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

export default DeactivateJugadorModal
