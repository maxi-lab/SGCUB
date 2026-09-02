import { Button, Group, Modal, NumberInput, Select, Stack, Text, TextInput } from '@mantine/core'

const GENERO_OPCIONES = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
]

function AddCategoriaModal({
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
    <Modal opened={opened} onClose={onClose} title={editing ? 'Modificar categoría' : 'Agregar categoría'}>
      <form onSubmit={onSubmit}>
        <Stack>
          <TextInput
            label="Nombre"
            value={formulario.nombre}
            onChange={(event) => onChange('nombre', event.currentTarget.value)}
            required
          />
          <NumberInput
            label="Año vigente"
            value={formulario.anio_vigente}
            onChange={(valor) => onChange('anio_vigente', valor)}
            min={1900}
            required
          />
          <Group grow align="flex-start">
            <NumberInput
              label="Edad máxima"
              value={formulario.edad_maxima}
              onChange={(valor) => onChange('edad_maxima', valor)}
              min={0}
              required
            />
          </Group>
          <Select
            label="Género"
            data={GENERO_OPCIONES}
            value={formulario.genero}
            onChange={(valor) => onChange('genero', valor)}
            required
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

export default AddCategoriaModal
