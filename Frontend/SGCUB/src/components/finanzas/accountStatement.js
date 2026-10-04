const normalizeState = (state) => String(state ?? '').toLowerCase().replaceAll(' ', '')

export const isPaid = (cuota) => normalizeState(cuota.estado_cuota ?? cuota.estado) === 'paga'

export const cuotaAmount = (cuota) => Number(cuota.monto_total ?? 0)

export const cuotaConcepts = (cuota) => [...new Set((cuota.items ?? []).map((item) => item.concepto_nombre ?? item.concepto).filter(Boolean))].join(', ') || '—'
