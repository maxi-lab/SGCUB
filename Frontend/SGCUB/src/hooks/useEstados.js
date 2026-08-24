import { useCallback, useEffect, useState } from 'react'
import { getEstados } from '../api/estados'

function useEstados() {
  const [estados, setEstados] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const cargarEstados = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      setEstados(await getEstados())
    } catch (requestError) {
      setError(requestError)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarEstados()
  }, [cargarEstados])

  return { estados, isLoading, error }
}

export default useEstados
