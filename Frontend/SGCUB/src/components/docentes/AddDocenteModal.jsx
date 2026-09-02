import { useState } from 'react'
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Divider,
  Group,
  Modal,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Tooltip,
  Grid,
} from '@mantine/core'
import { IconAlertCircle, IconCheck, IconSearch } from '@tabler/icons-react'
import { api } from '../../api/conf'

function AddDocenteModal({
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
  const [buscandoPersona, setBuscandoPersona] = useState(false)
  const [personaEncontrada, setPersonaEncontrada] = useState(null)

  const [errorBuscador, setErrorBuscador] = useState('')

  const buscarPersonaPorDNI = async (dni) => {
    if (!dni) return
    setBuscandoPersona(true)
    setPersonaEncontrada(null)
    setErrorBuscador('')
    try {
      const response = await api.get(`padron/persona/?dni=${dni}`)
      if (response.data && response.data.length > 0) {
        const p = response.data[0]
        setPersonaEncontrada(p)
        onChange('persona', p.persona_id)
        onChange('nombre', p.nombre)
        onChange('apellido', p.apellido)
      } else {
        setPersonaEncontrada(false)
      }
    } catch (err) {
      console.error('Error al buscar persona:', err)
    } finally {
      setBuscandoPersona(false)
    }
  }

  return (
    <Modal opened={opened} onClose={onClose} title="Agregar docente" size="lg">
      <form onSubmit={onSubmit}>
        <Stack spacing="md">
          <Paper p="sm" withBorder radius="md" style={{ backgroundColor: 'var(--bg)' }}>
            <Stack spacing="xs">
                <Group position="apart">
                  <Text weight={600} size="sm">
                    Datos de la persona
                  </Text>
                  {personaEncontrada && (
                    <Badge color="teal" size="sm" leftSection={<IconCheck size={12} />}>
                      Persona encontrada en padrón
                    </Badge>
                  )}
                </Group>

                {errorBuscador && (
                  <Alert color="yellow" p="xs" title="Atención" mb="xs">
                    {errorBuscador}
                  </Alert>
                )}

                <Grid>
                  <Grid.Col span={12} sm={6}>
                    <TextInput
                      label="DNI"
                      placeholder="Ej: 38123456"
                      value={formulario.dni || ''}
                      onChange={(e) => {
                        onChange('dni', e.currentTarget.value)
                        onChange('persona', null)
                        setPersonaEncontrada(null)
                      }}
                      rightSection={
                        <Tooltip label="Buscar persona existente por DNI" withArrow position="top">
                          <ActionIcon type="button" loading={buscandoPersona} onClick={() => buscarPersonaPorDNI(formulario.dni)}>
                            <IconSearch size={16} />
                          </ActionIcon>
                        </Tooltip>
                      }
                      required
                    />
                  </Grid.Col>
                  <Grid.Col span={12} sm={6}>
                    <TextInput
                      label="Nombre"
                      value={formulario.nombre || ''}
                      onChange={(e) => onChange('nombre', e.currentTarget.value)}
                      required
                    />
                  </Grid.Col>
                  <Grid.Col span={12} sm={6}>
                    <TextInput
                      label="Apellido"
                      value={formulario.apellido || ''}
                      onChange={(e) => onChange('apellido', e.currentTarget.value)}
                      required
                    />
                  </Grid.Col>
                  <Grid.Col span={12} sm={6}>
                    <TextInput
                      label="Fecha de nacimiento"
                      type="date"
                      value={formulario.fecha_nacimiento || ''}
                      onChange={(e) => onChange('fecha_nacimiento', e.currentTarget.value)}
                      required
                    />
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
                      <TextInput
                        label="Especifique (otro)"
                        value={formulario.genero_otro || ''}
                        onChange={(e) => onChange('genero_otro', e.currentTarget.value)}
                        required
                      />
                    </Grid.Col>
                  )}
                  <Grid.Col span={12} sm={6}>
                    <TextInput
                      label="Teléfono"
                      value={formulario.telefono || ''}
                      onChange={(e) => onChange('telefono', e.currentTarget.value)}
                      required
                    />
                  </Grid.Col>
                  <Grid.Col span={12} sm={6}>
                    <TextInput
                      label="Email"
                      type="email"
                      value={formulario.email || ''}
                      onChange={(e) => onChange('email', e.currentTarget.value)}
                      required
                    />
                  </Grid.Col>
                </Grid>
                <Text weight={600} size="sm" mt="sm">Domicilio</Text>
                <Grid>
                  <Grid.Col span={8} sm={9}>
                    <TextInput
                      label="Calle"
                      value={formulario.domicilio_calle || ''}
                      onChange={(e) => onChange('domicilio_calle', e.currentTarget.value)}
                      required
                    />
                  </Grid.Col>
                  <Grid.Col span={4} sm={3}>
                    <TextInput
                      label="Número"
                      value={formulario.domicilio_numero || ''}
                      onChange={(e) => onChange('domicilio_numero', e.currentTarget.value)}
                      required
                    />
                  </Grid.Col>
                  <Grid.Col span={6} sm={6}>
                    <TextInput label="Piso" value={formulario.domicilio_piso || ''} onChange={(e) => onChange('domicilio_piso', e.currentTarget.value)} />
                  </Grid.Col>
                  <Grid.Col span={6} sm={6}>
                    <TextInput label="Departamento" value={formulario.domicilio_departamento || ''} onChange={(e) => onChange('domicilio_departamento', e.currentTarget.value)} />
                  </Grid.Col>
                  <Grid.Col span={12} sm={6}>
                    <TextInput label="Entre calle 1" value={formulario.domicilio_entre_calle_1 || ''} onChange={(e) => onChange('domicilio_entre_calle_1', e.currentTarget.value)} />
                  </Grid.Col>
                  <Grid.Col span={12} sm={6}>
                    <TextInput label="Entre calle 2" value={formulario.domicilio_entre_calle_2 || ''} onChange={(e) => onChange('domicilio_entre_calle_2', e.currentTarget.value)} />
                  </Grid.Col>
                  <Grid.Col span={12} sm={6}>
                    <TextInput label="Barrio" value={formulario.domicilio_barrio || ''} onChange={(e) => onChange('domicilio_barrio', e.currentTarget.value)} />
                  </Grid.Col>
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
            <TextInput
                      label="Legajo"
                      type="number"
                      value={formulario.legajo || ''}
                      onChange={(e) => onChange('legajo', e.currentTarget.value)}
                      required
                    />
            <TextInput
              label="Fecha de ingreso"
              type="date"
              value={formulario.fecha_ingreso || ''}
              onChange={(e) => onChange('fecha_ingreso', e.currentTarget.value)}
            />
          </Group>

          {error && (
            <Alert icon={<IconAlertCircle size={16} />} title="Atención" color="red" variant="filled">
              {error}
            </Alert>
          )}

          <Group position="right" mt="md">
            <Button type="button" variant="default" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading} color="teal">
              Guardar docente
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

export default AddDocenteModal
