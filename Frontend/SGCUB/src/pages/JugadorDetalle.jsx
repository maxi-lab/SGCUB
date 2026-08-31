import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Alert,
  Badge,
  Button,
  Card,
  Divider,
  Grid,
  Group,
  Loader,
  Paper,
  SimpleGrid,
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import {
  IconAlertCircle,
  IconArrowLeft,
  IconEdit,
  IconHeartbeat,
  IconId,
  IconMail,
  IconPhone,
  IconShirt,
  IconTrash,
  IconUser,
  IconUsers,
} from '@tabler/icons-react'
import { deleteJugador, getJugador, patchJugador } from '../api/jugadores'
import DeleteJugadorModal from '../components/jugadores/DeleteJugadorModal'
import EditJugadorModal from '../components/jugadores/EditJugadorModal'
import useCategorias from '../hooks/useCategorias'
import useEstados from '../hooks/useEstados'
import useJugadores from '../hooks/useJugadores'
import useSocio from '../hooks/useSocio'

const formularioInicial = (jugador) => {
  if (!jugador) {
    return {
      socio: '',
      nuevo_socio: {
        nombre: '',
        apellido: '',
        dni: '',
        telefono: '',
        email: '',
      },
      categoria: '',
      estado: '',
      obra_social: '',
      tallaIndumentaria: '',
      contactos_emergencia: [],
    }
  }

  return {
    socio: String(jugador.socio?.socio_id ?? ''),
    nuevo_socio: {
      nombre: jugador.socio?.nombre ?? '',
      apellido: jugador.socio?.apellido ?? '',
      dni: jugador.socio?.dni ?? '',
      telefono: jugador.socio?.telefono ?? '',
      email: jugador.socio?.email ?? '',
    },
    categoria: String(jugador.categoria?.categoria_id ?? ''),
    estado: String(jugador.estado?.estado_id ?? ''),
    obra_social: jugador.obra_social ?? '',
    tallaIndumentaria: jugador.tallaIndumentaria ?? '',
    contactos_emergencia: (jugador.contactos_emergencia ?? []).map((c) => ({
      contacto_emergencia_id: c.contacto_emergencia_id,
      persona: {
        nombre: c.persona?.nombre ?? '',
        apellido: c.persona?.apellido ?? '',
        dni: c.persona?.dni ?? '',
        telefono: c.persona?.telefono ?? '',
        email: c.persona?.email ?? null,
      },
      relacion: c.relacion ?? '',
      responsable_legal: Boolean(c.responsable_legal),
    })),
  }
}

function JugadorDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [jugador, setJugador] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Opciones para edición
  const { socios } = useSocio()
  const { jugadores } = useJugadores()
  const { categorias } = useCategorias()
  const { estados } = useEstados()

  // Estados de modales
  const [modalEdicionAbierto, setModalEdicionAbierto] = useState(false)
  const [guardandoEdicion, setGuardandoEdicion] = useState(false)
  const [errorEdicion, setErrorEdicion] = useState('')
  const [formulario, setFormulario] = useState(() => formularioInicial(null))

  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminacion, setErrorEliminacion] = useState('')

  const cargarDetalle = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getJugador(id)
      setJugador(data)
    } catch (err) {
      setError(
        err.response?.data?.detail || 'No se pudo cargar la información del jugador.',
      )
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    cargarDetalle()
  }, [cargarDetalle])

  const actualizarCampo = (campo, valor) =>
    setFormulario((actual) => ({ ...actual, [campo]: valor }))

  const abrirModalEdicion = () => {
    setErrorEdicion('')
    setFormulario(formularioInicial(jugador))
    setModalEdicionAbierto(true)
  }

  const guardarEdicion = async (event) => {
    event.preventDefault()
    setGuardandoEdicion(true)
    setErrorEdicion('')

    const payload = {
      socio: formulario.socio,
      categoria: formulario.categoria,
      estado: formulario.estado,
      obra_social: formulario.obra_social,
      tallaIndumentaria: formulario.tallaIndumentaria,
      contactos_emergencia: formulario.contactos_emergencia,
    }

    try {
      const actualizado = await patchJugador(jugador.jugador_id, payload)
      setJugador(actualizado)
      setModalEdicionAbierto(false)
    } catch (requestError) {
      const errorData = requestError.response?.data
      let errorMsg = 'No se pudo editar el jugador.'
      if (errorData) {
        if (typeof errorData === 'string') {
          errorMsg = errorData
        } else if (errorData.detail) {
          errorMsg = errorData.detail
        } else {
          errorMsg = Object.entries(errorData)
            .map(
              ([k, v]) =>
                `${k}: ${
                  Array.isArray(v)
                    ? v.join(' ')
                    : typeof v === 'object'
                      ? JSON.stringify(v)
                      : v
                }`,
            )
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
      await deleteJugador(jugador.jugador_id)
      setModalEliminarAbierto(false)
      navigate('/padron/jugadores')
    } catch (requestError) {
      setErrorEliminacion(
        requestError.response?.data?.detail || 'No se pudo eliminar el jugador.',
      )
    } finally {
      setEliminando(false)
    }
  }

  if (loading) {
    return (
      <Paper p="xl" withBorder style={{ textAlign: 'center' }}>
        <Loader color="teal" size="lg" variant="dots" />
        <Text mt="md" color="dimmed">
          Cargando detalle del jugador...
        </Text>
      </Paper>
    )
  }

  if (error || !jugador) {
    return (
      <Stack spacing="md">
        <Button
          variant="subtle"
          leftIcon={<IconArrowLeft size={16} />}
          onClick={() => navigate('/padron/jugadores')}
          compact
          style={{ alignSelf: 'flex-start' }}
        >
          Volver a Jugadores
        </Button>
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Error"
          color="red"
          variant="filled"
        >
          {error || 'El jugador solicitado no existe o no se pudo encontrar.'}
        </Alert>
      </Stack>
    )
  }

  const nombreCompleto =
    `${jugador.socio?.nombre ?? ''} ${jugador.socio?.apellido ?? ''}`.trim() ||
    'Sin nombre'

  return (
    <Stack spacing="lg">
      {/* Botón Volver y Barra Superior de Acciones */}
      <Group position="apart" align="center">
        <Button
          variant="subtle"
          leftIcon={<IconArrowLeft size={18} />}
          onClick={() => navigate('/padron/jugadores')}
          color="gray"
        >
          Volver a Jugadores
        </Button>

        <Group spacing="sm">
          <Button
            leftIcon={<IconEdit size={16} />}
            color="teal"
            onClick={abrirModalEdicion}
          >
            Editar jugador
          </Button>
          <Button
            leftIcon={<IconTrash size={16} />}
            color="red"
            variant="light"
            onClick={() => {
              setErrorEliminacion('')
              setModalEliminarAbierto(true)
            }}
          >
            Eliminar
          </Button>
        </Group>
      </Group>

      {/* Tarjeta Principal de Cabecera */}
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
                DNI: {jugador.socio?.dni || 'No registrado'}
              </Text>
            </div>
          </Group>

          <Group spacing="xs">
            {jugador.categoria?.nombre && (
              <Badge size="lg" variant="light" color="blue">
                {jugador.categoria.nombre}
              </Badge>
            )}
            {jugador.estado?.nombre && (
              <Badge
                size="lg"
                variant="filled"
                color={
                  jugador.estado.nombre.toLowerCase().includes('activo') ? 'teal' : 'gray'
                }
              >
                {jugador.estado.nombre}
              </Badge>
            )}
          </Group>
        </Group>
      </Paper>

      {/* Grid de Secciones */}
      <Grid gutter="md">
        {/* Columna 1: Información del Socio */}
        <Grid.Col span={12} md={6}>
          <Card shadow="xs" p="lg" radius="md" withBorder style={{ height: '100%' }}>
            <Group spacing="xs" mb="md">
              <ThemeIcon color="teal" variant="light" size="md">
                <IconId size={18} />
              </ThemeIcon>
              <Text weight={600} size="md">
                Datos del Socio
              </Text>
            </Group>
            <Divider mb="md" />

            <Stack spacing="sm">
              <Group position="apart">
                <Text size="sm" color="dimmed">
                  Nombre completo:
                </Text>
                <Text size="sm" weight={500}>
                  {nombreCompleto}
                </Text>
              </Group>

              <Group position="apart">
                <Text size="sm" color="dimmed">
                  DNI:
                </Text>
                <Text size="sm" weight={500}>
                  {jugador.socio?.dni || '-'}
                </Text>
              </Group>

              <Group position="apart">
                <Text size="sm" color="dimmed">
                  Teléfono:
                </Text>
                <Group spacing={6}>
                  <IconPhone size={14} color="gray" />
                  <Text size="sm" weight={500}>
                    {jugador.socio?.telefono || 'No registrado'}
                  </Text>
                </Group>
              </Group>

              <Group position="apart">
                <Text size="sm" color="dimmed">
                  Email:
                </Text>
                <Group spacing={6}>
                  <IconMail size={14} color="gray" />
                  <Text size="sm" weight={500}>
                    {jugador.socio?.email || 'No registrado'}
                  </Text>
                </Group>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>

        {/* Columna 2: Datos Deportivos y Médicos */}
        <Grid.Col span={12} md={6}>
          <Card shadow="xs" p="lg" radius="md" withBorder style={{ height: '100%' }}>
            <Group spacing="xs" mb="md">
              <ThemeIcon color="teal" variant="light" size="md">
                <IconShirt size={18} />
              </ThemeIcon>
              <Text weight={600} size="md">
                Información Deportiva y Médica
              </Text>
            </Group>
            <Divider mb="md" />

            <Stack spacing="sm">
              <Group position="apart">
                <Text size="sm" color="dimmed">
                  Categoría:
                </Text>
                <Text size="sm" weight={500}>
                  {jugador.categoria?.nombre || '-'}
                </Text>
              </Group>

              <Group position="apart">
                <Text size="sm" color="dimmed">
                  Estado Deportivo:
                </Text>
                <Text size="sm" weight={500}>
                  {jugador.estado?.nombre || '-'}
                </Text>
              </Group>

              <Group position="apart">
                <Text size="sm" color="dimmed">
                  Obra Social:
                </Text>
                <Text size="sm" weight={500}>
                  {jugador.obra_social || 'No especificada'}
                </Text>
              </Group>

              <Group position="apart">
                <Text size="sm" color="dimmed">
                  Talla de Indumentaria:
                </Text>
                <Text size="sm" weight={500}>
                  {jugador.tallaIndumentaria || 'No especificada'}
                </Text>
              </Group>
            </Stack>
          </Card>
        </Grid.Col>

        {/* Sección: Contactos de Emergencia */}
        <Grid.Col span={12}>
          <Card shadow="xs" p="lg" radius="md" withBorder>
            <Group position="apart" mb="md">
              <Group spacing="xs">
                <ThemeIcon color="teal" variant="light" size="md">
                  <IconHeartbeat size={18} />
                </ThemeIcon>
                <Text weight={600} size="md">
                  Contactos de Emergencia
                </Text>
              </Group>
              <Badge color="gray" variant="light">
                {jugador.contactos_emergencia?.length || 0} registrados
              </Badge>
            </Group>
            <Divider mb="md" />

            {!jugador.contactos_emergencia ||
            jugador.contactos_emergencia.length === 0 ? (
              <Text color="dimmed" size="sm" align="center" py="md">
                No hay contactos de emergencia registrados para este jugador.
              </Text>
            ) : (
              <SimpleGrid
                cols={2}
                breakpoints={[{ maxWidth: 'sm', cols: 1 }]}
                spacing="md"
              >
                {jugador.contactos_emergencia.map((contacto, idx) => (
                  <Paper
                    key={contacto.contacto_emergencia_id ?? idx}
                    p="md"
                    radius="md"
                    withBorder
                    style={{ backgroundColor: 'var(--bg)' }}
                  >
                    <Group position="apart" mb="xs">
                      <Group spacing="xs">
                        <ThemeIcon color="teal" size="sm" variant="subtle">
                          <IconUsers size={16} />
                        </ThemeIcon>
                        <Text weight={600} size="sm">
                          {contacto.persona?.nombre} {contacto.persona?.apellido}
                        </Text>
                      </Group>
                      <Group spacing={4}>
                        {contacto.relacion && (
                          <Badge size="sm" variant="outline" color="teal">
                            {contacto.relacion}
                          </Badge>
                        )}
                        {contacto.responsable_legal && (
                          <Badge size="sm" variant="filled" color="indigo">
                            Responsable Legal
                          </Badge>
                        )}
                      </Group>
                    </Group>

                    <Stack spacing={4} mt="xs">
                      <Group spacing="xs">
                        <Text size="xs" color="dimmed">
                          DNI:
                        </Text>
                        <Text size="xs" weight={500}>
                          {contacto.persona?.dni || '-'}
                        </Text>
                      </Group>

                      <Group spacing="xs">
                        <Text size="xs" color="dimmed">
                          Teléfono:
                        </Text>
                        <Text size="xs" weight={500}>
                          {contacto.persona?.telefono || '-'}
                        </Text>
                      </Group>

                      {contacto.persona?.email && (
                        <Group spacing="xs">
                          <Text size="xs" color="dimmed">
                            Email:
                          </Text>
                          <Text size="xs" weight={500}>
                            {contacto.persona.email}
                          </Text>
                        </Group>
                      )}
                    </Stack>
                  </Paper>
                ))}
              </SimpleGrid>
            )}
          </Card>
        </Grid.Col>
      </Grid>

      {/* Modal de Edición */}
      <EditJugadorModal
        opened={modalEdicionAbierto}
        onClose={() => !guardandoEdicion && setModalEdicionAbierto(false)}
        onSubmit={guardarEdicion}
        formulario={formulario}
        onChange={actualizarCampo}
        socios={socios}
        jugadores={jugadores}
        categorias={categorias}
        estados={estados}
        loading={guardandoEdicion}
        error={errorEdicion}
      />

      {/* Modal de Eliminación */}
      <DeleteJugadorModal
        opened={modalEliminarAbierto}
        onClose={() => !eliminando && setModalEliminarAbierto(false)}
        onConfirm={confirmarEliminacion}
        jugador={jugador}
        loading={eliminando}
        error={errorEliminacion}
      />
    </Stack>
  )
}

export default JugadorDetalle
