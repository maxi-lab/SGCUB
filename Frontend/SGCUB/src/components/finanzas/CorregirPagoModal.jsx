import { useEffect, useMemo, useState } from 'react'
import { Modal } from '@mantine/core'
import { getEstadoCuenta } from '../../api/estadoCuenta'
import { corregirPago } from '../../api/pagos'
import { formatAmount, formatDate } from '../personas/format'

const medioInicial = () => ({ medio_de_pago: '', monto: '' })

function CorregirPagoModal({ comprobante, pago, opened, onClose, onSuccess }) {
  const [cuenta, setCuenta] = useState(null)
  const [cargandoCuenta, setCargandoCuenta] = useState(false)
  const [cuotasSeleccionadas, setCuotasSeleccionadas] = useState([])
  const [montoTotal, setMontoTotal] = useState('')
  const [medios, setMedios] = useState([medioInicial()])
  const [motivo, setMotivo] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const socioId = pago?.socio?.socio_id
    if (!opened || !socioId) return undefined

    let activo = true
    setCuenta(null)
    setCargandoCuenta(true)
    setError('')
    setCuotasSeleccionadas([])
    setMontoTotal(String(comprobante?.monto_total ?? ''))
    setMedios((pago.items_pago ?? []).map((item) => ({
      medio_de_pago: item.medio_de_pago,
      monto: String(item.monto),
    })).length ? pago.items_pago.map((item) => ({
      medio_de_pago: item.medio_de_pago,
      monto: String(item.monto),
    })) : [medioInicial()])
    setMotivo('')

    getEstadoCuenta(socioId)
      .then((respuesta) => activo && setCuenta(respuesta))
      .catch(() => activo && setError('No se pudo cargar el estado de cuenta para elegir las cuotas corregidas.'))
      .finally(() => activo && setCargandoCuenta(false))

    return () => { activo = false }
  }, [comprobante?.monto_total, opened, pago])

  const cuotas = cuenta?.cuotas ?? []
  const montoMaximo = useMemo(
    () => cuotas
      .filter((cuota) => cuotasSeleccionadas.includes(cuota.cuota_id))
      .reduce((total, cuota) => total + Number(cuota.monto_total ?? 0), 0),
    [cuotas, cuotasSeleccionadas],
  )
  const sumaMedios = medios.reduce((total, medio) => total + Number(medio.monto || 0), 0)

  const actualizarMedio = (index, campo, valor) => {
    setMedios((actuales) => actuales.map((medio, posicion) => (
      posicion === index ? { ...medio, [campo]: valor } : medio
    )))
  }

  const enviarCorreccion = async (event) => {
    event.preventDefault()
    setError('')

    if (!motivo.trim()) {
      setError('Ingresá el motivo de la corrección para dejar trazabilidad.')
      return
    }
    if (!cuotasSeleccionadas.length) {
      setError('Seleccioná las cuotas que debe cancelar el pago corregido.')
      return
    }
    if (!montoTotal || Number(montoTotal) <= 0 || Number(montoTotal) > montoMaximo) {
      setError('El monto debe ser mayor a cero y no puede superar las cuotas seleccionadas.')
      return
    }
    if (!medios.length || medios.some((medio) => !medio.medio_de_pago || Number(medio.monto) <= 0)) {
      setError('Completá un medio y un monto válido para cada fila.')
      return
    }
    if (Math.abs(sumaMedios - Number(montoTotal)) > 0.001) {
      setError('La suma de los medios de pago debe coincidir con el monto total.')
      return
    }

    setGuardando(true)
    try {
      const resultado = await corregirPago(pago.pago_id, {
        motivo: motivo.trim(),
        cuota_ids: cuotasSeleccionadas,
        monto_total: Number(montoTotal),
        medios: medios.map((medio) => ({
          medio_de_pago: medio.medio_de_pago,
          monto: Number(medio.monto),
        })),
      })
      await onSuccess?.(resultado)
      onClose()
    } catch (requestError) {
      if (requestError.response?.status === 403) {
        setError('Solo tesorería o dirección pueden corregir pagos.')
      } else if (requestError.response?.status === 404) {
        setError('El servidor todavía no tiene disponible la operación de corrección de pagos.')
      } else {
        setError(requestError.response?.data?.detail || 'No se pudo registrar la corrección. El pago original se conserva.')
      }
    } finally {
      setGuardando(false)
    }
  }

  if (!comprobante || !pago) return null

  return (
    <Modal opened={opened} onClose={() => !guardando && onClose()} title="Corregir pago registrado" centered size="lg">
      <form onSubmit={enviarCorreccion} className="flex flex-col gap-5" noValidate>
        <div className="grid grid-cols-2 gap-3 p-3 bg-surface-container-low border border-outline-variant/30 rounded-lg">
          <div><p className="text-sm text-on-surface-variant">Pago original</p><p className="font-semibold text-on-surface">#{pago.pago_id}</p></div>
          <div><p className="text-sm text-on-surface-variant">Comprobante original</p><p className="font-semibold text-on-surface">#{comprobante.numero}</p></div>
          <div><p className="text-sm text-on-surface-variant">Monto original</p><p className="font-semibold text-on-surface">{formatAmount(comprobante.monto_total)}</p></div>
          <div><p className="text-sm text-on-surface-variant">Socio</p><p className="font-semibold text-on-surface">{pago.socio?.apellido}, {pago.socio?.nombre}</p></div>
        </div>

        <p className="text-sm text-on-surface-variant">Se conservará el pago original. Esta solicitud debe generar un contra-asiento auditable y vincular el comprobante corregido.</p>

        <fieldset className="flex flex-col gap-2">
          <legend className="font-semibold text-on-surface">Cuotas que debe cancelar</legend>
          {cargandoCuenta && <p className="text-sm text-on-surface-variant">Cargando cuotas...</p>}
          {!cargandoCuenta && cuotas.length === 0 && <p className="text-sm text-on-surface-variant">La cuenta no tiene cuotas disponibles.</p>}
          <div className="max-h-48 overflow-auto border border-outline-variant/30 divide-y divide-outline-variant/20 rounded-lg">
            {cuotas.map((cuota) => (
              <label key={cuota.cuota_id} className="flex items-center gap-3 p-3 hover:bg-surface-container-low cursor-pointer">
                <input type="checkbox" checked={cuotasSeleccionadas.includes(cuota.cuota_id)} onChange={(event) => setCuotasSeleccionadas((actuales) => event.target.checked ? [...actuales, cuota.cuota_id] : actuales.filter((id) => id !== cuota.cuota_id))} className="accent-primary" />
                <span className="min-w-0 flex-1"><strong className="block text-on-surface">Período {cuota.periodo}</strong><span className="text-sm text-on-surface-variant">Vence {formatDate(cuota.fecha_venc2)} · {cuota.estado_cuota}</span></span>
                <strong className="text-sm text-on-surface">{formatAmount(cuota.monto_total)}</strong>
              </label>
            ))}
          </div>
          <p className="text-sm text-on-surface-variant">Monto seleccionado: {formatAmount(montoMaximo)}</p>
        </fieldset>

        <label className="flex flex-col gap-1.5 text-sm font-semibold text-on-surface">Monto corregido
          <input type="number" min="0.01" step="0.01" value={montoTotal} onChange={(event) => setMontoTotal(event.target.value)} className="h-10 px-3 bg-surface-container-lowest border border-outline-variant/50 rounded-md font-normal focus:outline-none focus:border-primary" />
        </label>

        <fieldset className="flex flex-col gap-2">
          <legend className="font-semibold text-on-surface">Medios de pago corregidos</legend>
          {medios.map((medio, index) => (
            <div key={index} className="flex flex-wrap gap-2">
              <select value={medio.medio_de_pago} onChange={(event) => actualizarMedio(index, 'medio_de_pago', event.target.value)} className="h-10 min-w-0 flex-1 px-3 bg-surface-container-lowest border border-outline-variant/50 rounded-md">
                <option value="">Seleccionar medio</option><option value="Efectivo">Efectivo</option><option value="Transferencia">Transferencia</option><option value="BilleteraVirtual">Billetera virtual</option>
              </select>
              <input type="number" min="0.01" step="0.01" value={medio.monto} onChange={(event) => actualizarMedio(index, 'monto', event.target.value)} aria-label={`Monto del medio ${index + 1}`} placeholder="Monto" className="h-10 w-32 px-3 bg-surface-container-lowest border border-outline-variant/50 rounded-md" />
              {medios.length > 1 && <button type="button" onClick={() => setMedios((actuales) => actuales.filter((_, posicion) => posicion !== index))} aria-label="Quitar medio de pago" className="h-10 w-10 text-error hover:bg-error-container rounded"><span className="material-symbols-outlined">delete</span></button>}
            </div>
          ))}
          <button type="button" onClick={() => setMedios((actuales) => [...actuales, medioInicial()])} className="self-start inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"><span className="material-symbols-outlined text-lg">add</span>Agregar medio</button>
          <p className="text-sm text-on-surface-variant">Distribución: {formatAmount(sumaMedios)}</p>
        </fieldset>

        <label className="flex flex-col gap-1.5 text-sm font-semibold text-on-surface">Motivo de la corrección
          <textarea value={motivo} onChange={(event) => setMotivo(event.target.value)} rows={3} maxLength={200} required className="p-3 bg-surface-container-lowest border border-outline-variant/50 rounded-md font-normal focus:outline-none focus:border-primary resize-y" placeholder="Describí el error que se corrige" />
        </label>

        {error && <p className="p-3 text-sm text-error bg-error-container rounded-md" role="alert">{error}</p>}
        <div className="flex justify-end gap-2 pt-3 border-t border-outline-variant/30">
          <button type="button" onClick={onClose} disabled={guardando} className="h-10 px-4 border border-outline-variant/50 rounded-md font-semibold text-on-surface hover:bg-surface-container-low disabled:opacity-50">Cancelar</button>
          <button type="submit" disabled={guardando || cargandoCuenta || !cuenta} className="inline-flex items-center gap-2 h-10 px-4 bg-primary text-on-primary rounded-md font-semibold hover:bg-primary/90 disabled:opacity-50">
            <span className="material-symbols-outlined text-lg">{guardando ? 'progress_activity' : 'published_with_changes'}</span>{guardando ? 'Registrando contra-asiento...' : 'Solicitar corrección'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default CorregirPagoModal