import { api } from './conf'

const comprobantesEndpoint = 'finanzas/comprobante/'

export const getComprobantes = async () => {
  const response = await api.get(comprobantesEndpoint)
  return response.data
}

export const getComprobante = async (comprobanteId) => {
  const response = await api.get(`${comprobantesEndpoint}${comprobanteId}/`)
  return response.data
}