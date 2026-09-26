//DEBE REHACERSE, SOLAMENTE ES PARA PODER MOSTRAR ALGO EN EL LEGAJO


import { api } from './conf'

export const getCuentasCorrientes = async () => {
  const response = await api.get('finanzas/cuenta-corriente/')
  return response.data
}

export const getCuotas = async () => {
  const response = await api.get('finanzas/cuota/')
  return response.data
}

export const getItemsCuota = async () => {
  const response = await api.get('finanzas/item-cuota/')
  return response.data
}

export const getEstadosCuota = async () => {
  const response = await api.get('finanzas/estado-cuota/')
  return response.data
}
