import { Link } from 'react-router-dom'
import { formatAmount } from '../personas/format'

const TODAY = new Date()
const DATE_LABEL = TODAY.toLocaleDateString('es-AR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
})

/**
 * Skeleton placeholder shown while data loads.
 */
function KpiSkeleton() {
  return (
    <div className="min-w-0 bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-space-md flex flex-col justify-between gap-space-sm animate-pulse min-h-[120px]">
      <div className="flex items-center justify-between">
        <div className="h-3 w-2/5 bg-surface-container-high rounded" />
        <div className="w-9 h-9 rounded-lg bg-surface-container-high" />
      </div>
      <div className="flex flex-col gap-1.5 mt-2">
        <div className="h-8 w-3/5 bg-surface-container-high rounded" />
        <div className="h-3 w-2/5 bg-surface-container-high rounded" />
      </div>
    </div>
  )
}

/**
 * A single KPI card matching the mockup layout:
 * icon top-right, label top-left, large value, caption row at the bottom.
 *
 * @param {{
 *   label: string,
 *   value: string | number,
 *   icon: string,
 *   iconClass: string,
 *   caption?: string,
 *   to: string,
 *   ariaLabel?: string,
 * }} props
 */
function KpiCard({ label, value, icon, iconClass, caption, to, ariaLabel }) {
  return (
    <Link
      to={to}
      aria-label={ariaLabel}
      className="block bg-surface-container-lowest border border-outline-variant/30 rounded-xl p-space-md flex flex-col justify-between gap-space-sm hover:border-outline-variant transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary min-h-[120px]"
    >
      {/* Top row: label + icon */}
      <div className="flex items-start justify-between gap-2">
        <span className="font-label-md text-label-lg uppercase tracking-wider text-on-surface-variant font-semibold leading-snug">
          {label}
        </span>
        <span className={`p-2 rounded-lg shrink-0 ${iconClass}`}>
          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">{icon}</span>
        </span>
      </div>

      {/* Bottom: value + caption */}
      <div className="flex flex-col gap-1">
        <span className="font-display-md text-display-md text-on-surface font-bold tracking-tight leading-none">
          {value}
        </span>
        {caption && (
          <span className="font-body-sm text-body-sm text-on-surface-variant">{caption}</span>
        )}
      </div>
    </Link>
  )
}

/**
 * Header bar showing the section title, period and today's date.
 *
 * @param {{ mesLabel: string }} props
 */
function SectionHeader({ mesLabel }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-outline-variant/30">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary shrink-0 border border-outline-variant/30">
          <span className="material-symbols-outlined text-[22px]" aria-hidden="true">payments</span>
        </div>
        <div className="flex flex-col">
          <h2 className="font-headline-md text-headline-md text-on-surface font-bold tracking-tight leading-tight">
            Resumen de Cobranzas
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5 flex items-center gap-2 flex-wrap">
            <span class="text-gray-700">
              {mesLabel.charAt(0).toUpperCase() + mesLabel.slice(1).toLowerCase()}
            </span>
            <span className="w-1 h-1 rounded-full bg-outline-variant inline-block" aria-hidden="true" />
            <span>Monitoreo financiero</span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/30 text-on-surface-variant font-label-sm text-label-sm shrink-0 self-start sm:self-center">
        <span className="material-symbols-outlined text-[15px] text-primary" aria-hidden="true">calendar_today</span>
        <span className="capitalize">{DATE_LABEL}</span>
      </div>
    </div>
  )
}

/**
 * Four financial KPI cards for the dashboard home section.
 *
 * @param {{
 *   isLoading: boolean,
 *   mesLabel: string,
 *   totalRecaudadoMes: number | null,
 *   sociosEnMora: number | null,
 *   montoAdeudadoTotal: number | null,
 *   cuotasVencidas: number | null,
 *   totalSociosActivos: number,
 * }} props
 */
export default function FinancialKpiSection({
  isLoading,
  mesLabel,
  totalRecaudadoMes,
  sociosEnMora,
  montoAdeudadoTotal,
  cuotasVencidas,
  totalSociosActivos,
}) {
  const moraPct = sociosEnMora != null && totalSociosActivos > 0
    ? `${((sociosEnMora / totalSociosActivos) * 100).toFixed(1)}% del padrón activo`
    : null

  return (
    <section aria-labelledby="dashboard-financial-title" className="flex flex-col gap-space-md mt-2">
      <SectionHeader mesLabel={mesLabel ?? '—'} />

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-space-md">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => <KpiSkeleton key={index} />)
        ) : (
          <>
            <KpiCard
              to="/resumen-financiero"
              ariaLabel="Ver resumen financiero"
              icon="account_balance_wallet"
              iconClass="bg-surface-container-low text-primary"
              label="Total recaudado este mes"
              value={formatAmount(totalRecaudadoMes ?? 0)}
            />

            <KpiCard
              to="/morosidad"
              ariaLabel="Ver reporte de morosidad"
              icon="person_alert"
              iconClass="bg-amber-50 text-amber-800 border border-amber-200"
              label="Socios en mora"
              value={sociosEnMora ?? '—'}
              caption={moraPct ?? undefined}
            />

            <KpiCard
              to="/morosidad"
              ariaLabel="Ver reporte de morosidad"
              icon="pending_actions"
              iconClass="bg-amber-50 text-amber-800 border border-amber-200"
              label="Monto total adeudado"
              value={montoAdeudadoTotal != null ? formatAmount(montoAdeudadoTotal) : '—'}
            />

            <KpiCard
              to="/resumen-financiero"
              ariaLabel="Ver resumen financiero"
              icon="event_busy"
              iconClass="bg-red-50 text-red-800 border border-red-200"
              label="Cuotas vencidas a la fecha"
              value={cuotasVencidas ?? '—'}
              caption={cuotasVencidas != null ? `${cuotasVencidas} cuota${cuotasVencidas !== 1 ? 's' : ''} sin pagar` : undefined}
            />
          </>
        )}
      </div>
    </section>
  )
}
