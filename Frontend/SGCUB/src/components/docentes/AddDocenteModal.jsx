import { useState } from 'react'
import {
  ActionIcon,
  Alert,
  Badge,
  Button,
  Group,
  Modal,
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
        onChange('email', p.email || '')
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
            <Stack spacing="xs">
                <Group position="apart">
                  <Text weight={600} size="sm">
                    Datos del nuevo docente
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
                      onChange={(e) => onChange('dni', e.currentTarget.value)}
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
                      label="Email"
                      type="email"
                      value={formulario.email || ''}
                      onChange={(e) => onChange('email', e.currentTarget.value)}
                      required
                    />
                  </Grid.Col>
                  <Grid.Col span={12} sm={6}>
                    <TextInput
                      label="Legajo"
                      type="number"
                      value={formulario.legajo || ''}
                      onChange={(e) => onChange('legajo', e.currentTarget.value)}
                      required
                    />
                  </Grid.Col>
                </Grid>
              </Stack>

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
