import { useState } from 'react'
import AddJugadorModal from '../components/jugadores/AddJugadorModal'
import DeleteJugadorModal from '../components/jugadores/DeleteJugadorModal'
import EditJugadorModal from '../components/jugadores/EditJugadorModal'
import JugadoresTable from '../components/jugadores/JugadoresTable'
import useCategorias from '../hooks/useCategorias'
import useEstados from '../hooks/useEstados'
import useJugadores from '../hooks/useJugadores'
import useSocio from '../hooks/useSocio'

function Jugadores() {
  const {
    jugadores,
    isLoading,
    error,
    crearJugador,
    editarJugador,
    eliminarJugador,
  } = useJugadores()
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
  const [formulario, setFormulario] = useState({
    socio: null,
    categoria: null,
    estado: null,
    obra_social: '',
    tallaIndumentaria: '',
    contactoEmergencia: '',
  })

  const actualizarCampo = (campo, valor) => {
    setFormulario((formularioActual) => ({
      ...formularioActual,
      [campo]: valor,
    }))
  }

  const abrirModal = () => {
    setErrorGuardado('')
    setFormulario({
      socio: null,
      categoria: null,
      estado: null,
      obra_social: '',
      tallaIndumentaria: '',
      contactoEmergencia: '',
    })
    setModalAbierto(true)
  }

  const abrirModalEdicion = (jugador) => {
    setErrorEdicion('')
    setJugadorAEditar(jugador)
    setFormulario({
      socio: String(jugador.socio?.socio_id ?? ''),
      categoria: String(jugador.categoria?.categoria_id ?? ''),
      estado: String(jugador.estado?.estado_id ?? ''),
      obra_social: jugador.obra_social ?? '',
      tallaIndumentaria: jugador.tallaIndumentaria ?? '',
      contactoEmergencia: jugador.contactoEmergencia ?? '',
    })
  }

  const cerrarModalEdicion = () => {
    if (!editando) {
      setJugadorAEditar(null)
    }
  }

  const cerrarModal = () => {
    if (!guardando) {
      setModalAbierto(false)
    }
  }

  const guardarJugador = async (event) => {
    event.preventDefault()
    setGuardando(true)
    setErrorGuardado('')

    try {
      await crearJugador(formulario)
      setFormulario({
        socio: null,
        categoria: null,
        estado: null,
        obra_social: '',
        tallaIndumentaria: '',
        contactoEmergencia: '',
      })
      setModalAbierto(false)
    } catch (requestError) {
      setErrorGuardado(
        requestError.response?.data?.socio?.[0] ||
          requestError.response?.data?.categoria?.[0] ||
          requestError.response?.data?.estado?.[0] ||
          requestError.response?.data?.detail ||
          'No se pudo agregar el jugador.',
      )
    } finally {
      setGuardando(false)
    }
  }

  const guardarEdicion = async (event) => {
    event.preventDefault()
    setEditando(true)
    setErrorEdicion('')

    try {
      await editarJugador(jugadorAEditar.jugador_id, {
        socio: formulario.socio,
        categoria: formulario.categoria,
        estado: formulario.estado,
        obra_social: formulario.obra_social,
        tallaIndumentaria: formulario.tallaIndumentaria,
        contactoEmergencia: formulario.contactoEmergencia,
      })
      setJugadorAEditar(null)
    } catch (requestError) {
      setErrorEdicion(
        requestError.response?.data?.socio_id?.[0] ||
          requestError.response?.data?.estado?.[0] ||
          requestError.response?.data?.categoria?.[0] ||
          requestError.response?.data?.socio?.[0] ||
          requestError.response?.data?.detail ||
          'No se pudo editar el jugador.',
      )
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
      setErrorEliminacion(
        requestError.response?.data?.detail || 'No se pudo eliminar el jugador.',
      )
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
        onClose={cerrarModal}
        onSubmit={guardarJugador}
        formulario={formulario}
        onChange={actualizarCampo}
        socios={socios}
        categorias={categorias}
        estados={estados}
        loading={guardando}
        error={errorGuardado}
      />
      <EditJugadorModal
        opened={Boolean(jugadorAEditar)}
        onClose={cerrarModalEdicion}
        onSubmit={guardarEdicion}
        formulario={formulario}
        onChange={actualizarCampo}
        socios={socios}
        categorias={categorias}
        estados={estados}
        loading={editando}
        error={errorEdicion}
      />
      <DeleteJugadorModal
        opened={Boolean(jugadorAEliminar)}
        onClose={() => {
          if (!eliminando) {
            setJugadorAEliminar(null)
          }
        }}
        onConfirm={confirmarEliminacion}
        jugador={jugadorAEliminar}
        loading={eliminando}
        error={errorEliminacion}
      />
    </section>
  )
}

export default Jugadores
