import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/conf'

function useGeneros() {
  const [generos, setGeneros] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const cargarGeneros = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.get('padron/genero/')
      setGeneros(response.data)
    } catch (requestError) {
      setError(requestError)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarGeneros()
  }, [cargarGeneros])

  return { generos, isLoading, error }
}

export default useGeneros
