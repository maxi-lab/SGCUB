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
  // Filtrar socios disponibles (los que no tienen jugador + el socio actualmente asignado a este jugador)
  const sociosDisponiblesOptions = useMemo(() => {
    const socioActualId = String(formulario.socio || '')
    const sociosOcupadosIds = new Set(
      (jugadores || [])
        .map((j) => String(j.socio?.socio_id))
        .filter((id) => id && id !== socioActualId),
    )

    return socios
      .filter((s) => !sociosOcupadosIds.has(String(s.socio_id)))
      .map((socio) => ({
        value: String(socio.socio_id),
        label: `${socio.nombre} ${socio.apellido} - DNI ${socio.dni}`,
      }))
  }, [socios, jugadores, formulario.socio])

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

  return (
    <Modal opened={opened} onClose={onClose} title="Editar jugador" size="lg">
      <form onSubmit={onSubmit}>
        <Stack spacing="md">
          {/* Reasignar socio */}
          <Select
            label="Socio asignado"
            placeholder="Seleccione el socio"
            searchable
            nothingFound="No se encontraron socios disponibles"
            data={sociosDisponiblesOptions}
            value={formulario.socio}
            onChange={(value) => onChange('socio', value)}
            required
          />

          {/* Opcional: Modificar datos personales del socio directamente */}
          {formulario.nuevo_socio && (
            <Paper p="sm" withBorder radius="md" style={{ backgroundColor: 'var(--bg)' }}>
              <Stack spacing="xs">
                <Text weight={600} size="sm">
                  Datos personales del socio vinculado
                </Text>
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
                <Group grow>
                  <TextInput
                    label="Teléfono"
                    value={formulario.nuevo_socio?.telefono || ''}
                    onChange={(e) =>
                      onChange('nuevo_socio', {
                        ...formulario.nuevo_socio,
                        telefono: e.currentTarget.value,
                      })
                    }
                    required
                  />
                  <TextInput
                    label="Email"
                    type="email"
                    value={formulario.nuevo_socio?.email || ''}
                    onChange={(e) =>
                      onChange('nuevo_socio', {
                        ...formulario.nuevo_socio,
                        email: e.currentTarget.value,
                      })
                    }
                  />
                </Group>
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
              value={formulario.obra_social || ''}
              onChange={(event) => onChange('obra_social', event.currentTarget.value)}
            />
            <TextInput
              label="Talla de indumentaria"
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
              Guardar cambios
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

export default EditJugadorModal