import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/conf'
import { deleteDocente, getDocente, patchDocente } from '../api/docentes'
import { docenteCategoriaByDocente } from '../api/docenteCategoria'
import DeleteDocenteModal from '../components/docentes/DeleteDocenteModal'
import EditDocenteModal from '../components/docentes/EditDocenteModal'
import PersonHeader, { EditButton, DeleteButton } from '../components/personas/HeaderPersona'
import PersonTabs from '../components/personas/TabsNavPersonas'
import PersonalDataTab from '../components/personas/tabs/PersonalDataTab'
import { LoadingFile, ErrorFile } from '../components/personas/FileStatus'
import { yearsSince, formatDni, formatDate, getErrorMessage, yearsText } from '../components/personas/format'
import useGeneros from '../hooks/useGeneros'
import useLocalidades from '../hooks/useLocalidades'

const formularioDesdeDocente = (docente) => {
  const persona = docente.persona_detalle ?? {}
  return {
    nombre: persona.nombre ?? '',
    apellido: persona.apellido ?? '',
    dni: persona.dni ?? '',
    email: persona.email ?? '',
    telefono: persona.telefono ?? '',
    fecha_nacimiento: persona.fecha_nacimiento ?? '',
    genero: persona.genero ? String(persona.genero) : '',
    genero_otro: persona.genero_otro ?? '',
    domicilio_calle: persona.domicilio_calle ?? '',
    domicilio_numero: persona.domicilio_numero ?? '',
    domicilio_piso: persona.domicilio_piso ?? '',
    domicilio_departamento: persona.domicilio_departamento ?? '',
    domicilio_entre_calle_1: persona.domicilio_entre_calle_1 ?? '',
    domicilio_entre_calle_2: persona.domicilio_entre_calle_2 ?? '',
    domicilio_barrio: persona.domicilio_barrio ?? '',
    domicilio_localidad: persona.domicilio_localidad ? String(persona.domicilio_localidad) : '',
    legajo: docente.legajo ?? '',
    fecha_ingreso: docente.fecha_ingreso ?? '',
  }
}

function DocenteDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { generos } = useGeneros()
  const { localidades } = useLocalidades()

  // Guarda el id cargado para derivar "cargando" sin setState síncrono en el effect.
  const [carga, setCarga] = useState({ id: null, docente: null, categorias: [], error: null })
  const loading = carga.id !== id
  const { docente, categorias, error } = carga
  const setDocente = (datos) => setCarga((actual) => ({ ...actual, docente: datos }))

  const [modalEdicionAbierto, setModalEdicionAbierto] = useState(false)
  const [guardandoEdicion, setGuardandoEdicion] = useState(false)
  const [errorEdicion, setErrorEdicion] = useState('')
  const [formulario, setFormulario] = useState(null)

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

  const abrirModalEdicion = () => {
    setErrorEdicion('')
    setFormulario(formularioDesdeDocente(docente))
    setModalEdicionAbierto(true)
  }

  const guardarEdicion = async (event) => {
    event.preventDefault()
    setGuardandoEdicion(true)
    setErrorEdicion('')
    try {
      const { legajo, fecha_ingreso, ...datosPersona } = formulario
      await api.patch(`padron/persona/${docente.persona}/`, {
        ...datosPersona,
        fecha_nacimiento: datosPersona.fecha_nacimiento || null,
        genero: datosPersona.genero || null,
        domicilio_localidad: datosPersona.domicilio_localidad || null,
      })
      await patchDocente(docente.docente_id, {
        legajo: Number(legajo),
        ...(fecha_ingreso ? { fecha_ingreso } : {}),
      })
      setDocente(await getDocente(docente.docente_id))
      setModalEdicionAbierto(false)
    } catch (requestError) {
      setErrorEdicion(getErrorMessage(requestError, 'No se pudo editar el docente.'))
    } finally {
      setGuardandoEdicion(false)
    }
  }

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
  ]

  return (
    <div className="flex flex-col w-full pb-8">
      <PersonHeader
        breadcrumb={[
          { label: 'Personas' },
          { label: 'Docentes', to: '/padron/docentes' },
          { label: `Legajo #${docente.legajo}` },
        ]}
        nombre={persona.nombre}
        apellido={persona.apellido}
        metadata={[
          { label: 'DNI', value: formatDni(persona.dni) },
          { label: 'Legajo', value: `#${docente.legajo}`, highlighted: true },
          { label: 'Fecha de ingreso', value: formatDate(docente.fecha_ingreso) },
          { label: 'Antigüedad', value: yearsText(yearsSince(docente.fecha_ingreso)) },
          ...(nombresCategorias ? [{ label: 'Categorías', value: nombresCategorias }] : []),
        ]}
        actions={(
          <>
            <EditButton onClick={abrirModalEdicion} />
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

      {formulario && (
        <EditDocenteModal
          opened={modalEdicionAbierto}
          onClose={() => !guardandoEdicion && setModalEdicionAbierto(false)}
          onSubmit={guardarEdicion}
          formulario={formulario}
          onChange={(campo, valor) => setFormulario((actual) => ({ ...actual, [campo]: valor }))}
          generos={generos}
          localidades={localidades}
          loading={guardandoEdicion}
          error={errorEdicion}
        />
      )}

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
