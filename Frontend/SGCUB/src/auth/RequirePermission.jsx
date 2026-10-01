import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './useAuth'

// Protege rutas enteras: ocultar el ítem del menú no impide escribir la URL a mano
export default function RequirePermission({ permission }) {
  const { hasPermission } = useAuth()
  return hasPermission(permission) ? <Outlet /> : <Navigate to="/" replace />
}
