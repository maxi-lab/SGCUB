import { Button, Group, Modal, Stack, Text, TextInput } from '@mantine/core'

function AddPersonaModal({
  opened,
  onClose,
  onSubmit,
  formulario,
  onChange,
  loading,
  error,
  editing = false,
}) {
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={editing ? 'Editar persona' : 'Agregar persona'}
    >
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
          <TextInput
            label="Email"
            type="email"
            value={formulario.email || ''}
            onChange={(event) => onChange('email', event.currentTarget.value)}
          />
          {error && (
            <Text color="red" size="sm">
              {error}
            </Text>
          )}
          <Group position="right" mt="md">
            <Button type="button" variant="default" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading} color={editing ? 'teal' : undefined}>
              {editing ? 'Guardar cambios' : 'Guardar'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

export default AddPersonaModal

