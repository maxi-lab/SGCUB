import SociosTable from '../components/SociosTable'

function Padron() {
  return (
    <>
      <p className="eyebrow">Club Universitario Berisso</p>
      <h1>Gestión del padrón</h1>
      <p className="intro">
        Administrá la información de socios, jugadores y docentes del club.
      </p>
      <h2>Socios</h2>
      <section className="padron-table-section" aria-label="Socios y jugadores">
        <SociosTable />
      </section>
    </>
  )
}

export default Padron
