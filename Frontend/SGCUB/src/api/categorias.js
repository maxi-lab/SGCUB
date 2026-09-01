import { api } from './conf'

const categoriasEndpoint = 'padron/categoria/'

export const getCategorias = async () => {
  const response = await api.get(categoriasEndpoint)
  return response.data
}

export const getCategoria = async (categoriaId) => {
  const response = await api.get(`${categoriasEndpoint}${categoriaId}/`)
  return response.data
}

export const postCategoria = async (categoria) => {
  const response = await api.post(categoriasEndpoint, categoria)
  return response.data
}

export const patchCategoria = async (categoriaId, categoria) => {
  const response = await api.patch(`${categoriasEndpoint}${categoriaId}/`, categoria)
  return response.data
}

export const deleteCategoria = async (categoriaId) => {
  await api.delete(`${categoriasEndpoint}${categoriaId}/`)
}