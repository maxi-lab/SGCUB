import { Navigate, Outlet, useLocation } from 'react-router-dom'
import FullPageLoader from '../components/shared/FullPageLoader'
import { CHANGE_PASSWORD_PATH } from './paths'
import { useAuth } from './useAuth'

export default function ProtectedRoute() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  // Sin esperar a /me/, un F5 mandaría al login aunque haya un token válido
  if (isLoading) return <FullPageLoader />

  const from = `${location.pathname}${location.search}${location.hash}`

  if (!user) {
    // Si sale desde la pantalla de cambio de contraseña, el próximo ingreso arranca en el inicio
    const state = location.pathname === CHANGE_PASSWORD_PATH ? undefined : { from }
    return <Navigate to="/login" replace state={state} />
  }

  // Primer ingreso o contraseña reseteada: no se puede usar el sistema hasta cambiarla
  if (user.must_change_password && location.pathname !== CHANGE_PASSWORD_PATH) {
    return <Navigate to={CHANGE_PASSWORD_PATH} replace state={{ from }} />
  }

  return <Outlet />
}
