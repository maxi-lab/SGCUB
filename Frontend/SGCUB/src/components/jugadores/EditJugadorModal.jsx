import { Button, Group, Modal, Select, Stack, Text, TextInput } from '@mantine/core'

function EditJugadorModal({
  opened,
  onClose,
  onSubmit,
  formulario,
  onChange,
  socios,
  categorias,
  loading,
  error,
}) {
  const sociosOptions = socios.map((socio) => ({
    value: String(socio.socio_id),
    label: `${socio.nombre} ${socio.apellido} - DNI ${socio.dni}`,
  }))
  const categoriasOptions = categorias.map((categoria) => ({
    value: String(categoria.categoria_id),
    label: categoria.nombre,
  }))

  return (
    <Modal opened={opened} onClose={onClose} title="Editar jugador">
      <form onSubmit={onSubmit}>
        <Stack>
          <Select
            label="Socio"
            placeholder="Seleccioná el socio"
            searchable
            nothingFound="No se encontraron socios"
            data={sociosOptions}
            value={formulario.socio}
            onChange={(value) => onChange('socio', value)}
            required
          />
          <Select
            label="Categoría"
            placeholder="Seleccioná la categoría"
            data={categoriasOptions}
            value={formulario.categoria}
            onChange={(value) => onChange('categoria', value)}
            required
          />
          <TextInput
            label="Obra social"
            value={formulario.obra_social}
            onChange={(event) => onChange('obra_social', event.currentTarget.value)}
          />
          <TextInput
            label="Talla de indumentaria"
            value={formulario.tallaIndumentaria}
            onChange={(event) => onChange('tallaIndumentaria', event.currentTarget.value)}
          />
          <TextInput
            label="Contacto de emergencia"
            value={formulario.contactoEmergencia}
            onChange={(event) => onChange('contactoEmergencia', event.currentTarget.value)}
          />
          {error && <Text color="red" size="sm">{error}</Text>}
          <Group position="right" mt="md">
            <Button type="button" variant="default" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              Guardar cambios
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

export default EditJugadorModal