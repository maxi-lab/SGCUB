import './EnDesarrollo.css'

export default function EnDesarrollo({ title }) {
  return (
    <section className="development-page">
      <span className="development-page-icon material-symbols-outlined" aria-hidden="true">
        construction
      </span>
      <p className="eyebrow">SGCUB</p>
      <h1>{title}</h1>
      <p className="development-page-message">
        Esta sección se encuentra en desarrollo.
      </p>
    </section>
  )
}