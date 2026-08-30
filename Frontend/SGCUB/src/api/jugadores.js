import { api } from './conf'

const jugadoresEndpoint = 'padron/jugador/'

export const getJugadores = async () => {
  const response = await api.get(jugadoresEndpoint)
  return response.data
}

export const getJugador = async (jugadorId) => {
  const response = await api.get(`${jugadoresEndpoint}${jugadorId}/`)
  return response.data
}

export const postJugador = async (jugador) => {
  const response = await api.post(jugadoresEndpoint, jugador)
  return response.data
}

export const patchJugador = async (jugadorId, jugador) => {
  const response = await api.patch(`${jugadoresEndpoint}${jugadorId}/`, jugador)
  return response.data
}

export const deleteJugador = async (jugadorId) => {
  await api.delete(`${jugadoresEndpoint}${jugadorId}/`)
}
