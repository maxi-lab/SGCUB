import { Button, Group, Modal, Select, Stack, Text, TextInput } from '@mantine/core'
import ContactoEmergenciaForm from './ContactoEmergenciaForm'

function AddJugadorModal({ opened, onClose, onSubmit, formulario, onChange, socios, categorias, estados, loading, error }) {
  const sociosOptions = socios.map((socio) => ({ value: String(socio.socio_id), label: `${socio.nombre} ${socio.apellido} - DNI ${socio.dni}` }))
  const categoriasOptions = categorias.map((categoria) => ({ value: String(categoria.categoria_id), label: categoria.nombre }))
  const estadosOptions = estados.map((estado) => ({ value: String(estado.estado_id), label: estado.nombre }))

  return (
    <Modal opened={opened} onClose={onClose} title="Agregar jugador">
      <form onSubmit={onSubmit}>
        <Stack>
          <Select label="Socio" placeholder="Seleccione el socio" searchable nothingFound="No se encontraron socios" data={sociosOptions} value={formulario.socio} onChange={(value) => onChange('socio', value)} required />
          <Select label="Categoría" placeholder="Seleccione la categoría" data={categoriasOptions} value={formulario.categoria} onChange={(value) => onChange('categoria', value)} required />
          <Select label="Estado deportivo" placeholder="Seleccione el estado deportivo" data={estadosOptions} value={formulario.estado} onChange={(value) => onChange('estado', value)} required />
          <TextInput label="Obra social" value={formulario.obra_social} onChange={(event) => onChange('obra_social', event.currentTarget.value)} />
          <TextInput label="Talla de indumentaria" value={formulario.tallaIndumentaria} onChange={(event) => onChange('tallaIndumentaria', event.currentTarget.value)} />
          <ContactoEmergenciaForm contactos={formulario.contactos_emergencia} onChange={(value) => onChange('contactos_emergencia', value)} />
          {error && <Text color="red" size="sm">{error}</Text>}
          <Group position="right" mt="md">
            <Button type="button" variant="default" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button type="submit" loading={loading}>Guardar</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

export default AddJugadorModal
