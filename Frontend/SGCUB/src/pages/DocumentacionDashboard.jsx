import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useDocumentacion from '../hooks/useDocumentacion'
import { parseDueDate } from '../components/documental/dueDate'

export default function DocumentacionDashboard() {
  const navigate = useNavigate()
  const { documentosActivos: documentos, isLoading, getNombreTipo } = useDocumentacion(null, true)

  const [searchProximos, setSearchProximos] = useState('')
  const [searchVencidos, setSearchVencidos] = useState('')
  const [limitProximos, setLimitProximos] = useState(5)
  const [limitVencidos, setLimitVencidos] = useState(5)

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

  const filteredProximos = upcomingDocs.filter(doc => 
    (doc.persona_nombre_completo || '').toLowerCase().includes(searchProximos.toLowerCase()) ||
    (doc.nombre || '').toLowerCase().includes(searchProximos.toLowerCase())
  )
  const paginatedProximos = filteredProximos.slice(0, limitProximos)

  const filteredVencidos = expiredDocs.filter(doc => 
    (doc.persona_nombre_completo || '').toLowerCase().includes(searchVencidos.toLowerCase()) ||
    (doc.nombre || '').toLowerCase().includes(searchVencidos.toLowerCase())
  )
  const paginatedVencidos = filteredVencidos.slice(0, limitVencidos)

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
                  <span className="bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm px-2 py-0.5 rounded-full font-bold">{upcomingDocs.length}</span>
                </div>
              </div>
            </div>
            {/* Quick Search */}
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">search</span>
              <input 
                className="w-full h-9 pl-9 pr-4 bg-surface-container-low text-on-surface placeholder:text-outline text-body-sm font-body-sm rounded-lg focus:outline-none focus:bg-surface-container-lowest transition-all" 
                placeholder="Filtrar por jugador o documento..." 
                type="text"
                value={searchProximos}
                onChange={e => setSearchProximos(e.target.value)}
              />
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
                {paginatedProximos.map(doc => (
                  <tr key={doc.id_documento} onClick={() => navigate(`${doc.url_perfil}?tab=documentacion`)} onKeyDown={(e) => e.key === 'Enter' && navigate(`${doc.url_perfil}?tab=documentacion`)} tabIndex={0} className="hover:bg-surface-container-low transition-colors cursor-pointer group focus:outline-none focus:bg-surface-container-low">
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
                      <span className="block font-medium">{doc.dueDateLabel}</span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-label-sm font-semibold mt-1">
                        Vence en {doc.daysLeft} día/s
                      </span>
                    </td>
                  </tr>
                ))}
                {paginatedProximos.length === 0 && (
                  <tr><td colSpan="3" className="p-4 text-center text-outline">No hay documentos próximos a vencer</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredProximos.length > limitProximos && (
            <div className="p-space-md bg-surface-container-low flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-outline">Mostrando {limitProximos} de {filteredProximos.length}</span>
              <button 
                onClick={() => setLimitProximos(limitProximos + 5)}
                className="font-label-md text-label-md text-primary font-semibold hover:underline"
              >
                Cargar más ↓
              </button>
            </div>
          )}
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
                  <span className="bg-error text-on-error font-label-sm text-label-sm px-2 py-0.5 rounded-full font-bold">{expiredDocs.length}</span>
                </div>
              </div>
            </div>
            {/* Quick Search */}
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">search</span>
              <input 
                className="w-full h-9 pl-9 pr-4 bg-surface-container-low text-on-surface placeholder:text-outline text-body-sm font-body-sm rounded-lg focus:outline-none focus:bg-surface-container-lowest transition-all" 
                placeholder="Filtrar por jugador o documento..." 
                type="text"
                value={searchVencidos}
                onChange={e => setSearchVencidos(e.target.value)}
              />
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
                {paginatedVencidos.map(doc => (
                  <tr key={doc.id_documento} onClick={() => navigate(`${doc.url_perfil}?tab=documentacion`)} onKeyDown={(e) => e.key === 'Enter' && navigate(`${doc.url_perfil}?tab=documentacion`)} tabIndex={0} className="hover:bg-error-container/20 transition-colors cursor-pointer group focus:outline-none focus:bg-error-container/20">
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
                      <span className="block font-medium text-on-surface">{doc.dueDateLabel}</span>
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-error-container text-error text-label-sm font-semibold mt-1">
                        {doc.overdueDays} día/s de mora
                      </span>
                    </td>
                  </tr>
                ))}
                {paginatedVencidos.length === 0 && (
                  <tr><td colSpan="3" className="p-4 text-center text-outline">No hay documentos vencidos</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {filteredVencidos.length > limitVencidos && (
            <div className="p-space-md bg-surface-container-low flex items-center justify-between">
              <span className="font-label-sm text-label-sm text-outline">Mostrando {limitVencidos} de {filteredVencidos.length}</span>
              <button 
                onClick={() => setLimitVencidos(limitVencidos + 5)}
                className="font-label-md text-label-md text-error font-semibold hover:underline"
              >
                Cargar más ↓
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
