import { api } from './conf'

const docentesEndpoint = 'padron/docente/'

export const getDocentes = async () => {
  const response = await api.get(docentesEndpoint)
  return response.data
}

export const getDocente = async (docenteId) => {
  const response = await api.get(`${docentesEndpoint}${docenteId}/`)
  return response.data
}

export const postDocente = async (docente) => {
  const response = await api.post(docentesEndpoint, docente)
  return response.data
}

export const patchDocente = async (docenteId, docente) => {
  const response = await api.patch(`${docentesEndpoint}${docenteId}/`, docente  )
  return response.data
}

export const deleteDocente = async (docenteId) => {
  await api.delete(`${docentesEndpoint}${docenteId}/`)
}