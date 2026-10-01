import { useState, useEffect, useCallback } from 'react'
import { getDocumentos, createDocumento, deleteDocumento, getTiposDocumento, getEstadosDocumento } from '../api/documentacion'

export default function useDocumentacion(personaId = null) {
  const [documentos, setDocumentos] = useState([])
  const [tipos, setTipos] = useState([])
  const [estados, setEstados] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const cargarDatos = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [docsData, tiposData, estadosData] = await Promise.all([
        getDocumentos(personaId || ''),
        getTiposDocumento(),
        getEstadosDocumento()
      ])
      setDocumentos(docsData)
      setTipos(tiposData)
      setEstados(estadosData)
    } catch (err) {
      setError(err)
      console.error('Error cargando documentación:', err)
    } finally {
      setIsLoading(false)
    }
  }, [personaId])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  const subirDocumento = async (documentData) => {
    try {
      await createDocumento(documentData)
      await cargarDatos()
    } catch (err) {
      console.error('Error subiendo documento:', err)
      throw err
    }
  }

  const borrarDocumento = async (id) => {
    try {
      await deleteDocumento(id)
      await cargarDatos()
    } catch (err) {
      console.error('Error eliminando documento:', err)
      throw err
    }
  }

  // Utilidad para obtener nombre del tipo / estado (opcional)
  const getNombreTipo = (id) => {
    const t = tipos.find(x => String(x.id_tipo_documento) === String(id))
    return t ? t.nombre : '—'
  }

  const getNombreEstado = (id) => {
    const e = estados.find(x => String(x.id_estado_documento) === String(id))
    return e ? e.nombre : '—'
  }

  return {
    documentos,
    tipos,
    estados,
    isLoading,
    error,
    cargarDatos,
    subirDocumento,
    borrarDocumento,
    getNombreTipo,
    getNombreEstado
  }
}
