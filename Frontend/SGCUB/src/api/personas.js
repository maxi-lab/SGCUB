import { api } from './conf'

const personasEndpoint = 'padron/persona/'

export const getPersonas = async (dni = null) => {
  const url = dni ? `${personasEndpoint}?dni=${dni}` : personasEndpoint
  const response = await api.get(url)
  return response.data
}

export const getPersona = async (personaId) => {
  const response = await api.get(`${personasEndpoint}${personaId}/`)
  return response.data
}

export const postPersona = async (persona) => {
  const response = await api.post(personasEndpoint, persona)
  return response.data
}

export const putPersona = async (personaId, persona) => {
  const response = await api.put(`${personasEndpoint}${personaId}/`, persona)
  return response.data
}

export const patchPersona = async (personaId, persona) => {
  const response = await api.patch(`${personasEndpoint}${personaId}/`, persona)
  return response.data
}

export const deletePersona = async (personaId) => {
  await api.delete(`${personasEndpoint}${personaId}/`)
}

