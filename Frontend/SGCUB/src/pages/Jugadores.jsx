import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DeleteJugadorModal from '../components/jugadores/DeleteJugadorModal'
import JugadoresTable from '../components/jugadores/JugadoresTable'
import useCategorias from '../hooks/useCategorias'
import useJugadores from '../hooks/useJugadores'
import PageHeader from '../components/shared/PageHeader'
import StatCard from '../components/shared/StatCard'

function Jugadores() {
  const navigate = useNavigate()
  const { jugadores, isLoading, error, eliminarJugador } = useJugadores()
  const { categorias } = useCategorias()
  const [jugadorAEliminar, setJugadorAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminacion, setErrorEliminacion] = useState('')
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
            onClick={() => navigate('/padron/jugadores/nuevo')}
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
