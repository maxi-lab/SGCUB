import { useState } from 'react'
import AddJugadorModal from '../components/jugadores/AddJugadorModal'
import DeleteJugadorModal from '../components/jugadores/DeleteJugadorModal'
import JugadoresTable from '../components/jugadores/JugadoresTable'
import useCategorias from '../hooks/useCategorias'
import useJugadores from '../hooks/useJugadores'
import useSocio from '../hooks/useSocio'

function Jugadores() {
  const {
    jugadores,
    isLoading,
    error,
    crearJugador,
    eliminarJugador,
  } = useJugadores()
  const { socios } = useSocio()
  const { categorias } = useCategorias()
  const [modalAbierto, setModalAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorGuardado, setErrorGuardado] = useState('')
  const [jugadorAEliminar, setJugadorAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminacion, setErrorEliminacion] = useState('')
  const [formulario, setFormulario] = useState({
    socio: null,
    categoria: null,
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
    setModalAbierto(true)
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
        obra_social: '',
        tallaIndumentaria: '',
        contactoEmergencia: '',
      })
      setModalAbierto(false)
    } catch (requestError) {
      setErrorGuardado(
        requestError.response?.data?.socio?.[0] ||
          requestError.response?.data?.detail ||
          'No se pudo agregar el jugador.',
      )
    } finally {
      setGuardando(false)
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
        loading={guardando}
        error={errorGuardado}
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
