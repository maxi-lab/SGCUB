import { useEffect, useState } from 'react'
import './App.css'
import { getRoute, routes } from './routes'

function useRoute() {
  const [route, setRoute] = useState(window.location.pathname)

  useEffect(() => {
    const handlePopState = () => setRoute(window.location.pathname)
    window.addEventListener('popstate', handlePopState)

    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const navigate = (path) => {
    window.history.pushState({}, '', path)
    setRoute(path)
  }

  return { route, navigate }
}

function App() {
  const { route, navigate } = useRoute()
  const currentRoute = getRoute(route)
  const Page = currentRoute.component

  const handleNavigation = (event, path) => {
    event.preventDefault()
    navigate(path)
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a
          className="brand"
          href="/"
          aria-label="SGCUB inicio"
          onClick={(event) => handleNavigation(event, '/')}
        >
          <span className="brand-mark">CU</span>
          <span className="brand-name">SGCUB</span>
        </a>

        <nav className="main-nav" aria-label="Navegación principal">
          {routes
            .filter((navigationRoute) => navigationRoute.showInNavigation)
            .map((navigationRoute) => (
              <a
                className={`nav-link ${currentRoute.path === navigationRoute.path ? 'nav-link-active' : ''}`}
                href={navigationRoute.path}
                onClick={(event) => handleNavigation(event, navigationRoute.path)}
                key={navigationRoute.path}
              >
                {navigationRoute.label}
              </a>
            ))}
        </nav>
      </header>

      <main className="main-content">
        <Page />
      </main>

      <footer className="site-footer">
        <span>Sistema Gestión Club Universitario Berisso</span>
      </footer>
    </div>
  )
}

export default App
