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
  Stack,
  Text,
  ThemeIcon,
  Title,
} from '@mantine/core'
import { IconAlertCircle, IconArrowLeft, IconEdit, IconId, IconShirt, IconTrash, IconUser, IconUserPlus } from '@tabler/icons-react'
import { deleteCategoria, getCategoria, patchCategoria } from '../api/categorias'
import { deleteDocenteCategoria, docenteCategoriaByCategoria, postDocenteCategoria } from '../api/docenteCategoria'
import DeleteCategoriaModal from '../components/categorias/DeleteCategoriaModal'
import AddCategoriaModal from '../components/categorias/AddCategoriaModal'
import AsignarDocenteModal from '../components/categorias/AsignarDocenteModal'
import useCategorias from '../hooks/useCategorias'
import useDocentes from '../hooks/useDocentes'
import CategoriaDocenteTable from '../components/categorias/CategoriaDocenteTable'

const formularioInicial = (categoria, docenteCategorias = []) => {
  if (!categoria) {
    return {
      nombre: '',
      anio_vigente: '',
      edad_minima: '',
      edad_maxima: '',
      genero: "",
      docentes: [],
    }
  }

  return {
    nombre: categoria.nombre ?? '',
    anio_vigente: categoria.anio_vigente ?? '',
    edad_minima: categoria.edad_minima ?? '',
    edad_maxima: categoria.edad_maxima ?? '',
    genero: categoria.genero ?? '',
    docentes: docenteCategorias.map((dc) => dc.docente),
  }
}

function CategoriaDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [categoria, setCategoria] = useState(null)
  const [docenteCategorias, setDocenteCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Opciones para edición
  const { categorias } = useCategorias()
  const { docentes } = useDocentes()
  // Estados de modales
  const [modalEdicionAbierto, setModalEdicionAbierto] = useState(false)
  const [guardandoEdicion, setGuardandoEdicion] = useState(false)
  const [errorEdicion, setErrorEdicion] = useState('')
  const [formulario, setFormulario] = useState(() => formularioInicial(null))

  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminacion, setErrorEliminacion] = useState('')
  const [modalAsignarAbierto, setModalAsignarAbierto] = useState(false)
  const [docenteAsignando, setDocenteAsignando] = useState(null)
  const [errorAsignacion, setErrorAsignacion] = useState('')

  const cargarDetalle = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getCategoria(id)
      setCategoria(data)
    } catch (err) {
      setError(
        err.response?.data?.detail || 'No se pudo cargar la información de la categoría.',
      )
    } finally {
      setLoading(false)
    }
  }, [id])

  const cargarDocenteCategorias = useCallback(async () => {
    try {
      setDocenteCategorias(await docenteCategoriaByCategoria(id))
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'No se pudieron cargar los docentes asociados.')
    }
  }, [id])

  useEffect(() => {
    cargarDetalle()
    cargarDocenteCategorias()
  }, [cargarDetalle, cargarDocenteCategorias])

  const actualizarCampo = (campo, valor) =>
    setFormulario((actual) => ({ ...actual, [campo]: valor }))

  const abrirModalEdicion = () => {
    setErrorEdicion('')
    setFormulario(formularioInicial(categoria, docenteCategorias))
    setModalEdicionAbierto(true)
  }

  const handleDeleteDocenteCategoria = async (docenteCategoriaId) => {
    try {
      await deleteDocenteCategoria(docenteCategoriaId)
      await cargarDocenteCategorias()
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'No se pudo eliminar la asociación.')
    }
  }

  const asignarDocente = async (docente) => {
    setDocenteAsignando(docente.docente_id)
    setErrorAsignacion('')
    try {
      await postDocenteCategoria({
        docente_id: docente.docente_id,
        categoria_id: categoria.categoria_id,
      })
      await cargarDocenteCategorias()
    } catch (requestError) {
      setErrorAsignacion(
        requestError.response?.data?.detail || 'No se pudo asignar el docente a la categoría.',
      )
    } finally {
      setDocenteAsignando(null)
    }
  }

  const guardarEdicion = async (event) => {
    event.preventDefault()
    setGuardandoEdicion(true)
    setErrorEdicion('')

    const payload = {
      nombre: formulario.nombre,
      anio_vigente: formulario.anio_vigente,
      edad_minima: formulario.edad_minima,
      edad_maxima: formulario.edad_maxima,
      genero: formulario.genero,
      docentes: formulario.docentes.map((docente) => docente.docente_id), // Solo enviar los IDs de los docentes
    }

    try {
      const actualizado = await patchCategoria(categoria.categoria_id, payload)
      setCategoria(actualizado)
      setModalEdicionAbierto(false)
    } catch (requestError) {
      const errorData = requestError.response?.data
      let errorMsg = 'No se pudo editar la categoría.'
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
      await deleteCategoria(categoria.categoria_id)
      setModalEliminarAbierto(false)
      navigate('/padron/categorias')
    } catch (requestError) {
      setErrorEliminacion(
        requestError.response?.data?.detail || 'No se pudo eliminar la categoría.',
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
          Cargando detalle de la categoría...
        </Text>
      </Paper>
    )
  }

  if (error || !categoria) {
    return (
      <Stack spacing="md">
        <Button
          variant="subtle"
          leftIcon={<IconArrowLeft size={16} />}
          onClick={() => navigate('/padron/categorias')}
          compact
          style={{ alignSelf: 'flex-start' }}
        >
          Volver a Categorías
        </Button>
        <Alert
          icon={<IconAlertCircle size={16} />}
          title="Error"
          color="red"
          variant="filled"
        >
          {error || 'La categoría solicitada no existe o no se pudo encontrar.'}
        </Alert>
      </Stack>
    )
  }

  return (
    <Stack spacing="lg">
      {/* Botón Volver y Barra Superior de Acciones */}
      <Group position="apart" align="center">
        <Button
          variant="subtle"
          leftIcon={<IconArrowLeft size={18} />}
          onClick={() => navigate('/padron/categorias')}
          color="gray"
        >
          Volver a Categorías
        </Button>

        <Group spacing="sm">
          <Button
            leftIcon={<IconUserPlus size={16} />}
            color="blue"
            variant="light"
            onClick={() => {
              setErrorAsignacion('')
              setModalAsignarAbierto(true)
            }}
          >
            Asignar docente
          </Button>
          <Button
            leftIcon={<IconEdit size={16} />}
            color="teal"
            onClick={abrirModalEdicion}
          >
            Editar categoría
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
                {categoria.nombre || 'Categoría sin nombre'}
              </Title>
            </div>
          </Group>

          <Group spacing="xs">
            {categoria.genero && (
              <Badge
                size="lg"
                variant="filled"
                color={categoria.genero === 'M' ? 'blue' : 'pink'}
              >
                {categoria.genero === 'M' ? 'Masculino' : 'Femenino'}
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
                Datos de la Categoría
              </Text>
            </Group>
            <Divider mb="md" />

            <Stack spacing="sm">
              <Group position="apart">
                <Text size="sm" color="dimmed">
                  Año vigente:
                </Text>
                <Text size="sm" weight={500}>
                  {categoria.anio_vigente || 'Categoría sin año vigente'}
                </Text>
              </Group>

              <Group position="apart">
                <Text size="sm" color="dimmed">
                  Edad máxima:
                </Text>
                <Group spacing={6}>
                  <Text size="sm" weight={500}>
                    {categoria.edad_maxima !== null ? categoria.edad_maxima : 'No especificada'}
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
                Docentes Asociados
              </Text>
            </Group>
            <Divider mb="md" />

            <Stack spacing="sm">
              <CategoriaDocenteTable
                docenteCategorias={docenteCategorias}
                onDelete={handleDeleteDocenteCategoria}
              />
              {errorAsignacion && (
                <Alert color="red" variant="light">
                  {errorAsignacion}
                </Alert>
              )}
            </Stack>
          </Card>
        </Grid.Col>

        {/* Sección: Contactos de Emergencia */}
    {/*<Grid.Col span={12}>
          <Card shadow="xs" p="lg" radius="md" withBorder>
            <Group position="apart" mb="md">
              <Group spacing="xs">
                <ThemeIcon color="teal" variant="light" size="md">
                  <IconHeartbeat size={18} />
                </ThemeIcon>
                <Text weight={600} size="md">
                  Jugadores Asociados
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
        </Grid.Col>*/}
      </Grid>

      {/* Modal de Edición */}
      <AddCategoriaModal
        opened={modalEdicionAbierto}
        onClose={() => !guardandoEdicion && setModalEdicionAbierto(false)}
        onSubmit={guardarEdicion}
        formulario={formulario}
        onChange={actualizarCampo}
        categorias={categorias}
        loading={guardandoEdicion}
        error={errorEdicion}
      />

      {/* Modal de Eliminación */}
      <DeleteCategoriaModal
        opened={modalEliminarAbierto}
        onClose={() => !eliminando && setModalEliminarAbierto(false)}
        onConfirm={confirmarEliminacion}
        categoria={categoria}
        loading={eliminando}
        error={errorEliminacion}
      />

      <AsignarDocenteModal
        opened={modalAsignarAbierto}
        onClose={() => !docenteAsignando && setModalAsignarAbierto(false)}
        docentes={docentes}
        docentesAsignados={docenteCategorias}
        onAssign={asignarDocente}
        loading={docenteAsignando}
      />
    </Stack>
  )
}
export default CategoriaDetalle