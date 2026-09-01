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
  socio: null,
  categoria: null,
  estado: null,
  obra_social: '',
  tallaIndumentaria: '',
  fecha_nacimiento: '2026-01-01',
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
    try {
      await crearJugador(formulario)
      setFormulario(formularioInicial())
      setModalAbierto(false)
    } catch (requestError) {
      setErrorGuardado(Object.values(requestError.response?.data || {}).flat().join(' ') || 'No se pudo agregar el jugador.')
    } finally {
      setGuardando(false)
    }
  }

  const guardarEdicion = async (event) => {
    event.preventDefault()
    setEditando(true)
    setErrorEdicion('')
    try {
      await editarJugador(jugadorAEditar.jugador_id, formulario)
      setJugadorAEditar(null)
    } catch (requestError) {
      setErrorEdicion(Object.values(requestError.response?.data || {}).flat().join(' ') || 'No se pudo editar el jugador.')
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
        <JugadoresTable data={jugadores} isLoading={isLoading} error={error} onAdd={abrirModal} onEdit={abrirModalEdicion} onDelete={setJugadorAEliminar} />
      </section>
      <AddJugadorModal opened={modalAbierto} onClose={() => !guardando && setModalAbierto(false)} onSubmit={guardarJugador} formulario={formulario} onChange={actualizarCampo} socios={socios} categorias={categorias} estados={estados} loading={guardando} error={errorGuardado} />
      <EditJugadorModal opened={Boolean(jugadorAEditar)} onClose={() => !editando && setJugadorAEditar(null)} onSubmit={guardarEdicion} formulario={formulario} onChange={actualizarCampo} socios={socios} categorias={categorias} estados={estados} loading={editando} error={errorEdicion} />
      <DeleteJugadorModal opened={Boolean(jugadorAEliminar)} onClose={() => !eliminando && setJugadorAEliminar(null)} onConfirm={confirmarEliminacion} jugador={jugadorAEliminar} loading={eliminando} error={errorEliminacion} />
    </section>
  )
}

export default Jugadores



