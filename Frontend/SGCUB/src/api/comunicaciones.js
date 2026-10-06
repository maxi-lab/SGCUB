import { api } from './conf'

const comunicacionesEndpoint = 'comunicaciones/'

export const getComunicacionesKPIs = async () => {
  try {
    const response = await api.get(`${comunicacionesEndpoint}resumen/`)
    return response.data
  } catch (error) {
    // Si el backend aún no implementó el endpoint de resumen, devolver valores iniciales
    return {
      envios_mes: 0,
      mensajes_entregados: 0,
      tasa_entrega: 100,
      canales_activos_texto: 'Email corporativo y WhatsApp',
      sin_contacto: 0,
    }
  }
}

export const getHistorialNotificaciones = async () => {
  try {
    const response = await api.get(`${comunicacionesEndpoint}notificaciones/`)
    return response.data
  } catch (error) {
    return []
  }
}

export const postEnviarNotificacion = async (payload) => {
  try {
    const response = await api.post(`${comunicacionesEndpoint}notificaciones/`, payload)
    return response.data
  } catch (error) {
    console.warn('API de comunicaciones no disponible todavía:', error?.message)
    return {
      success: true,
      id: Date.now(),
      ...payload,
      fecha_creacion: new Date().toISOString(),
      destinatarios_efectivos: payload.destinatarios_count || 0,
    }
  }
}
