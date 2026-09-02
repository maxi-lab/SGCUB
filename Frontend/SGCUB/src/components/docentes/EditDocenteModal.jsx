import {
  Alert,
  Button,
  Group,
  Modal,
  Stack,
  TextInput,
} from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'

function EditDocenteModal({
  opened,
  onClose,
  onSubmit,
  formulario,
  onChange,
  loading,
  error,
}) {

  return (
    <Modal opened={opened} onClose={onClose} title="Editar docente" size="lg">
      <form onSubmit={onSubmit}>
        <Stack spacing="md">
          {error && (
            <Alert icon={<IconAlertCircle size={16} />} title="Atención" color="red" variant="filled">
              {error}
            </Alert>
          )}

          <TextInput label="Nombre" value={formulario.nombre || ''} disabled />
          <TextInput label="Apellido" value={formulario.apellido || ''} disabled />
          <TextInput label="DNI" value={formulario.dni || ''} disabled />
          <TextInput
            label="Legajo"
            type="number"
            value={formulario.legajo || ''}
            onChange={(event) => onChange('legajo', event.currentTarget.value)}
            required
          />

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

export default EditDocenteModal