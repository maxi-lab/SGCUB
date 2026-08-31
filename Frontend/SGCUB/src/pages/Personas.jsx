import { useState } from 'react'
import AddPersonaModal from '../components/personas/AddPersonaModal'
import DeletePersonaModal from '../components/personas/DeletePersonaModal'
import PersonasTable from '../components/personas/PersonasTable'
import usePersonas from '../hooks/usePersonas'

function Personas() {
  const {
    personas,
    isLoading,
    error,
    crearPersona,
    modificarPersona,
    eliminarPersona,
  } = usePersonas()

  const [modalAbierto, setModalAbierto] = useState(false)
  const [personaAEliminar, setPersonaAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminacion, setErrorEliminacion] = useState('')
  const [personaEnEdicion, setPersonaEnEdicion] = useState(null)

  const [formulario, setFormulario] = useState({
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    email: '',
  })
  const [guardando, setGuardando] = useState(false)
  const [errorGuardado, setErrorGuardado] = useState('')

  const abrirModal = () => {
    setErrorGuardado('')
    setPersonaEnEdicion(null)
    setFormulario({ nombre: '', apellido: '', dni: '', telefono: '', email: '' })
    setModalAbierto(true)
  }

  const abrirEdicion = (persona) => {
    setErrorGuardado('')
    setPersonaEnEdicion(persona)
    setFormulario({
      nombre: persona.nombre,
      apellido: persona.apellido,
      dni: persona.dni,
      telefono: persona.telefono,
      email: persona.email || '',
    })
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    if (!guardando) {
      setModalAbierto(false)
    }
  }

  const actualizarCampo = (campo, valor) => {
    setFormulario((formularioActual) => ({
      ...formularioActual,
      [campo]: valor,
    }))
  }

  const guardarPersona = async (event) => {
    event.preventDefault()
    setGuardando(true)
    setErrorGuardado('')

    try {
      if (personaEnEdicion) {
        await modificarPersona(personaEnEdicion.persona_id, formulario)
      } else {
        await crearPersona(formulario)
      }
      setFormulario({ nombre: '', apellido: '', dni: '', telefono: '', email: '' })
      setPersonaEnEdicion(null)
      setModalAbierto(false)
    } catch (requestError) {
      setErrorGuardado(
        Object.values(requestError.response?.data || {})
          .flat()
          .join(' ') ||
          (personaEnEdicion
            ? 'No se pudo modificar la persona.'
            : 'No se pudo agregar la persona.'),
      )
    } finally {
      setGuardando(false)
    }
  }

  const borrarPersona = async (persona) => {
    setErrorEliminacion('')
    setPersonaAEliminar(persona)
  }

  const confirmarEliminacion = async () => {
    setEliminando(true)
    setErrorEliminacion('')

    try {
      await eliminarPersona(personaAEliminar.persona_id)
      setPersonaAEliminar(null)
    } catch (requestError) {
      setErrorEliminacion(
        requestError.response?.data?.detail || 'No se pudo eliminar la persona.',
      )
    } finally {
      setEliminando(false)
    }
  }

  return (
    <>
      <section className="padron-table-section" aria-label="Personas">
        <PersonasTable
          data={personas}
          isLoading={isLoading}
          error={error}
          onAdd={abrirModal}
          onEdit={abrirEdicion}
          onDelete={borrarPersona}
        />
      </section>

      <AddPersonaModal
        opened={modalAbierto}
        onClose={cerrarModal}
        onSubmit={guardarPersona}
        formulario={formulario}
        onChange={actualizarCampo}
        loading={guardando}
        error={errorGuardado}
        editing={Boolean(personaEnEdicion)}
      />

      <DeletePersonaModal
        opened={Boolean(personaAEliminar)}
        onClose={() => {
          if (!eliminando) {
            setPersonaAEliminar(null)
          }
        }}
        onConfirm={confirmarEliminacion}
        persona={personaAEliminar}
        loading={eliminando}
        error={errorEliminacion}
      />
    </>
  )
}

export default Personas

