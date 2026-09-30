import { Button, Group, Modal, Text } from '@mantine/core'

function ActivateJugadorModal({ opened, onClose, onConfirm, jugador, loading, error }) {
  const nombreCompleto = jugador?.socio
    ? `${jugador.socio.nombre} ${jugador.socio.apellido}`.trim()
    : 'este jugador'

  return (
    <Modal opened={opened} onClose={onClose} title={
    <Text fw={700} size="xl" >
      Confirmar alta de jugador
    </Text>
    } centered>
      <Text size="md">
        ¿Seguro que desea dar de alta al jugador <strong>{nombreCompleto}</strong>?
      </Text>
      <Text size="sm" c="dimmed" mt="xs">
        Si el socio está inactivo, también se dará de alta.
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

export default ActivateJugadorModal
