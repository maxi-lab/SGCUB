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
    <Modal opened={opened} onClose={onClose} title={editing ? 'Editar socio' : 'Agregar socio'}>
      <form onSubmit={onSubmit}>
        <Stack>
          {!editing && personaEncontrada && (
            <Badge color="teal" size="sm" leftSection={<IconCheck size={12} />}>
              Persona encontrada en padrón
            </Badge>
          )}

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
          <TextInput
            label="Nombre"
            value={formulario.nombre}
            onChange={(event) => onChange('nombre', event.currentTarget.value)}
            required
          />
          <TextInput
            label="Apellido"
            value={formulario.apellido}
            onChange={(event) => onChange('apellido', event.currentTarget.value)}
            required
          />
          <TextInput
            label="Teléfono"
            value={formulario.telefono}
            onChange={(event) => onChange('telefono', event.currentTarget.value)}
            required
          />
          <TextInput
            label="Email"
            type="email"
            value={formulario.email}
            onChange={(event) => onChange('email', event.currentTarget.value)}
            required
          />
          {editing && (
            <Select
              label="Estado"
              data={estadosSocio.map(e => ({ value: String(e.estado_id), label: e.nombre }))}
              value={formulario.estado_socio}
              onChange={(value) => onChange('estado_socio', value)}
              required
            />
          )}
          {error && <Text color="red" size="sm">{error}</Text>}
          <Group position="right" mt="md">
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