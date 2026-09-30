import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { activateDocente, deactivateDocente, getDocente } from '../api/docentes'
import { docenteCategoriaByDocente } from '../api/docenteCategoria'
import ActivateDocenteModal from '../components/docentes/ActivateDocenteModal'
import DeactivateDocenteModal from '../components/docentes/DeactivateDocenteModal'
import PersonHeader, { EditButton, DeactivateButton, ActivateButton } from '../components/personas/HeaderPersona'
import PersonTabs from '../components/personas/TabsNavPersonas'
import PersonalDataTab from '../components/personas/tabs/PersonalDataTab'
import CategoriesTab from '../components/personas/tabs/CategoriesTab'
import { LoadingFile, ErrorFile } from '../components/personas/FileStatus'
import { yearsSince, formatDni, formatDate, yearsText, isActiveStatus, getErrorMessage } from '../components/personas/format'
import useLocalidades from '../hooks/useLocalidades'

function DocenteDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { localidades } = useLocalidades()

  const [carga, setCarga] = useState({ id: null, docente: null, categorias: [], error: null })
  const loading = carga.id !== id
  const { docente, categorias, error } = carga

  const [modalBajaAbierto, setModalBajaAbierto] = useState(false)
  const [dandoDeBaja, setDandoDeBaja] = useState(false)
  const [errorBaja, setErrorBaja] = useState('')
  const [modalAltaAbierto, setModalAltaAbierto] = useState(false)
  const [dandoDeAlta, setDandoDeAlta] = useState(false)
  const [errorAlta, setErrorAlta] = useState('')

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

  const confirmarBaja = async () => {
    setDandoDeBaja(true)
    setErrorBaja('')
    try {
      await deactivateDocente(docente.docente_id)
      setModalBajaAbierto(false)
      navigate('/padron/docentes')
    } catch (requestError) {
      setErrorBaja(requestError.response?.data?.detail || 'No se pudo dar de baja el docente.')
    } finally {
      setDandoDeBaja(false)
    }
  }

  const confirmarAlta = async () => {
    setDandoDeAlta(true)
    setErrorAlta('')
    try {
      const actualizado = await activateDocente(docente.docente_id)
      setCarga((actual) => ({ ...actual, docente: actualizado }))
      setModalAltaAbierto(false)
    } catch (requestError) {
      setErrorAlta(getErrorMessage(requestError, 'No se pudo dar de alta el docente.'))
    } finally {
      setDandoDeAlta(false)
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
  const nombresCargos = (docente.asignaciones ?? []).map((asignacion) => asignacion.cargo_nombre).filter(Boolean).join(', ')
  const activo = isActiveStatus(docente.estado_nombre)

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
        status={docente.estado_nombre ? { label: docente.estado_nombre, isActive: activo } : null}
        metadata={[
          { label: 'DNI', value: formatDni(persona.dni) },
          { label: 'Legajo', value: `#${docente.legajo}`, highlighted: true },
          { label: 'Fecha de ingreso', value: formatDate(docente.fecha_ingreso) },
          { label: 'Antigüedad', value: yearsText(yearsSince(docente.fecha_ingreso)) },
          ...(nombresCargos ? [{ label: 'Cargos', value: nombresCargos }] : []),
        ]}
        actions={activo ? (
          <>
            <EditButton onClick={() => navigate(`/padron/docentes/${docente.docente_id}/editar`)} />
            <DeactivateButton
              onClick={() => {
                setErrorBaja('')
                setModalBajaAbierto(true)
              }}
            />
          </>
        ) : (
          <ActivateButton
            onClick={() => {
              setErrorAlta('')
              setModalAltaAbierto(true)
            }}
          />
        )}
      />

      <PersonTabs tabs={tabs} />

      <ActivateDocenteModal
        opened={modalAltaAbierto}
        onClose={() => !dandoDeAlta && setModalAltaAbierto(false)}
        onConfirm={confirmarAlta}
        docente={docente}
        loading={dandoDeAlta}
        error={errorAlta}
      />

      <DeactivateDocenteModal
        opened={modalBajaAbierto}
        onClose={() => !dandoDeBaja && setModalBajaAbierto(false)}
        onConfirm={confirmarBaja}
        docente={docente}
        loading={dandoDeBaja}
        error={errorBaja}
      />
    </div>
  )
}

export default DocenteDetail
