import { useEffect, useMemo, useState } from 'react'
import { getEstadoCuenta } from '../../../api/estadoCuenta'
import CuotasEstadoCuentaTable from '../../finanzas/CuotasEstadoCuentaTable'
import { isPaid } from '../../finanzas/accountStatement'
import { formatAmount, formatNumber } from '../format'
import { EmptyState, KPI } from './parts'
import useAssignBenefit from '../../../hooks/useAssignBenefit'
import useRegisterPayment from '../../../hooks/useRegisterPayment'

const fetchAccount = (socioId) => getEstadoCuenta(socioId).catch((requestError) => {
  if (requestError.response?.status === 404) return null
  throw requestError
})

function FinancialTab({ socio }) {
  const { openPayment } = useRegisterPayment()
  const { openBenefit } = useAssignBenefit()
  const socioId = socio.socio_id
  const [load, setLoad] = useState({ socioId: null, error: null, account: null })

  useEffect(() => {
    let active = true
    fetchAccount(socioId)
      .then((account) => active && setLoad({ socioId, error: null, account }))
      .catch(() => active && setLoad({ socioId, error: 'No se pudo cargar el estado de cuenta.', account: null }))
    return () => { active = false }
  }, [socioId])

  const loading = load.socioId !== socioId
  const account = load.account
  const cuotas = useMemo(() => account?.cuotas ?? [], [account])

  const reloadAccount = () => fetchAccount(socioId)
    .then((account) => setLoad({ socioId, error: null, account }))
    .catch(() => setLoad((current) => ({ ...current, error: 'Los cambios se guardaron, pero no se pudo actualizar el estado de cuenta.' })))

  const summary = useMemo(() => ({
    paidCount: cuotas.filter(isPaid).length,
    surcharges: Number(account?.total_mora ?? 0),
    debt: Number(account?.total_adeudado ?? 0),
  }), [account, cuotas])

  if (loading) {
    return <div className="py-16 flex flex-col items-center gap-3 text-on-surface-variant"><span className="material-symbols-outlined text-3xl animate-spin">progress_activity</span><p>Cargando estado de cuenta...</p></div>
  }

  if (load.error) {
    return <div className="bg-error-container text-on-error-container p-4 rounded-lg border border-error/30" role="alert">{load.error}</div>
  }

  if (!account) {
    return <EmptyState icon="account_balance_wallet" title="Sin cuenta corriente" description="Este socio todavía no tiene una cuenta corriente asociada." />
  }

  return (
    <section className="flex flex-col gap-5" aria-labelledby="estado-cuenta-title">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 pb-4 border-b border-surface-container">
        <div>
          <p className="text-sm uppercase tracking-wider font-semibold text-primary">Cuenta corriente {formatNumber(account.cuenta_corriente_id)}</p>
          <h2 id="estado-cuenta-title" className="text-2xl font-bold text-on-surface mt-1">Estado de cuenta</h2>
          <p className="text-base text-on-surface-variant mt-1">Detalle de cuotas, pagos y conceptos pendientes del socio.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <KPI label="Saldo total adeudado" value={formatAmount(summary.debt)} icon="account_balance" tone={summary.debt ? 'error' : 'ok'} />
        <KPI label="Cuotas generadas" value={cuotas.length} icon="receipt_long" />
        <KPI label="Cuotas pagas" value={summary.paidCount} icon="task_alt" tone="ok" />
        <KPI label="Recargos por mora" value={formatAmount(summary.surcharges)} icon="warning" tone={summary.surcharges ? 'alert' : 'ok'} />
      </div>

      {cuotas.length === 0 ? (
        <EmptyState icon="receipt_long" title="Sin cuotas generadas" description="La cuenta corriente no tiene cuotas registradas." />
      ) : (
        <CuotasEstadoCuentaTable
          cuotas={cuotas}
          onPay={(cuota) => openPayment({ socioId, cuotaIds: [cuota.cuota_id], onSuccess: reloadAccount })}
          onAssignBenefit={(cuota) => openBenefit({ socioId, cuotaId: cuota.cuota_id, onSuccess: reloadAccount })}
        />
      )}
    </section>
  )
}

export default FinancialTab
