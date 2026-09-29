import { formatAmount, formatDate } from '../personas/format'

function ComprobantesTable({ comprobantes = [], isLoading, error, onSelect }) {
  return (
    <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-sm overflow-hidden" aria-labelledby="comprobantes-title">
      <div className="p-5 border-b border-outline-variant/20 flex items-center justify-between gap-3">
        <div><h2 id="comprobantes-title" className="text-xl font-bold text-on-surface">Comprobantes de pago</h2><p className="text-sm text-on-surface-variant">Historial completo de comprobantes emitidos.</p></div>
        <span className="material-symbols-outlined text-primary text-2xl">receipt_long</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[620px] text-left border-collapse">
          <thead><tr className="bg-surface-container-low/70 border-b border-outline-variant/30 text-sm uppercase tracking-wider text-on-surface-variant"><th className="py-3 px-4">Número</th><th className="py-3 px-4">Fecha</th><th className="py-3 px-4">Pago asociado</th><th className="py-3 px-4 text-right">Monto total</th></tr></thead>
          <tbody className="divide-y divide-outline-variant/20">
            {isLoading && <tr><td colSpan={4} className="py-10 px-4 text-center text-on-surface-variant">Cargando comprobantes...</td></tr>}
            {!isLoading && error && <tr><td colSpan={4} className="py-10 px-4 text-center text-error">No se pudieron cargar los comprobantes.</td></tr>}
            {!isLoading && !error && comprobantes.length === 0 && <tr><td colSpan={4} className="py-10 px-4 text-center text-on-surface-variant">Todavía no hay comprobantes registrados.</td></tr>}
            {!isLoading && !error && comprobantes.map((comprobante) => <tr key={comprobante.comprobante_id} onClick={() => onSelect?.(comprobante)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') onSelect?.(comprobante) }} tabIndex={0} role="button" className="hover:bg-surface-container-low focus:bg-surface-container-low focus:outline-none transition-colors cursor-pointer"><td className="py-3.5 px-4 font-semibold text-primary">#{comprobante.numero}</td><td className="py-3.5 px-4 text-on-surface-variant">{formatDate(comprobante.fecha_emision)}</td><td className="py-3.5 px-4 text-on-surface-variant">Pago #{comprobante.pago}</td><td className="py-3.5 px-4 text-right font-semibold text-on-surface">{formatAmount(comprobante.monto_total)}</td></tr>)}
          </tbody>
        </table>
      </div>
    </section>
  )
}

export default ComprobantesTable