import { formatAmount, formatDate, formatDni } from '../personas/format'
import { SecondaryButton } from '../personas/tabs/parts'

const categoriaDe = (concepto) => {
  const valor = String(concepto ?? '').toLowerCase()
  if (valor.includes('deport')) return 'cuotaDeportiva'
  if (valor.includes('mora')) return 'mora'
  return 'cuotaSocial'
}

function ComprobantePago({ socio, cuotas, medios, montoTotal, observacion, numero, fecha: fechaEmision, onBack }) {
  const fecha = fechaEmision ? formatDate(fechaEmision) : new Date().toLocaleDateString('es-AR')
  const desglose = { cuotaSocial: 0, cuotaDeportiva: 0, mora: 0 }
  let restante = Number(montoTotal)

  cuotas.flatMap((cuota) => cuota.items?.length ? cuota.items : [{ concepto: 'CuotaSocial', monto: cuota.monto_total }])
    .forEach((item) => {
      if (restante <= 0) return
      const importe = Math.min(restante, Number(item.monto ?? 0))
      desglose[categoriaDe(item.concepto)] += importe
      restante -= importe
    })

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div><p className="text-sm uppercase tracking-wider font-semibold text-emerald-700">Operación confirmada</p><h2 className="text-2xl font-bold text-on-surface">Comprobante de pago</h2></div>
        <span className="inline-flex items-center gap-2 text-emerald-700 font-semibold"><span className="material-symbols-outlined">verified</span>Registrado</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-surface-container-low border border-outline-variant/30">
        <div><p className="text-sm text-on-surface-variant">Fecha</p><p className="font-semibold text-on-surface">{fecha}</p></div>
        <div><p className="text-sm text-on-surface-variant">Comprobante N°</p><p className="font-semibold text-on-surface">{numero ?? 'Pendiente'}</p></div>
        <div><p className="text-sm text-on-surface-variant">Socio N°</p><p className="font-semibold text-on-surface">{socio.numero_socio}</p></div>
        <div><p className="text-sm text-on-surface-variant">Nombre y apellido</p><p className="font-semibold text-on-surface">{socio.nombre} {socio.apellido}</p></div>
        <div><p className="text-sm text-on-surface-variant">DNI</p><p className="font-semibold text-on-surface">{formatDni(socio.dni)}</p></div>
      </div>

      <section className="border border-outline-variant/30 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-surface-container-low border-b border-outline-variant/30"><h3 className="font-bold text-on-surface">Detalle del pago</h3></div>
        <div className="divide-y divide-outline-variant/20">
          {medios.map((medio, index) => <div key={`${medio.medio}-${index}`} className="flex justify-between gap-4 px-4 py-3"><span className="text-on-surface-variant">{medio.medio}</span><strong className="text-on-surface">{formatAmount(medio.monto)}</strong></div>)}
          <div className="flex justify-between gap-4 px-4 py-3 bg-surface-container-low"><strong className="text-on-surface">Monto total</strong><strong className="text-lg text-primary">{formatAmount(montoTotal)}</strong></div>
        </div>
      </section>

      <section className="border border-outline-variant/30 rounded-xl overflow-hidden">
        <div className="px-4 py-3 bg-surface-container-low border-b border-outline-variant/30"><h3 className="font-bold text-on-surface">Desglose aplicado</h3></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-outline-variant/20">
          <div className="p-4"><p className="text-sm text-on-surface-variant">Cuota social</p><p className="text-lg font-bold text-on-surface">{formatAmount(desglose.cuotaSocial)}</p></div>
          <div className="p-4"><p className="text-sm text-on-surface-variant">Cuota deportiva</p><p className="text-lg font-bold text-on-surface">{formatAmount(desglose.cuotaDeportiva)}</p></div>
          <div className="p-4"><p className="text-sm text-on-surface-variant">Mora</p><p className="text-lg font-bold text-on-surface">{formatAmount(desglose.mora)}</p></div>
        </div>
      </section>

      {observacion && <div className="p-4 bg-surface-container-low rounded-lg"><p className="text-sm text-on-surface-variant">Observación</p><p className="text-on-surface">{observacion}</p></div>}
      <div className="flex justify-end"><SecondaryButton icon="arrow_back" onClick={onBack}>Volver al estado de cuenta</SecondaryButton></div>
    </div>
  )
}

export default ComprobantePago