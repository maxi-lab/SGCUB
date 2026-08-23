import { api } from './conf'

const sociosEndpoint = 'padron/socio/'

export const getSocios = async () => {
  try {
    const response = await api.get(sociosEndpoint)
    console.log('GET socios:', response.data)
    return response.data
  } catch (error) {
    console.error('Error al obtener los socios:', error)
    throw error
  }
}

export const getSocio = async (socioId) => {
  try {
    const response = await api.get(`${sociosEndpoint}${socioId}/`)
    console.log('GET socio:', response.data)
    return response.data
  } catch (error) {
    console.error('Error al obtener el socio:', error)
    throw error
  }
}

export const postSocio = async (socio) => {
  try {
    const response = await api.post(sociosEndpoint, socio)
    console.log('POST socio:', response.data)
    return response.data
  } catch (error) {
    console.error('Error al crear el socio:', error)
    throw error
  }
}

export const putSocio = async (socioId, socio) => {
  try {
    const response = await api.put(`${sociosEndpoint}${socioId}/`, socio)
    console.log('PUT socio:', response.data)
    return response.data
  } catch (error) {
    console.error('Error al modificar el socio:', error)
    throw error
  }
}

export const deleteSocio = async (socioId) => {
  try {
    const response = await api.delete(`${sociosEndpoint}${socioId}/`)
    console.log('DELETE socio:', response.data)
    return response.data
  } catch (error) {
    console.error('Error al eliminar el socio:', error)
    throw error
  }
}
