import {
  Alert,
  Button,
  Divider,
  Group,
  Grid,
  Modal,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'

function EditDocenteModal({
  opened,
  onClose,
  onSubmit,
  formulario,
  onChange,
  generos = [],
  localidades = [],
  loading,
  error,
}) {

  return (
    <Modal opened={opened} onClose={onClose} title="Editar docente" size="lg">
      <form onSubmit={onSubmit}>
        <Stack spacing="md">
          {error && (
            <Alert icon={<IconAlertCircle size={16} />} title="Atención" color="red" variant="filled">
              {error}
            </Alert>
          )}

          <Paper p="sm" withBorder radius="md" style={{ backgroundColor: 'var(--bg)' }}>
            <Stack spacing="xs">
              <Text weight={600} size="sm">Datos de la persona</Text>
              <Grid>
                <Grid.Col span={12} sm={6}>
                  <TextInput label="DNI" value={formulario.dni || ''} disabled />
                </Grid.Col>
                <Grid.Col span={12} sm={6}>
                  <TextInput label="Nombre" value={formulario.nombre || ''} onChange={(event) => onChange('nombre', event.currentTarget.value)} required />
                </Grid.Col>
                <Grid.Col span={12} sm={6}>
                  <TextInput label="Apellido" value={formulario.apellido || ''} onChange={(event) => onChange('apellido', event.currentTarget.value)} required />
                </Grid.Col>
                <Grid.Col span={12} sm={6}>
                  <TextInput label="Fecha de nacimiento" type="date" value={formulario.fecha_nacimiento || ''} onChange={(event) => onChange('fecha_nacimiento', event.currentTarget.value)} required />
                </Grid.Col>
                <Grid.Col span={12} sm={6}>
                  <Select
                    label="Género"
                    data={generos.map((genero) => ({ value: String(genero.genero_id), label: genero.nombre }))}
                    value={formulario.genero || ''}
                    onChange={(value) => onChange('genero', value)}
                    clearable
                    required
                  />
                </Grid.Col>
                {formulario.genero === String(generos.find((genero) => genero.nombre === 'Otro')?.genero_id) && (
                  <Grid.Col span={12} sm={6}>
                    <TextInput label="Especifique (otro)" value={formulario.genero_otro || ''} onChange={(event) => onChange('genero_otro', event.currentTarget.value)} required />
                  </Grid.Col>
                )}
                <Grid.Col span={12} sm={6}>
                  <TextInput label="Teléfono" value={formulario.telefono || ''} onChange={(event) => onChange('telefono', event.currentTarget.value)} required />
                </Grid.Col>
                <Grid.Col span={12} sm={6}>
                  <TextInput label="Email" type="email" value={formulario.email || ''} onChange={(event) => onChange('email', event.currentTarget.value)} required />
                </Grid.Col>
              </Grid>
              <Text weight={600} size="sm" mt="sm">Domicilio</Text>
              <Grid>
                <Grid.Col span={8} sm={9}><TextInput label="Calle" value={formulario.domicilio_calle || ''} onChange={(event) => onChange('domicilio_calle', event.currentTarget.value)} required /></Grid.Col>
                <Grid.Col span={4} sm={3}><TextInput label="Número" value={formulario.domicilio_numero || ''} onChange={(event) => onChange('domicilio_numero', event.currentTarget.value)} required /></Grid.Col>
                <Grid.Col span={6} sm={6}><TextInput label="Piso" value={formulario.domicilio_piso || ''} onChange={(event) => onChange('domicilio_piso', event.currentTarget.value)} /></Grid.Col>
                <Grid.Col span={6} sm={6}><TextInput label="Departamento" value={formulario.domicilio_departamento || ''} onChange={(event) => onChange('domicilio_departamento', event.currentTarget.value)} /></Grid.Col>
                <Grid.Col span={12} sm={6}><TextInput label="Entre calle 1" value={formulario.domicilio_entre_calle_1 || ''} onChange={(event) => onChange('domicilio_entre_calle_1', event.currentTarget.value)} /></Grid.Col>
                <Grid.Col span={12} sm={6}><TextInput label="Entre calle 2" value={formulario.domicilio_entre_calle_2 || ''} onChange={(event) => onChange('domicilio_entre_calle_2', event.currentTarget.value)} /></Grid.Col>
                <Grid.Col span={12} sm={6}><TextInput label="Barrio" value={formulario.domicilio_barrio || ''} onChange={(event) => onChange('domicilio_barrio', event.currentTarget.value)} /></Grid.Col>
                <Grid.Col span={12} sm={6}>
                  <Select
                    label="Localidad"
                    data={localidades.map((localidad) => ({ value: String(localidad.localidad_id), label: localidad.nombre }))}
                    value={formulario.domicilio_localidad || ''}
                    onChange={(value) => onChange('domicilio_localidad', value)}
                    clearable
                    required
                  />
                </Grid.Col>
              </Grid>
            </Stack>
          </Paper>

          <Divider label="Información del docente" labelPosition="center" my="xs" />
          <Group grow>
            <TextInput label="Legajo" type="number" value={formulario.legajo || ''} onChange={(event) => onChange('legajo', event.currentTarget.value)} required />
            <TextInput label="Fecha de ingreso" type="date" value={formulario.fecha_ingreso || ''} onChange={(event) => onChange('fecha_ingreso', event.currentTarget.value)} />
          </Group>

          <Group position="right" mt="md">
            <Button type="button" variant="default" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading} color="teal">
              Guardar cambios
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

export default EditDocenteModal