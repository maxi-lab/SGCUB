//DEBE REVISARSE AL REALIZAR TODA LA LOGICA DE FINANZAS, SOLO ES PARA PODER MOSTRAR ALGO EN EL ESTADO DE CUENTA



import { formatDate, formatAmount } from '../format'
import { TabHeader, EmptyState, KPI } from './parts'

const ESTILO_ESTADO = {
  Paga: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'En Fecha': 'bg-primary-fixed/30 text-primary border-primary-fixed',
  Vencida: 'bg-error-container text-on-error-container border-error/20',
}

export default function FinancialTab({ cuenta, cuotas = [], vencidas = [], situacion, isLoading, error }) {
  if (isLoading) {
    return (
      <div className="py-12 flex flex-col items-center gap-3 text-on-surface-variant">
        <span className="material-symbols-outlined text-[28px] animate-spin">progress_activity</span>
        <p className="text-base">Cargando estado de cuenta...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-error-container text-on-error-container p-4 rounded-lg border border-error/30 flex items-center gap-2.5" role="alert">
        <span className="material-symbols-outlined text-error">error</span>
        <p className="text-base font-medium">No se pudo cargar la información financiera.</p>
      </div>
    )
  }

  const deuda = vencidas.reduce((total, cuota) => total + cuota.monto, 0)
  const pagas = cuotas.filter((c) => c.estado === 'Paga').length
  const saldo = cuenta?.saldo ?? 0

  return (
    <div className="flex flex-col gap-6">
      <TabHeader
        title="Estado de cuenta"
        description="Cuotas emitidas, vencimientos y saldo de la cuenta corriente del socio"
        actions={situacion && (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
            situacion.tono === 'ok' ? 'bg-emerald-50 text-emerald-700'
              : situacion.tono === 'error' ? 'bg-error-container text-on-error-container'
                : 'bg-surface-container-high text-on-surface-variant'
          }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {situacion.tono === 'ok' ? 'check_circle' : situacion.tono === 'error' ? 'warning' : 'info'}
            </span>
            {situacion.label}
          </span>
        )}
      />

      {!cuenta ? (
        <EmptyState
          icono="account_balance_wallet"
          titulo="Sin cuenta corriente"
          descripcion="Este socio todavía no tiene una cuenta corriente asociada, por lo que no hay cuotas para mostrar."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI label="Saldo de cuenta" value={formatAmount(saldo)} icon="account_balance" tone={saldo < 0 ? 'error' : 'neutral'} />
            <KPI label="Cuotas emitidas" value={cuotas.length} icon="receipt_long" />
            <KPI label="Cuotas pagas" value={pagas} icon="task_alt" tone="ok" />
            <KPI label="Deuda vencida" value={formatAmount(deuda)} icon="warning" tone={vencidas.length ? 'error' : 'ok'} />
          </div>

          {cuotas.length === 0 ? (
            <EmptyState icon="receipt_long" title="Sin cuotas emitidas" description="La cuenta corriente no tiene cuotas registradas." />
          ) : (
            <div className="overflow-x-auto border border-outline-variant/30 rounded-xl bg-surface-container-lowest shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-surface-container-low/70 border-b border-outline-variant/30 text-on-surface-variant text-sm uppercase tracking-wider">
                    <th className="py-3 px-4 font-semibold">Período</th>
                    <th className="py-3 px-4 font-semibold">1° vencimiento</th>
                    <th className="py-3 px-4 font-semibold">2° vencimiento</th>
                    <th className="py-3 px-4 font-semibold">Conceptos</th>
                    <th className="py-3 px-4 font-semibold text-right">Monto</th>
                    <th className="py-3 px-4 font-semibold text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20 text-base">
                  {cuotas.map((cuota) => (
                    <tr key={cuota.cuota_id} className="hover:bg-surface-container-low transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-on-surface">{cuota.periodo}</td>
                      <td className="py-3.5 px-4 text-on-surface-variant">{formatDate(cuota.fecha_venc1)}</td>
                      <td className="py-3.5 px-4 text-on-surface-variant">{formatDate(cuota.fecha_venc2)}</td>
                      <td className="py-3.5 px-4 text-sm text-on-surface-variant">
                        {cuota.items.length ? cuota.items.map((item) => item.concepto).join(', ') : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-on-surface">{formatAmount(cuota.monto)}</td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold border ${ESTILO_ESTADO[cuota.estado] ?? 'bg-surface-container-high text-on-surface-variant border-outline-variant/30'}`}>
                          {cuota.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
