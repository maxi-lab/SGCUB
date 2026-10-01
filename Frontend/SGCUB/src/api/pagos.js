import { api } from './conf'

const registrarPagoEndpoint = 'finanzas/pago/registrar/'

export const registrarPago = async (pago) => {
  const response = await api.post(registrarPagoEndpoint, pago)
  return response.data
}

export const corregirPago = async (pagoId, correccion) => {
  const response = await api.post(`finanzas/pago/${pagoId}/corregir/`, correccion)
  return response.data
}