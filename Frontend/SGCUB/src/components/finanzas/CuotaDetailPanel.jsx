import { useEffect, useState } from 'react'
import { descargarComprobantePdf, getComprobante, getComprobantesByCuota } from '../../api/comprobantes'
import { formatAmount, formatDate } from '../personas/format'
import { PrimaryButton, SecondaryButton } from '../personas/tabs/parts'
import ComprobanteDetailModal from './ComprobanteDetailModal'
import { SUMMARY_GROUP_CLASS } from './formParts'
import { isPaid } from './accountStatement'

const ICON_BUTTON_CLASS = 'w-9 h-9 shrink-0 inline-flex items-center justify-center rounded-lg border border-outline-variant/40 text-on-surface-variant hover:bg-surface-container hover:text-primary transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

const isAnnulled = (comprobante) => comprobante.estado === 'Anulado'

function ReceiptRow({ comprobante, onOpen }) {
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState('')
  const annulled = isAnnulled(comprobante)

  const download = async () => {
    setDownloading(true)
    setError('')
    try {
      await descargarComprobantePdf(comprobante.comprobante_id)
    } catch {
      setError('No se pudo descargar el comprobante.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <li className="flex flex-col gap-1 p-3 rounded-lg border border-outline-variant/30 bg-surface-container-lowest">
      <div className="flex items-center gap-3">
        <span className={`material-symbols-outlined text-[24px] shrink-0 ${annulled ? 'text-outline' : 'text-primary'}`} aria-hidden="true">receipt_long</span>
        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-base font-semibold ${annulled ? 'text-on-surface-variant line-through' : 'text-on-surface'}`}>Comprobante #{comprobante.numero}</span>
            <span className={`px-2 py-0.5 rounded text-xs font-bold border ${annulled ? 'bg-error-container text-on-error-container border-error/20' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
              {comprobante.estado ?? 'Vigente'}
            </span>
          </div>
          <span className="text-sm text-on-surface-variant">Emitido el {formatDate(comprobante.fecha_emision)}</span>
        </div>
        <div className="text-right shrink-0">
          <span className="block text-xs text-on-surface-variant">Total del comprobante</span>
          <span className="text-base font-bold text-on-surface">{formatAmount(comprobante.monto_total)}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button type="button" onClick={() => onOpen(comprobante)} title="Ver detalle" aria-label={`Ver comprobante ${comprobante.numero}`} className={ICON_BUTTON_CLASS}>
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">visibility</span>
          </button>
          <button type="button" onClick={download} disabled={downloading} title="Descargar PDF" aria-label={`Descargar comprobante ${comprobante.numero}`} className={ICON_BUTTON_CLASS}>
            <span className={`material-symbols-outlined text-[20px] ${downloading ? 'animate-spin' : ''}`} aria-hidden="true">{downloading ? 'progress_activity' : 'download'}</span>
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-error pl-9" role="alert">{error}</p>}
    </li>
  )
}

// Content of the row that opens below a cuota: its receipts and the actions on it
function CuotaDetailPanel({ cuota, colSpan, onPay, onAssignBenefit }) {
  const [receipts, setReceipts] = useState({ loading: true, error: '', items: [] })
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState({ loading: false, error: null, data: null })
  const payable = !isPaid(cuota) && Number(cuota.saldo_pendiente ?? 0) > 0

  useEffect(() => {
    let active = true
    getComprobantesByCuota(cuota.cuota_id)
      .then((items) => active && setReceipts({ loading: false, error: '', items: items ?? [] }))
      .catch(() => active && setReceipts({ loading: false, error: 'No se pudieron cargar los comprobantes.', items: [] }))
    return () => { active = false }
  }, [cuota.cuota_id])

  const openReceipt = async (comprobante) => {
    setSelected(comprobante)
    setDetail({ loading: true, error: null, data: null })
    try {
      setDetail({ loading: false, error: null, data: await getComprobante(comprobante.comprobante_id) })
    } catch {
      setDetail({ loading: false, error: 'No se pudo cargar el detalle.', data: null })
    }
  }

  return (
    <tr className="bg-surface-container-low/60">
      <td colSpan={colSpan} className="px-4 py-4 border-l-4 border-primary">
        <div className="flex flex-col lg:flex-row gap-4">
          <section className="flex-1 min-w-0 flex flex-col gap-2" aria-label="Comprobantes asociados">
            <h4 className={SUMMARY_GROUP_CLASS}>Comprobantes asociados</h4>
            {receipts.loading && (
              <p className="flex items-center gap-2 text-base text-on-surface-variant" role="status">
                <span className="material-symbols-outlined text-[20px] animate-spin" aria-hidden="true">progress_activity</span>
                Cargando comprobantes...
              </p>
            )}
            {receipts.error && <p className="text-sm text-error" role="alert">{receipts.error}</p>}
            {!receipts.loading && !receipts.error && (receipts.items.length ? (
              <ul className="flex flex-col gap-2">
                {receipts.items.map((comprobante) => (
                  <ReceiptRow key={comprobante.comprobante_id} comprobante={comprobante} onOpen={openReceipt} />
                ))}
              </ul>
            ) : (
              <p className="text-base text-on-surface-variant py-4 text-center border border-dashed border-outline-variant/40 rounded-lg">
                Sin comprobantes asociados.
              </p>
            ))}
          </section>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 lg:w-64 shrink-0 [&>button]:justify-center">
            <h4 className={`${SUMMARY_GROUP_CLASS} hidden lg:block`}>Acciones</h4>
            {payable && onPay && (
              <PrimaryButton icon="payments" onClick={() => onPay(cuota)}>
                Pagar · {formatAmount(Number(cuota.saldo_pendiente ?? 0))}
              </PrimaryButton>
            )}
            {onAssignBenefit && !isPaid(cuota) && (
              <SecondaryButton icon="redeem" onClick={() => onAssignBenefit(cuota)}>Asignar beca o descuento</SecondaryButton>
            )}
          </div>
        </div>

        <ComprobanteDetailModal
          comprobante={selected}
          detalle={detail.data}
          loading={detail.loading}
          error={detail.error}
          opened={Boolean(selected)}
          onClose={() => setSelected(null)}
        />
      </td>
    </tr>
  )
}

export default CuotaDetailPanel
