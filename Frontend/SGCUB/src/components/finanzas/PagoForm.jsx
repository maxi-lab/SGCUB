import { useMemo, useState } from 'react'
import { formatAmount, formatDate, formatNumber } from '../personas/format'
import { PrimaryButton, SecondaryButton } from '../personas/tabs/parts'
import ComprobantePago from './ComprobantePago'
import { registrarPago } from '../../api/pagos'
import { getComprobante } from '../../api/comprobantes'

const PAYMENT_METHODS = [
  { value: 'Efectivo', label: 'Efectivo' },
  { value: 'Transferencia', label: 'Transferencia' },
  { value: 'BilleteraVirtual', label: 'Billetera virtual' },
]

const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

const emptyPaymentRow = () => ({ medio: '', monto: '' })

const errorMessages = (data) => {
  if (!data) return []
  if (typeof data === 'string') return [data]
  if (Array.isArray(data)) return data.flatMap(errorMessages)
  if (typeof data === 'object') return Object.values(data).flatMap(errorMessages)
  return []
}

const todayIso = () => {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
}

const periodLabel = (periodo) => {
  const [year, month] = String(periodo ?? '').split('-')
  const name = MONTHS[Number(month) - 1]
  return name ? `${name} ${year}` : periodo || '—'
}

const lateFee = (cuota) => (cuota.items ?? [])
  .filter((item) => !item.es_descuento && String(item.concepto ?? '').toLowerCase() === 'mora')
  .reduce((total, item) => total + Number(item.monto || 0), 0)

const dueText = (cuota, today) => {
  const first = cuota.fecha_venc1?.split('T')[0]
  const second = cuota.fecha_venc2?.split('T')[0]
  if (!first) return 'Sin fecha de vencimiento'
  if (first >= today) return `Vence el ${formatDate(first)}`
  if (second && second >= today) return `Venció el ${formatDate(first)} · 2° vencimiento ${formatDate(second)}`
  return `Venció el ${formatDate(first)}`
}

function CuotaOption({ cuota, today, selected, onToggle }) {
  const total = Number(cuota.monto_total || 0)
  const fee = lateFee(cuota)
  const paid = Number(cuota.monto_pagado || 0)
  const pending = Number(cuota.saldo_pendiente || 0)
  const overdue = Boolean(cuota.fecha_venc1) && cuota.fecha_venc1.split('T')[0] < today

  return (
    <label className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-surface-container-lowest border cursor-pointer transition-colors ${selected ? 'border-primary/50 ring-1 ring-primary/30' : 'border-outline-variant/30 hover:border-outline-variant'}`}>
      <div className="flex items-center gap-3 min-w-0">
        <input type="checkbox" checked={selected} onChange={(event) => onToggle(cuota.cuota_id, event.target.checked)} className="h-4 w-4 accent-primary shrink-0" />
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${overdue ? 'bg-error' : 'bg-emerald-500'}`} aria-hidden="true" />
        <div className="flex flex-col min-w-0">
          <span className="text-base font-semibold text-on-surface truncate">Cuota {periodLabel(cuota.periodo)}</span>
          <span className={`text-sm ${overdue ? 'text-error' : 'text-on-surface-variant'}`}>{dueText(cuota, today)}</span>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-x-6 gap-y-2 md:justify-end pl-7 md:pl-0">
        <div className="text-right">
          <span className="block text-xs text-on-surface-variant">Monto total</span>
          <span className="text-sm font-semibold text-on-surface">{formatAmount(total - fee)}</span>
        </div>
        {fee > 0 && (
          <div className="text-right">
            <span className="block text-xs text-on-surface-variant">Recargo por vencimiento</span>
            <span className="text-sm font-semibold text-error">+ {formatAmount(fee)}</span>
          </div>
        )}
        {paid > 0 && (
          <div className="text-right">
            <span className="block text-xs text-on-surface-variant">Pago parcial</span>
            <span className="text-sm font-semibold text-emerald-700">− {formatAmount(paid)}</span>
          </div>
        )}
        <div className="text-right pl-6 border-l border-outline-variant/30">
          <span className="block text-xs text-on-surface-variant">Total a pagar</span>
          <span className="text-base font-bold text-on-surface">{formatAmount(pending)}</span>
        </div>
      </div>
    </label>
  )
}

function PagoForm({ socio, cuenta, onCancel, onSuccess }) {
  const today = todayIso()
  const pendingCuotas = useMemo(
    () => (cuenta?.cuotas ?? []).filter((cuota) => Number(cuota.saldo_pendiente ?? 0) > 0),
    [cuenta],
  )
  const [selectedIds, setSelectedIds] = useState([])
  const [paymentRows, setPaymentRows] = useState([emptyPaymentRow()])
  const [observacion, setObservacion] = useState('')
  const [errors, setErrors] = useState({})
  const [receipt, setReceipt] = useState(null)
  const [saving, setSaving] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const selectedTotal = pendingCuotas
    .filter((cuota) => selectedIds.includes(cuota.cuota_id))
    .reduce((total, cuota) => total + Number(cuota.saldo_pendiente || 0), 0)
  const enteredTotal = paymentRows.reduce((total, row) => total + Number(row.monto || 0), 0)
  const difference = Math.round((enteredTotal - selectedTotal) * 100) / 100

  const toggleCuota = (cuotaId, checked) => {
    setSelectedIds((current) => (checked ? [...current, cuotaId] : current.filter((id) => id !== cuotaId)))
  }

  const updateRow = (index, field, value) => {
    setPaymentRows((current) => current.map((row, position) => (position === index ? { ...row, [field]: value } : row)))
  }

  const validate = () => {
    const newErrors = {}
    if (!selectedIds.length) newErrors.cuotas = 'Seleccioná al menos una cuota.'
    if (paymentRows.some((row) => !row.medio || !row.monto || Number(row.monto) <= 0)) {
      newErrors.medios = 'Completá el medio y el monto de cada fila.'
    }
    if (selectedIds.length && difference > 0) newErrors.montos = 'El pago no puede superar el total de las cuotas seleccionadas.'
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const confirmPayment = async (event) => {
    event.preventDefault()
    if (!validate()) return
    setSaving(true)
    setSubmitError('')
    try {
      const response = await registrarPago({
        socio_id: socio.socio_id,
        cuota_ids: selectedIds,
        monto_total: enteredTotal,
        medios: paymentRows.map((row) => ({ medio_de_pago: row.medio, monto: Number(row.monto) })),
        observacion,
      })
      const detalle = await getComprobante(response.comprobante?.comprobante_id).catch(() => null)
      setReceipt({
        detalle,
        medios: paymentRows.map((row) => ({ ...row, monto: Number(row.monto), medio: PAYMENT_METHODS.find((option) => option.value === row.medio)?.label ?? row.medio })),
        montoTotal: enteredTotal,
        observacion,
        numero: response.comprobante?.numero,
        fecha: response.comprobante?.fecha_emision,
      })
      onSuccess?.(response)
    } catch (error) {
      setSubmitError(errorMessages(error.response?.data).join(' ') || 'No se pudo registrar el pago.')
    } finally {
      setSaving(false)
    }
  }

  if (receipt) {
    return <ComprobantePago socio={socio} {...receipt} onBack={onCancel} />
  }

  const balance = !selectedIds.length || enteredTotal <= 0
    ? { box: 'bg-surface-container-lowest border-outline-variant/30', icon: 'info', iconClass: 'text-outline', title: 'Sin montos para conciliar', titleClass: 'text-on-surface', detail: 'Seleccioná cuotas e ingresá los medios de pago.' }
    : difference === 0
      ? { box: 'bg-emerald-50/70 border-emerald-200/80', icon: 'check_circle', iconClass: 'text-emerald-700', title: 'Montos coincidentes', titleClass: 'text-emerald-700', detail: 'Se cancelan las cuotas seleccionadas.' }
      : difference < 0
        ? { box: 'bg-amber-50/70 border-amber-200/80', icon: 'hourglass_bottom', iconClass: 'text-amber-700', title: 'Pago parcial', titleClass: 'text-amber-700', detail: `Quedan ${formatAmount(Math.abs(difference))} pendientes.` }
        : { box: 'bg-error-container/40 border-error/20', icon: 'warning', iconClass: 'text-error', title: 'El pago excede lo seleccionado', titleClass: 'text-error', detail: `Sobran ${formatAmount(difference)}.` }

  return (
    <form onSubmit={confirmPayment} className="flex flex-col gap-6" noValidate>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 p-4 bg-surface-container-low rounded-xl border border-outline-variant/30">
        <div><p className="text-sm uppercase tracking-wider font-semibold text-primary">Socio</p><h2 className="text-xl font-bold text-on-surface">{socio.apellido}, {socio.nombre}</h2><p className="text-base text-on-surface-variant">DNI {socio.dni} · Socio {formatNumber(socio.numero_socio)}</p></div>
        <div className="lg:text-right"><p className="text-sm text-on-surface-variant">Saldo disponible para cancelar</p><p className="text-2xl font-bold text-error">{formatAmount(cuenta?.total_adeudado)}</p></div>
      </div>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-outline text-[20px]" aria-hidden="true">checklist</span>
            <h3 className="text-lg font-bold text-on-surface">Cuotas a pagar</h3>
          </div>
          <span className="text-sm text-on-surface-variant">{pendingCuotas.length} {pendingCuotas.length === 1 ? 'cuota pendiente' : 'cuotas pendientes'}</span>
        </div>
        <div className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-3">
          {pendingCuotas.length
            ? pendingCuotas.map((cuota) => <CuotaOption key={cuota.cuota_id} cuota={cuota} today={today} selected={selectedIds.includes(cuota.cuota_id)} onToggle={toggleCuota} />)
            : <p className="text-base text-on-surface-variant text-center py-6">El socio no tiene cuotas pendientes.</p>}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-1.5 text-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[18px] text-primary" aria-hidden="true">info</span>
              <span>Si el pago es menor al total, el saldo restante queda pendiente.</span>
            </div>
            <div className="flex items-center gap-2 bg-surface-container px-4 py-2 rounded-xl self-end sm:self-auto">
              <span className="text-sm text-on-surface-variant">Total a pagar:</span>
              <span className="text-lg font-bold text-primary">{formatAmount(selectedTotal)}</span>
            </div>
          </div>
        </div>
        {errors.cuotas && <p className="text-sm text-error" role="alert">{errors.cuotas}</p>}
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-outline text-[20px]" aria-hidden="true">account_balance_wallet</span>
            <h3 className="text-lg font-bold text-on-surface">Medios de pago</h3>
          </div>
          <span className="text-sm text-on-surface-variant">Podés combinar varios medios</span>
        </div>
        <div className="bg-surface-container-low rounded-xl p-4 flex flex-col gap-3">
          {paymentRows.map((row, index) => (
            <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end p-4 rounded-xl bg-surface-container-lowest border border-outline-variant/30">
              <label className="sm:col-span-6 flex flex-col gap-1">
                <span className="text-xs text-on-surface-variant">Medio de pago</span>
                <select value={row.medio} onChange={(event) => updateRow(index, 'medio', event.target.value)} className="h-10 px-3 bg-surface-container-low rounded-lg border border-outline-variant/40 text-base text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="">Seleccioná un medio</option>
                  {PAYMENT_METHODS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="sm:col-span-5 flex flex-col gap-1">
                <span className="text-xs text-on-surface-variant">Monto</span>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-outline">$</span>
                  <input type="number" min="0.01" step="0.01" value={row.monto} onChange={(event) => updateRow(index, 'monto', event.target.value)} placeholder="0,00" className="w-full h-10 pl-7 pr-3 bg-surface-container-low rounded-lg border border-outline-variant/40 text-base font-semibold text-on-surface text-right focus:outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </label>
              <div className="sm:col-span-1 flex justify-end sm:justify-center sm:pb-1">
                <button type="button" disabled={paymentRows.length === 1} onClick={() => setPaymentRows((current) => current.filter((_, position) => position !== index))} title="Quitar medio" className="w-8 h-8 rounded-lg text-outline hover:text-error hover:bg-error-container flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-outline">
                  <span className="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>
            </div>
          ))}
          <button type="button" onClick={() => setPaymentRows((current) => [...current, emptyPaymentRow()])} className="self-start inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-surface-container text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface text-sm font-semibold transition-colors cursor-pointer">
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            Agregar otro medio de pago
          </button>
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_1.5fr] gap-3 items-center pt-3 border-t border-outline-variant/30">
            <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/30 flex flex-col">
              <span className="text-sm text-on-surface-variant">Total a pagar</span>
              <span className="text-lg font-bold text-on-surface">{formatAmount(selectedTotal)}</span>
            </div>
            <span className="material-symbols-outlined text-outline hidden md:block" aria-hidden="true">compare_arrows</span>
            <div className="p-3 bg-surface-container-lowest rounded-xl border border-outline-variant/30 flex flex-col">
              <span className="text-sm text-on-surface-variant">Total ingresado</span>
              <span className="text-lg font-bold text-primary">{formatAmount(enteredTotal)}</span>
            </div>
            <div className={`flex items-center gap-2 p-3 rounded-xl border ${balance.box}`}>
              <span className={`material-symbols-outlined text-[22px] ${balance.iconClass}`} aria-hidden="true">{balance.icon}</span>
              <div className="flex flex-col">
                <span className={`text-sm font-semibold ${balance.titleClass}`}>{balance.title}</span>
                <span className="text-xs text-on-surface-variant">{balance.detail}</span>
              </div>
            </div>
          </div>
        </div>
        {errors.medios && <p className="text-sm text-error" role="alert">{errors.medios}</p>}
        {errors.montos && <p className="text-sm text-error" role="alert">{errors.montos}</p>}
      </section>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-on-surface-variant">Observaciones <span className="font-normal text-outline">(opcional)</span></span>
        <input type="text" value={observacion} onChange={(event) => setObservacion(event.target.value)} maxLength="200" placeholder="Detalle adicional del pago" className="w-full h-10 px-4 bg-surface-container-low rounded-xl border border-outline-variant/40 text-base text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20" />
      </label>

      {submitError && <p className="text-sm text-error bg-error-container p-3 rounded-lg" role="alert">{submitError}</p>}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-surface-container">
        <SecondaryButton icon="close" onClick={onCancel}>Cancelar</SecondaryButton>
        <PrimaryButton icon={saving ? 'progress_activity' : 'payments'} type="submit" disabled={saving || difference > 0}>{saving ? 'Registrando...' : `Confirmar pago (${formatAmount(enteredTotal)})`}</PrimaryButton>
      </div>
    </form>
  )
}

export default PagoForm
