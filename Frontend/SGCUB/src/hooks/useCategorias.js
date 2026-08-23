import { useCallback, useEffect, useState } from 'react'
import { getCategorias } from '../api/categorias'

function useCategorias() {
  const [categorias, setCategorias] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const cargarCategorias = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      setCategorias(await getCategorias())
    } catch (requestError) {
      setError(requestError)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    cargarCategorias()
  }, [cargarCategorias])

  return { categorias, isLoading, error }
}

export default useCategorias