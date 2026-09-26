const TONOS = {
  neutral: 'bg-surface-container-high text-primary',
  positive: 'bg-emerald-50 text-emerald-700 border border-emerald-100',
  muted: 'bg-surface-container-high text-on-surface-variant',
}

export default function StatCard({ label, value, icon, tone = 'neutral' }) {
  return (
    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-4 flex items-center justify-between shadow-xs">
      <div className="flex flex-col">
        <span className="text-xl font-medium text-on-surface-variant uppercase tracking-wider">{label}</span>
        <span className="text-2xl font-bold text-on-surface mt-0.5">{value}</span>
      </div>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${TONOS[tone] ?? TONOS.neutral}`}>
        <span className="material-symbols-outlined text-[22px]" aria-hidden="true">{icon}</span>
      </div>
    </div>
  )
}
