import { Button, Group, Modal, Text } from '@mantine/core'

function DeleteContactoEmergenciaModal({
  opened,
  onClose,
  onConfirm,
  contacto,
  loading,
  error,
}) {
  const nombre = contacto?.persona
    ? `${contacto.persona.nombre} ${contacto.persona.apellido}`.trim()
    : 'este contacto'

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Eliminar contacto de emergencia"
      centered
    >
      <Text>
        ¿Seguro que querés eliminar a <strong>{nombre}</strong>?
      </Text>

      {error && (
        <Text color="red" size="sm" mt="md">
          {error}
        </Text>
      )}

      <Group position="right" mt="xl">
        <Button
          variant="default"
          onClick={onClose}
          disabled={loading}
        >
          Cancelar
        </Button>

        <Button color="red" onClick={onConfirm} loading={loading}>
          Eliminar
        </Button>
      </Group>
    </Modal>
  )
}

export default DeleteContactoEmergenciaModal