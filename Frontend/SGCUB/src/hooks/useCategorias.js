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

  const crearCategoria = useCallback(async (categoria) => {
    const categoriaCreada = await postCategoria(categoria)
    await cargarCategorias()
    return categoriaCreada
  }, [cargarCategorias])

  const editarCategoria = useCallback(async (categoriaId, categoria) => {
    const categoriaEditada = await patchCategoria(categoriaId, categoria)
    await cargarCategorias()
    return categoriaEditada
  }, [cargarCategorias])

  const eliminarCategoria = useCallback(async (categoriaId) => {
    await deleteCategoria(categoriaId)
    await cargarCategorias()
  }, [cargarCategorias])

  useEffect(() => {
    cargarCategorias()
  }, [cargarCategorias])

  return {
    categorias,
    isLoading,
    error,
    crearCategoria,
    editarCategoria,
    eliminarCategoria,
  }
}

export default useCategorias
