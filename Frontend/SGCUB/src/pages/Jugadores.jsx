import { useState } from 'react'
import AddJugadorModal from '../components/jugadores/AddJugadorModal'
import EditJugadorModal from '../components/jugadores/EditJugadorModal'
import DeleteJugadorModal from '../components/jugadores/DeleteJugadorModal'
import JugadoresTable from '../components/jugadores/JugadoresTable'
import useCategorias from '../hooks/useCategorias'
import useEstados from '../hooks/useEstados'
import useJugadores from '../hooks/useJugadores'
import useSocio from '../hooks/useSocio'

const formularioInicial = () => ({
  modo_socio: 'existente',
  socio: null,
  nuevo_socio: {
    nombre: '',
    apellido: '',
    dni: '',
    telefono: '',
    email: '',
  },
  categoria: null,
  estado: null,
  obra_social: '',
  tallaIndumentaria: '',
  contactos_emergencia: [],
})

function Jugadores() {
  const { jugadores, isLoading, error, crearJugador, editarJugador, eliminarJugador } = useJugadores()
  const { socios } = useSocio()
  const { categorias } = useCategorias()
  const { estados } = useEstados()
  const [modalAbierto, setModalAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorGuardado, setErrorGuardado] = useState('')
  const [jugadorAEditar, setJugadorAEditar] = useState(null)
  const [editando, setEditando] = useState(false)
  const [errorEdicion, setErrorEdicion] = useState('')
  const [jugadorAEliminar, setJugadorAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminacion, setErrorEliminacion] = useState('')
  const [formulario, setFormulario] = useState(formularioInicial)

  const actualizarCampo = (campo, valor) => setFormulario((actual) => ({ ...actual, [campo]: valor }))

  const abrirModal = () => {
    setErrorGuardado('')
    setFormulario(formularioInicial())
    setModalAbierto(true)
  }

  const abrirModalEdicion = (jugador) => {
    setErrorEdicion('')
    setJugadorAEditar(jugador)
    setFormulario({
      socio: String(jugador.socio?.socio_id ?? ''),
      nuevo_socio: {
        nombre: jugador.socio?.nombre ?? '',
        apellido: jugador.socio?.apellido ?? '',
        dni: jugador.socio?.dni ?? '',
        telefono: jugador.socio?.telefono ?? '',
        email: jugador.socio?.email ?? '',
      },
      categoria: String(jugador.categoria?.categoria_id ?? ''),
      estado: String(jugador.estado?.estado_id ?? ''),
      obra_social: jugador.obra_social ?? '',
      tallaIndumentaria: jugador.tallaIndumentaria ?? '',
      contactos_emergencia: jugador.contactos_emergencia ?? [],
    })
  }

  const guardarJugador = async (event) => {
    event.preventDefault()
    setGuardando(true)
    setErrorGuardado('')

    const payload = {
      categoria: formulario.categoria,
      estado: formulario.estado,
      obra_social: formulario.obra_social,
      tallaIndumentaria: formulario.tallaIndumentaria,
      contactos_emergencia: formulario.contactos_emergencia,
    }

    if (formulario.modo_socio === 'nuevo') {
      payload.nuevo_socio = formulario.nuevo_socio
    } else {
      payload.socio = formulario.socio
    }

    try {
      await crearJugador(payload)
      setFormulario(formularioInicial())
      setModalAbierto(false)
    } catch (requestError) {
      const errorData = requestError.response?.data
      let errorMsg = 'No se pudo agregar el jugador.'
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

    const payload = {
      socio: formulario.socio,
      categoria: formulario.categoria,
      estado: formulario.estado,
      obra_social: formulario.obra_social,
      tallaIndumentaria: formulario.tallaIndumentaria,
      contactos_emergencia: formulario.contactos_emergencia,
    }

    try {
      await editarJugador(jugadorAEditar.jugador_id, payload)
      setJugadorAEditar(null)
    } catch (requestError) {
      const errorData = requestError.response?.data
      let errorMsg = 'No se pudo editar el jugador.'
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
      await eliminarJugador(jugadorAEliminar.jugador_id)
      setJugadorAEliminar(null)
    } catch (requestError) {
      setErrorEliminacion(requestError.response?.data?.detail || 'No se pudo eliminar el jugador.')
    } finally {
      setEliminando(false)
    }
  }

  return (
    <section className="padron-section">
      <section className="padron-table-section" aria-label="Jugadores">
        <JugadoresTable
          data={jugadores}
          isLoading={isLoading}
          error={error}
          onAdd={abrirModal}
          onEdit={abrirModalEdicion}
          onDelete={setJugadorAEliminar}
        />
      </section>

      <AddJugadorModal
        opened={modalAbierto}
        onClose={() => !guardando && setModalAbierto(false)}
        onSubmit={guardarJugador}
        formulario={formulario}
        onChange={actualizarCampo}
        socios={socios}
        jugadores={jugadores}
        categorias={categorias}
        estados={estados}
        loading={guardando}
        error={errorGuardado}
      />

      <EditJugadorModal
        opened={Boolean(jugadorAEditar)}
        onClose={() => !editando && setJugadorAEditar(null)}
        onSubmit={guardarEdicion}
        formulario={formulario}
        onChange={actualizarCampo}
        socios={socios}
        jugadores={jugadores}
        categorias={categorias}
        estados={estados}
        loading={editando}
        error={errorEdicion}
      />

      <DeleteJugadorModal
        opened={Boolean(jugadorAEliminar)}
        onClose={() => !eliminando && setJugadorAEliminar(null)}
        onConfirm={confirmarEliminacion}
        jugador={jugadorAEliminar}
        loading={eliminando}
        error={errorEliminacion}
      />
    </section>
  )
}

export default Jugadores
