import { api } from './conf'

const estadoCuentaEndpoint = 'finanzas/cuenta-corriente/'

export const getEstadoCuenta = async (socioId) => {
  const response = await api.get(`${estadoCuentaEndpoint}socio/${socioId}/estado/`)
  return response.data
}