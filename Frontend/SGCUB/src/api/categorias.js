import { api } from './conf'

const categoriasEndpoint = 'padron/categoria/'

export const getCategorias = async () => {
  const response = await api.get(categoriasEndpoint)
  return response.data
}