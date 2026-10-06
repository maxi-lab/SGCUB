import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/conf'

const ordenarPorNombre = (barrios) => [...barrios].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))

function useBarrios(localidadId) {
  const [cargados, setCargados] = useState({ localidadId: null, barrios: [] })

  useEffect(() => {
    if (!localidadId) return undefined
    let activo = true
    api.get('padron/barrio/', { params: { localidad: localidadId } })
      .then((response) => {
        if (activo) setCargados({ localidadId, barrios: response.data })
      })
      .catch(() => {
        if (activo) setCargados({ localidadId, barrios: [] })
      })
    return () => { activo = false }
  }, [localidadId])

  const crearBarrio = useCallback(async (nombre) => {
    const barrio = (await api.post('padron/barrio/', { nombre, localidad: localidadId })).data
    setCargados((actual) => {
      if (actual.localidadId !== localidadId || actual.barrios.some((b) => b.barrio_id === barrio.barrio_id)) return actual
      return { ...actual, barrios: ordenarPorNombre([...actual.barrios, barrio]) }
    })
    return barrio
  }, [localidadId])

  const barrios = cargados.localidadId === localidadId ? cargados.barrios : []

  return { barrios, crearBarrio }
}

export default useBarrios
