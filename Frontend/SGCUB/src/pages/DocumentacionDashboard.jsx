import useDocumentacion from '../hooks/useDocumentacion'
import DocumentAlertTable from '../components/documental/DocumentAlertTable'
import { parseDueDate } from '../components/documental/dueDate'

export default function DocumentacionDashboard() {
  const { documentosActivos: documentos, isLoading, getNombreTipo } = useDocumentacion(null, true)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const activeDocs = documentos
    .filter(doc => doc.persona_es_activo && doc.fecha_vencimiento)
    .map(doc => ({ ...doc, ...parseDueDate(doc, today) }))

  const expiredDocs = activeDocs
    .filter(doc => doc.daysFromToday < 0)
    .map(doc => ({ ...doc, overdueDays: Math.floor(-doc.daysFromToday) }))
    .sort((a, b) => b.overdueDays - a.overdueDays)

  const upcomingDocs = activeDocs
    .filter(doc => doc.daysFromToday >= 0 && doc.daysFromToday <= 30)
    .map(doc => ({ ...doc, daysLeft: Math.ceil(doc.daysFromToday) }))
    .sort((a, b) => a.daysLeft - b.daysLeft)

  const validCount = activeDocs.length - expiredDocs.length

  if (isLoading) return <div className="p-space-lg text-on-surface-variant">Cargando dashboard documental...</div>

  return (
    <div className="flex flex-col w-full gap-space-xl pb-space-xl">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-space-md">
        <div className="flex flex-col gap-space-xs max-w-3xl">
          <div className="flex items-center gap-space-xs">
            <span className="bg-surface-container text-primary font-label-sm text-label-sm px-space-sm py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              Módulo de Auditoría y Control
            </span>
          </div>
          <h1 className="font-display-md text-display-md text-on-surface tracking-tight">
            Control Documental
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Seguimiento institucional de aptos médicos, fichas de salud, autorizaciones y fichajes federativos del club.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-space-md">
        {/* Vencidos KPI */}
        <div className="md:col-span-4 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-error uppercase tracking-wider font-semibold">Alerta Crítica</span>
              <span className="font-headline-sm text-headline-sm text-on-surface mt-1">Documentación Vencida</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-error-container text-error flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[22px]">gpp_bad</span>
            </div>
          </div>
          <div className="my-space-md flex items-baseline gap-space-xs">
            <span className="font-display-lg text-display-lg text-error leading-none">{expiredDocs.length}</span>
            <span className="font-label-lg text-label-lg text-error font-medium">inhabilitados</span>
          </div>
        </div>

        {/* Proximos KPI */}
        <div className="md:col-span-4 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">Prevención Activa</span>
              <span className="font-headline-sm text-headline-sm text-on-surface mt-1">Próxima a Vencer</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[22px]">notification_important</span>
            </div>
          </div>
          <div className="my-space-md flex items-baseline gap-space-xs">
            <span className="font-display-lg text-display-lg text-secondary leading-none">{upcomingDocs.length}</span>
            <span className="font-label-lg text-label-lg text-secondary font-medium">a vencer (próx. 30 días)</span>
          </div>
        </div>

        {/* Total KPI */}
        <div className="md:col-span-4 bg-surface-container-lowest p-space-lg rounded-xl shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider font-semibold">Cobertura Total</span>
              <span className="font-headline-sm text-headline-sm text-on-surface mt-1">Total Vigentes al Día</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-container-high text-primary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[22px]">verified_user</span>
            </div>
          </div>
          <div className="my-space-md flex items-baseline gap-space-xs">
            <span className="font-display-lg text-display-lg text-on-surface leading-none">{validCount}</span>
            <span className="font-label-lg text-label-lg text-on-surface-variant"> activos</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg items-start">
        <DocumentAlertTable
          title="Próximos a Vencer"
          icon="timelapse"
          tone="warning"
          headers={['Persona / Categoría', 'Documento Requerido', 'Vencimiento']}
          rows={upcomingDocs}
          getBadgeLabel={doc => `Vence en ${doc.daysLeft} día/s`}
          getTypeName={getNombreTipo}
          emptyMessage="No hay documentos próximos a vencer"
        />
        <DocumentAlertTable
          title="Documentos Vencidos"
          icon="cancel"
          tone="error"
          headers={['Persona / Categoría', 'Documento Vencido', 'Fecha Vencida']}
          rows={expiredDocs}
          getBadgeLabel={doc => `${doc.overdueDays} día/s de mora`}
          getTypeName={getNombreTipo}
          emptyMessage="No hay documentos vencidos"
        />
      </div>
    </div>
  )
}
