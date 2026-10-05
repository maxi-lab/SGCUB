import { Link } from 'react-router-dom'

/**
 * Static process entries shown in the dashboard.
 * When the automations backend is implemented, replace this
 * with a real API call and map the response to this shape.
 *
 * @type {Array<{
 *   id: string,
 *   nombre: string,
 *   descripcion: string,
 *   estado: 'ejecutando' | 'fallo' | 'inactivo',
 *   detalle: string,
 * }>}
 */
const PROCESOS_ESTATICOS = [
  {
    id: 'comet-sync',
    nombre: 'Sincronización COMET',
    descripcion: 'Actualización de fichas federativas con AFA',
    estado: 'ejecutando',
    detalle: 'Último ciclo: hace 2 h',
  },
  {
    id: 'backup-db',
    nombre: 'Backup de base de datos',
    descripcion: 'Respaldo nocturno automático del sistema',
    estado: 'ejecutando',
    detalle: 'Último ciclo: 02:00 AM',
  },
  {
    id: 'smtp-alertas',
    nombre: 'Alertas SMTP',
    descripcion: 'Envío de notificaciones por correo electrónico',
    estado: 'fallo',
    detalle: 'Timeout relay — reintentar',
  },
]

const ESTADO_STYLES = {
  ejecutando: {
    badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    dot: 'bg-emerald-600',
    label: 'En ejecución',
    icon: 'check_circle',
    iconClass: 'text-emerald-600',
  },
  fallo: {
    badge: 'bg-red-50 text-red-700 border border-red-200',
    dot: 'bg-red-600',
    label: 'Con fallo',
    icon: 'error',
    iconClass: 'text-red-600',
  },
  inactivo: {
    badge: 'bg-surface-container text-on-surface-variant border border-outline-variant/30',
    dot: 'bg-outline',
    label: 'Inactivo',
    icon: 'pause_circle',
    iconClass: 'text-outline',
  },
}

const totalConFallo = PROCESOS_ESTATICOS.filter((p) => p.estado === 'fallo').length
const totalEjecutando = PROCESOS_ESTATICOS.filter((p) => p.estado === 'ejecutando').length

/**
 * Dashboard card — Estado de Procesos (static placeholder).
 *
 * Displays the status of background automation tasks.
 * This component is intentionally static until the automations
 * backend endpoint is developed. The data shape and component
 * interface are already defined for easy future integration.
 */
export default function ProcessStatusSection() {
  return (
    <section
      aria-labelledby="dashboard-process-title"
      className="lg:col-span-7 bg-surface-container-lowest rounded-xl border border-outline-variant/30 flex flex-col overflow-hidden"
    >
      {/* Card header */}
      <div className="p-space-lg border-b border-outline-variant/20 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2
              id="dashboard-process-title"
              className="font-headline-sm text-headline-sm text-on-surface font-semibold leading-tight"
            >
              Estado de Procesos
            </h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              Monitoreo de servicios en segundo plano y cron
            </p>
          </div>
          <Link
            to="/automatizaciones"
            className="font-label-md text-label-md font-semibold text-primary hover:text-secondary inline-flex items-center gap-0.5 transition-colors shrink-0 pt-0.5"
          >
            Ver automatizaciones
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_forward</span>
          </Link>
        </div>

        {/* Summary tiles */}
        <div className="grid grid-cols-2 gap-space-sm">
          {/* Con fallo */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-space-sm flex flex-col justify-between">
            <div className="flex items-center gap-1 text-red-700 font-label-sm text-label-sm font-semibold uppercase">
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">error</span>
              <span>Con Fallo</span>
            </div>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="font-headline-md text-headline-md text-red-800 font-bold">
                {totalConFallo}
              </span>
              {totalConFallo > 0 && (
                <button
                  type="button"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-700 text-white font-label-sm text-label-sm font-semibold hover:bg-red-800 transition-colors"
                  title="Reintentar procesos con fallo"
                  onClick={() => {/* TODO: connect to automations API */}}
                >
                  <span className="material-symbols-outlined text-[13px]" aria-hidden="true">refresh</span>
                  Reintentar
                </button>
              )}
            </div>
            <span className="font-body-sm text-body-sm text-red-700/80 mt-1">
              {PROCESOS_ESTATICOS.filter((p) => p.estado === 'fallo').map((p) => p.nombre).join(', ')}
            </span>
          </div>

          {/* En ejecución */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-space-sm flex flex-col justify-between">
            <div className="flex items-center gap-1 text-emerald-700 font-label-sm text-label-sm font-semibold uppercase">
              <span className="material-symbols-outlined text-[16px]" aria-hidden="true">check_circle</span>
              <span>En Ejecución</span>
            </div>
            <div className="flex items-baseline justify-between mt-0.5">
              <span className="font-headline-md text-headline-md text-emerald-800 font-bold">
                {totalEjecutando}
              </span>
              <span className="inline-flex items-center gap-1 text-label-sm font-label-sm text-emerald-700 font-medium px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" aria-hidden="true" />
                Activo
              </span>
            </div>
            <span className="font-body-sm text-body-sm text-emerald-800/80 mt-1">
              {PROCESOS_ESTATICOS.filter((p) => p.estado === 'ejecutando').map((p) => p.nombre).join(', ')}
            </span>
          </div>
        </div>
      </div>

      {/* Process list */}
      <div className="flex flex-col flex-1">
        <div className="px-space-md py-2 border-b border-outline-variant/10 bg-surface-container-low/50">
          <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider font-semibold">
            Detalle de procesos
          </span>
        </div>

        <div className="flex flex-col divide-y divide-outline-variant/10">
          {PROCESOS_ESTATICOS.map((proceso) => {
            const style = ESTADO_STYLES[proceso.estado] ?? ESTADO_STYLES.inactivo
            return (
              <div
                key={proceso.id}
                className="flex items-center justify-between gap-3 px-space-md py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`material-symbols-outlined text-[20px] shrink-0 ${style.iconClass}`}
                    aria-hidden="true"
                  >
                    {style.icon}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-body-md text-body-md text-on-surface font-medium truncate">
                      {proceso.nombre}
                    </span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                      {proceso.descripcion}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end shrink-0 gap-0.5">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-label-sm text-label-sm font-semibold ${style.badge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} aria-hidden="true" />
                    {style.label}
                  </span>
                  <span className="font-label-sm text-label-sm text-on-surface-variant">{proceso.detalle}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Static notice footer */}
      <div className="px-space-lg py-space-sm border-t border-outline-variant/20 bg-surface-container-low/50 flex items-center gap-2 mt-auto">
        <span className="material-symbols-outlined text-[15px] text-on-surface-variant" aria-hidden="true">info</span>
        <span className="font-body-sm text-body-sm text-on-surface-variant">
          Los datos de procesos son de referencia. La integración en tiempo real está pendiente de desarrollo.
        </span>
      </div>
    </section>
  )
}
