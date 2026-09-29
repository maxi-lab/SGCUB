import { Alert, Button, Group, Modal, Select, Stack, TextInput } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import ItemsCuotaFields from './ItemsCuotaFields'

const ESTADO_OPTIONS = [
  { value: 'EnFecha', label: 'En fecha' },
  { value: 'Vencida', label: 'Vencida' },
  { value: 'Paga', label: 'Paga' },
]

function AddCuotaModal({ opened, onClose, onSubmit, formulario, onChange, loading, error, cuentasOptions = [] }) {
  return (
    <Modal opened={opened} onClose={onClose} title="Agregar cuota" centered size="md">
      <form onSubmit={onSubmit}>
        <Stack gap="md">
          <TextInput
            label="Período"
            placeholder="Ej: 2026-03"
            value={formulario.periodo || ''}
            onChange={(event) => onChange('periodo', event.currentTarget.value)}
            required
          />

          <Select
            label="Estado"
            placeholder="Seleccione un estado"
            data={ESTADO_OPTIONS}
            value={formulario.estado_cuota || ''}
            onChange={(value) => onChange('estado_cuota', value)}
            required
          />

          <Group grow>
            <TextInput
              label="Fecha vencimiento 1"
              type="date"
              value={formulario.fecha_venc1 || ''}
              onChange={(event) => onChange('fecha_venc1', event.currentTarget.value)}
              required
            />
            <TextInput
              label="Fecha vencimiento 2"
              type="date"
              value={formulario.fecha_venc2 || ''}
              onChange={(event) => onChange('fecha_venc2', event.currentTarget.value)}
              required
            />
          </Group>

          <Select
            label="Cuenta corriente"
            placeholder="Seleccione el socio"
            data={cuentasOptions}
            searchable
            clearable
            value={formulario.cuenta_corriente ? String(formulario.cuenta_corriente) : null}
            onChange={(value) => onChange('cuenta_corriente', value || '')}
            required
          />

          <ItemsCuotaFields
            items={formulario.items || []}
            onChange={(index, campo, valor) => onChange('items', formulario.items.map((item, itemIndex) => itemIndex === index ? { ...item, [campo]: valor } : item))}
            onAdd={() => onChange('items', [...(formulario.items || []), { concepto: 'CuotaSocial', es_descuento: false, fecha_aplicacion: formulario.fecha_venc1 || '', monto: '', motivo: '' }])}
            onRemove={(index) => onChange('items', formulario.items.filter((_, itemIndex) => itemIndex !== index))}
            disabled={loading}
          />

          {error && (
            <Alert icon={<IconAlertCircle size={16} />} title="Atención" color="red" variant="filled">
              {error}
            </Alert>
          )}

          <Group justify="flex-end" mt="md">
            <Button type="button" variant="default" onClick={onClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading} color="teal">
              Guardar
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

export default AddCuotaModal
