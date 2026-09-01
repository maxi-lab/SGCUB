import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/conf'

function useLocalidades() {
  const [localidades, setLocalidades] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const cargarLocalidades = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.get('padron/localidad/')
      setLocalidades(response.data)
    } catch (requestError) {
      setError(requestError)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarLocalidades()
  }, [cargarLocalidades])

  return { localidades, isLoading, error }
}

export default useLocalidades
