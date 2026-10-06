import { useEffect, useMemo, useState } from 'react'
import { getComprobantes } from '../api/comprobantes'
import { getCuotas } from '../api/cuotas'
import { getResumenFinanciero } from '../api/resumenFinanciero'

function periodLabel(period) {
  if (!period) return '—'
  const [year, month] = period.split('-')
  const date = new Date(Number(year), Number(month) - 1, 1)
  const label = date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export default function useResumenFinanciero() {
  const [resumen, setResumen] = useState(null)
  const [cuotas, setCuotas] = useState([])
  const [comprobantes, setComprobantes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [errors, setErrors] = useState({})
  const [selectedPeriod, setSelectedPeriod] = useState(null)

  useEffect(() => {
    let active = true

    const loadAll = async () => {
      const [resumenResult, cuotasResult, comprobantesResult] = await Promise.allSettled([
        getResumenFinanciero(),
        getCuotas(),
        getComprobantes(),
      ])

      if (!active) return

      if (resumenResult.status === 'fulfilled') {
        setResumen(resumenResult.value)
      } else {
        setErrors((prev) => ({ ...prev, resumen: resumenResult.reason }))
      }

      if (cuotasResult.status === 'fulfilled') {
        const cuotasData = cuotasResult.value
        setCuotas(cuotasData)
        const periods = [...new Set(cuotasData.map((c) => c.periodo))].sort().reverse()
        if (periods.length > 0) setSelectedPeriod(periods[0])
      } else {
        setErrors((prev) => ({ ...prev, cuotas: cuotasResult.reason }))
      }

      if (comprobantesResult.status === 'fulfilled') {
        setComprobantes(comprobantesResult.value)
      } else {
        setErrors((prev) => ({ ...prev, comprobantes: comprobantesResult.reason }))
      }

      if (active) setIsLoading(false)
    }

    loadAll()
    return () => { active = false }
  }, [])

  const availablePeriods = useMemo(
    () => [...new Set(cuotas.map((c) => c.periodo))].sort().reverse(),
    [cuotas],
  )

  const selectedPeriodLabel = useMemo(() => periodLabel(selectedPeriod), [selectedPeriod])

  const periodKpis = useMemo(() => {
    const periodCuotas = cuotas.filter((c) => c.periodo === selectedPeriod)
    const cuotasGeneradas = periodCuotas.length
    const cuotasPagas = periodCuotas.filter((c) => c.estado_cuota === 'Paga').length

    let totalRecaudadoPeriodo = 0
    if (selectedPeriod) {
      const [year, month] = selectedPeriod.split('-').map(Number)
      totalRecaudadoPeriodo = comprobantes
        .filter((c) => {
          if (!c.fecha_emision || c.estado === 'Anulado') return false
          const d = new Date(c.fecha_emision)
          return d.getFullYear() === year && d.getMonth() + 1 === month
        })
        .reduce((sum, c) => sum + Number(c.monto_total ?? 0), 0)
    }

    return {
      cuotasGeneradas,
      cuotasPagas,
      cuotasImpagas: cuotasGeneradas - cuotasPagas,
      totalRecaudadoPeriodo,
    }
  }, [cuotas, comprobantes, selectedPeriod])

  const debtorRows = useMemo(() => {
    const bySocio = new Map()

    cuotas.forEach((cuota) => {
      const pending = Number(cuota.saldo_pendiente ?? 0)
      if (pending <= 0 || cuota.estado_cuota === 'Paga') return

      const socio = cuota.socio
      if (!socio) return
      const id = socio.socio_id

      if (!bySocio.has(id)) {
        bySocio.set(id, {
          socio_id: id,
          numero_socio: socio.numero_socio,
          nombre: socio.nombre,
          apellido: socio.apellido,
          dni: socio.dni,
          deudaEnFecha: 0,
          cuotasVencidas: 0,
          deudaVencida: 0,
        })
      }

      const row = bySocio.get(id)
      const estado = cuota.estado_cuota ?? cuota.estado
      if (estado === 'EnFecha' || estado === 'En fecha') {
        row.deudaEnFecha += pending
      } else if (estado === 'Vencida') {
        row.cuotasVencidas += 1
        row.deudaVencida += pending
      }
    })

    return [...bySocio.values()].sort((a, b) =>
      `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`, 'es'),
    )
  }, [cuotas])

  return {
    isLoading,
    errors,
    resumen,
    selectedPeriod,
    setSelectedPeriod,
    availablePeriods,
    selectedPeriodLabel,
    periodKpis,
    debtorRows,
  }
}
