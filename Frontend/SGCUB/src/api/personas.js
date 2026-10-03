import { api } from './conf'

const personasEndpoint = 'padron/persona/'

export const searchPersonas = async (query, { signal } = {}) => {
  const response = await api.get(personasEndpoint, { params: { q: query }, signal })
  return response.data
}
