import { useCallback, useEffect, useState } from 'react'
import { deletePersona, getPersonas, postPersona, putPersona } from '../api/personas'

function usePersonas() {
  const [personas, setPersonas] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const cargarPersonas = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data = await getPersonas()
      setPersonas(data)
    } catch (requestError) {
      setError(requestError)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const crearPersona = useCallback(
    async (persona) => {
      const nueva = await postPersona(persona)
      await cargarPersonas()
      return nueva
    },
    [cargarPersonas],
  )

  const modificarPersona = useCallback(
    async (personaId, persona) => {
      const modificada = await putPersona(personaId, persona)
      await cargarPersonas()
      return modificada
    },
    [cargarPersonas],
  )

  const eliminarPersona = useCallback(
    async (personaId) => {
      await deletePersona(personaId)
      await cargarPersonas()
    },
    [cargarPersonas],
  )

  useEffect(() => {
    cargarPersonas()
  }, [cargarPersonas])

  return {
    personas,
    isLoading,
    error,
    recargarPersonas: cargarPersonas,
    crearPersona,
    modificarPersona,
    eliminarPersona,
  }
}

export default usePersonas

