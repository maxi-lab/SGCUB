import { useState } from 'react'
import { api } from '../api/conf'
import AddDocenteModal from '../components/docentes/AddDocenteModal'
import EditDocenteModal from '../components/docentes/EditDocenteModal'
import DeleteDocenteModal from '../components/docentes/DeleteDocenteModal'
import DocentesTable from '../components/docentes/DocentesTable'
import useDocentes from '../hooks/useDocentes'

const formularioInicial = () => ({
  nombre: '', apellido: '', dni: '', email: '', legajo: '', persona: null,
})

function Docentes() {
  const { docentes, isLoading, error, crearDocente, editarDocente, eliminarDocente } = useDocentes()
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
      legajo: docente.legajo ?? '',
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
          })
          personaId = personaResponse.data.persona_id
        }
      }
      await crearDocente({ persona: personaId, legajo: Number(formulario.legajo) })
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
      await editarDocente(docenteAEditar.docente_id, { legajo: Number(formulario.legajo) })
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
