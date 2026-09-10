import { api } from './conf'

const docenteCategoriaEndpoint = 'padron/docente-categoria/'

export const getDocenteCategorias = async () => {
  const response = await api.get(docenteCategoriaEndpoint)
  return response.data
}
export const getDocenteCategoria = async (docenteCategoriaId) => {
  const response = await api.get(`${docenteCategoriaEndpoint}${docenteCategoriaId}/`)
  return response.data
}
export const postDocenteCategoria = async (docenteCategoria) => {
  const response = await api.post(docenteCategoriaEndpoint, docenteCategoria)
  return response.data
}
export const deleteDocenteCategoria = async (docenteCategoriaId) => {
  await api.delete(`${docenteCategoriaEndpoint}${docenteCategoriaId}/`)
}

export const docenteCategoriaByDocente = async (docenteId) => {
  const response = await api.get(`${docenteCategoriaEndpoint}?docente=${docenteId}`)
  return response.data
}
export const docenteCategoriaByCategoria = async (categoriaId) => {
  const response = await api.get(`${docenteCategoriaEndpoint}?categoria=${categoriaId}`)
  return response.data
}