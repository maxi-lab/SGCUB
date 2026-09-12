import { Outlet, useLocation } from 'react-router-dom'
import './commonLayout.css'

export default function CommonLayout({ moduleName, defaultDescription, getSectionName }) {
export default function CommonLayout({ moduleName, defaultDescription, getSectionName, getSectionDescription }) {
  const { pathname } = useLocation()
  
  const sectionName = getSectionName ? getSectionName(pathname) : ''
  const description = sectionName ? `Administración y control de ${sectionName.toLowerCase()}` : defaultDescription
  const description = getSectionDescription 
    ? getSectionDescription(pathname) 
    : (sectionName ? `Administración y control de ${sectionName.toLowerCase()}` : defaultDescription)

  return (
    <section className="common-layout">
      <header className="common-header">
        <h1 className="common-title">
          {moduleName} {sectionName && <span className="common-section-name">{sectionName}</span>}
        </h1>
      </header>
      
      {description && (
        <p className="common-description-below">
          {description}
        </p>
      )}

      <Outlet />
    </section>
  )
}

