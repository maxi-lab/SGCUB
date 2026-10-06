import { useEffect, useMemo, useState } from 'react'
import { Modal } from '@mantine/core'
import { collectErrorMessages, formatAmount } from '../personas/format'

const fechaHoy = () => {
  const hoy = new Date()
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
}

const formularioInicial = () => ({
  tipo: 'descuento',
  modalidad: 'fijo',
  valor: '',
  concepto: 'CuotaSocial',
  fechaInicio: fechaHoy(),
  fechaFin: '',
  motivo: '',
})

const baseDescontable = (cuota) => (cuota?.items ?? [])
  .filter((item) => !item.es_descuento && item.concepto !== 'Mora')
  .reduce((total, item) => total + Number(item.monto ?? 0), 0)

const CONCEPTOS = [
  { value: 'CuotaSocial', label: 'Cuota social' },
  { value: 'CuotaDeportiva', label: 'Cuota deportiva' },
  { value: 'Otro', label: 'Otro concepto' },
]

function BecaDescuentoModal({ opened, cuota, onClose, onSubmit, isSaving }) {
  const [formulario, setFormulario] = useState(formularioInicial)
  const [error, setError] = useState('')
  const montoCuota = baseDescontable(cuota)
  const tienePagos = Number(cuota?.monto_pagado ?? 0) > 0 || cuota?.estado_cuota === 'Paga'
  const montoCalculado = useMemo(() => {
    const valor = Number(formulario.valor)
    if (!Number.isFinite(valor) || valor <= 0) return 0
    const monto = formulario.modalidad === 'porcentaje'
      ? montoCuota * valor / 100
      : valor
    return Math.round((monto + Number.EPSILON) * 100) / 100
  }, [formulario.modalidad, formulario.valor, montoCuota])

  useEffect(() => {
    if (opened) {
      setFormulario({ ...formularioInicial(), tipo: tienePagos ? 'beca' : 'descuento' })
      setError('')
    }
  }, [cuota?.cuota_id, opened, tienePagos])

  const actualizar = (campo, valor) => {
    setFormulario((actual) => ({ ...actual, [campo]: valor }))
    setError('')
  }

  const enviar = async (event) => {
    event.preventDefault()
    const valor = Number(formulario.valor)
    if (!formulario.fechaInicio || !formulario.concepto || !formulario.motivo.trim()) {
      setError('Completá todos los campos obligatorios.')
      return
    }
    if (!Number.isFinite(valor) || valor <= 0) {
      setError('Ingresá un monto o porcentaje mayor a cero.')
      return
    }
    if (formulario.modalidad === 'fijo' && valor >= montoCuota) {
      setError('El monto fijo debe ser menor que el valor actual de la cuota.')
      return
    }
    if (formulario.modalidad === 'porcentaje' && (valor < 1 || valor > 100)) {
      setError('El porcentaje debe estar entre 1% y 100%.')
      return
    }
    if (formulario.tipo === 'beca' && !formulario.fechaFin) {
      setError('Indicá la fecha de finalización de la beca.')
      return
    }
    if (formulario.tipo === 'beca' && formulario.fechaFin < formulario.fechaInicio) {
      setError('La finalización no puede ser anterior a la fecha de alta del beneficio.')
      return
    }

    try {
      await onSubmit({
        tipo: formulario.tipo === 'beca' ? 'Beca' : 'Descuento',
        modalidad: formulario.modalidad === 'porcentaje' ? 'Porcentaje' : 'MontoFijo',
        valor,
        concepto: formulario.concepto,
        fecha_aplicacion: formulario.fechaInicio,
        ...(formulario.tipo === 'beca' && { fecha_fin: formulario.fechaFin }),
        motivo: formulario.motivo.trim(),
      })
    } catch (requestError) {
      setError(collectErrorMessages(requestError.response?.data).join(' ') || requestError.message || 'No se pudo aplicar el beneficio.')
    }
  }

  if (!cuota) return null

  return (
    <Modal opened={opened} onClose={() => !isSaving && onClose()} title="Asignar beca o descuento" centered size="lg">
      <form onSubmit={enviar} className="flex flex-col gap-4" noValidate>
        <div className="p-3 bg-surface-container-low border border-outline-variant/30 rounded-lg">
          <p className="text-sm text-on-surface-variant">Cuota seleccionada · {cuota.periodo}</p>
          <p className="text-lg font-semibold text-on-surface">Importe sobre el que se calcula: {formatAmount(montoCuota)}</p>
          {tienePagos && <p className="mt-1 text-sm text-on-surface-variant">La cuota tiene pagos: solo puede asignarse una beca, que se aplicará a las cuotas siguientes dentro de su vigencia.</p>}
        </div>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-semibold text-on-surface">Tipo de beneficio <span className="text-error">*</span></legend>
          <div className="grid grid-cols-2 gap-2">
            {[['descuento', 'Descuento'], ['beca', 'Beca']].map(([value, label]) => (
              <label key={value} className={`flex items-center gap-2 p-3 border rounded-md ${value === 'descuento' && tienePagos ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${formulario.tipo === value ? 'border-primary bg-primary/5' : 'border-outline-variant/40'}`}>
                <input type="radio" name="tipo-beneficio" value={value} checked={formulario.tipo === value} disabled={value === 'descuento' && tienePagos} onChange={() => actualizar('tipo', value)} className="accent-primary" />
                <span className="font-semibold text-on-surface">{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-semibold text-on-surface">Modalidad del descuento <span className="text-error">*</span></legend>
          <div className="inline-flex self-start border border-outline-variant/50 rounded-md overflow-hidden">
            {[['fijo', 'Monto fijo'], ['porcentaje', 'Porcentaje']].map(([value, label]) => (
              <button key={value} type="button" onClick={() => actualizar('modalidad', value)} aria-pressed={formulario.modalidad === value} className={`px-3 py-2 text-sm font-semibold ${formulario.modalidad === value ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-low'}`}>{label}</button>
            ))}
          </div>
          <label className="flex flex-col gap-1 text-sm text-on-surface-variant">
            {formulario.modalidad === 'porcentaje' ? 'Porcentaje (1 a 100%)' : 'Monto (menor a la cuota)'}
            <input type="number" min={formulario.modalidad === 'porcentaje' ? '1' : '0.01'} max={formulario.modalidad === 'porcentaje' ? '100' : undefined} step={formulario.modalidad === 'porcentaje' ? '1' : '0.01'} value={formulario.valor} onChange={(event) => actualizar('valor', event.target.value)} className="h-10 px-3 bg-surface-container-lowest border border-outline-variant/50 rounded-md text-on-surface focus:outline-none focus:border-primary" aria-required="true" />
          </label>
          <p className="text-sm text-on-surface-variant">Beneficio aplicado: <strong className="text-on-surface">{formatAmount(montoCalculado)}</strong></p>
        </fieldset>

        <label className="flex flex-col gap-1.5 text-sm font-semibold text-on-surface">Concepto <span className="text-error">*</span>
          <select value={formulario.concepto} onChange={(event) => actualizar('concepto', event.target.value)} className="h-10 px-3 bg-surface-container-lowest border border-outline-variant/50 rounded-md font-normal">
            {CONCEPTOS.map((concepto) => <option key={concepto.value} value={concepto.value}>{concepto.label}</option>)}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-semibold text-on-surface">Fecha de alta del beneficio <span className="text-error">*</span>
          <input type="date" value={formulario.fechaInicio} onChange={(event) => actualizar('fechaInicio', event.target.value)} className="h-10 px-3 bg-surface-container-lowest border border-outline-variant/50 rounded-md font-normal" />
        </label>

        {formulario.tipo === 'beca' && (
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-on-surface">Fecha de finalización <span className="text-error">*</span>
            <input type="date" min={formulario.fechaInicio} value={formulario.fechaFin} onChange={(event) => actualizar('fechaFin', event.target.value)} className="h-10 px-3 bg-surface-container-lowest border border-outline-variant/50 rounded-md font-normal" />
          </label>
        )}

        <label className="flex flex-col gap-1.5 text-sm font-semibold text-on-surface">Motivo de aplicación <span className="text-error">*</span>
          <textarea value={formulario.motivo} onChange={(event) => actualizar('motivo', event.target.value)} rows={3} maxLength={140} className="p-3 bg-surface-container-lowest border border-outline-variant/50 rounded-md font-normal resize-y focus:outline-none focus:border-primary" />
          <span className="text-xs font-normal text-on-surface-variant">{formulario.motivo.length}/140</span>
        </label>

        {error && <p className="p-3 text-sm text-error bg-error-container rounded-md" role="alert">{error}</p>}
        <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/30">
          <button type="button" onClick={onClose} disabled={isSaving} className="h-10 px-4 border border-outline-variant/50 rounded-md font-semibold text-on-surface hover:bg-surface-container-low">Cancelar</button>
          <button type="submit" disabled={isSaving} className="inline-flex items-center gap-2 h-10 px-4 bg-primary text-on-primary rounded-md font-semibold hover:bg-primary/90 disabled:opacity-50">
            <span className="material-symbols-outlined text-lg">{isSaving ? 'progress_activity' : 'savings'}</span>{isSaving ? 'Aplicando...' : 'Aplicar beneficio'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default BecaDescuentoModal