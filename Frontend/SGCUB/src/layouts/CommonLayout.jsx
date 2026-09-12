import { Outlet, useLocation } from 'react-router-dom'
import './commonLayout.css'

export default function CommonLayout({ moduleName, defaultDescription, getSectionName }) {
  const { pathname } = useLocation()
  
  const sectionName = getSectionName ? getSectionName(pathname) : ''

  return (
    <section className="common-layout">
      <header className="common-header">
        <p className="eyebrow">Módulo de gestión</p>
        <h1>
          {moduleName} {sectionName && <span className="common-section-name">{sectionName}</span>}
        </h1>
        <p className="common-description">
          {sectionName ? `Gestión de ${sectionName.toLowerCase()}` : defaultDescription}
        </p>
      </header>
      <Outlet />
    </section>
  )
}

