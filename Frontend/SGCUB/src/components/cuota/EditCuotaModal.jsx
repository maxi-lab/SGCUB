import { Alert, Button, Group, Modal, Stack, Table, Text, TextInput } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'

const CONCEPTO_LABEL = {
  CuotaSocial: 'Cuota social',
  CuotaDeportiva: 'Cuota deportiva',
  Mora: 'Mora',
  DescuentoUnico: 'Descuento único',
  Beca: 'Beca',
  Otro: 'Otro',
}

const formatAmount = (item) => {
  const monto = Number(item.monto ?? 0) * (item.es_descuento ? -1 : 1)
  return monto.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })
}

function EditCuotaModal({ opened, onClose, onSubmit, formulario, onChange, loading, error, cuota }) {
  const socio = cuota?.socio
  const nombreSocio = socio ? `${socio.apellido}, ${socio.nombre}` : 'Sin socio'

  return (
    <Modal opened={opened} onClose={onClose} title="Editar cuota" centered size="md">
      <form onSubmit={onSubmit}>
        <Stack gap="md">
          <Group grow>
            <TextInput label="Socio" value={nombreSocio} disabled />
            <TextInput label="Período" value={formulario.periodo || ''} disabled />
          </Group>

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

          <Stack gap={4}>
            <Text size="sm" fw={500}>Ítems</Text>
            <Table withTableBorder>
              <Table.Tbody>
                {(cuota?.items ?? []).map((item) => (
                  <Table.Tr key={item.item_cuota_id}>
                    <Table.Td>{CONCEPTO_LABEL[item.concepto] ?? item.concepto}</Table.Td>
                    <Table.Td ta="right">{formatAmount(item)}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Stack>

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
              Guardar cambios
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

export default EditCuotaModal
