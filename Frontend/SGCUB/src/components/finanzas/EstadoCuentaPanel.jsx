import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getEstadoCuenta } from '../../api/estadoCuenta'
import { formatAmount, formatDate, formatNumber } from '../personas/format'
import { EmptyState, KPI, PrimaryButton } from '../personas/tabs/parts'

const estadoNormalizado = (estado) => String(estado ?? '').toLowerCase().replaceAll(' ', '')

const montoCuota = (cuota) => {
  return Number(cuota.monto_total ?? 0)
}

const conceptosDe = (cuota) => (cuota.items ?? []).map((item) => item.concepto).filter(Boolean).join(', ') || 'Cuota social'

function EstadoCuentaPanel({ socio, onRegisterPayment }) {
  const navigate = useNavigate()
  const [carga, setCarga] = useState({ loading: true, error: null, cuenta: null })

  useEffect(() => {
    let activo = true
    setCarga({ loading: true, error: null, cuenta: null })
    getEstadoCuenta(socio.socio_id)
      .then((cuenta) => activo && setCarga({ loading: false, error: null, cuenta }))
      .catch(() => activo && setCarga({ loading: false, error: 'No se pudo cargar el estado de cuenta.', cuenta: null }))
    return () => { activo = false }
  }, [socio?.socio_id])

  const cuenta = carga.cuenta
  const cuotas = cuenta?.cuotas ?? []

  const resumen = useMemo(() => {
    const pagas = cuotas.filter((cuota) => estadoNormalizado(cuota.estado_cuota ?? cuota.estado) === 'paga')
    const impagas = cuotas.filter((cuota) => estadoNormalizado(cuota.estado_cuota ?? cuota.estado) !== 'paga')
    const mora = Number(cuenta?.total_mora ?? 0)
    const deuda = Number(cuenta?.total_adeudado ?? 0)
    return { pagas, impagas, mora, deuda }
  }, [cuenta, cuotas])

  if (carga.loading) {
    return <div className="py-16 flex flex-col items-center gap-3 text-on-surface-variant"><span className="material-symbols-outlined text-3xl animate-spin">progress_activity</span><p>Cargando estado de cuenta...</p></div>
  }

  if (carga.error) {
    return <div className="bg-error-container text-on-error-container p-4 rounded-lg border border-error/30" role="alert">{carga.error}</div>
  }

  if (!cuenta) {
    return <EmptyState icon="account_balance_wallet" title="Sin cuenta corriente" description="Este socio todavía no tiene una cuenta corriente asociada." />
  }

  return (
    <section className="flex flex-col gap-5" aria-labelledby="estado-cuenta-title">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 pb-4 border-b border-surface-container">
        <div>
          <p className="text-sm uppercase tracking-wider font-semibold text-primary">Cuenta corriente {formatNumber(cuenta.cuenta_corriente_id)}</p>
          <h2 id="estado-cuenta-title" className="text-2xl font-bold text-on-surface mt-1">Estado de cuenta</h2>
          <p className="text-base text-on-surface-variant mt-1">Detalle de cuotas, pagos y conceptos pendientes del socio.</p>
        </div>
        <PrimaryButton icon="payments" onClick={onRegisterPayment ?? (() => navigate(`/caja?socio=${socio.socio_id}`))}>Registrar pago</PrimaryButton>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <KPI label="Saldo total adeudado" value={formatAmount(resumen.deuda)} icon="account_balance" tone={resumen.deuda ? 'error' : 'ok'} />
        <KPI label="Cuotas generadas" value={cuotas.length} icon="receipt_long" />
        <KPI label="Cuotas pagas" value={resumen.pagas.length} icon="task_alt" tone="ok" />
        <KPI label="Recargos por mora" value={formatAmount(resumen.mora)} icon="warning" tone={resumen.mora ? 'alert' : 'ok'} />
      </div>

      {cuotas.length === 0 ? (
        <EmptyState icon="receipt_long" title="Sin cuotas generadas" description="La cuenta corriente no tiene cuotas registradas." />
      ) : (
        <div className="overflow-x-auto border border-outline-variant/30 rounded-xl bg-surface-container-lowest shadow-sm">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-surface-container-low/70 border-b border-outline-variant/30 text-on-surface-variant text-sm uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Período</th>
                <th className="py-3 px-4 font-semibold">Vencimientos</th>
                <th className="py-3 px-4 font-semibold">Conceptos</th>
                <th className="py-3 px-4 font-semibold text-right">Importe</th>
                <th className="py-3 px-4 font-semibold text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-base">
              {cuotas.map((cuota) => {
                const estado = cuota.estado_cuota ?? cuota.estado ?? 'Pendiente'
                const paga = estadoNormalizado(estado) === 'paga'
                return (
                  <tr key={cuota.cuota_id} className="hover:bg-surface-container-low transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-on-surface">{cuota.periodo || '—'}</td>
                    <td className="py-3.5 px-4 text-on-surface-variant">{formatDate(cuota.fecha_venc1)} / {formatDate(cuota.fecha_venc2)}</td>
                    <td className="py-3.5 px-4 text-on-surface-variant">{conceptosDe(cuota)}</td>
                    <td className="py-3.5 px-4 text-right font-semibold text-on-surface">{formatAmount(montoCuota(cuota))}</td>
                    <td className="py-3.5 px-4 text-center"><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold border ${paga ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-error-container text-on-error-container border-error/20'}`}>{estado}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

export default EstadoCuentaPanel