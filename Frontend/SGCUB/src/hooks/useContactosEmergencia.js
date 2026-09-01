import { useCallback, useEffect, useState } from 'react'
import {
  deleteContactoEmergencia,
  getContactosEmergencia,
  patchContactoEmergencia,
  postContactoEmergencia,
} from '../api/contactosEmergencia'

function useContactosEmergencia() {
  const [contactos, setContactos] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const cargarContactos = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      setContactos(await getContactosEmergencia())
    } catch (requestError) {
      console.error('Error al cargar los contactos de emergencia:', requestError)
      setError(requestError)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const crearContacto = useCallback(async (contacto) => {
    const contactoCreado = await postContactoEmergencia(contacto)
    await cargarContactos()
    return contactoCreado
  }, [cargarContactos])

  const editarContacto = useCallback(async (contactoId, contacto) => {
    const contactoEditado = await patchContactoEmergencia(contactoId, contacto)
    await cargarContactos()
    return contactoEditado
  }, [cargarContactos])

  const eliminarContacto = useCallback(async (contactoId) => {
    await deleteContactoEmergencia(contactoId)
    await cargarContactos()
  }, [cargarContactos])

  useEffect(() => {
    cargarContactos()
  }, [cargarContactos])

  return {
    contactos,
    isLoading,
    error,
    crearContacto,
    editarContacto,
    eliminarContacto,
  }
}

export default useContactosEmergencia