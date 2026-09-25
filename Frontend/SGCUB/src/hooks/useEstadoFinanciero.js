//HAY QUE REVISAR Y REHACER, SOLAMENTE ES PARA PODER MOSTRAR ALGO EN EL LEGAJO

import { useEffect, useState } from 'react'
import { getCuentasCorrientes, getCuotas, getEstadosCuota, getItemsCuota } from '../api/finanzas'

// Los endpoints de finanzas no filtran por socio: se trae todo y se filtra en el cliente.
function useFinancialStatus(socioId) {
  const [cuenta, setCuenta] = useState(null)
  const [cuotas, setCuotas] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!socioId) return undefined
    let activo = true

    const cargar = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [cuentas, todasLasCuotas, items, estados] = await Promise.all([
          getCuentasCorrientes(), getCuotas(), getItemsCuota(), getEstadosCuota(),
        ])
        if (!activo) return

        const cuentaSocio = cuentas.find((c) => String(c.socio) === String(socioId)) ?? null
        const nombreEstado = Object.fromEntries(estados.map((e) => [e.estado_cuota_id, e.nombre]))

        const cuotasSocio = cuentaSocio
          ? todasLasCuotas
            .filter((c) => c.cuenta_corriente === cuentaSocio.cuenta_corriente_id)
            .map((cuota) => {
              const itemsCuota = items.filter((i) => i.cuota === cuota.cuota_id)
              const monto = itemsCuota.reduce(
                (total, item) => total + (item.es_descuento ? -1 : 1) * Number(item.monto || 0),
                0,
              )
              return { ...cuota, estado: nombreEstado[cuota.estado_cuota] ?? '—', items: itemsCuota, monto }
            })
            .sort((a, b) => String(b.fecha_venc1).localeCompare(String(a.fecha_venc1)))
          : []

        setCuenta(cuentaSocio)
        setCuotas(cuotasSocio)
      } catch (requestError) {
        if (activo) setError(requestError)
      } finally {
        if (activo) setIsLoading(false)
      }
    }

    cargar()
    return () => { activo = false }
  }, [socioId])

  const vencidas = cuotas.filter((c) => c.estado === 'Vencida')
  const situacion = !cuenta
    ? { label: 'Sin cuenta', tono: 'neutro' }
    : vencidas.length > 0
      ? { label: 'Con deuda', tono: 'error' }
      : { label: 'Al día', tono: 'ok' }

  return { cuenta, cuotas, vencidas, situacion, isLoading, error }
}

export default useFinancialStatus
