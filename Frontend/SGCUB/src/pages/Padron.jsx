import SociosTable from '../components/SociosTable'
import useSocio from '../hooks/useSocio'

function Padron() {
  const { socios, isLoading, error } = useSocio()

  return (
    <>
      <p className="eyebrow">Club Universitario Berisso</p>
      <h1>Gestión del padrón</h1>
      <p className="intro">
        Administrá la información de socios, jugadores y docentes del club.
      </p>
      <h2>Socios</h2>
      <section className="padron-table-section" aria-label="Socios y jugadores">
        <SociosTable data={socios} isLoading={isLoading} error={error} />
      </section>
    </>
  )
}

export default Padron
