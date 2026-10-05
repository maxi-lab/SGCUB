import { Link } from 'react-router-dom'

const TOP_URGENT_COUNT = 4

/**
 * Compact badge for document status (expired or upcoming).
 *
 * @param {{ tone: 'error' | 'warning', label: string }} props
 */
function StatusBadge({ tone, label }) {
  const styles = {
    error: 'bg-red-50 text-red-700 border border-red-200',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200',
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded font-label-sm text-label-sm font-semibold ${styles[tone]}`}>
      {label}
    </span>
  )
}

/**
 * A single row in the urgent documents list.
 *
 * @param {{ doc: object, getTypeName: Function, tone: 'error' | 'warning', badgeLabel: string }} props
 */
function UrgentDocRow({ doc, getTypeName, tone, badgeLabel }) {
  const rowHover = tone === 'error'
    ? 'hover:bg-red-50/50 focus:bg-red-50/50'
    : 'hover:bg-amber-50/50 focus:bg-amber-50/50'

  return (
    <Link
      to={`${doc.url_perfil}?tab=documentacion`}
      className={`flex items-center justify-between gap-3 px-space-md py-2.5 transition-colors group focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${rowHover}`}
    >
      <div className="flex flex-col min-w-0">
        <span className="font-body-md text-body-md text-on-surface font-medium truncate group-hover:text-primary transition-colors">
          {doc.persona_nombre_completo ?? '—'}
        </span>
        <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
          {getTypeName(doc.tipo_documento)}{doc.categoria_nombre ? ` · ${doc.categoria_nombre}` : ''}
        </span>
      </div>
      <div className="shrink-0">
        <StatusBadge tone={tone} label={badgeLabel} />
      </div>
    </Link>
  )
}

/**
 * Skeleton for the urgent docs list while loading.
 */
function DocListSkeleton() {
  return (
    <div className="flex flex-col divide-y divide-outline-variant/10 animate-pulse">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-3 px-space-md py-2.5">
          <div className="flex flex-col gap-1.5 flex-1">
            <div className="h-3 w-3/5 bg-surface-container-high rounded" />
            <div className="h-2.5 w-2/5 bg-surface-container-high rounded" />
          </div>
          <div className="h-5 w-20 bg-surface-container-high rounded shrink-0" />
        </div>
      ))}
    </div>
  )
}

/**
 * Dashboard card — Resumen Documental.
 *
 * Shows expired and upcoming document counts plus a list of the most urgent cases.
 * Data comes from useDashboard (pre-classified vencidos and proximosAVencer arrays).
 *
 * @param {{
 *   isLoading: boolean,
 *   vencidos: Array,
 *   proximosAVencer: Array,
 *   getNombreTipo: Function,
 * }} props
 */
export default function DocumentSummarySection({ isLoading, vencidos, proximosAVencer, getNombreTipo }) {
  const totalAlerts = vencidos.length + proximosAVencer.length

  // Top urgent = all expired (sorted by most overdue) then upcoming (sorted by closest deadline)
  const sortedExpired = [...vencidos].sort((a, b) => b.diasVencido - a.diasVencido)
  const sortedUpcoming = [...proximosAVencer].sort((a, b) => a.diasRestantes - b.diasRestantes)
  const urgentDocs = [...sortedExpired, ...sortedUpcoming].slice(0, TOP_URGENT_COUNT)

  return (
    <section
      aria-labelledby="dashboard-doc-summary-title"
      className="lg:col-span-5 bg-surface-container-lowest rounded-xl border border-outline-variant/30 flex flex-col overflow-hidden"
    >
      {/* Card header */}
      <div className="p-space-lg border-b border-outline-variant/20 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2
              id="dashboard-doc-summary-title"
              className="font-headline-sm text-headline-sm text-on-surface font-semibold leading-tight"
            >
              Resumen Documental
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              Control de aptos físicos y legajos de deportistas
            </p>
          </div>
          <Link
            to="/documental"
            className="font-label-md text-label-md font-semibold text-primary hover:text-secondary inline-flex items-center gap-0.5 transition-colors shrink-0 pt-0.5"
            aria-label={`Ver todos los documentos (${totalAlerts} alertas)`}
          >
            Ver todos ({totalAlerts})
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_forward</span>
          </Link>
        </div>

        {/* Quick metric tiles */}
        <div className="grid grid-cols-2 gap-space-sm">
          {/* Expired */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-space-sm flex flex-col">
            <div className="flex items-center gap-1 text-red-700 font-label-sm text-label-sm font-semibold uppercase">
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">error</span>
              <span>Vencidos</span>
            </div>
            <span className="font-headline-md text-headline-md text-red-800 font-bold mt-0.5">
              {isLoading ? '—' : vencidos.length}
            </span>
            <span className="font-body-sm text-body-sm text-red-700/80">Inhabilitados para jugar</span>
          </div>

          {/* Upcoming */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-space-sm flex flex-col">
            <div className="flex items-center gap-1 text-amber-800 font-label-sm text-label-sm font-semibold uppercase">
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">schedule</span>
              <span>Próximos a vencer</span>
            </div>
            <span className="font-headline-md text-headline-md text-amber-900 font-bold mt-0.5">
              {isLoading ? '—' : proximosAVencer.length}
            </span>
            <span className="font-body-sm text-body-sm text-amber-800/80">En los próximos 30 días</span>
          </div>
        </div>
      </div>

      {/* Urgent documents list */}
      <div className="flex flex-col flex-1">
        <div className="px-space-md py-2 border-b border-outline-variant/10 bg-surface-container-low/50">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">
            Casos más urgentes
          </span>
        </div>

        {isLoading ? (
          <DocListSkeleton />
        ) : urgentDocs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-space-lg text-center text-on-surface-variant gap-2">
            <span className="material-symbols-outlined text-[32px] text-emerald-600" aria-hidden="true">verified_user</span>
            <p className="font-body-md text-body-md font-medium text-on-surface">Sin alertas documentales</p>
            <p className="font-body-sm text-body-sm">Toda la documentación activa está al día.</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-outline-variant/10">
            {urgentDocs.map((doc) => {
              const isExpired = doc.diasVencido != null
              return (
                <UrgentDocRow
                  key={doc.id_documento}
                  doc={doc}
                  getTypeName={getNombreTipo}
                  tone={isExpired ? 'error' : 'warning'}
                  badgeLabel={
                    isExpired
                      ? `Vencido hace ${doc.diasVencido} día${doc.diasVencido !== 1 ? 's' : ''}`
                      : `Vence en ${doc.diasRestantes} día${doc.diasRestantes !== 1 ? 's' : ''}`
                  }
                />
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-space-lg py-space-sm border-t border-outline-variant/20 bg-surface-container-low/50 flex items-center justify-between gap-2 mt-auto">
        <span className="font-body-sm text-body-sm text-on-surface-variant">
          Fichas federativas y aptos médicos
        </span>
        <Link
          to="/documental"
          className="inline-flex items-center gap-1 text-primary font-label-md text-label-md font-semibold hover:underline transition-colors"
        >
          <span className="material-symbols-outlined text-[15px]" aria-hidden="true">open_in_new</span>
          Ir al control documental
        </Link>
      </div>
    </section>
  )
}
