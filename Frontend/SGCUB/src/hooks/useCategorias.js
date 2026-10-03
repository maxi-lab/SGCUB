import { useCallback, useEffect, useState } from 'react'
import {
  deleteCategoria,
  getCategorias,
  patchCategoria,
  postCategoria,
} from '../api/categorias'

function useCategorias() {
  const [categorias, setCategorias] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchCategorias = useCallback(async () => {
    try {
      setCategorias(await getCategorias())
      setError(null)
    } catch (requestError) {
      setError(requestError)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reloadCategorias = useCallback(async () => {
    setIsLoading(true)
    await fetchCategorias()
  }, [fetchCategorias])

  const withRefresh = useCallback((request) => async (...args) => {
    const result = await request(...args)
    await fetchCategorias()
    return result
  }, [fetchCategorias])

  useEffect(() => {
    let cancelled = false
    getCategorias()
      .then((receivedCategorias) => {
        if (!cancelled) setCategorias(receivedCategorias)
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return {
    categorias,
    isLoading,
    error,
    reloadCategorias,
    createCategoria: withRefresh(postCategoria),
    updateCategoria: withRefresh(patchCategoria),
    deleteCategoria: withRefresh(deleteCategoria),
  }
}

export default useCategorias
