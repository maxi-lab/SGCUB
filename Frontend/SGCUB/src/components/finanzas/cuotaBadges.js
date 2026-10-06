const countByState = (cuotas, state) => cuotas.filter((cuota) => cuota.estado_cuota === state).length

export const buildCuotaBadges = (account) => {
  if (!account) return undefined
  const cuotas = account.cuotas ?? []
  const overdue = countByState(cuotas, 'Vencida')
  const pending = countByState(cuotas, 'EnFecha')

  const badges = []
  if (overdue > 0) badges.push({ label: overdue, tono: 'error', icon: 'error', hideDot: true, title: 'Vencidas' })
  if (pending > 0) badges.push({ label: pending, tono: 'alerta', icon: 'schedule', hideDot: true, title: 'Pendientes' })
  if (badges.length > 0) return badges

  return { tono: 'ok', icon: 'check', hideDot: true, title: 'Al día' }
}
