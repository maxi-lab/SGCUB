// "30123456" -> "30.123.456"
export const formatDni = (dni) => (/^\d+$/.test(dni ?? '') ? Number(dni).toLocaleString('es-AR') : dni || '—')

export const getInitials = (usuario) =>
  `${usuario.first_name?.[0] ?? ''}${usuario.last_name?.[0] ?? ''}`.toUpperCase() || '—'

const ROLE_STYLES = {
  Administrativo: { badge: 'bg-surface-container-high text-on-secondary-container', avatar: 'bg-surface-variant text-on-surface-variant' },
  Tesorero: { badge: 'bg-primary-fixed text-on-primary-fixed-variant', avatar: 'bg-primary-fixed text-on-primary-fixed-variant' },
  Directivo: { badge: 'bg-surface-container-highest text-on-secondary-fixed', avatar: 'bg-tertiary-fixed text-on-tertiary-fixed-variant' },
  Administrador: { badge: 'bg-secondary-fixed text-on-secondary-fixed-variant', avatar: 'bg-secondary-fixed text-on-secondary-fixed-variant' },
}
const DEFAULT_ROLE_STYLE = { badge: 'bg-surface-container text-on-surface-variant', avatar: 'bg-surface-container text-on-surface-variant' }

export const getRoleStyle = (role) => ROLE_STYLES[role] ?? DEFAULT_ROLE_STYLE
