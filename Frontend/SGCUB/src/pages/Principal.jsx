import './Principal.css'

function Principal() {
  return (
    <section className="principal-panel">
      <p className="eyebrow">Club Universitario Berisso</p>
      <h1 className="principal-title">Sistema de gestión</h1>
      <p className="intro principal-intro">
        Seleccioná una sección en la barra lateral para comenzar.
      </p>
      <div className="principal-sections">
        <p className="principal-status">
          <span>Padrón</span>
          <span className="principal-status-label">En desarrollo</span>
        </p>
        <p className="principal-section principal-section--coming-soon">
          Más secciones próximamente
        </p>
      </div>
    </section>
  )
}

export default Principal
