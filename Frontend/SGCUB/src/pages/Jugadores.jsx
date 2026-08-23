import JugadoresTable from '../components/jugadores/JugadoresTable'
import useJugadores from '../hooks/useJugadores'

function Jugadores() {
  const { jugadores, isLoading, error } = useJugadores()

  return (
    <section className="padron-section">
      <section className="padron-table-section" aria-label="Jugadores">
        <JugadoresTable
          data={jugadores}
          isLoading={isLoading}
          error={error}
        />
      </section>
    </section>
  )
}

export default Jugadores
