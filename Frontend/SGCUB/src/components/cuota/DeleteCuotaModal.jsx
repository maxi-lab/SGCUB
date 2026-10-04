import { Button, Group, Modal, Text } from '@mantine/core'

function DeleteCuotaModal({ opened, onClose, onConfirm, cuota, loading, error }) {
  const periodo = cuota?.periodo || 'esta cuota'

  return (
    <Modal opened={opened} onClose={onClose} title="Eliminar cuota" centered>
      <Text>
        ¿Seguro que querés eliminar la cuota <strong>{periodo}</strong>?
      </Text>
      {error && (
        <Text c="red" size="sm" mt="md">
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

export default DeleteCuotaModal
