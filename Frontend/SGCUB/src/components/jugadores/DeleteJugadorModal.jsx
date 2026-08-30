import { Button, Group, Modal, Text } from '@mantine/core'

function DeleteJugadorModal({ opened, onClose, onConfirm, jugador, loading, error }) {
  const nombreCompleto = jugador?.socio
    ? `${jugador.socio.nombre} ${jugador.socio.apellido}`.trim()
    : 'este jugador'

  return (
    <Modal opened={opened} onClose={onClose} title="Eliminar jugador" centered>
      <Text>
        ¿Seguro que querés eliminar al jugador <strong>{nombreCompleto}</strong>?
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

export default DeleteJugadorModal