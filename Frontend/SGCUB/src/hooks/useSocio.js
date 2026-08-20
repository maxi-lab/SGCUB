import { useCallback, useEffect, useState } from 'react'
import { getSocios, postSocio } from '../api/socios'

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

  useEffect(() => {
    cargarSocios()
  }, [cargarSocios])

  return { socios, isLoading, error, recargarSocios: cargarSocios, crearSocio }
}

export default useSocio
