import { useCallback, useEffect, useState } from 'react'
import { getJugadores, postJugador } from '../api/jugadores'

function useJugadores() {
  const [jugadores, setJugadores] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const cargarJugadores = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      setJugadores(await getJugadores())
    } catch (requestError) {
      setError(requestError)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const crearJugador = useCallback(async (jugador) => {
    const jugadorCreado = await postJugador(jugador)
    await cargarJugadores()
    return jugadorCreado
  }, [cargarJugadores])

  useEffect(() => {
    cargarJugadores()
  }, [cargarJugadores])

  return { jugadores, isLoading, error, crearJugador }
}

export default useJugadores
