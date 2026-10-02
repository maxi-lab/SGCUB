import { useEffect, useState } from 'react'
import useDocumentacion from '../hooks/useDocumentacion'

export default function DocumentacionDashboard() {
  const { documentos, isLoading, getNombreTipo } = useDocumentacion()

  const now = new Date()
  const hoy = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  
  const docsActivos = documentos.filter(doc => doc.persona_es_activo && doc.fecha_vencimiento)
  
  const vencidos = docsActivos
    .filter(doc => {
      const dateStr = doc.fecha_vencimiento.split('T')[0]
      const [yyyy, mm, dd] = dateStr.split('-')
      const v = new Date(yyyy, mm - 1, dd)
      return v < hoy
    })
    .map(doc => {
      const dateStr = doc.fecha_vencimiento.split('T')[0]
      const [yyyy, mm, dd] = dateStr.split('-')
      const v = new Date(yyyy, mm - 1, dd)
      const diasMora = Math.floor((hoy - v) / (1000 * 60 * 60 * 24))
      return { ...doc, diasMora, fechaStr: `${dd}/${mm}/${yyyy}` }
    })
    .sort((a, b) => b.diasMora - a.diasMora)

  const proximosAVencer = docsActivos
    .filter(doc => {
      const dateStr = doc.fecha_vencimiento.split('T')[0]
      const [yyyy, mm, dd] = dateStr.split('-')
      const v = new Date(yyyy, mm - 1, dd)
      return v >= hoy && (v - hoy) / (1000 * 60 * 60 * 24) <= 30
    })
    .map(doc => {
      const dateStr = doc.fecha_vencimiento.split('T')[0]
      const [yyyy, mm, dd] = dateStr.split('-')
      const v = new Date(yyyy, mm - 1, dd)
      const diasVence = Math.ceil((v - hoy) / (1000 * 60 * 60 * 24))
      return { ...doc, diasVence, fechaStr: `${dd}/${mm}/${yyyy}` }
    })
    .sort((a, b) => a.diasVence - b.diasVence)

  const totalActivos = docsActivos.length
  const vigentes = totalActivos - vencidos.length

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
            <span className="font-display-lg text-display-lg text-error leading-none">{vencidos.length}</span>
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
            <span className="font-display-lg text-display-lg text-secondary leading-none">{proximosAVencer.length}</span>
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
            <span className="font-display-lg text-display-lg text-on-surface leading-none">{vigentes}</span>
            <span className="font-label-lg text-label-lg text-on-surface-variant"> activos</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-space-lg items-start">
        {/* Próximos a Vencer Table */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-space-lg bg-surface-container-lowest flex flex-col gap-space-md border-b border-surface-container">
            <div className="flex items-center gap-space-sm">
              <div className="w-8 h-8 rounded-lg bg-secondary-fixed text-on-secondary-fixed flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">timelapse</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-headline-sm text-headline-sm text-on-surface">Próximos a Vencer</h2>
                  <span className="bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm px-2 py-0.5 rounded-full font-bold">{proximosAVencer.length}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                  <th className="py-space-sm px-space-md font-semibold">Persona / Categoría</th>
                  <th className="py-space-sm px-space-md font-semibold">Documento Requerido</th>
                  <th className="py-space-sm px-space-md font-semibold">Vencimiento</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm text-on-surface">
                {proximosAVencer.map(doc => (
                  <tr key={doc.id_documento} className="hover:bg-surface-container-low transition-colors cursor-pointer group">
                    <td className="py-space-md px-space-md">
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-lg text-label-lg font-semibold text-on-surface truncate group-hover:text-primary transition-colors">{doc.persona_nombre_completo || 'Desconocido'}</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant truncate">{doc.categoria_nombre || ''}</span>
                      </div>
                    </td>
                    <td className="py-space-md px-space-md">
                      <span className="font-medium text-on-surface">{doc.nombre}</span>
                      <span className="block font-label-sm text-label-sm text-outline">{getNombreTipo(doc.tipo_documento)}</span>
                    </td>
                    <td className="py-space-md px-space-md whitespace-nowrap">
                      <span className="block font-medium">{doc.fechaStr}</span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-label-sm font-semibold mt-1">
                        Vence en {doc.diasVence} día/s
                      </span>
                    </td>
                  </tr>
                ))}
                {proximosAVencer.length === 0 && (
                  <tr><td colSpan="3" className="p-4 text-center text-outline">No hay documentos próximos a vencer</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Documentos Vencidos Table */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-space-lg bg-surface-container-lowest flex flex-col gap-space-md border-b border-surface-container">
            <div className="flex items-center gap-space-sm">
              <div className="w-8 h-8 rounded-lg bg-error-container text-error flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">cancel</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-headline-sm text-headline-sm text-on-surface">Documentos Vencidos</h2>
                  <span className="bg-error text-on-error font-label-sm text-label-sm px-2 py-0.5 rounded-full font-bold">{vencidos.length}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                  <th className="py-space-sm px-space-md font-semibold">Persona / Categoría</th>
                  <th className="py-space-sm px-space-md font-semibold">Documento Vencido</th>
                  <th className="py-space-sm px-space-md font-semibold">Fecha Vencida</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm text-on-surface">
                {vencidos.map(doc => (
                  <tr key={doc.id_documento} className="hover:bg-error-container/20 transition-colors cursor-pointer group">
                    <td className="py-space-md px-space-md">
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-lg text-label-lg font-semibold text-on-surface truncate group-hover:text-error transition-colors">{doc.persona_nombre_completo || 'Desconocido'}</span>
                        <span className="font-body-sm text-body-sm text-on-surface-variant truncate">{doc.categoria_nombre || ''}</span>
                      </div>
                    </td>
                    <td className="py-space-md px-space-md">
                      <span className="font-medium text-error">{doc.nombre}</span>
                      <span className="block font-label-sm text-label-sm text-outline">{getNombreTipo(doc.tipo_documento)}</span>
                    </td>
                    <td className="py-space-md px-space-md whitespace-nowrap">
                      <span className="block font-medium text-on-surface">{doc.fechaStr}</span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-error-container text-error text-label-sm font-semibold mt-1">
                        {doc.diasMora} día/s de mora
                      </span>
                    </td>
                  </tr>
                ))}
                {vencidos.length === 0 && (
                  <tr><td colSpan="3" className="p-4 text-center text-outline">No hay documentos vencidos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
