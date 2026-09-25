import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AddJugadorModal from '../components/jugadores/AddJugadorModal'
import DeleteJugadorModal from '../components/jugadores/DeleteJugadorModal'
import JugadoresTable from '../components/jugadores/JugadoresTable'
import useCategorias from '../hooks/useCategorias'
import useEstados from '../hooks/useEstados'
import useJugadores from '../hooks/useJugadores'
import useSocio from '../hooks/useSocio'
import useGeneros from '../hooks/useGeneros'
import useLocalidades from '../hooks/useLocalidades'
import PageHeader from '../components/shared/PageHeader'
import StatCard from '../components/shared/StatCard'

const formularioInicial = () => ({
  modo_socio: 'nuevo',
  socio: null,
  nuevo_socio: {
    nombre: '', apellido: '', dni: '', telefono: '', email: '',
    fecha_nacimiento: '', genero: '', genero_otro: '',
    domicilio_calle: '', domicilio_numero: '', domicilio_piso: '', domicilio_departamento: '',
    domicilio_entre_calle_1: '', domicilio_entre_calle_2: '', domicilio_barrio: '', domicilio_localidad: ''
  },
  categoria: null,
  estado: null,
  obra_social: '',
  tallaIndumentaria: '',
  contactos_emergencia: [],
})

function Jugadores() {
  const navigate = useNavigate()
  const { jugadores, isLoading, error, crearJugador, eliminarJugador } = useJugadores()
  const { socios } = useSocio()
  const { categorias } = useCategorias()
  const { estados } = useEstados()
  const { generos } = useGeneros()
  const { localidades } = useLocalidades()
  const [modalAbierto, setModalAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorGuardado, setErrorGuardado] = useState('')
  const [jugadorAEliminar, setJugadorAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminacion, setErrorEliminacion] = useState('')
  const [formulario, setFormulario] = useState(formularioInicial)
  const totales = useMemo(() => {
    const activos = jugadores.filter((jugador) => {
      const estado = (jugador.estado?.nombre ?? '').toLowerCase()
      return estado.includes('activo') && !estado.includes('baja') && !estado.includes('inactivo')
    }).length
    return {
      total: jugadores.length.toLocaleString('es-AR'),
      activos: activos.toLocaleString('es-AR'),
      bajas: (jugadores.length - activos).toLocaleString('es-AR'),
    }
  }, [jugadores])

  const actualizarCampo = (campo, valor) => setFormulario((actual) => ({ ...actual, [campo]: valor }))

  const abrirModal = () => {
    setErrorGuardado('')
    setFormulario(formularioInicial())
    setModalAbierto(true)
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
            .map(([k, v]) => {
              if (Array.isArray(v)) {
                return `${k}: ${v.map(item => typeof item === 'object' ? JSON.stringify(item) : item).join(', ')}`
              }
              return `${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`
            })
            .join(' | ')
        }
      }
      setErrorGuardado(errorMsg)
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
      setErrorEliminacion(requestError.response?.data?.detail || 'No se pudo eliminar el jugador.')
    } finally {
      setEliminando(false)
    }
  }

  return (
    <div className="w-full flex flex-col gap-5">
      <PageHeader
        breadcrumb={[{ label: 'Personas' }, { label: 'Jugadores' }]}
        title="Jugadores"
        actions={(
          <button
            type="button"
            onClick={abrirModal}
            className="inline-flex items-center gap-2 bg-primary text-on-primary hover:bg-primary/90 px-4 py-2 rounded shadow-sm font-label-lg text-base font-medium transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">person_add</span>
            <span className="text-xl"> Nuevo jugador</span>
          </button>
        )}
      />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
        <StatCard label="Total Jugadores" value={totales.total} icon="sports_soccer" tone="neutral" />
        <StatCard label="Jugadores Activos" value={totales.activos} icon="how_to_reg" tone="positive" />
        <StatCard label="Jugadores de Baja" value={totales.bajas} icon="person_off" tone="muted" />
      </div>
      <section aria-label="Jugadores">
        <JugadoresTable
          data={jugadores}
          categorias={categorias}
          isLoading={isLoading}
          error={error}
          onEdit={(jugador) => navigate(`/padron/jugadores/${jugador.jugador_id}/editar`)}
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
        generos={generos}
        localidades={localidades}
        loading={guardando}
        error={errorGuardado}
      />

      <DeleteJugadorModal
        opened={Boolean(jugadorAEliminar)}
        onClose={() => !eliminando && setJugadorAEliminar(null)}
        onConfirm={confirmarEliminacion}
        jugador={jugadorAEliminar}
        loading={eliminando}
        error={errorEliminacion}
      />
    </div>
  )
}

export default Jugadores
