import { Navigate, Outlet, useLocation } from 'react-router-dom'
import FullPageLoader from '../components/shared/FullPageLoader'
import { useAuth } from './useAuth'

export default function ProtectedRoute() {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  // Sin esperar a /me/, un F5 mandaría al login aunque haya un token válido
  if (isLoading) return <FullPageLoader />

  if (!user) {
    const from = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to="/login" replace state={{ from }} />
  }

  return <Outlet />
}
