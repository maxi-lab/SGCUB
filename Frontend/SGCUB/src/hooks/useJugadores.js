import { useCallback, useEffect, useState } from 'react'
import { getJugadores } from '../api/jugadores'

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

  useEffect(() => {
    cargarJugadores()
  }, [cargarJugadores])

  return { jugadores, isLoading, error }
}

export default useJugadores
