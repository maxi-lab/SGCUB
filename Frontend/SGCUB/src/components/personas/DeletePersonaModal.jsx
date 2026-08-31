import { Button, Group, Modal, Text } from '@mantine/core'

function DeletePersonaModal({ opened, onClose, onConfirm, persona, loading, error }) {
  const nombreCompleto = persona
    ? `${persona.nombre} ${persona.apellido}`.trim()
    : 'esta persona'

  return (
    <Modal opened={opened} onClose={onClose} title="Eliminar persona" centered>
      <Text>
        ¿Seguro que querés eliminar a <strong>{nombreCompleto}</strong>?
      </Text>
      <Text size="xs" color="dimmed" mt="xs">
        Nota: Si esta persona está vinculada como socio, jugador o contacto de emergencia, la eliminación podría verse restringida.
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

export default DeletePersonaModal

