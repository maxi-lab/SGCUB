import { useMemo } from 'react'
import {
  Alert,
  Button,
  Divider,
  Group,
  Modal,
  Paper,
  Select,
  Stack,
  Text,
  TextInput,
  Accordion,
} from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import ContactoEmergenciaForm from './ContactoEmergenciaForm'

function EditJugadorModal({
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


  const categoriasOptions = useMemo(() => {
    let generoNombre = null
    let anioNac = null

    if (formulario.socio) {
      const socioElegido = socios.find((s) => String(s.socio_id) === String(formulario.socio))
      if (socioElegido) {
        anioNac = socioElegido.fecha_nacimiento ? parseInt(socioElegido.fecha_nacimiento.substring(0, 4)) : null
        if (socioElegido.genero) {
          const genObj = window.generosGlobal?.find((g) => String(g.genero_id) === String(socioElegido.genero))
          if (genObj) {
            generoNombre = genObj.nombre
          } else {
            generoNombre = socioElegido.genero_nombre || null
          }
        }
      }
    }

    let categoriasFiltradas = categorias
    
    if (anioNac && generoNombre) {
      const generoLetra = generoNombre === 'Masculino' ? 'M' : 'F'
      const temporadaActual = categorias.length > 0 ? categorias[0].anio_vigente : 2026
      const edadCompetencia = temporadaActual - anioNac

      categoriasFiltradas = categorias.filter((c) => 
        c.genero === generoLetra && c.edad_maxima >= edadCompetencia
      )
    }

    return categoriasFiltradas.map((categoria) => ({
      value: String(categoria.categoria_id),
      label: categoria.nombre,
    }))
  }, [categorias, formulario.socio, socios])

  const estadosOptions = useMemo(
    () =>
      estados.map((estado) => ({
        value: String(estado.estado_id),
        label: estado.nombre,
      })),
    [estados],
  )

  return (
    <Modal opened={opened} onClose={onClose} title="Editar jugador" size="lg">
      <form onSubmit={onSubmit}>
        <Stack spacing="md">
          <TextInput
            label="Socio vinculado"
            value={
              socios.find((s) => String(s.socio_id) === String(formulario.socio))
                ? `${socios.find((s) => String(s.socio_id) === String(formulario.socio)).nombre} ${socios.find((s) => String(s.socio_id) === String(formulario.socio)).apellido} - DNI ${socios.find((s) => String(s.socio_id) === String(formulario.socio)).dni}`
                : 'Cargando socio...'
            }
            readOnly
            disabled
          />

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
              value={formulario.obra_social || ''}
              onChange={(event) => onChange('obra_social', event.currentTarget.value)}
            />
            <TextInput
              label="Talla de indumentaria"
              value={formulario.tallaIndumentaria || ''}
              onChange={(event) => onChange('tallaIndumentaria', event.currentTarget.value)}
            />
          </Group>

          <Accordion variant="separated">
            <Accordion.Item value="contactos">
              <Accordion.Control>
                <Text weight={600} size="sm">Contactos de Emergencia</Text>
              </Accordion.Control>
              <Accordion.Panel>
                <ContactoEmergenciaForm
                  contactos={formulario.contactos_emergencia || []}
                  onChange={(value) => onChange('contactos_emergencia', value)}
                />
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>

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
              Guardar cambios
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

export default EditJugadorModal