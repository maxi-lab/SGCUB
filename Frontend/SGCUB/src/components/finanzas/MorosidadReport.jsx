import { Fragment, useState } from 'react'
import { formatAmount, formatDni, formatNumber } from '../personas/format'
import FinancialTab from '../personas/tabs/FinancialTab'
import './MorosidadReport.css'

const alcances = [
  { id: 'activos', titulo: 'Todos los activos', detalle: 'Incluye a todos los socios activos.' },
  { id: 'filtrados', titulo: 'Aplicar filtros', detalle: 'Filtra por nombre, DNI o categoría.' },
  { id: 'manual', titulo: 'Selección manual', detalle: 'Elegí varios socios de la lista.' },
  { id: 'socio', titulo: 'Un socio', detalle: 'Consulta individual actualizada.' },
]

function MorosidadReport({
  sociosFiltrados,
  categorias,
  categoriaPorSocio,
  isLoading,
  rosterError,
  scope,
  onScopeChange,
  busqueda,
  onBusquedaChange,
  categoriaSeleccionada,
  onCategoriaChange,
  seleccionados,
  onSeleccionadosChange,
  socioIndividual,
  onSocioIndividualChange,
  isGenerating,
  onGenerate,
  reporte,
  generationError,
}) {
  const [socioExpandido, setSocioExpandido] = useState(null)
  const sociosParaElegir = sociosFiltrados
  const deudaTotal = reporte?.filas.reduce((total, fila) => total + fila.monto_adeudado, 0) ?? 0

  const alternarSeleccion = (socioId) => {
    const id = String(socioId)
    onSeleccionadosChange((actuales) => actuales.includes(id)
      ? actuales.filter((actual) => actual !== id)
      : [...actuales, id])
  }

  const imprimirReporte = () => window.print()

  return (
    <div className="morosidad-report flex flex-col gap-5">
      <section className="morosidad-no-print border-b border-outline-variant/40 pb-5" aria-labelledby="morosidad-config-title">
        <div className="mb-4">
          <h2 id="morosidad-config-title" className="text-lg font-bold text-on-surface">Alcance del reporte</h2>
          <p className="mt-1 text-sm text-on-surface-variant">La consulta recupera el estado de cuenta actualizado al momento de generarla.</p>
        </div>

        <fieldset className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
          <legend className="sr-only">Seleccionar alcance</legend>
          {alcances.map((alcance) => (
            <label key={alcance.id} className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${scope === alcance.id ? 'border-primary bg-primary/5' : 'border-outline-variant/40 hover:bg-surface-container-low'}`}>
              <input type="radio" name="alcance-morosidad" value={alcance.id} checked={scope === alcance.id} onChange={() => onScopeChange(alcance.id)} className="mt-1 accent-primary" />
              <span><span className="block font-semibold text-on-surface">{alcance.titulo}</span><span className="block mt-0.5 text-sm text-on-surface-variant">{alcance.detalle}</span></span>
            </label>
          ))}
        </fieldset>

        {(scope === 'filtrados' || scope === 'manual' || scope === 'socio') && (
          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(220px,0.7fr)] gap-3 mt-4">
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-on-surface">
              Buscar socio
              <input value={busqueda} onChange={(event) => onBusquedaChange(event.target.value)} placeholder="Nombre, apellido o DNI" className="h-10 px-3 bg-surface-container-lowest border border-outline-variant/50 rounded-md font-normal focus:outline-none focus:border-primary" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm font-semibold text-on-surface">
              Categoría deportiva
              <select value={categoriaSeleccionada} onChange={(event) => onCategoriaChange(event.target.value)} className="h-10 px-3 bg-surface-container-lowest border border-outline-variant/50 rounded-md font-normal focus:outline-none focus:border-primary">
                <option value="">Todas las categorías</option>
                <option value="Sin categoría">Sin categoría</option>
                {categorias.map((categoria) => <option key={categoria} value={categoria}>{categoria}</option>)}
              </select>
            </label>
          </div>
        )}

        {scope === 'socio' && (
          <label className="flex flex-col gap-1.5 mt-3 max-w-2xl text-sm font-semibold text-on-surface">
            Socio a consultar
            <select value={socioIndividual} onChange={(event) => onSocioIndividualChange(event.target.value)} className="h-10 px-3 bg-surface-container-lowest border border-outline-variant/50 rounded-md font-normal focus:outline-none focus:border-primary">
              <option value="">Seleccionar socio</option>
              {sociosFiltrados.map((socio) => <option key={socio.socio_id} value={socio.socio_id}>{socio.apellido}, {socio.nombre} · DNI {formatDni(socio.dni)}</option>)}
            </select>
          </label>
        )}

        {scope === 'manual' && (
          <div className="mt-3 border border-outline-variant/40 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between gap-3 px-3 py-2 bg-surface-container-low text-sm">
              <span className="font-semibold text-on-surface">Socios disponibles</span>
              <span className="text-on-surface-variant">{seleccionados.length} seleccionados</span>
            </div>
            <div className="max-h-56 overflow-auto divide-y divide-outline-variant/20">
              {sociosParaElegir.slice(0, 100).map((socio) => (
                <label key={socio.socio_id} className="flex items-center gap-3 px-3 py-2 hover:bg-surface-container-low cursor-pointer">
                  <input type="checkbox" checked={seleccionados.includes(String(socio.socio_id))} onChange={() => alternarSeleccion(socio.socio_id)} className="accent-primary" />
                  <span className="min-w-0 flex-1"><span className="block truncate font-medium text-on-surface">{socio.apellido}, {socio.nombre}</span><span className="text-sm text-on-surface-variant">DNI {formatDni(socio.dni)} · {categoriaPorSocio[String(socio.socio_id)] || 'Sin categoría'}</span></span>
                </label>
              ))}
              {sociosParaElegir.length === 0 && <p className="px-3 py-4 text-sm text-on-surface-variant">No hay socios que coincidan con los filtros.</p>}
              {sociosParaElegir.length > 100 && <p className="px-3 py-2 text-xs text-on-surface-variant">Mostrando los primeros 100 resultados; usá los filtros para acotar la lista.</p>}
            </div>
          </div>
        )}

        {rosterError && <p className="mt-3 text-sm text-error" role="alert">{rosterError}</p>}
        {generationError && <p className="mt-3 text-sm text-error" role="alert">{generationError}</p>}
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <button type="button" onClick={onGenerate} disabled={isLoading || isGenerating || Boolean(rosterError)} className="inline-flex items-center gap-2 h-10 px-4 bg-primary text-on-primary rounded-md font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed">
            <span className={`material-symbols-outlined text-[19px] ${isGenerating ? 'animate-spin' : ''}`} aria-hidden="true">{isGenerating ? 'progress_activity' : 'summarize'}</span>
            {isGenerating ? 'Consultando cuentas...' : 'Generar reporte'}
          </button>
          {isLoading && <span className="text-sm text-on-surface-variant">Cargando padrón y categorías...</span>}
        </div>
      </section>

      {reporte && (
        <section aria-labelledby="morosidad-resultados-title">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
            <div>
              <p className="text-xs uppercase font-semibold text-primary">{reporte.alcance} · {reporte.fecha}</p>
              <h2 id="morosidad-resultados-title" className="mt-1 text-xl font-bold text-on-surface">Socios con deuda vencida</h2>
              <p className="mt-1 text-sm text-on-surface-variant">El cálculo de mora toma como vencimiento la segunda fecha de vencimiento de cada cuota.</p>
            </div>
            <button type="button" onClick={imprimirReporte} className="morosidad-no-print inline-flex items-center justify-center gap-2 h-10 px-4 border border-outline-variant/50 rounded-md text-on-surface font-semibold hover:bg-surface-container-low">
              <span className="material-symbols-outlined text-[19px]" aria-hidden="true">picture_as_pdf</span>Exportar PDF
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="border-l-4 border-error bg-error-container/40 px-4 py-3"><p className="text-sm text-on-surface-variant">Socios morosos</p><p className="text-xl font-bold text-on-surface">{reporte.filas.length}</p></div>
            <div className="border-l-4 border-primary bg-surface-container-low px-4 py-3"><p className="text-sm text-on-surface-variant">Deuda vencida total</p><p className="text-xl font-bold text-on-surface">{formatAmount(deudaTotal)}</p></div>
            <div className="border-l-4 border-outline bg-surface-container-low px-4 py-3"><p className="text-sm text-on-surface-variant">Sin cuenta corriente</p><p className="text-xl font-bold text-on-surface">{reporte.sin_cuenta}</p></div>
          </div>

          {reporte.filas.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-outline-variant/50 text-on-surface-variant"><span className="material-symbols-outlined text-3xl">task_alt</span><p className="mt-2 font-semibold text-on-surface">No hay socios con deuda vencida en este alcance.</p></div>
          ) : (
            <div className="overflow-x-auto border border-outline-variant/40 rounded-lg">
              <table className="w-full min-w-[760px] text-left border-collapse">
                <thead><tr className="bg-surface-container-low border-b border-outline-variant/40 text-xs uppercase text-on-surface-variant"><th className="px-3 py-3 font-semibold">Socio</th><th className="px-3 py-3 font-semibold">DNI</th><th className="px-3 py-3 font-semibold">Categoría deportiva</th><th className="px-3 py-3 text-right font-semibold">Monto adeudado</th><th className="px-3 py-3 text-right font-semibold">Días de mora</th></tr></thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {reporte.filas.map((fila) => {
                    const expandido = String(socioExpandido) === String(fila.socio_id)
                    return (
                      <Fragment key={fila.socio_id}>
                        <tr className="hover:bg-surface-container-low/70">
                          <td className="px-3 py-2.5"><button type="button" aria-expanded={expandido} onClick={() => setSocioExpandido(expandido ? null : fila.socio_id)} className="inline-flex items-center gap-2 text-left font-semibold text-primary hover:underline"><span className="material-symbols-outlined text-[18px]" aria-hidden="true">{expandido ? 'expand_less' : 'expand_more'}</span>{fila.apellido}, {fila.nombre}</button><span className="block pl-7 text-xs text-on-surface-variant">Socio {formatNumber(fila.numero_socio)}</span></td>
                          <td className="px-3 py-2.5 text-on-surface-variant">{formatDni(fila.dni)}</td>
                          <td className="px-3 py-2.5 text-on-surface-variant">{fila.categoria_deportiva}</td>
                          <td className="px-3 py-2.5 text-right font-semibold text-error">{formatAmount(fila.monto_adeudado)}</td>
                          <td className="px-3 py-2.5 text-right tabular-nums text-on-surface">{fila.dias_mora}</td>
                        </tr>
                        {expandido && <tr key={`${fila.socio_id}-detalle`} className="morosidad-detail bg-surface-container-low/50"><td colSpan="5" className="p-4"><FinancialTab socio={fila} /></td></tr>}
                      </Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  )
}

export default MorosidadReport