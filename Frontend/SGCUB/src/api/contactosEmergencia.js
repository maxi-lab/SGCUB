import { api } from './conf'

const contactosEndpoint = 'padron/contacto-emergencia/'

export const getContactosEmergencia = async () => {
  const response = await api.get(contactosEndpoint)
  return response.data
}

export const postContactoEmergencia = async (contacto) => {
  const response = await api.post(contactosEndpoint, contacto)
  return response.data
}

export const patchContactoEmergencia = async (contactoId, contacto) => {
  const response = await api.patch(
    `${contactosEndpoint}${contactoId}/`,
    contacto,
  )

  return response.data
}

export const deleteContactoEmergencia = async (contactoId) => {
  await api.delete(`${contactosEndpoint}${contactoId}/`)
}