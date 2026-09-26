import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { deleteDocente, getDocente } from '../api/docentes'
import { docenteCategoriaByDocente } from '../api/docenteCategoria'
import DeleteDocenteModal from '../components/docentes/DeleteDocenteModal'
import PersonHeader, { EditButton, DeleteButton } from '../components/personas/HeaderPersona'
import PersonTabs from '../components/personas/TabsNavPersonas'
import PersonalDataTab from '../components/personas/tabs/PersonalDataTab'
import CategoriesTab from '../components/personas/tabs/CategoriesTab'
import { LoadingFile, ErrorFile } from '../components/personas/FileStatus'
import { yearsSince, formatDni, formatDate, yearsText } from '../components/personas/format'
import useLocalidades from '../hooks/useLocalidades'

function DocenteDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { localidades } = useLocalidades()

  // Guarda el id cargado para derivar "cargando" sin setState síncrono en el effect.
  const [carga, setCarga] = useState({ id: null, docente: null, categorias: [], error: null })
  const loading = carga.id !== id
  const { docente, categorias, error } = carga

  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminacion, setErrorEliminacion] = useState('')

  const cargarDetalle = useCallback(async () => {
    const [datosDocente, asignaciones] = await Promise.all([
      getDocente(id),
      docenteCategoriaByDocente(id).catch(() => []),
    ])
    return { datosDocente, asignaciones }
  }, [id])

  useEffect(() => {
    let activo = true
    cargarDetalle()
      .then(({ datosDocente, asignaciones }) => {
        if (activo) setCarga({ id, docente: datosDocente, categorias: asignaciones, error: null })
      })
      .catch((requestError) => {
        if (activo) setCarga({ id, docente: null, categorias: [], error: requestError.response?.data?.detail || 'No se pudo cargar la información del docente.' })
      })
    return () => { activo = false }
  }, [cargarDetalle, id])

  const confirmarEliminacion = async () => {
    setEliminando(true)
    setErrorEliminacion('')
    try {
      await deleteDocente(docente.docente_id)
      setModalEliminarAbierto(false)
      navigate('/padron/docentes')
    } catch (requestError) {
      setErrorEliminacion(requestError.response?.data?.detail || 'No se pudo eliminar el docente.')
    } finally {
      setEliminando(false)
    }
  }

  if (loading) return <LoadingFile text="Cargando detalle del docente..." />
  if (error || !docente) {
    return (
      <ErrorFile
        message={error || 'El docente solicitado no existe.'}
        backTo="/padron/docentes"
        backText="Volver a docentes"
      />
    )
  }

  const persona = docente.persona_detalle ?? {}
  const nombresCategorias = categorias.map((c) => c.categoria?.nombre).filter(Boolean).join(', ')

  const tabs = [
    {
      id: 'datos-personales',
      label: 'Datos personales',
      icon: 'person',
      content: <PersonalDataTab persona={persona} localidades={localidades} />,
    },
    {
      id: 'categorias',
      label: 'Categorías',
      icon: 'groups',
      content: <CategoriesTab assignments={categorias} />,
    },
  ]

  return (
    <div className="flex flex-col w-full pb-8">
      <PersonHeader
        breadcrumb={[
          { label: 'Personas' },
          { label: 'Docentes', to: '/padron/docentes' },
          { label: `Legajo #${docente.legajo}` },
        ]}
        name={persona.nombre}
        surname={persona.apellido}
        metadata={[
          { label: 'DNI', value: formatDni(persona.dni) },
          { label: 'Legajo', value: `#${docente.legajo}`, highlighted: true },
          { label: 'Fecha de ingreso', value: formatDate(docente.fecha_ingreso) },
          { label: 'Antigüedad', value: yearsText(yearsSince(docente.fecha_ingreso)) },
          ...(nombresCategorias ? [{ label: 'Categorías', value: nombresCategorias }] : []),
        ]}
        actions={(
          <>
            <EditButton onClick={() => navigate(`/padron/docentes/${docente.docente_id}/editar`)} />
            <DeleteButton
              onClick={() => {
                setErrorEliminacion('')
                setModalEliminarAbierto(true)
              }}
            />
          </>
        )}
      />

      <PersonTabs tabs={tabs} />

      <DeleteDocenteModal
        opened={modalEliminarAbierto}
        onClose={() => !eliminando && setModalEliminarAbierto(false)}
        onConfirm={confirmarEliminacion}
        docente={docente}
        loading={eliminando}
        error={errorEliminacion}
      />
    </div>
  )
}

export default DocenteDetail
