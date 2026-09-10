import { useCallback, useEffect, useState } from 'react'
import { deleteDocente, getDocentes, patchDocente, postDocente } from '../api/docentes'

function useDocentes() {
  const [docentes, setDocentes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const cargarDocentes = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      setDocentes(await getDocentes())
    } catch (requestError) {
      setError(requestError)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const crearDocente = useCallback(async (docente) => {
    const docenteCreado = await postDocente(docente)
    await cargarDocentes()
    return docenteCreado
  }, [cargarDocentes])

  const editarDocente = useCallback(async (docenteId, docente) => {
    const docenteEditado = await patchDocente(docenteId, docente)
    await cargarDocentes()
    return docenteEditado
  }, [cargarDocentes])

  const eliminarDocente = useCallback(async (docenteId) => {
    await deleteDocente(docenteId)
    await cargarDocentes()
  }, [cargarDocentes])

  useEffect(() => {
    cargarDocentes()
  }, [cargarDocentes])

  return {
    docentes,
    isLoading,
    error,
    recargarDocentes: cargarDocentes,
    crearDocente,
    editarDocente,
    eliminarDocente,
  }
}

export default useDocentes
