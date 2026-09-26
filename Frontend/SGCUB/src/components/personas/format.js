export const formatDate = (date) => {
  if (!date) return '—'
  const parts = String(date).split('-')
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : date
}

export const formatDni = (dni) => {
  if (!dni) return '—'
  const numero = Number(dni)
  return Number.isNaN(numero) ? dni : numero.toLocaleString('es-AR')
}

export const formatNumber = (number) => (number ? `#${String(number).padStart(4, '0')}` : '—')

export const formatAmount = (amount) =>
  Number(amount || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })

// Años completos entre la fecha dada (YYYY-MM-DD) y hoy.
export const yearsSince = (date) => {
  if (!date) return null
  const start = new Date(`${date}T00:00:00`)
  const today = new Date()
  let years = today.getFullYear() - start.getFullYear()
  const monthDifference = today.getMonth() - start.getMonth()
  if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < start.getDate())) years -= 1
  return years
}

export const yearsText = (years) => {
  if (years === null || years === undefined) return '—'
  if (years < 1) return 'Menos de 1 año'
  return years === 1 ? '1 año' : `${years} años`
}

export const isActiveStatus = (name) => {
  const value = name?.toLowerCase() ?? ''
  return value.includes('activo') && !value.includes('inactivo')
}

export const getErrorMessage = (requestError, fallback) => {
  const errorData = requestError.response?.data
  if (!errorData) return fallback
  if (typeof errorData === 'string') return errorData
  if (errorData.detail) return errorData.detail
  return Object.entries(errorData)
    .map(([k, v]) => {
      if (Array.isArray(v)) {
        return `${k}: ${v.map((item) => (typeof item === 'object' ? JSON.stringify(item) : item)).join(', ')}`
      }
      return `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`
    })
    .join(' | ')
}
