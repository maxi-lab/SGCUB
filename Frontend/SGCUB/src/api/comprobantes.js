import { api } from './conf'

const comprobantesEndpoint = 'finanzas/comprobante/'

export const getComprobantes = async () => {
  const response = await api.get(comprobantesEndpoint)
  return response.data
}

export const getComprobantesByCuota = async (cuotaId) => {
  const response = await api.get(comprobantesEndpoint, { params: { cuota_id: cuotaId } })
  return response.data
}

export const getComprobante = async (comprobanteId) => {
  const response = await api.get(`${comprobantesEndpoint}${comprobanteId}/`)
  return response.data
}

const nombreArchivo = (contentDisposition, comprobanteId) => {
  const coincidencia = /filename="([^"]+)"/.exec(contentDisposition ?? '')
  return coincidencia ? coincidencia[1] : `comprobante-${comprobanteId}.pdf`
}

export const descargarComprobantePdf = async (comprobanteId) => {
  const response = await api.get(`${comprobantesEndpoint}${comprobanteId}/pdf/`, { responseType: 'blob' })
  const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
  const enlace = document.createElement('a')
  enlace.href = url
  enlace.download = nombreArchivo(response.headers['content-disposition'], comprobanteId)
  document.body.appendChild(enlace)
  enlace.click()
  enlace.remove()
  URL.revokeObjectURL(url)
}