import { useEffect, useMemo, useState } from 'react'
import { deleteCuota, deleteItemCuota, getCuotas, getCuentasCorrientes, patchCuota, patchItemCuota, postCuota, postItemCuota } from '../api/cuotas'
import { getSocios } from '../api/socios'
import AddCuotaModal from '../components/cuota/AddCuotaModal'
import CuotaTable from '../components/cuota/CuotaTable'
import DeleteCuotaModal from '../components/cuota/DeleteCuotaModal'
import EditCuotaModal from '../components/cuota/EditCuotaModal'
import PageHeader from '../components/shared/PageHeader'
import StatCard from '../components/shared/StatCard'
import { itemCuotaInicial } from '../components/cuota/ItemsCuotaFields'

const FORMULARIO_INICIAL = {
  cuenta_corriente: '',
  estado_cuota: 'EnFecha',
  fecha_venc1: '',
  fecha_venc2: '',
  periodo: '',
  items: [itemCuotaInicial()],
}

function Cuotas() {
  const [cuotas, setCuotas] = useState([])
  const [cuentas, setCuentas] = useState([])
  const [socios, setSocios] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalAgregar, setModalAgregar] = useState(false)
  const [modalEditar, setModalEditar] = useState(false)
  const [modalEliminar, setModalEliminar] = useState(false)
  const [cuotaSeleccionada, setCuotaSeleccionada] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [errorFormulario, setErrorFormulario] = useState('')
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL)

  const cargarDatos = async () => {
    try {
      setIsLoading(true)
      setError('')
      const [respuestaCuotas, respuestaCuentas, respuestaSocios] = await Promise.all([
        getCuotas(),
        getCuentasCorrientes(),
        getSocios(),
      ])
      setCuotas(respuestaCuotas ?? [])
      setCuentas(respuestaCuentas ?? [])
      setSocios(respuestaSocios ?? [])
    } catch (requestError) {
      setError(requestError.response?.data?.detail || 'No se pudieron cargar las cuotas.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const cuentasPorId = useMemo(
    () => Object.fromEntries((cuentas ?? []).map((cuenta) => [String(cuenta.cuenta_corriente_id), cuenta])),
    [cuentas],
  )

  const cuentasOptions = useMemo(() => cuentas.map((cuenta) => {
    const socioId = typeof cuenta.socio === 'object' ? cuenta.socio?.socio_id : cuenta.socio
    const socio = socios.find((item) => String(item.socio_id) === String(socioId))
    const nombre = socio ? `${socio.apellido}, ${socio.nombre}` : `Socio ${socioId}`
    return { value: String(cuenta.cuenta_corriente_id), label: `${nombre} - Cuenta ${cuenta.cuenta_corriente_id}` }
  }), [cuentas, socios])

  const cuotaConDetalle = useMemo(
    () =>
      (cuotas ?? []).map((cuota) => {
        const cuenta = cuentasPorId[String(cuota.cuenta_corriente)]
        const socio = cuenta?.socio

        return {
          ...cuota,
          cuenta_corriente: cuenta ?? { socio: cuota.cuenta_corriente },
          socio,
        }
      }),
    [cuotas, cuentasPorId],
  )

  const resumen = useMemo(() => {
    const total = cuotaConDetalle.length
    const vencidas = cuotaConDetalle.filter((cuota) => cuota.estado_cuota === 'Vencida').length
    const pagas = cuotaConDetalle.filter((cuota) => cuota.estado_cuota === 'Paga').length

    return {
      total: total.toLocaleString('es-AR'),
      vencidas: vencidas.toLocaleString('es-AR'),
      pagas: pagas.toLocaleString('es-AR'),
    }
  }, [cuotaConDetalle])

  const abrirAgregar = () => {
    setFormulario(FORMULARIO_INICIAL)
    setErrorFormulario('')
    setModalAgregar(true)
  }

  const abrirEditar = (cuota) => {
    setCuotaSeleccionada(cuota)
    setFormulario({
      cuenta_corriente: cuota.cuenta_corriente?.cuenta_corriente_id ?? cuota.cuenta_corriente ?? '',
      estado_cuota: cuota.estado_cuota ?? 'EnFecha',
      fecha_venc1: cuota.fecha_venc1 ?? '',
      fecha_venc2: cuota.fecha_venc2 ?? '',
      periodo: cuota.periodo ?? '',
      items: (cuota.items ?? []).map((item) => ({
        item_cuota_id: item.item_cuota_id,
        concepto: item.concepto,
        es_descuento: item.es_descuento,
        fecha_aplicacion: item.fecha_aplicacion,
        monto: Number(item.monto ?? 0),
        motivo: item.motivo ?? '',
      })),
    })
    setErrorFormulario('')
    setModalEditar(true)
  }

  const cerrarModal = () => {
    setModalAgregar(false)
    setModalEditar(false)
    setModalEliminar(false)
    setCuotaSeleccionada(null)
    setFormulario(FORMULARIO_INICIAL)
    setErrorFormulario('')
  }

  const guardarCuota = async (event) => {
    event.preventDefault()
    setGuardando(true)
    setErrorFormulario('')

    try {
      const { items, ...datosCuota } = formulario
      const payload = {
        ...datosCuota,
        cuenta_corriente: Number(formulario.cuenta_corriente),
      }

      const itemsInvalidos = !items.length || items.some((item) => !item.concepto || !item.fecha_aplicacion || !item.monto || Number(item.monto) <= 0)
      if (!payload.cuenta_corriente || !payload.periodo || !payload.fecha_venc1 || !payload.fecha_venc2 || itemsInvalidos) {
        throw new Error('Completá los campos obligatorios.')
      }

      if (modalEditar && cuotaSeleccionada) {
        await patchCuota(cuotaSeleccionada.cuota_id, payload)
        const itemsOriginales = cuotaSeleccionada.items ?? []
        const itemsActuales = items.filter((item) => item.item_cuota_id)
        await Promise.all(items.map((item) => {
          const itemPayload = { ...item, cuota: cuotaSeleccionada.cuota_id, monto: Number(item.monto) }
          return item.item_cuota_id ? patchItemCuota(item.item_cuota_id, itemPayload) : postItemCuota(itemPayload)
        }))
        await Promise.all(itemsOriginales
          .filter((item) => !itemsActuales.some((actual) => actual.item_cuota_id === item.item_cuota_id))
          .map((item) => deleteItemCuota(item.item_cuota_id)))
      } else {
        const cuotaCreada = await postCuota(payload)
        await Promise.all(items.map((item) => postItemCuota({
          ...item,
          cuota: cuotaCreada.cuota_id,
          monto: Number(item.monto),
        })))
      }

      cerrarModal()
      await cargarDatos()
    } catch (requestError) {
      const mensaje = requestError.response?.data
      const detalle = typeof mensaje === 'object'
        ? Object.values(mensaje).flat().join(' ')
        : requestError.message || 'No se pudo guardar la cuota.'
      setErrorFormulario(detalle)
    } finally {
      setGuardando(false)
    }
  }

  const eliminarCuota = async () => {
    if (!cuotaSeleccionada) return

    setGuardando(true)
    setErrorFormulario('')

    try {
      await deleteCuota(cuotaSeleccionada.cuota_id)
      cerrarModal()
      await cargarDatos()
    } catch (requestError) {
      setErrorFormulario(requestError.response?.data?.detail || 'No se pudo eliminar la cuota.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="w-full flex flex-col gap-5">
      <PageHeader
        breadcrumb={[{ label: 'Finanzas' }, { label: 'Cuotas' }]}
        title="Cuotas"
        actions={(
          <button
            type="button"
            onClick={abrirAgregar}
            className="inline-flex items-center gap-2 bg-primary text-on-primary hover:bg-primary/90 px-4 py-2 rounded shadow-sm font-label-lg text-base font-medium transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">receipt_long</span>
            <span className="text-xl">Nueva cuota</span>
          </button>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <StatCard label="Total cuotas" value={resumen.total} icon="receipt" tone="neutral" />
        <StatCard label="Cuotas vencidas" value={resumen.vencidas} icon="warning" tone="warning" />
        <StatCard label="Cuotas pagas" value={resumen.pagas} icon="task_alt" tone="positive" />
      </div>

      <section aria-label="Cuotas">
        <CuotaTable
          data={cuotaConDetalle}
          isLoading={isLoading}
          error={error}
          onAdd={abrirAgregar}
          onEdit={abrirEditar}
          onDelete={(cuota) => {
            setCuotaSeleccionada(cuota)
            setModalEliminar(true)
          }}
        />
      </section>

      <AddCuotaModal
        opened={modalAgregar}
        onClose={() => !guardando && cerrarModal()}
        onSubmit={guardarCuota}
        formulario={formulario}
        onChange={(campo, valor) => setFormulario((actual) => ({ ...actual, [campo]: valor }))}
        loading={guardando}
        error={errorFormulario}
        cuentasOptions={cuentasOptions}
      />

      <EditCuotaModal
        opened={modalEditar}
        onClose={() => !guardando && cerrarModal()}
        onSubmit={guardarCuota}
        formulario={formulario}
        onChange={(campo, valor) => setFormulario((actual) => ({ ...actual, [campo]: valor }))}
        loading={guardando}
        error={errorFormulario}
        cuentasOptions={cuentasOptions}
      />

      <DeleteCuotaModal
        opened={modalEliminar}
        onClose={() => !guardando && cerrarModal()}
        onConfirm={eliminarCuota}
        cuota={cuotaSeleccionada}
        loading={guardando}
        error={errorFormulario}
      />
    </div>
  )
}

export default Cuotas
