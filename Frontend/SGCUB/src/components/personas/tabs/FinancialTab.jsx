import { useEffect, useMemo, useState } from 'react'
import { getEstadoCuenta } from '../../../api/estadoCuenta'
import { postBeneficio } from '../../../api/cuotas'
import BecaDescuentoModal from '../../finanzas/BecaDescuentoModal'
import CuotasEstadoCuentaTable from '../../finanzas/CuotasEstadoCuentaTable'
import { isPaid } from '../../finanzas/accountStatement'
import { formatAmount, formatNumber } from '../format'
import { EmptyState, KPI, PrimaryButton } from './parts'
import useRegisterPayment from '../../../hooks/useRegisterPayment'

const fetchAccount = (socioId) => getEstadoCuenta(socioId).catch((requestError) => {
  if (requestError.response?.status === 404) return null
  throw requestError
})

function FinancialTab({ socio, onRegisterPayment, enableBenefits = false }) {
  const { openPayment } = useRegisterPayment()
  const socioId = socio.socio_id
  const [load, setLoad] = useState({ socioId: null, error: null, account: null })
  const [selectedCuota, setSelectedCuota] = useState(null)
  const [benefitModalOpen, setBenefitModalOpen] = useState(false)
  const [savingBenefit, setSavingBenefit] = useState(false)

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

  const applyBenefit = async (benefit) => {
    if (!selectedCuota) return
    setSavingBenefit(true)
    try {
      await postBeneficio(selectedCuota.cuota_id, benefit)
      setBenefitModalOpen(false)
      setSelectedCuota(null)
      try {
        const updatedAccount = await fetchAccount(socioId)
        setLoad({ socioId, error: null, account: updatedAccount })
      } catch {
        setLoad((current) => ({ ...current, error: 'El beneficio se aplicó, pero no se pudo actualizar el estado de cuenta.' }))
      }
    } finally {
      setSavingBenefit(false)
    }
  }

  const reloadAccount = () => fetchAccount(socioId)
    .then((account) => setLoad({ socioId, error: null, account }))
    .catch(() => setLoad((current) => ({ ...current, error: 'El pago se registró, pero no se pudo actualizar el estado de cuenta.' })))

  const summary = useMemo(() => ({
    paidCount: cuotas.filter(isPaid).length,
    surcharges: Number(account?.total_mora ?? 0),
    debt: Number(account?.total_adeudado ?? 0),
  }), [account, cuotas])

  const toggleCuota = (cuota, selected) => setSelectedCuota(selected ? null : cuota)

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
        <PrimaryButton icon="payments" onClick={onRegisterPayment ?? (() => openPayment({ socioId, onSuccess: reloadAccount }))}>Registrar pago</PrimaryButton>
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
        <CuotasEstadoCuentaTable cuotas={cuotas} selectedCuotaId={selectedCuota?.cuota_id} onToggle={toggleCuota} />
      )}

      {enableBenefits && selectedCuota && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-surface-container-low border border-outline-variant/30 rounded-lg">
          <p className="text-sm text-on-surface-variant">Cuota seleccionada: <strong className="text-on-surface">{selectedCuota.periodo}</strong> · {formatAmount(selectedCuota.monto_total)} · Pendiente {formatAmount(Number(selectedCuota.saldo_pendiente ?? 0))}</p>
          <button type="button" onClick={() => setBenefitModalOpen(true)} className="inline-flex items-center justify-center gap-2 h-10 px-4 bg-primary text-on-primary rounded-md font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed">
            <span className="material-symbols-outlined text-lg">redeem</span>Asignar beca o descuento
          </button>
        </div>
      )}

      <BecaDescuentoModal
        opened={benefitModalOpen}
        cuota={selectedCuota}
        onClose={() => !savingBenefit && setBenefitModalOpen(false)}
        onSubmit={applyBenefit}
        isSaving={savingBenefit}
      />
    </section>
  )
}

export default FinancialTab
