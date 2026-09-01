import { useMemo, useState } from 'react'
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Divider,
  Group,
  Modal,
  Paper,
  SegmentedControl,
  Select,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core'
import { IconAlertCircle, IconCheck, IconSearch, IconUserPlus } from '@tabler/icons-react'
import ContactoEmergenciaForm from './ContactoEmergenciaForm'
import { api } from '../../api/conf'

function AddJugadorModal({
  opened,
  onClose,
  onSubmit,
  formulario,
  onChange,
  socios = [],
  jugadores = [],
  categorias = [],
  estados = [],
  loading,
  error,
}) {
  const [buscandoPersona, setBuscandoPersona] = useState(false)
  const [personaEncontrada, setPersonaEncontrada] = useState(null)

  // Filtrar socios que NO tienen ya un jugador asignado
  const sociosConJugadorIds = useMemo(() => {
    return new Set(
      (jugadores || []).map((j) => String(j.socio?.socio_id)).filter(Boolean),
    )
  }, [jugadores])

  const sociosDisponiblesOptions = useMemo(() => {
    return socios
      .filter((s) => !sociosConJugadorIds.has(String(s.socio_id)))
      .map((socio) => ({
        value: String(socio.socio_id),
        label: `${socio.nombre} ${socio.apellido} - DNI ${socio.dni}`,
      }))
  }, [socios, sociosConJugadorIds])

  const categoriasOptions = useMemo(
    () =>
      categorias.map((categoria) => ({
        value: String(categoria.categoria_id),
        label: categoria.nombre,
      })),
    [categorias],
  )

  const estadosOptions = useMemo(
    () =>
      estados.map((estado) => ({
        value: String(estado.estado_id),
        label: estado.nombre,
      })),
    [estados],
  )

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
        
        const socioExistente = socios.find((s) => s.dni === p.dni)
        if (socioExistente) {
          if (sociosConJugadorIds.has(String(socioExistente.socio_id))) {
            setErrorBuscador('Esta persona ya tiene un jugador asignado.')
          } else {
            setErrorBuscador('Esta persona ya es socio. Cambiando a pestaña existente...')
            setTimeout(() => {
              onChange('modo_socio', 'existente')
              onChange('socio', String(socioExistente.socio_id))
              setErrorBuscador('')
            }, 1000)
          }
          return
        }

        onChange('nuevo_socio', {
          ...formulario.nuevo_socio,
          nombre: p.nombre,
          apellido: p.apellido,
          dni: p.dni,
          telefono: p.telefono,
          email: p.email || '',
        })
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

  const modoSocio = formulario.modo_socio || 'nuevo'

  return (
    <Modal opened={opened} onClose={onClose} title="Agregar jugador" size="lg">
      <form onSubmit={onSubmit}>
        <Stack spacing="md">
          {/* Selector de modo para el socio */}
          <SegmentedControl
            value={modoSocio}
            onChange={(val) => {
              setPersonaEncontrada(null)
              onChange('modo_socio', val)
            }}
            data={[
              { label: 'Registrar nuevo socio', value: 'nuevo' },
              { label: 'Socio existente', value: 'existente' },
            ]}
            fullWidth
            color="teal"
          />

          {modoSocio === 'existente' ? (
            <Stack spacing="xs">
              <Select
                label="Socio"
                placeholder="Seleccione el socio"
                searchable
                nothingFound="No se encontraron socios disponibles sin jugador"
                data={sociosDisponiblesOptions}
                value={formulario.socio}
                onChange={(value) => onChange('socio', value)}
                required
              />
              {sociosDisponiblesOptions.length === 0 && (
                <Text size="xs" color="dimmed">
                  Todos los socios registrados ya tienen un jugador asignado. Podés registrar un nuevo socio en la pestaña de arriba.
                </Text>
              )}
            </Stack>
          ) : (
            <Paper p="sm" withBorder radius="md" style={{ backgroundColor: 'var(--bg)' }}>
              <Stack spacing="xs">
                <Group position="apart">
                  <Text weight={600} size="sm">
                    Datos del nuevo socio / persona
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

                <Group grow align="flex-start">
                  <TextInput
                    label="DNI"
                    placeholder="Ej: 38123456"
                    value={formulario.nuevo_socio?.dni || ''}
                    onChange={(e) =>
                      onChange('nuevo_socio', {
                        ...formulario.nuevo_socio,
                        dni: e.currentTarget.value,
                      })
                    }
                    rightSection={
                      <Tooltip label="Buscar persona existente por DNI" withArrow position="top">
                        <ActionIcon
                          loading={buscandoPersona}
                          onClick={() => buscarPersonaPorDNI(formulario.nuevo_socio?.dni)}
                        >
                          <IconSearch size={16} />
                        </ActionIcon>
                      </Tooltip>
                    }
                    required
                  />
                  <TextInput
                    label="Teléfono"
                    placeholder="Ej: 2214567890"
                    value={formulario.nuevo_socio?.telefono || ''}
                    onChange={(e) =>
                      onChange('nuevo_socio', {
                        ...formulario.nuevo_socio,
                        telefono: e.currentTarget.value,
                      })
                    }
                    required
                  />
                </Group>

                <Group grow>
                  <TextInput
                    label="Nombre"
                    value={formulario.nuevo_socio?.nombre || ''}
                    onChange={(e) =>
                      onChange('nuevo_socio', {
                        ...formulario.nuevo_socio,
                        nombre: e.currentTarget.value,
                      })
                    }
                    required
                  />
                  <TextInput
                    label="Apellido"
                    value={formulario.nuevo_socio?.apellido || ''}
                    onChange={(e) =>
                      onChange('nuevo_socio', {
                        ...formulario.nuevo_socio,
                        apellido: e.currentTarget.value,
                      })
                    }
                    required
                  />
                </Group>

                <TextInput
                  label="Email"
                  type="email"
                  placeholder="ejemplo@email.com"
                  value={formulario.nuevo_socio?.email || ''}
                  onChange={(e) =>
                    onChange('nuevo_socio', {
                      ...formulario.nuevo_socio,
                      email: e.currentTarget.value,
                    })
                  }
                  required
                />
              </Stack>
            </Paper>
          )}

          <Divider label="Información deportiva" labelPosition="center" my="xs" />

          <Group grow>
            <Select
              label="Categoría"
              placeholder="Seleccione la categoría"
              data={categoriasOptions}
              value={formulario.categoria}
              onChange={(value) => onChange('categoria', value)}
              required
            />
            <Select
              label="Estado deportivo"
              placeholder="Seleccione el estado deportivo"
              data={estadosOptions}
              value={formulario.estado}
              onChange={(value) => onChange('estado', value)}
              required
            />
          </Group>

          <Group grow>
            <TextInput
              label="Obra social"
              placeholder="Ej: OSDE, IOMA, Ninguna"
              value={formulario.obra_social || ''}
              onChange={(event) => onChange('obra_social', event.currentTarget.value)}
            />
            <TextInput
              label="Talla de indumentaria"
              placeholder="Ej: Remera L Short M"
              value={formulario.tallaIndumentaria || ''}
              onChange={(event) => onChange('tallaIndumentaria', event.currentTarget.value)}
            />
          </Group>

          <Divider label="Contactos de emergencia" labelPosition="center" my="xs" />

          <ContactoEmergenciaForm
            contactos={formulario.contactos_emergencia || []}
            onChange={(value) => onChange('contactos_emergencia', value)}
          />

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
              Guardar jugador
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

export default AddJugadorModal
