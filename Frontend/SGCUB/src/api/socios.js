import { api } from './conf'

const sociosEndpoint = 'padron/socio/'

export const getSocios = async () => {
  try {
    const response = await api.get(sociosEndpoint)
    return response.data
  } catch (error) {
    console.error('Error al obtener los socios:', error)
    throw error
  }
}

export const getSocio = async (socioId) => {
  try {
    const response = await api.get(`${sociosEndpoint}${socioId}/`)
    return response.data
  } catch (error) {
    console.error('Error al obtener el socio:', error)
    throw error
  }
}

export const postSocio = async (socio) => {
  try {
    const response = await api.post(sociosEndpoint, socio)
    return response.data
  } catch (error) {
    console.error('Error al crear el socio:', error)
    throw error
  }
}

export const putSocio = async (socioId, socio) => {
  try {
    const response = await api.put(`${sociosEndpoint}${socioId}/`, socio)
    return response.data
  } catch (error) {
    console.error('Error al modificar el socio:', error)
    throw error
  }
}

export const deleteSocio = async (socioId) => {
  try {
    const response = await api.delete(`${sociosEndpoint}${socioId}/`)
    return response.data
  } catch (error) {
    console.error('Error al eliminar el socio:', error)
    throw error
  }
}
