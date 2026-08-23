import { useCallback, useEffect, useState } from 'react'
import { deleteJugador, getJugadores, postJugador } from '../api/jugadores'

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

  const eliminarJugador = useCallback(async (jugadorId) => {
    await deleteJugador(jugadorId)
    await cargarJugadores()
  }, [cargarJugadores])

  useEffect(() => {
    cargarJugadores()
  }, [cargarJugadores])

  return { jugadores, isLoading, error, crearJugador, eliminarJugador }
}

export default useJugadores
