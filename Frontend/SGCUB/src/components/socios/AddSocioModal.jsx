import { useState, useEffect } from 'react'
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
  Tooltip,
  Select,
  Paper,
  Grid,
  Divider,
} from '@mantine/core'
import { IconCheck, IconSearch } from '@tabler/icons-react'
import { api } from '../../api/conf'

function AddSocioModal({
  opened,
  onClose,
  onSubmit,
  formulario,
  onChange,
  loading,
  error,
  editing = false,
  estadosSocio = [],
  generos = [],
  localidades = [],
}) {
  const [buscandoPersona, setBuscandoPersona] = useState(false)
  const [personaEncontrada, setPersonaEncontrada] = useState(null)

  // Reseteamos el estado de búsqueda al abrir/cerrar el modal
  useEffect(() => {
    if (!opened) {
      setPersonaEncontrada(null)
    }
  }, [opened])

  const buscarPersonaPorDNI = async (dni) => {
    if (!dni) return
    setBuscandoPersona(true)
    setPersonaEncontrada(null)
    try {
      const response = await api.get(`padron/persona/?dni=${dni}`)
      if (response.data && response.data.length > 0) {
        const p = response.data[0]
        onChange('nombre', p.nombre)
        onChange('apellido', p.apellido)
        onChange('telefono', p.telefono)
        onChange('email', p.email || '')
        setPersonaEncontrada(p)
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
    <Modal opened={opened} onClose={onClose} title={editing ? 'Editar socio' : 'Agregar socio'} size="lg">
      <form onSubmit={onSubmit}>
        <Stack spacing="lg">
          {!editing && personaEncontrada && (
            <Badge color="teal" size="sm" leftSection={<IconCheck size={12} />}>
              Persona encontrada en padrón
            </Badge>
          )}

          <Paper withBorder p="md" radius="md">
            <Text weight={500} mb="md">Datos Personales</Text>
            <Grid>
              <Grid.Col span={12} sm={6}>
                <TextInput
                  label="DNI"
                  placeholder="Ej: 38123456"
                  value={formulario.dni}
                  onChange={(event) => onChange('dni', event.currentTarget.value)}
                  rightSection={
                    !editing ? (
                      <Tooltip label="Buscar persona existente por DNI" withArrow position="top">
                        <ActionIcon
                          loading={buscandoPersona}
                          onClick={() => buscarPersonaPorDNI(formulario.dni)}
                        >
                          <IconSearch size={16} />
                        </ActionIcon>
                      </Tooltip>
                    ) : null
                  }
                  required
                />
              </Grid.Col>
              <Grid.Col span={12} sm={6}>
                <TextInput
                  label="Fecha de Nacimiento"
                  type="date"
                  value={formulario.fecha_nacimiento}
                  onChange={(event) => onChange('fecha_nacimiento', event.currentTarget.value)}
                  required
                />
              </Grid.Col>
              <Grid.Col span={12} sm={6}>
                <TextInput
                  label="Nombre"
                  value={formulario.nombre}
                  onChange={(event) => onChange('nombre', event.currentTarget.value)}
                  required
                />
              </Grid.Col>
              <Grid.Col span={12} sm={6}>
                <TextInput
                  label="Apellido"
                  value={formulario.apellido}
                  onChange={(event) => onChange('apellido', event.currentTarget.value)}
                  required
                />
              </Grid.Col>
              <Grid.Col span={12} sm={6}>
                <Select
                  label="Género"
                  data={generos.map(g => ({ value: String(g.genero_id), label: g.nombre }))}
                  value={formulario.genero}
                  onChange={(value) => onChange('genero', value)}
                  required
                />
              </Grid.Col>
              {formulario.genero === String(generos.find(g => g.nombre === 'Otro')?.genero_id) && (
                <Grid.Col span={12} sm={6}>
                  <TextInput
                    label="Especifique (Otro)"
                    value={formulario.genero_otro}
                    onChange={(event) => onChange('genero_otro', event.currentTarget.value)}
                  />
                </Grid.Col>
              )}
            </Grid>
          </Paper>

          <Paper withBorder p="md" radius="md">
            <Text weight={500} mb="md">Datos de Contacto y Domicilio</Text>
            <Grid>
              <Grid.Col span={12} sm={6}>
                <TextInput
                  label="Teléfono"
                  value={formulario.telefono}
                  onChange={(event) => onChange('telefono', event.currentTarget.value)}
                  required
                />
              </Grid.Col>
              <Grid.Col span={12} sm={6}>
                <TextInput
                  label="Email"
                  type="email"
                  value={formulario.email}
                  onChange={(event) => onChange('email', event.currentTarget.value)}
                  required
                />
              </Grid.Col>
              <Grid.Col span={8} sm={9}>
                <TextInput
                  label="Calle"
                  value={formulario.domicilio_calle}
                  onChange={(event) => onChange('domicilio_calle', event.currentTarget.value)}
                  required
                />
              </Grid.Col>
              <Grid.Col span={4} sm={3}>
                <TextInput
                  label="Número"
                  value={formulario.domicilio_numero}
                  onChange={(event) => onChange('domicilio_numero', event.currentTarget.value)}
                  required
                />
              </Grid.Col>
              <Grid.Col span={12} sm={6}>
                <TextInput
                  label="Entre calle 1"
                  value={formulario.domicilio_entre_calle_1}
                  onChange={(event) => onChange('domicilio_entre_calle_1', event.currentTarget.value)}
                />
              </Grid.Col>
              <Grid.Col span={12} sm={6}>
                <TextInput
                  label="Entre calle 2"
                  value={formulario.domicilio_entre_calle_2}
                  onChange={(event) => onChange('domicilio_entre_calle_2', event.currentTarget.value)}
                />
              </Grid.Col>
              <Grid.Col span={12} sm={6}>
                <TextInput
                  label="Barrio"
                  value={formulario.domicilio_barrio}
                  onChange={(event) => onChange('domicilio_barrio', event.currentTarget.value)}
                />
              </Grid.Col>
              <Grid.Col span={12} sm={6}>
                <Select
                  label="Localidad"
                  data={localidades.map(l => ({ value: String(l.localidad_id), label: l.nombre }))}
                  value={formulario.domicilio_localidad}
                  onChange={(value) => onChange('domicilio_localidad', value)}
                  required
                />
              </Grid.Col>
            </Grid>
          </Paper>

          {editing && (
            <Paper withBorder p="md" radius="md">
              <Text weight={500} mb="md">Estado Institucional</Text>
              <Select
                label="Estado"
                data={estadosSocio.map(e => ({ value: String(e.estado_id), label: e.nombre }))}
                value={formulario.estado_socio}
                onChange={(value) => onChange('estado_socio', value)}
                required
              />
            </Paper>
          )}

          {error && <Text color="red" size="sm">{error}</Text>}
          <Group position="right">
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

export default AddSocioModal