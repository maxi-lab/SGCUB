import { Button, Group, Modal, Stack, Text, TextInput } from '@mantine/core'

function AddSocioModal({
  opened,
  onClose,
  onSubmit,
  formulario,
  onChange,
  loading,
  error,
}) {
  return (
    <Modal opened={opened} onClose={onClose} title="Agregar socio">
      <form onSubmit={onSubmit}>
        <Stack>
          <TextInput
            label="Nombre"
            value={formulario.nombre}
            onChange={(event) => onChange('nombre', event.currentTarget.value)}
            required
          />
          <TextInput
            label="Apellido"
            value={formulario.apellido}
            onChange={(event) => onChange('apellido', event.currentTarget.value)}
            required
          />
          <TextInput
            label="DNI"
            value={formulario.dni}
            onChange={(event) => onChange('dni', event.currentTarget.value)}
            required
          />
          <TextInput
            label="Teléfono"
            value={formulario.telefono}
            onChange={(event) => onChange('telefono', event.currentTarget.value)}
            required
          />
          {error && <Text color="red" size="sm">{error}</Text>}
          <Group position="right" mt="md">
            <Button type="button" variant="default" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              Guardar
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

export default AddSocioModal
