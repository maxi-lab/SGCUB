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
import CategoriaFormModal from '../components/categorias/CategoriaFormModal'
import ConfirmCategoriaModal from '../components/categorias/ConfirmCategoriaModal'
import AsignarDocenteModal from '../components/categorias/AsignarDocenteModal'
import useDocentes from '../hooks/useDocentes'
import CategoriaDocenteTable from '../components/categorias/CategoriaDocenteTable'

function CategoriaDetalle() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [categoria, setCategoria] = useState(null)
  const [docenteCategorias, setDocenteCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const { docentes } = useDocentes()

  const [modalKey, setModalKey] = useState(0)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeletionOpen, setIsDeletionOpen] = useState(false)
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

  const openModal = (setOpened) => {
    setModalKey((key) => key + 1)
    setOpened(true)
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

  const handleUpdate = async (data) => {
    setCategoria(await patchCategoria(categoria.categoria_id, data))
  }

  const handleDelete = async () => {
    await deleteCategoria(categoria.categoria_id)
    navigate('/padron/categorias')
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
            onClick={() => openModal(setIsFormOpen)}
          >
            Editar categoría
          </Button>
          <Button
            leftIcon={<IconTrash size={16} />}
            color="red"
            variant="light"
            onClick={() => openModal(setIsDeletionOpen)}
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

      {/* Modal de Edición */}
      <CategoriaFormModal
        key={`form-${modalKey}`}
        opened={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleUpdate}
        categoria={categoria}
      />

      {/* Modal de Eliminación */}
      <ConfirmCategoriaModal
        key={`delete-${modalKey}`}
        opened={isDeletionOpen}
        onClose={() => setIsDeletionOpen(false)}
        onConfirm={handleDelete}
        categoria={categoria}
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