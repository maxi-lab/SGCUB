import { api } from './conf'

const becasEndpoint = 'finanzas/beca/'

export const getBecasBySocio = async (socioId) => {
  const response = await api.get(becasEndpoint, { params: { socio_id: socioId } })
  return response.data
}
