import { api } from './conf'

const estadosEndpoint = 'padron/estado/'

export const getEstados = async () => {
  const response = await api.get(estadosEndpoint)
  return response.data
}
