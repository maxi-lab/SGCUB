import useDocumentacion from '../hooks/useDocumentacion'
import StatCard from '../components/shared/StatCard'
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

  const upcomingDocs = activeDocs
    .filter(doc => doc.daysFromToday >= 0 && doc.daysFromToday <= 30)
    .map(doc => ({ ...doc, daysLeft: Math.ceil(doc.daysFromToday) }))

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard size="lg" eyebrow="Alerta Crítica" label="Documentación Vencida" value={expiredDocs.length} caption="inhabilitados" icon="gpp_bad" tone="error" />
        <StatCard size="lg" eyebrow="Prevención Activa" label="Próxima a Vencer" value={upcomingDocs.length} caption="a vencer (próx. 30 días)" icon="notification_important" tone="warning" />
        <StatCard size="lg" eyebrow="Cobertura Total" label="Total Vigentes al Día" value={validCount} caption="activos" icon="verified_user" tone="neutral" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg items-start">
        <DocumentAlertTable
          title="Próximos a Vencer"
          icon="timelapse"
          tone="warning"
          documentHeader="Documento Requerido"
          dateHeader="Vencimiento"
          rows={upcomingDocs}
          getBadgeLabel={doc => `Vence en ${doc.daysLeft} día/s`}
          getTypeName={getNombreTipo}
          emptyMessage="No hay documentos próximos a vencer"
        />
        <DocumentAlertTable
          title="Documentos Vencidos"
          icon="cancel"
          tone="error"
          documentHeader="Documento Vencido"
          dateHeader="Fecha Vencida"
          rows={expiredDocs}
          getBadgeLabel={doc => `${doc.overdueDays} día/s de mora`}
          getTypeName={getNombreTipo}
          emptyMessage="No hay documentos vencidos"
        />
      </div>
    </div>
  )
}
