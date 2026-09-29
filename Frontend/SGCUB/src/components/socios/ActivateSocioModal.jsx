import { Button, Group, Modal, Text } from '@mantine/core'

function ActivateSocioModal({ opened, onClose, onConfirm, socio, loading, error }) {
  const nombreCompleto = socio
    ? `${socio.nombre} ${socio.apellido}`.trim()
    : 'este socio'

  return (
    <Modal opened={opened} onClose={onClose} title={
    <Text fw={700} size="xl" >
      Confirmar alta de socio
    </Text>
    } centered>
      <Text size="md">
        ¿Seguro que desea dar de alta a <strong>{nombreCompleto}</strong>?
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

export default ActivateSocioModal
