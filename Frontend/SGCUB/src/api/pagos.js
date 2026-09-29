import { api } from './conf'

const registrarPagoEndpoint = 'finanzas/pago/registrar/'

export const registrarPago = async (pago) => {
  const response = await api.post(registrarPagoEndpoint, pago)
  return response.data
}