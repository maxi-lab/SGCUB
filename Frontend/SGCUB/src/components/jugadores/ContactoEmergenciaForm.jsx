import { Button, Checkbox, Group, Select, Stack, TextInput, ActionIcon, Tooltip } from '@mantine/core'
import { IconSearch } from '@tabler/icons-react'
import { api } from '../../api/conf'

const contactoVacio = () => ({
  persona: { nombre: '', apellido: '', dni: '', telefono: '', email: null },
  relacion: '',
  responsable_legal: false,
})

function ContactoEmergenciaForm({ contactos = [], onChange }) {
  const cambiarContacto = (indice, campo, valor) => {
    const actualizados = contactos.map((contacto, posicion) => {
      if (posicion !== indice) return contacto
      if (campo === 'persona') {
        return { ...contacto, persona: { ...contacto.persona, ...valor } }
      }
      return { ...contacto, [campo]: valor }
    })
    onChange(actualizados)
  }

  const buscarPersona = async (indice, dni) => {
    if (!dni) return
    try {
      const response = await api.get(`padron/persona/?dni=${dni}`)
      if (response.data && response.data.length > 0) {
        const p = response.data[0]
        cambiarContacto(indice, 'persona', {
          nombre: p.nombre,
          apellido: p.apellido,
          dni: p.dni,
          telefono: p.telefono,
          email: p.email,
        })
      }
    } catch (error) {
      console.error("Error buscando persona", error)
    }
  }

  const agregarContacto = () => onChange([...contactos, contactoVacio()])
  const quitarContacto = (indice) => onChange(contactos.filter((_, posicion) => posicion !== indice))

  return (
    <Stack spacing="md">
      {contactos.map((contacto, indice) => (
        <Stack key={contacto.contacto_emergencia_id ?? indice} spacing="xs">
          <Group position="apart">
            <strong>Contacto {indice + 1}</strong>
            <Button type="button" color="red" variant="subtle" size="xs" onClick={() => quitarContacto(indice)}>
              Quitar
            </Button>
          </Group>
          <Group grow>
            <TextInput 
              label="DNI" 
              value={contacto.persona?.dni ?? ''} 
              onChange={(event) => cambiarContacto(indice, 'persona', { dni: event.currentTarget.value })} 
              rightSection={
                <Tooltip label="Buscar persona por DNI" withArrow position="top">
                  <ActionIcon onClick={() => buscarPersona(indice, contacto.persona?.dni)}>
                    <IconSearch size={16} />
                  </ActionIcon>
                </Tooltip>
              }
              required 
            />
            <TextInput label="Telefono" value={contacto.persona?.telefono ?? ''} onChange={(event) => cambiarContacto(indice, 'persona', { telefono: event.currentTarget.value })} />
          </Group>
          <Group grow>
            <TextInput label="Nombre" value={contacto.persona?.nombre ?? ''} onChange={(event) => cambiarContacto(indice, 'persona', { nombre: event.currentTarget.value })} required />
            <TextInput label="Apellido" value={contacto.persona?.apellido ?? ''} onChange={(event) => cambiarContacto(indice, 'persona', { apellido: event.currentTarget.value })} required />
          </Group>
          <TextInput label="Email" type="email" value={contacto.persona?.email ?? ''} onChange={(event) => cambiarContacto(indice, 'persona', { email: event.currentTarget.value || null })} />
          <Group grow align="flex-end">
            <Select label="Relacion" data={['Madre', 'Padre', 'Tutor', 'Abuelo', 'Hermano', 'Otro']} value={contacto.relacion} onChange={(value) => cambiarContacto(indice, 'relacion', value)} required />
            <Checkbox label="Responsable legal" checked={contacto.responsable_legal} onChange={(event) => cambiarContacto(indice, 'responsable_legal', event.currentTarget.checked)} />
          </Group>
        </Stack>
      ))}
      <Button type="button" variant="light" onClick={agregarContacto}>Agregar contacto de emergencia</Button>
    </Stack>
  )
}

export default ContactoEmergenciaForm


