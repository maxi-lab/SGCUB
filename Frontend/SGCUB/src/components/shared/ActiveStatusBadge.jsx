const STYLES = {
  active: { badge: 'font-semibold bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-600' },
  inactive: { badge: 'font-medium bg-surface-container-high text-on-surface-variant border-outline-variant/30', dot: 'bg-outline' },
}

// Active / inactive pill with a status dot. `label` overrides the default text.
export default function ActiveStatusBadge({ isActive, label }) {
  const style = isActive ? STYLES.active : STYLES.inactive
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm border whitespace-nowrap ${style.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
      {label ?? (isActive ? 'Activo' : 'Inactivo')}
    </span>
  )
}
