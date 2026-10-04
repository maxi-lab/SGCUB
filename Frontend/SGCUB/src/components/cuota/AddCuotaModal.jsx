import { Alert, Button, Group, Modal, Select, Stack, Text, TextInput } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'

function AddCuotaModal({ opened, onClose, onSubmit, formulario, onChange, loading, error, sociosOptions = [] }) {
  return (
    <Modal opened={opened} onClose={onClose} title="Generar cuota" centered size="md">
      <form onSubmit={onSubmit}>
        <Stack spacing="md">
          <Select
            label="Socio"
            placeholder="Seleccione el socio"
            data={sociosOptions}
            searchable
            clearable
            value={formulario.socio_id ? String(formulario.socio_id) : null}
            onChange={(value) => onChange('socio_id', value || '')}
            required
          />

          <TextInput
            label="Período"
            type="month"
            value={formulario.periodo || ''}
            onChange={(event) => onChange('periodo', event.currentTarget.value)}
            required
          />

          <Group grow>
            <TextInput
              label="Fecha vencimiento 1"
              type="date"
              value={formulario.fecha_venc1 || ''}
              onChange={(event) => onChange('fecha_venc1', event.currentTarget.value)}
            />
            <TextInput
              label="Fecha vencimiento 2"
              type="date"
              value={formulario.fecha_venc2 || ''}
              onChange={(event) => onChange('fecha_venc2', event.currentTarget.value)}
            />
          </Group>

          <Text size="sm" c="dimmed">
            Los ítems de la cuota se calculan automáticamente según el socio. Si no se indican vencimientos, se usan los días configurados para el período.
          </Text>

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
              Generar
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

export default AddCuotaModal
