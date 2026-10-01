import { api } from './conf'

export const getDocumentos = async (personaId) => {
  const { data } = await api.get('documental/documentos/', { params: { persona_id: personaId } })
  return data
}

export const createDocumento = async (documentData) => {
  const { data } = await api.post('documental/documentos/', documentData)
  return data
}

export const deleteDocumento = async (id) => {
  await api.delete(`documental/documentos/${id}/`)
}

export const getTiposDocumento = async () => {
  const { data } = await api.get('documental/tipos/')
  return data
}

export const getEstadosDocumento = async () => {
  const { data } = await api.get('documental/estados/')
  return data
}
