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

  const crearLocalidad = useCallback(async (nombre) => {
    const localidad = (await api.post('padron/localidad/', { nombre })).data
    setLocalidades((actuales) => (
      actuales.some((l) => l.localidad_id === localidad.localidad_id)
        ? actuales
        : [...actuales, localidad].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    ))
    return localidad
  }, [])

  return { localidades, isLoading, error, crearLocalidad }
}

export default useLocalidades
