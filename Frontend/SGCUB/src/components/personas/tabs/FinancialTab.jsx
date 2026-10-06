import { useEffect, useMemo, useState } from 'react'
import { getBecasBySocio } from '../../../api/becas'
import { getEstadoCuenta } from '../../../api/estadoCuenta'
import { DiscountsTable, ScholarshipsTable } from '../../finanzas/BenefitTables'
import CuotasEstadoCuentaTable from '../../finanzas/CuotasEstadoCuentaTable'
import { isPaid, scholarshipState } from '../../finanzas/accountStatement'
import { formatAmount, formatNumber } from '../format'
import { EmptyState, KPI } from './parts'
import useAssignBenefit from '../../../hooks/useAssignBenefit'
import useRegisterPayment from '../../../hooks/useRegisterPayment'

const fetchAccount = (socioId) => getEstadoCuenta(socioId).catch((requestError) => {
  if (requestError.response?.status === 404) return null
  throw requestError
})

// The scholarships section shows its own error, so a failure there doesn't hide the account
const fetchScholarships = (socioId) => getBecasBySocio(socioId).catch(() => null)

const fetchFinances = (socioId) => Promise.all([fetchAccount(socioId), fetchScholarships(socioId)])

function FinancialTab({ socio }) {
  const { openPayment } = useRegisterPayment()
  const { openBenefit } = useAssignBenefit()
  const socioId = socio.socio_id
  const [load, setLoad] = useState({ socioId: null, error: null, account: null, becas: [] })

  useEffect(() => {
    let active = true
    fetchFinances(socioId)
      .then(([account, becas]) => active && setLoad({ socioId, error: null, account, becas }))
      .catch(() => active && setLoad({ socioId, error: 'No se pudo cargar el estado de cuenta.', account: null, becas: [] }))
    return () => { active = false }
  }, [socioId])

  const loading = load.socioId !== socioId
  const account = load.account
  const cuotas = useMemo(() => account?.cuotas ?? [], [account])

  const reloadFinances = () => fetchFinances(socioId)
    .then(([updatedAccount, becas]) => setLoad({ socioId, error: null, account: updatedAccount, becas }))
    .catch(() => setLoad((current) => ({ ...current, error: 'Los cambios se guardaron, pero no se pudo actualizar el estado de cuenta.' })))

  const summary = useMemo(() => ({
    pendingCount: cuotas.filter((cuota) => !isPaid(cuota)).length,
    debt: Number(account?.total_adeudado ?? 0),
    activeScholarships: load.becas ? load.becas.filter((beca) => scholarshipState(beca) === 'active').length : null,
  }), [account, cuotas, load.becas])

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
    <section className="flex flex-col gap-6" aria-labelledby="estado-cuenta-title">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wider font-semibold text-primary">Cuenta corriente {formatNumber(account.cuenta_corriente_id)}</p>
          <h2 id="estado-cuenta-title" className="text-2xl font-bold text-on-surface mt-1">Estado de cuenta</h2>
          <p className="text-base text-on-surface-variant mt-1">Detalle de cuotas, pagos y beneficios del socio.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 my-4">
        <KPI label="Cuotas pendientes" value={summary.pendingCount} icon="pending_actions" tone={summary.pendingCount ? 'alert' : 'ok'} />
        <KPI label="Saldo total adeudado" value={formatAmount(summary.debt)} icon="account_balance" tone={summary.debt ? 'error' : 'ok'} />
        <KPI label="Becas vigentes" value={summary.activeScholarships ?? '—'} icon="sell" />
      </div>

      <section className="flex flex-col gap-6 my-4" aria-labelledby="cuotas-title">
        <div className="flex items-baseline justify-between gap-3">
          <h3 id="cuotas-title" className="text-lg font-bold text-on-surface">Cuotas</h3>
          <span className="text-sm text-on-surface-variant">{cuotas.length} {cuotas.length === 1 ? 'cuota' : 'cuotas'}</span>
        </div>
        {cuotas.length === 0 ? (
          <EmptyState icon="receipt_long" title="Sin cuotas generadas" description="La cuenta corriente no tiene cuotas registradas." />
        ) : (
          <CuotasEstadoCuentaTable
            cuotas={cuotas}
            onPay={(cuota) => openPayment({ socioId, cuotaIds: [cuota.cuota_id], onSuccess: reloadFinances })}
            onAssignBenefit={(cuota) => openBenefit({ socioId, cuotaId: cuota.cuota_id, onSuccess: reloadFinances })}
          />
        )}
      </section>

      <ScholarshipsTable becas={load.becas} />
      <div className="my-4">
        <DiscountsTable cuotas={cuotas} />
      </div>
    </section>
  )
}

export default FinancialTab
