import { useEffect, useRef, useState } from 'react'
import { api } from '../api/conf'

const MIN_DIGITOS_BUSQUEDA = 5
const DEMORA_BUSQUEDA_MS = 300

const CAMPOS_EDITABLES_SOCIO = ['telefono', 'email']

export const campoBloqueadoPorSocio = (datosSocio, campo) => Boolean(datosSocio)
  && campo in datosSocio
  && !CAMPOS_EDITABLES_SOCIO.includes(campo)
  && String(datosSocio[campo] ?? '').trim() !== ''

function usePersonaSearchDNI({ habilitada }) {
  const [coincidencias, setCoincidencias] = useState([])
  const [buscando, setBuscando] = useState(false)
  const [abiertas, setAbiertas] = useState(false)
  const temporizador = useRef(null)
  const ultimaBusqueda = useRef(0)

  useEffect(() => () => clearTimeout(temporizador.current), [])

  const buscar = (dni) => {
    clearTimeout(temporizador.current)
    const busquedaId = ++ultimaBusqueda.current
    setAbiertas(true)
    if (!habilitada || dni.length < MIN_DIGITOS_BUSQUEDA) {
      setCoincidencias([])
      setBuscando(false)
      return
    }
    setBuscando(true)
    temporizador.current = setTimeout(async () => {
      try {
        const response = await api.get(`padron/persona/?dni_prefix=${encodeURIComponent(dni)}`)
        if (busquedaId === ultimaBusqueda.current) setCoincidencias(response.data ?? [])
      } catch (requestError) {
        console.error('Error al buscar persona:', requestError)
        if (busquedaId === ultimaBusqueda.current) setCoincidencias([])
      } finally {
        if (busquedaId === ultimaBusqueda.current) setBuscando(false)
      }
    }, DEMORA_BUSQUEDA_MS)
  }

  const limpiar = () => {
    clearTimeout(temporizador.current)
    ultimaBusqueda.current += 1
    setCoincidencias([])
    setBuscando(false)
  }

  return { coincidencias, buscando, abiertas, setAbiertas, buscar, limpiar }
}

export default usePersonaSearchDNI
