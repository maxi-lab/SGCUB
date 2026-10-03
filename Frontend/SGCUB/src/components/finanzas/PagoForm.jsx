import { useMemo, useState } from 'react'
import { formatAmount, formatDate } from '../personas/format'
import { PrimaryButton, SecondaryButton } from '../personas/tabs/parts'
import ComprobantePago from './ComprobantePago'
import { registrarPago } from '../../api/pagos'

const MEDIOS = [
  { value: 'Efectivo', label: 'Efectivo' },
  { value: 'Transferencia', label: 'Transferencia' },
  { value: 'BilleteraVirtual', label: 'Billetera virtual' },
]

const filaInicial = () => ({ medio: '', monto: '' })

function PagoForm({ socio, cuenta, onCancel, onSuccess }) {
  const cuotasPendientes = useMemo(
    () => (cuenta?.cuotas ?? []).filter((cuota) => cuota.estado_cuota !== 'Paga'),
    [cuenta],
  )
  const [cuotasSeleccionadas, setCuotasSeleccionadas] = useState([])
  const [montoTotal, setMontoTotal] = useState('')
  const [medios, setMedios] = useState([filaInicial()])
  const [observacion, setObservacion] = useState('')
  const [errores, setErrores] = useState({})
  const [guardado, setGuardado] = useState(false)
  const [comprobante, setComprobante] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [errorRegistro, setErrorRegistro] = useState('')

  const montoMedios = medios.reduce((total, medio) => total + Number(medio.monto || 0), 0)
  const montoSeleccionado = cuotasPendientes
    .filter((cuota) => cuotasSeleccionadas.includes(cuota.cuota_id))
    .reduce((total, cuota) => total + Number(cuota.monto_total || 0), 0)

  const cambiarMedio = (index, campo, valor) => {
    setMedios((actuales) => actuales.map((medio, posicion) => (
      posicion === index ? { ...medio, [campo]: valor } : medio
    )))
  }

  const validar = () => {
    const nuevosErrores = {}
    if (!cuotasSeleccionadas.length) nuevosErrores.cuotas = 'Seleccioná al menos una cuota.'
    if (!montoTotal || Number(montoTotal) <= 0) nuevosErrores.montoTotal = 'Ingresá un monto total válido.'
    if (!medios.length || medios.some((medio) => !medio.medio || !medio.monto || Number(medio.monto) <= 0)) {
      nuevosErrores.medios = 'Completá el medio y el monto de cada fila.'
    }
    if (montoTotal && Math.abs(Number(montoTotal) - montoMedios) > 0.001) {
      nuevosErrores.montos = 'La suma de los medios debe coincidir con el monto total.'
    }
    if (montoTotal && Number(montoTotal) > montoSeleccionado) {
      nuevosErrores.exceso = 'El pago no puede superar el saldo de las cuotas seleccionadas.'
    }
    setErrores(nuevosErrores)
    return Object.keys(nuevosErrores).length === 0
  }

  const confirmarPago = async (event) => {
    event.preventDefault()
    if (!validar()) return
    setGuardando(true)
    setErrorRegistro('')
    try {
      const respuesta = await registrarPago({
        socio_id: socio.socio_id,
        cuota_ids: cuotasSeleccionadas,
        monto_total: Number(montoTotal),
        medios: medios.map((medio) => ({ medio_de_pago: medio.medio, monto: Number(medio.monto) })),
        observacion,
      })
      setComprobante({
        cuotas: cuotasPendientes.filter((cuota) => cuotasSeleccionadas.includes(cuota.cuota_id)),
        medios: medios.map((medio) => ({ ...medio, monto: Number(medio.monto), medio: MEDIOS.find((opcion) => opcion.value === medio.medio)?.label ?? medio.medio })),
        montoTotal: Number(montoTotal),
        observacion,
        numero: respuesta.comprobante?.numero,
        fecha: respuesta.comprobante?.fecha_emision,
      })
      setGuardado(true)
      onSuccess?.(respuesta)
    } catch (error) {
      setErrorRegistro(error.response?.data?.detail || 'No se pudo registrar el pago.')
    } finally {
      setGuardando(false)
    }
  }

  if (guardado) {
    return (
      <ComprobantePago socio={socio} {...comprobante} onBack={onCancel} />
    )
  }

  return (
    <form onSubmit={confirmarPago} className="flex flex-col gap-6" noValidate>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-4 p-4 bg-surface-container-low rounded-xl border border-outline-variant/30">
        <div><p className="text-sm uppercase tracking-wider font-semibold text-primary">Socio</p><h2 className="text-xl font-bold text-on-surface">{socio.apellido}, {socio.nombre}</h2><p className="text-base text-on-surface-variant">DNI {socio.dni} · Cuenta #{cuenta?.cuenta_corriente_id}</p></div>
        <div className="lg:text-right"><p className="text-sm text-on-surface-variant">Saldo disponible para cancelar</p><p className="text-2xl font-bold text-error">{formatAmount(cuenta?.total_adeudado)}</p></div>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-lg font-bold text-on-surface">Cuotas a saldar</legend>
        <p className="text-sm text-on-surface-variant">Podés seleccionar una o varias cuotas y registrar un pago parcial.</p>
        <div className="border border-outline-variant/30 rounded-xl overflow-hidden divide-y divide-outline-variant/20">
          {cuotasPendientes.map((cuota) => <label key={cuota.cuota_id} className="flex items-center gap-3 p-3 hover:bg-surface-container-low cursor-pointer"><input type="checkbox" checked={cuotasSeleccionadas.includes(cuota.cuota_id)} onChange={(event) => setCuotasSeleccionadas((actuales) => event.target.checked ? [...actuales, cuota.cuota_id] : actuales.filter((id) => id !== cuota.cuota_id))} className="h-4 w-4 accent-primary" /><span className="flex-1"><strong className="block text-on-surface">Período {cuota.periodo}</strong><span className="text-sm text-on-surface-variant">Vence {formatDate(cuota.fecha_venc1)} · {formatAmount(cuota.monto_total)}</span></span></label>)}
        </div>
        {errores.cuotas && <p className="text-sm text-error" role="alert">{errores.cuotas}</p>}
      </fieldset>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <fieldset className="flex flex-col gap-3">
          <legend className="text-lg font-bold text-on-surface">Importe del pago</legend>
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-on-surface-variant">Monto total registrado<input type="number" min="0.01" step="0.01" value={montoTotal} onChange={(event) => setMontoTotal(event.target.value)} className={`h-11 px-3 rounded-lg bg-surface-container-low border ${errores.montoTotal ? 'border-error' : 'border-outline-variant/40'} text-on-surface focus:outline-none focus:border-primary`} placeholder="0,00" /></label>
          {errores.montoTotal && <p className="text-sm text-error" role="alert">{errores.montoTotal}</p>}
          {errores.exceso && <p className="text-sm text-error" role="alert">{errores.exceso}</p>}
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-lg font-bold text-on-surface">Medios de pago</legend>
          {medios.map((medio, index) => <div key={`${index}-${medio.medio}`} className="flex gap-2"><select value={medio.medio} onChange={(event) => cambiarMedio(index, 'medio', event.target.value)} className="h-11 flex-1 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface focus:outline-none focus:border-primary"><option value="">Medio de pago</option>{MEDIOS.map((opcion) => <option key={opcion.value} value={opcion.value}>{opcion.label}</option>)}</select><input type="number" min="0.01" step="0.01" value={medio.monto} onChange={(event) => cambiarMedio(index, 'monto', event.target.value)} className="h-11 w-32 px-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface focus:outline-none focus:border-primary" placeholder="Monto" aria-label={`Monto por ${medio.medio || 'medio de pago'}`} />{medios.length > 1 && <button type="button" onClick={() => setMedios((actuales) => actuales.filter((_, posicion) => posicion !== index))} className="p-2 text-error hover:bg-error-container rounded-lg" title="Quitar medio"><span className="material-symbols-outlined">delete</span></button>}</div>)}
          <button type="button" onClick={() => setMedios((actuales) => [...actuales, filaInicial()])} className="self-start inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline cursor-pointer"><span className="material-symbols-outlined text-[18px]">add</span>Agregar otro medio</button>
          <p className={`text-sm ${errores.montos || errores.medios ? 'text-error' : 'text-on-surface-variant'}`}>Distribuido: {formatAmount(montoMedios)}{errores.montos ? ` · ${errores.montos}` : ''}</p>
        </fieldset>
      </div>

      <label className="flex flex-col gap-1.5 text-sm font-semibold text-on-surface-variant">Observación<span className="font-normal">Opcional</span><textarea value={observacion} onChange={(event) => setObservacion(event.target.value)} rows="3" maxLength="200" className="p-3 rounded-lg bg-surface-container-low border border-outline-variant/40 text-on-surface focus:outline-none focus:border-primary resize-y" placeholder="Detalle adicional del pago" /></label>

      {errorRegistro && <p className="text-sm text-error bg-error-container p-3 rounded-lg" role="alert">{errorRegistro}</p>}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-4 border-t border-surface-container"><SecondaryButton icon="close" onClick={onCancel}>Cancelar</SecondaryButton><PrimaryButton icon={guardando ? 'progress_activity' : 'payments'} type="submit" disabled={guardando}>{guardando ? 'Registrando...' : 'Confirmar pago'}</PrimaryButton></div>
    </form>
  )
}

export default PagoForm