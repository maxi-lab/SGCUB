import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Button,
  Card,
  Divider,
  Grid,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Badge,
} from '@mantine/core'
import {
  IconAlertCircle,
  IconArrowLeft,
  IconEdit,
  IconId,
  IconMail,
  IconPhone,
  IconTrash,
  IconUser,
  IconCalendar,
  IconMapPin
} from '@tabler/icons-react'
import { api } from '../api/conf'
import DeleteSocioModal from '../components/socios/DeleteSocioModal'
import AddSocioModal from '../components/socios/AddSocioModal'
import useGeneros from '../hooks/useGeneros'
import useLocalidades from '../hooks/useLocalidades'
import useSocio from '../hooks/useSocio'

function SocioDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [socio, setSocio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const { generos } = useGeneros()
  const { localidades } = useLocalidades()
  const { modificarSocio, eliminarSocio } = useSocio()

  const [modalEdicionAbierto, setModalEdicionAbierto] = useState(false)
  const [guardandoEdicion, setGuardandoEdicion] = useState(false)
  const [errorEdicion, setErrorEdicion] = useState('')
  const [formulario, setFormulario] = useState({})

  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminacion, setErrorEliminacion] = useState('')

  const [estadosSocio, setEstadosSocio] = useState([])

  useEffect(() => {
    api.get('padron/estado-socio/').then((res) => setEstadosSocio(res.data)).catch(console.error)
  }, [])

  const cargarDetalle = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get(`padron/socio/${id}/`)
      setSocio(response.data)
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'Error al cargar el detalle del socio.')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    cargarDetalle()
  }, [cargarDetalle])

  const abrirModalEdicion = () => {
    setErrorEdicion('')
    setFormulario({
      nombre: socio.nombre || '',
      apellido: socio.apellido || '',
      dni: socio.dni || '',
      telefono: socio.telefono || '',
      email: socio.email || '',
      estado_socio: socio.estado_socio ? String(socio.estado_socio) : '',
      fecha_nacimiento: socio.fecha_nacimiento || '',
      genero: socio.genero ? String(socio.genero) : '',
      genero_otro: socio.genero_otro || '',
      domicilio_calle: socio.domicilio_calle || '',
      domicilio_numero: socio.domicilio_numero || '',
      domicilio_piso: socio.domicilio_piso || '',
      domicilio_departamento: socio.domicilio_departamento || '',
      domicilio_entre_calle_1: socio.domicilio_entre_calle_1 || '',
      domicilio_entre_calle_2: socio.domicilio_entre_calle_2 || '',
      domicilio_barrio: socio.domicilio_barrio || '',
      domicilio_localidad: socio.domicilio_localidad ? String(socio.domicilio_localidad) : ''
    })
    setModalEdicionAbierto(true)
  }

  const guardarEdicion = async (e) => {
    e.preventDefault()
    setGuardandoEdicion(true)
    setErrorEdicion('')
    try {
      const actualizado = await modificarSocio(socio.socio_id, formulario)
      setSocio(actualizado)
      setModalEdicionAbierto(false)
    } catch (requestError) {
      const errorData = requestError.response?.data
      let errorMsg = 'No se pudo editar el socio.'
      if (errorData) {
        if (typeof errorData === 'string') {
          errorMsg = errorData
        } else if (errorData.detail) {
          errorMsg = errorData.detail
        } else {
          errorMsg = Object.entries(errorData)
            .map(([k, v]) => {
              if (Array.isArray(v)) {
                return `${k}: ${v.map(item => typeof item === 'object' ? JSON.stringify(item) : item).join(', ')}`
              }
              return `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`
            })
            .join(' | ')
        }
      }
      setErrorEdicion(errorMsg)
    } finally {
      setGuardandoEdicion(false)
    }
  }

  const confirmarEliminacion = async () => {
    setEliminando(true)
    setErrorEliminacion('')
    try {
      await eliminarSocio(socio.socio_id)
      setModalEliminarAbierto(false)
      navigate('/padron/socios')
    } catch (requestError) {
      setErrorEliminacion(requestError.response?.data?.detail || 'No se pudo eliminar el socio.')
    } finally {
      setEliminando(false)
    }
  }

  if (loading) {
    return (
      <Paper p="xl" withBorder style={{ textAlign: 'center' }}>
        <Loader color="teal" size="lg" variant="dots" />
        <Text mt="md" color="dimmed">
          Cargando detalle del socio...
        </Text>
      </Paper>
    )
  }

  if (error || !socio) {
    return (
      <Stack spacing="md">
        <Button
          variant="subtle"
          leftIcon={<IconArrowLeft size={16} />}
          onClick={() => navigate('/padron/socios')}
          compact
          style={{ alignSelf: 'flex-start' }}
        >
          Volver a Padrón
        </Button>
        <Alert icon={<IconAlertCircle size={16} />} title="Error" color="red" variant="filled">
          {error || 'El socio solicitado no existe.'}
        </Alert>
      </Stack>
    )
  }

  const nombreCompleto = `${socio.nombre ?? ''} ${socio.apellido ?? ''}`.trim() || 'Sin nombre'
  const isActivo = socio.estado_socio_nombre?.toLowerCase().includes('activo')

  return (
    <Stack spacing="lg">
      <Group position="apart" align="center">
        <Button
          variant="subtle"
          leftIcon={<IconArrowLeft size={18} />}
          onClick={() => navigate('/padron/socios')}
          color="gray"
        >
          Volver a Padrón
        </Button>
        <Group spacing="sm">
          <Button leftIcon={<IconEdit size={16} />} color="teal" onClick={abrirModalEdicion}>
            Editar socio
          </Button>
          <Button leftIcon={<IconTrash size={16} />} color="red" variant="light" onClick={() => setModalEliminarAbierto(true)}>
            Eliminar
          </Button>
        </Group>
      </Group>

      <Paper p="md" radius="md" withBorder style={{ backgroundColor: 'var(--surface)' }}>
        <Group position="apart" align="flex-start">
          <Group spacing="md">
            <ThemeIcon size={56} radius="xl" color="teal" variant="light">
              <IconUser size={30} />
            </ThemeIcon>
            <div>
              <Title order={2} style={{ margin: 0, fontSize: '1.6rem' }}>
                {nombreCompleto}
              </Title>
              <Text size="sm" color="dimmed" mt={2}>
                N° Socio: {socio.numero_socio || '-'} | DNI: {socio.dni || 'No registrado'}
              </Text>
            </div>
          </Group>
          <Group spacing="xs">
            {socio.estado_socio_nombre && (
              <Badge size="lg" variant="filled" color={isActivo ? 'teal' : 'gray'}>
                {socio.estado_socio_nombre}
              </Badge>
            )}
          </Group>
        </Group>
      </Paper>

      <Grid gutter="md">
        <Grid.Col span={12} md={6}>
          <Card shadow="xs" p="lg" radius="md" withBorder style={{ height: '100%' }}>
            <Group spacing="xs" mb="md">
              <ThemeIcon color="teal" variant="light" size="md">
                <IconId size={18} />
              </ThemeIcon>
              <Text weight={600} size="md">Datos Personales</Text>
            </Group>
            <Divider mb="md" />
            <Stack spacing="sm">
              <Group position="apart">
                <Text size="sm" color="dimmed">Nombre completo:</Text>
                <Text size="sm" weight={500}>{nombreCompleto}</Text>
              </Group>
              <Group position="apart">
                <Text size="sm" color="dimmed">DNI:</Text>
                <Text size="sm" weight={500}>{socio.dni || '-'}</Text>
              </Group>
              <Group position="apart">
                <Text size="sm" color="dimmed">Nacimiento:</Text>
                <Text size="sm" weight={500}>
                  {socio.fecha_nacimiento 
                    ? `${new Date(socio.fecha_nacimiento + 'T00:00:00').toLocaleDateString('es-AR')} (${Math.floor((new Date() - new Date(socio.fecha_nacimiento + 'T00:00:00')) / 3.15576e+10)} años)` 
                    : 'No registrado'}
                </Text>
              </Group>
              <Group position="apart">
                <Text size="sm" color="dimmed">Género:</Text>
                <Text size="sm" weight={500}>
                  {socio.genero
                    ? generos.find((g) => g.genero_id === socio.genero)?.nombre === 'Otro'
                      ? socio.genero_otro || 'Otro'
                      : generos.find((g) => g.genero_id === socio.genero)?.nombre || 'Registrado'
                    : 'No registrado'}
                </Text>
              </Group>
              <Group position="apart">
                <Text size="sm" color="dimmed">Fecha de Alta:</Text>
                <Text size="sm" weight={500}>
                  {socio.fecha_alta ? new Date(socio.fecha_alta + 'T00:00:00').toLocaleDateString('es-AR') : 'No registrado'}
                </Text>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>

        <Grid.Col span={12} md={6}>
          <Card shadow="xs" p="lg" radius="md" withBorder style={{ height: '100%' }}>
            <Group spacing="xs" mb="md">
              <ThemeIcon color="blue" variant="light" size="md">
                <IconMapPin size={18} />
              </ThemeIcon>
              <Text weight={600} size="md">Contacto y Domicilio</Text>
            </Group>
            <Divider mb="md" />
            <Stack spacing="sm">
              <Group position="apart">
                <Text size="sm" color="dimmed">Teléfono:</Text>
                <Group spacing={6}>
                  <IconPhone size={14} color="gray" />
                  <Text size="sm" weight={500}>{socio.telefono || 'No registrado'}</Text>
                </Group>
              </Group>
              <Group position="apart">
                <Text size="sm" color="dimmed">Email:</Text>
                <Group spacing={6}>
                  <IconMail size={14} color="gray" />
                  <Text size="sm" weight={500}>{socio.email || 'No registrado'}</Text>
                </Group>
              </Group>
              <Group position="apart">
                <Text size="sm" color="dimmed">Domicilio:</Text>
                <Text size="sm" weight={500} align="right">
                  {socio.domicilio_calle
                    ? `${socio.domicilio_calle} ${socio.domicilio_numero || ''}${socio.domicilio_piso ? ` Piso ${socio.domicilio_piso}` : ''}${socio.domicilio_departamento ? ` Depto ${socio.domicilio_departamento}` : ''}${socio.domicilio_barrio ? `, B° ${socio.domicilio_barrio}` : ''}${socio.domicilio_localidad ? ` - ${localidades.find(l => l.localidad_id === socio.domicilio_localidad)?.nombre || ''}` : ''}`
                    : 'No registrado'}
                </Text>
              </Group>
              <Group position="apart">
                <Text size="sm" color="dimmed">Entre calles:</Text>
                <Text size="sm" weight={500} align="right">
                  {socio.domicilio_entre_calle_1 || socio.domicilio_entre_calle_2
                    ? `${socio.domicilio_entre_calle_1 || ''} y ${socio.domicilio_entre_calle_2 || ''}`
                    : '-'}
                </Text>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>
      </Grid>

      <AddSocioModal
        opened={modalEdicionAbierto}
        onClose={() => !guardandoEdicion && setModalEdicionAbierto(false)}
        onSubmit={guardarEdicion}
        formulario={formulario}
        onChange={(campo, valor) => setFormulario((act) => ({ ...act, [campo]: valor }))}
        loading={guardandoEdicion}
        error={errorEdicion}
        editing={true}
        estadosSocio={estadosSocio}
        generos={generos}
        localidades={localidades}
      />

      <DeleteSocioModal
        opened={modalEliminarAbierto}
        onClose={() => !eliminando && setModalEliminarAbierto(false)}
        onConfirm={confirmarEliminacion}
        loading={eliminando}
        error={errorEliminacion}
      />
    </Stack>
  )
}

export default SocioDetalle
