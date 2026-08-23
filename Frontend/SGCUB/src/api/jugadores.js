import { api } from './conf'

const jugadoresEndpoint = 'padron/jugador/'

export const getJugadores = async () => {
  const response = await api.get(jugadoresEndpoint)
  return response.data
}
