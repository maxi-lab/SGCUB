import { useAuth } from './useAuth'

// Muestra su contenido solo si el usuario tiene el permiso (ítems del menú, botones, etc.)
export default function PermissionGate({ permission, children, fallback = null }) {
  const { hasPermission } = useAuth()
  return hasPermission(permission) ? children : fallback
}
