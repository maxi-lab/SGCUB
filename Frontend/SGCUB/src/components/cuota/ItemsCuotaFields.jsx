import { Button, Group, NumberInput, Select, Stack, TextInput } from '@mantine/core'

const CONCEPTO_OPTIONS = [
  { value: 'CuotaSocial', label: 'Cuota social' },
  { value: 'CuotaDeportiva', label: 'Cuota deportiva' },
  { value: 'Mora', label: 'Mora' },
  { value: 'DescuentoUnico', label: 'Descuento único' },
  { value: 'Beca', label: 'Beca' },
  { value: 'Otro', label: 'Otro' },
]

export const itemCuotaInicial = (fecha = '') => ({
  item_cuota_id: null,
  concepto: 'CuotaSocial',
  es_descuento: false,
  fecha_aplicacion: fecha,
  monto: '',
  motivo: '',
})

function ItemsCuotaFields({ items, onChange, onAdd, onRemove, disabled }) {
  const total = items.reduce(
    (acumulado, item) => acumulado + (item.es_descuento ? -Number(item.monto || 0) : Number(item.monto || 0)),
    0,
  )

  return (
    <Stack gap="sm">
      <Group justify="space-between" align="center">
        <div><strong>Ítems de la cuota</strong><div className="text-sm text-gray-600">El total se calcula sumando los importes y restando los descuentos.</div></div>
        <Button type="button" variant="light" size="xs" onClick={onAdd} disabled={disabled}>Agregar ítem</Button>
      </Group>

      {items.map((item, index) => (
        <Stack key={item.item_cuota_id ?? `nuevo-${index}`} gap="xs" p="sm" style={{ border: '1px solid var(--mantine-color-gray-3)', borderRadius: '8px' }}>
          <Group grow align="flex-end">
            <Select label="Concepto" data={CONCEPTO_OPTIONS} value={item.concepto} onChange={(value) => onChange(index, 'concepto', value || 'Otro')} required />
            <NumberInput label="Monto" min={0.01} decimalScale={2} fixedDecimalScale value={Number(item.monto ?? 0)} onChange={(value) => onChange(index, 'monto', value)} required />
          </Group>
          <Group grow align="flex-end">
            <TextInput label="Fecha de aplicación" type="date" value={item.fecha_aplicacion || ''} onChange={(event) => onChange(index, 'fecha_aplicacion', event.currentTarget.value)} required />
            <TextInput label="Motivo" value={item.motivo || ''} onChange={(event) => onChange(index, 'motivo', event.currentTarget.value)} />
            <Button type="button" color="red" variant="subtle" onClick={() => onRemove(index)} disabled={disabled || items.length === 1}>Quitar</Button>
          </Group>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={item.es_descuento} onChange={(event) => onChange(index, 'es_descuento', event.currentTarget.checked)} disabled={disabled} />Aplicar como descuento</label>
        </Stack>
      ))}
      <Group justify="flex-end">
        <strong>Total de la cuota: {total.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</strong>
      </Group>
    </Stack>
  )
}

export default ItemsCuotaFields