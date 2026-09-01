import { Outlet, useLocation } from 'react-router-dom'
import './PadronLayout.css'

export default function PadronLayout() {
  const { pathname } = useLocation()
  let sectionName = 'Socios'
  if (pathname.includes('/jugadores')) {
    sectionName = 'Jugadores'
  }

  return (
    <section className="padron-layout">
      <header className="padron-header">
        <p className="eyebrow">Módulo de gestión</p>
        <h1>
          Padrón <span className="padron-section-name">{sectionName}</span>
        </h1>
        <p className="padron-description">
          Gestión de {sectionName.toLowerCase()}
        </p>
      </header>
      <Outlet />
    </section>
  )
}
