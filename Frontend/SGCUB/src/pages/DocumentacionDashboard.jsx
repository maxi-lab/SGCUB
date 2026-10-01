import React from 'react'
import useDocumentacion from '../hooks/useDocumentacion'

export default function DocumentacionDashboard() {
  const { documentos, isLoading } = useDocumentacion(null) // null = trae todos si el backend lo soporta

  // Lógica para filtrar vencidos y por vencer
  const hoy = new Date()
  const treintaDias = new Date()
  treintaDias.setDate(treintaDias.getDate() + 30)

  const proximosAVencer = documentos.filter(doc => {
    if (!doc.fecha_vencimiento) return false
    const v = new Date(doc.fecha_vencimiento)
    return v >= hoy && v <= treintaDias
  })

  const vencidos = documentos.filter(doc => {
    if (!doc.fecha_vencimiento) return false
    const v = new Date(doc.fecha_vencimiento)
    return v < hoy
  })

  if (isLoading) return <div>Cargando dashboard documental...</div>

  return (
    <div className="flex flex-col w-full gap-8">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex flex-col gap-2 max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="bg-surface-container text-primary font-label-sm text-xs px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
              Módulo de Auditoría y Control
            </span>
          </div>
          <h1 className="font-display-md text-3xl font-bold text-on-surface tracking-tight">
            Control Documental
          </h1>
          <p className="text-on-surface-variant">
            Seguimiento institucional de aptos médicos, fichas de salud y autorizaciones.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-10 px-4 bg-surface-container-lowest text-on-surface hover:bg-surface-container transition-all rounded-xl shadow-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-outline">download</span>
            <span>Exportar planilla</span>
          </button>
        </div>
      </div>

      {/* Metric KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-4 bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-error uppercase tracking-wider font-semibold">Alerta Crítica</span>
              <span className="text-lg font-semibold text-on-surface mt-1">Documentación Vencida</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-error-container text-error flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[22px]">gpp_bad</span>
            </div>
          </div>
          <div className="my-4 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-error leading-none">{vencidos.length}</span>
            <span className="text-sm text-error font-medium">inhabilitados</span>
          </div>
        </div>

        <div className="md:col-span-4 bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-secondary uppercase tracking-wider font-semibold">Prevención Activa</span>
              <span className="text-lg font-semibold text-on-surface mt-1">Próxima a Vencer</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[22px]">notification_important</span>
            </div>
          </div>
          <div className="my-4 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-secondary leading-none">{proximosAVencer.length}</span>
            <span className="text-sm text-secondary font-medium">a vencer (próx. 30 días)</span>
          </div>
        </div>
        
        <div className="md:col-span-4 bg-surface-container-lowest p-6 rounded-xl shadow-sm flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-outline uppercase tracking-wider font-semibold">Total Documentos</span>
              <span className="text-lg font-semibold text-on-surface mt-1">Registrados en sistema</span>
            </div>
            <div className="w-10 h-10 rounded-xl bg-surface-container-high text-primary flex items-center justify-center shadow-sm">
              <span className="material-symbols-outlined text-[22px]">verified_user</span>
            </div>
          </div>
          <div className="my-4 flex items-baseline gap-2">
            <span className="text-4xl font-bold text-on-surface leading-none">{documentos.length}</span>
          </div>
        </div>
      </div>

      {/* Two Tables Split Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Próximos a Vencer */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 bg-surface-container-lowest flex flex-col gap-4 border-b border-surface-container">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary-container text-on-secondary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">timelapse</span>
              </div>
              <h2 className="text-lg font-semibold text-on-surface">Próximos a Vencer</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                  <th className="py-2 px-4 font-semibold">Documento</th>
                  <th className="py-2 px-4 font-semibold">Vencimiento</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {proximosAVencer.map(doc => (
                  <tr key={doc.id_documento} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-medium text-on-surface">{doc.nombre}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="block font-medium">{doc.fecha_vencimiento.split('T')[0]}</span>
                    </td>
                  </tr>
                ))}
                {proximosAVencer.length === 0 && (
                  <tr><td colSpan="2" className="p-4 text-center text-outline">No hay documentos próximos a vencer</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Documentación Vencida */}
        <div className="bg-surface-container-lowest rounded-xl shadow-sm flex flex-col overflow-hidden">
          <div className="p-6 bg-surface-container-lowest flex flex-col gap-4 border-b border-surface-container">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-error-container text-error flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">cancel</span>
              </div>
              <h2 className="text-lg font-semibold text-on-surface">Documentos Vencidos</h2>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-xs uppercase tracking-wider">
                  <th className="py-2 px-4 font-semibold">Documento</th>
                  <th className="py-2 px-4 font-semibold">Fecha Vencida</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {vencidos.map(doc => (
                  <tr key={doc.id_documento} className="hover:bg-error-container/20 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-medium text-error">{doc.nombre}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="block font-medium">{doc.fecha_vencimiento.split('T')[0]}</span>
                    </td>
                  </tr>
                ))}
                {vencidos.length === 0 && (
                  <tr><td colSpan="2" className="p-4 text-center text-outline">No hay documentos vencidos</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
