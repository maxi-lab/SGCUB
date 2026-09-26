import { Button, Group, Modal, Text } from '@mantine/core'

function DeleteSocioModal({ opened, onClose, onConfirm, socio, loading, error }) {
  const nombreCompleto = socio
    ? `${socio.nombre} ${socio.apellido}`.trim()
    : 'este socio'

  return (
    <Modal opened={opened} onClose={onClose} title={
    <Text fw={700} size="xl" >
      Confirmar eliminación
    </Text>
    } centered>
      <Text size="md">
        ¿Seguro que querés eliminar a <strong>{nombreCompleto}</strong>?
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
          Eliminar
        </Button>
      </Group>
    </Modal>
  )
}

export default DeleteSocioModal