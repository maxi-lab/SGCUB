import DataTable from '../shared/DataTable'
import { formatAmount, formatDate } from '../personas/format'
import { cuotaAmount, cuotaConcepts, isPaid } from './accountStatement'

// Cuotas of a socio's account statement. Clicking a row (or Enter / Space) toggles its selection.
// When `onPay` is given, unpaid cuotas get a "Pagar cuota" action.
function CuotasEstadoCuentaTable({ cuotas, selectedCuotaId, onToggle, onPay }) {
  const handleKeyDown = (event, cuota, selected) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onToggle(cuota, selected)
    }
  }

  return (
    <DataTable
      className="border border-outline-variant/30 rounded-xl bg-surface-container-lowest shadow-sm"
      tableClassName="min-w-[960px]"
      bodyClassName="text-base"
      headers={(
        <>
          <th className="py-3 px-4" scope="col">Período</th>
          <th className="py-3 px-4" scope="col">Vencimientos</th>
          <th className="py-3 px-4" scope="col">Conceptos</th>
          <th className="py-3 px-4 text-right" scope="col">Importe</th>
          <th className="py-3 px-4 text-right" scope="col">Pagado</th>
          <th className="py-3 px-4 text-right" scope="col">Pendiente</th>
          <th className="py-3 px-4 text-center" scope="col">Estado</th>
          {onPay && <th className="py-3 px-4 text-right" scope="col">Acciones</th>}
        </>
      )}
    >
      {cuotas.map((cuota) => {
        const state = cuota.estado_cuota ?? cuota.estado ?? 'Pendiente'
        const paid = isPaid(cuota)
        const selected = selectedCuotaId === cuota.cuota_id
        const payable = !paid && Number(cuota.saldo_pendiente ?? 0) > 0
        return (
          <tr
            key={cuota.cuota_id}
            tabIndex={0}
            aria-selected={selected}
            onClick={() => onToggle(cuota, selected)}
            onKeyDown={(event) => handleKeyDown(event, cuota, selected)}
            className={`cursor-pointer transition-colors ${selected ? 'bg-primary/5 ring-1 ring-inset ring-primary/40' : 'hover:bg-surface-container-low'}`}
          >
            <td className="py-3.5 px-4 font-semibold text-on-surface">{cuota.periodo || '—'}</td>
            <td className="py-3.5 px-4 text-on-surface-variant">{formatDate(cuota.fecha_venc1)} / {formatDate(cuota.fecha_venc2)}</td>
            <td className="py-3.5 px-4 text-on-surface-variant">{cuotaConcepts(cuota)}</td>
            <td className="py-3.5 px-4 text-right font-semibold text-on-surface">{formatAmount(cuotaAmount(cuota))}</td>
            <td className="py-3.5 px-4 text-right text-on-surface-variant">{formatAmount(Number(cuota.monto_pagado ?? 0))}</td>
            <td className="py-3.5 px-4 text-right font-semibold text-on-surface">{formatAmount(Number(cuota.saldo_pendiente ?? 0))}</td>
            <td className="py-3.5 px-4 text-center">
              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold border ${
                state === 'Paga' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 
                state === 'EnFecha' ? 'bg-sky-50 text-sky-700 border-sky-200' : 
                'bg-error-container text-on-error-container border-error/20'
              }`}>
                {state === 'EnFecha' ? 'En fecha' : state}
              </span>
            </td>
            {onPay && (
              <td className="py-3.5 px-4 text-right">
                {payable && (
                  <button
                    type="button"
                    title="Pagar cuota"
                    aria-label={`Pagar cuota ${cuota.periodo}`}
                    onClick={(event) => {
                      // Keep the click / key press from also toggling the row selection
                      event.stopPropagation()
                      onPay(cuota)
                    }}
                    onKeyDown={(event) => event.stopPropagation()}
                    className="w-8 h-8 inline-flex items-center justify-center rounded border border-primary/30 text-primary hover:bg-primary hover:text-on-primary transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]" aria-hidden="true">payments</span>
                  </button>
                )}
              </td>
            )}
          </tr>
        )
      })}
    </DataTable>
  )
}

export default CuotasEstadoCuentaTable
