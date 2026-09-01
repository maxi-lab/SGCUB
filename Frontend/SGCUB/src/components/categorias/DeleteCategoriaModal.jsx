import { Button, Group, Modal, Text } from '@mantine/core'

function DeleteCategoriaModal({ opened, onClose, onConfirm, categoria, loading, error }) {
  const nombre = categoria?.nombre ?? 'esta categoría'

  return (
    <Modal opened={opened} onClose={onClose} title="Eliminar categoría" centered>
      <Text>
        ¿Seguro que querés eliminar <strong>{nombre}</strong>?
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

export default DeleteCategoriaModal
