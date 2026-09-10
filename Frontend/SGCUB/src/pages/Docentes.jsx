import { useState } from 'react'
import { api } from '../api/conf'
import AddDocenteModal from '../components/docentes/AddDocenteModal'
import EditDocenteModal from '../components/docentes/EditDocenteModal'
import DeleteDocenteModal from '../components/docentes/DeleteDocenteModal'
import DocentesTable from '../components/docentes/DocentesTable'
import useDocentes from '../hooks/useDocentes'
import useGeneros from '../hooks/useGeneros'
import useLocalidades from '../hooks/useLocalidades'

const formularioInicial = () => ({
  nombre: '', apellido: '', dni: '', email: '', telefono: '',
  fecha_nacimiento: '', genero: '', genero_otro: '',
  domicilio_calle: '', domicilio_numero: '', domicilio_piso: '',
  domicilio_departamento: '', domicilio_entre_calle_1: '', domicilio_entre_calle_2: '',
  domicilio_barrio: '', domicilio_localidad: '', legajo: '', fecha_ingreso: '', persona: null,
})

function Docentes() {
  const { docentes, isLoading, error, crearDocente, editarDocente, eliminarDocente } = useDocentes()
  const { generos } = useGeneros()
  const { localidades } = useLocalidades()
  const [modalAbierto, setModalAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorGuardado, setErrorGuardado] = useState('')
  const [docenteAEditar, setDocenteAEditar] = useState(null)
  const [editando, setEditando] = useState(false)
  const [errorEdicion, setErrorEdicion] = useState('')
  const [docenteAEliminar, setDocenteAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminacion, setErrorEliminacion] = useState('')
  const [formulario, setFormulario] = useState(formularioInicial)

  const actualizarCampo = (campo, valor) => setFormulario((actual) => ({ ...actual, [campo]: valor }))

  const abrirModal = () => {
    setErrorGuardado('')
    setFormulario(formularioInicial())
    setModalAbierto(true)
  }

  const abrirModalEdicion = (docente) => {
    setErrorEdicion('')
    setDocenteAEditar(docente)
    setFormulario({
      nombre: docente.persona_detalle?.nombre ?? '',
      apellido: docente.persona_detalle?.apellido ?? '',
      dni: docente.persona_detalle?.dni ?? '',
      email: docente.persona_detalle?.email ?? '',
      telefono: docente.persona_detalle?.telefono ?? '',
      fecha_nacimiento: docente.persona_detalle?.fecha_nacimiento ?? '',
      genero: docente.persona_detalle?.genero ? String(docente.persona_detalle.genero) : '',
      genero_otro: docente.persona_detalle?.genero_otro ?? '',
      domicilio_calle: docente.persona_detalle?.domicilio_calle ?? '',
      domicilio_numero: docente.persona_detalle?.domicilio_numero ?? '',
      domicilio_piso: docente.persona_detalle?.domicilio_piso ?? '',
      domicilio_departamento: docente.persona_detalle?.domicilio_departamento ?? '',
      domicilio_entre_calle_1: docente.persona_detalle?.domicilio_entre_calle_1 ?? '',
      domicilio_entre_calle_2: docente.persona_detalle?.domicilio_entre_calle_2 ?? '',
      domicilio_barrio: docente.persona_detalle?.domicilio_barrio ?? '',
      domicilio_localidad: docente.persona_detalle?.domicilio_localidad ? String(docente.persona_detalle.domicilio_localidad) : '',
      legajo: docente.legajo ?? '',
      fecha_ingreso: docente.fecha_ingreso ?? '',
      persona: docente.persona ?? null,
    })
  }

  const guardarDocente = async (event) => {
    event.preventDefault()
    setGuardando(true)
    setErrorGuardado('')

    try {
      let personaId = formulario.persona
      if (!personaId) {
        const personasResponse = await api.get(`padron/persona/?dni=${encodeURIComponent(formulario.dni)}`)
        const personaExistente = personasResponse.data?.[0]

        if (personaExistente) {
          personaId = personaExistente.persona_id
        } else {
          const personaResponse = await api.post('padron/persona/', {
            nombre: formulario.nombre,
            apellido: formulario.apellido,
            dni: formulario.dni,
            email: formulario.email,
            telefono: formulario.telefono,
            fecha_nacimiento: formulario.fecha_nacimiento || null,
            genero: formulario.genero || null,
            genero_otro: formulario.genero_otro || '',
            domicilio_calle: formulario.domicilio_calle,
            domicilio_numero: formulario.domicilio_numero,
            domicilio_piso: formulario.domicilio_piso,
            domicilio_departamento: formulario.domicilio_departamento,
            domicilio_entre_calle_1: formulario.domicilio_entre_calle_1,
            domicilio_entre_calle_2: formulario.domicilio_entre_calle_2,
            domicilio_barrio: formulario.domicilio_barrio,
            domicilio_localidad: formulario.domicilio_localidad || null,
          })
          personaId = personaResponse.data.persona_id
        }
      }
      await crearDocente({
        persona: personaId,
        legajo: Number(formulario.legajo),
        ...(formulario.fecha_ingreso ? { fecha_ingreso: formulario.fecha_ingreso } : {}),
      })
      setFormulario(formularioInicial())
      setModalAbierto(false)
    } catch (requestError) {
      const errorData = requestError.response?.data
      let errorMsg = 'No se pudo agregar el docente.'
      if (errorData) {
        if (typeof errorData === 'string') {
          errorMsg = errorData
        } else if (errorData.detail) {
          errorMsg = errorData.detail
        } else {
          errorMsg = Object.entries(errorData)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : typeof v === 'object' ? JSON.stringify(v) : v}`)
            .join(' | ')
        }
      }
      setErrorGuardado(errorMsg)
    } finally {
      setGuardando(false)
    }
  }

  const guardarEdicion = async (event) => {
    event.preventDefault()
    setEditando(true)
    setErrorEdicion('')

    try {
      await api.patch(`padron/persona/${formulario.persona}/`, {
        nombre: formulario.nombre,
        apellido: formulario.apellido,
        dni: formulario.dni,
        email: formulario.email,
        telefono: formulario.telefono,
        fecha_nacimiento: formulario.fecha_nacimiento || null,
        genero: formulario.genero || null,
        genero_otro: formulario.genero_otro || '',
        domicilio_calle: formulario.domicilio_calle,
        domicilio_numero: formulario.domicilio_numero,
        domicilio_piso: formulario.domicilio_piso,
        domicilio_departamento: formulario.domicilio_departamento,
        domicilio_entre_calle_1: formulario.domicilio_entre_calle_1,
        domicilio_entre_calle_2: formulario.domicilio_entre_calle_2,
        domicilio_barrio: formulario.domicilio_barrio,
        domicilio_localidad: formulario.domicilio_localidad || null,
      })
      await editarDocente(docenteAEditar.docente_id, {
        legajo: Number(formulario.legajo),
        ...(formulario.fecha_ingreso ? { fecha_ingreso: formulario.fecha_ingreso } : {}),
      })
      setDocenteAEditar(null)
    } catch (requestError) {
      const errorData = requestError.response?.data
      let errorMsg = 'No se pudo editar el docente.'
      if (errorData) {
        if (typeof errorData === 'string') {
          errorMsg = errorData
        } else if (errorData.detail) {
          errorMsg = errorData.detail
        } else {
          errorMsg = Object.entries(errorData)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : typeof v === 'object' ? JSON.stringify(v) : v}`)
            .join(' | ')
        }
      }
      setErrorEdicion(errorMsg)
    } finally {
      setEditando(false)
    }
  }

  const confirmarEliminacion = async () => {
    setEliminando(true)
    setErrorEliminacion('')
    try {
      await eliminarDocente(docenteAEliminar.docente_id)
      setDocenteAEliminar(null)
    } catch (requestError) {
      setErrorEliminacion(requestError.response?.data?.detail || 'No se pudo eliminar el docente.')
    } finally {
      setEliminando(false)
    }
  }

  return (
    <section className="padron-section">
      <section className="padron-table-section" aria-label="Docentes">
        <DocentesTable
          data={docentes}
          isLoading={isLoading}
          error={error}
          onAdd={abrirModal}
          onEdit={abrirModalEdicion}
          onDelete={setDocenteAEliminar}
        />
      </section>

      <AddDocenteModal
        opened={modalAbierto}
        onClose={() => !guardando && setModalAbierto(false)}
        onSubmit={guardarDocente}
        formulario={formulario}
        onChange={actualizarCampo}
        docentes={docentes}
        generos={generos}
        localidades={localidades}
        loading={guardando}
        error={errorGuardado}
      />

      <EditDocenteModal
        opened={Boolean(docenteAEditar)}
        onClose={() => !editando && setDocenteAEditar(null)}
        onSubmit={guardarEdicion}
        formulario={formulario}
        onChange={actualizarCampo}
        docentes={docentes}
        generos={generos}
        localidades={localidades}
        loading={editando}
        error={errorEdicion}
      />

      <DeleteDocenteModal
        opened={Boolean(docenteAEliminar)}
        onClose={() => !eliminando && setDocenteAEliminar(null)}
        onConfirm={confirmarEliminacion}
        docente={docenteAEliminar}
        loading={eliminando}
        error={errorEliminacion}
      />
    </section>
  )
}

export default Docentes
