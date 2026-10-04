import { formatAmount } from '../personas/format'

function DesgloseComprobante({ detalle }) {
  const periodos = detalle?.periodos ?? []
  const desglose = detalle?.desglose ?? []

  return (
    <>
      <section className="border border-outline-variant/30 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-surface-container-low border-b border-outline-variant/30"><h3 className="font-bold text-on-surface">Períodos abonados</h3></div>
        <div className="divide-y divide-outline-variant/20">
          {periodos.length === 0 && <p className="px-4 py-3 text-on-surface-variant">Sin períodos imputados.</p>}
          {periodos.map((periodo) => (
            <div key={periodo.cuota_id} className="flex justify-between gap-4 px-4 py-3">
              <span className="text-on-surface-variant">Período {periodo.periodo}</span>
              <strong className="text-on-surface">{formatAmount(periodo.monto_aplicado)}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="border border-outline-variant/30 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-surface-container-low border-b border-outline-variant/30"><h3 className="font-bold text-on-surface">Desglose aplicado</h3></div>
        <div className="divide-y divide-outline-variant/20">
          {desglose.map((linea) => (
            <div key={linea.concepto} className="flex justify-between gap-4 px-4 py-3">
              <span className="text-on-surface-variant">{linea.concepto_nombre}</span>
              <strong className={Number(linea.monto) < 0 ? 'text-emerald-700' : 'text-on-surface'}>{formatAmount(linea.monto)}</strong>
            </div>
          ))}
          <div className="flex justify-between gap-4 px-4 py-3 bg-surface-container-low">
            <strong className="text-on-surface">Total abonado</strong>
            <strong className="text-lg text-primary">{formatAmount(detalle?.monto_total)}</strong>
          </div>
        </div>
      </section>
    </>
  )
}

export default DesgloseComprobante
