import { Button, Group, Modal, Stack, Text, TextInput } from '@mantine/core'

const formatLocalYmd = (date) => {
  if (!date) return ''
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function AddSocioModal({
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
    <Modal opened={opened} onClose={onClose} title={editing ? 'Modificar socio' : 'Agregar socio'}>
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
            value={formulario.email}
            onChange={(event) => onChange('email', event.currentTarget.value)}
            required
          />
          <TextInput
            label="Fecha de nacimiento"
            type="date"
            value={formulario.fecha_nacimiento ?? ''}
            onChange={(event) => onChange('fecha_nacimiento', event.currentTarget.value)}
            max={formatLocalYmd(new Date())}
          />
          {error && <Text color="red" size="sm">{error}</Text>}
          <Group position="right" mt="md">
            <Button type="button" variant="default" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              {editing ? 'Modificar' : 'Guardar'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

export default AddSocioModal