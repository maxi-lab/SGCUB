import { useCallback, useEffect, useState } from 'react'
import { deleteSocio, getSocios, postSocio, putSocio } from '../api/socios'

function useSocio() {
  const [socios, setSocios] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const cargarSocios = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const sociosRecibidos = await getSocios()
      setSocios(sociosRecibidos)
    } catch (requestError) {
      setError(requestError)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const crearSocio = useCallback(async (socio) => {
    const socioCreado = await postSocio(socio)
    await cargarSocios()
    return socioCreado
  }, [cargarSocios])

  const modificarSocio = useCallback(async (socioId, socio) => {
    const socioModificado = await putSocio(socioId, socio)
    await cargarSocios()
    return socioModificado
  }, [cargarSocios])

  const eliminarSocio = useCallback(async (socioId) => {
    await deleteSocio(socioId)
    await cargarSocios()
  }, [cargarSocios])

  useEffect(() => {
    cargarSocios()
  }, [cargarSocios])

  return {
    socios,
    isLoading,
    error,
    recargarSocios: cargarSocios,
    crearSocio,
    modificarSocio,
    eliminarSocio,
  }
}

export default useSocio
