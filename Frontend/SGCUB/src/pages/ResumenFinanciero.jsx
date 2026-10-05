import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCuotas } from '../api/cuotas'
import { getResumenFinanciero } from '../api/resumenFinanciero'
import { getSocios } from '../api/socios'
import { formatAmount, formatDni, getErrorMessage } from '../components/personas/format'
import PageHeader from '../components/shared/PageHeader'
import StatCard from '../components/shared/StatCard'
import DataTable from '../components/shared/DataTable'
import TableMessageRow from '../components/shared/TableMessageRow'
import TablePagination from '../components/shared/TablePagination'
import TableSearchInput from '../components/shared/TableSearchInput'
import usePagination from '../hooks/usePagination'

const summaryCards = [
  { label: 'Socios en mora', key: 'socios_en_mora', caption: 'socios', icon: 'person_alert', tone: 'warning', format: 'number' },
  { label: 'Monto adeudado total', key: 'monto_adeudado_total', icon: 'pending_actions', tone: 'warning', format: 'amount' },
  { label: 'Cuotas vencidas', key: 'cuotas_vencidas', icon: 'event_busy', tone: 'error', format: 'number' },
]

const collectionMethods = [
  {
    label: 'Transferencia bancaria',
    key: 'transferencia_bancaria',
    detail: 'Cobros por transferencia desde cuentas bancarias',
    icon: 'account_balance',
  },
  {
    label: 'Billetera virtual',
    key: 'billetera_virtual',
    detail: 'Cobros digitales instantáneos con QR institucional',
    icon: 'qr_code_2',
  },
  {
    label: 'Pago en efectivo',
    key: 'pago_efectivo',
    detail: 'Ventanilla y caja de cobro por administración',
    icon: 'payments',
  },
]

function ResumenFinanciero() {
  const navigate = useNavigate()
  const [socios, setSocios] = useState([])
  const [cuotas, setCuotas] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [resumen, setResumen] = useState(null)
  const [errorResumen, setErrorResumen] = useState('')

  useEffect(() => {
    let active = true
    const cargarDatos = async () => {
      try {
        const [sociosRecibidos, cuotasRecibidas] = await Promise.all([
          getSocios(),
          getCuotas(),
        ])
        if (active) {
          setSocios(sociosRecibidos)
          setCuotas(cuotasRecibidas)
        }
      } catch (requestError) {
        if (active) setError(requestError)
      } finally {
        if (active) setIsLoading(false)
      }
    }

    cargarDatos()
    getResumenFinanciero()
      .then((datos) => active && setResumen(datos))
      .catch((requestError) => {
        if (active) setErrorResumen(getErrorMessage(requestError, 'No se pudieron cargar las métricas financieras.'))
      })

    return () => { active = false }
  }, [])

  const rows = useMemo(() => {
    const resumenPorSocio = new Map()

    cuotas.forEach((cuota) => {
      const socioId = cuota.socio?.socio_id
      if (!socioId) return

      const resumen = resumenPorSocio.get(socioId) ?? { cuotas: 0, cuotasPagas: 0, saldo: 0 }
      resumen.cuotas += 1
      if (cuota.estado_cuota === 'Paga') resumen.cuotasPagas += 1
      resumen.saldo += Number(cuota.saldo_pendiente ?? 0)
      resumenPorSocio.set(socioId, resumen)
    })

    return socios
      .map((socio) => ({
        ...socio,
        ...(resumenPorSocio.get(socio.socio_id) ?? { cuotas: 0, cuotasPagas: 0, saldo: 0 }),
      }))
      .sort((a, b) => `${a.apellido} ${a.nombre}`.localeCompare(`${b.apellido} ${b.nombre}`, 'es'))
  }, [socios, cuotas])

  const filteredRows = useMemo(() => {
    const query = search.trim().toLocaleLowerCase()
    if (!query) return rows
    return rows.filter((row) => `${row.nombre} ${row.apellido} ${row.dni}`.toLocaleLowerCase().includes(query))
  }, [rows, search])

  const { visibleRows, withPageReset, paginationProps } = usePagination(filteredRows)

  return (
    <div className="w-full flex flex-col gap-5 pb-8">
      <PageHeader
        breadcrumb={[{ label: 'Finanzas' }, { label: 'Resumen financiero' }]}
        title="Resumen financiero"
        actions={(
          <>
            <button
              type="button"
              className="inline-flex items-center gap-2 h-10 px-4 border border-outline-variant/50 rounded-lg text-on-surface bg-surface-container-low hover:bg-surface-container transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">download</span>
              Exportar informe contable
            </button>
          </>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {summaryCards.map((card) => (
          <StatCard
            key={card.key}
            label={card.label}
            value={card.format === 'amount'
              ? formatAmount(resumen?.[card.key] ?? 0)
              : Number(resumen?.[card.key] ?? 0).toLocaleString('es-AR')}
            caption={card.caption}
            icon={card.icon}
            tone={card.tone}
          />
        ))}
      </div>
      {errorResumen && <p className="text-sm text-error" role="alert">{errorResumen}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {collectionMethods.map((method) => (
          <div
            key={method.key}
            className="min-w-0 bg-surface-container-lowest border border-outline-variant/30 rounded-lg p-4 flex flex-col gap-2 shadow-xs"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-col min-w-0">
                <span className="text-base leading-tight font-medium text-on-surface-variant uppercase tracking-wider break-words">{method.label}</span>
                <span className="text-xl sm:text-2xl font-bold text-on-surface truncate mt-0.5">
                  {formatAmount(resumen?.[method.key] ?? 0)}
                </span>
              </div>
              <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-surface-container-high text-primary">
                <span className="material-symbols-outlined text-[22px]" aria-hidden="true">{method.icon}</span>
              </div>
            </div>
            <p className="text-sm text-on-surface-variant">{method.detail}</p>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest shadow-sm overflow-hidden">
        <div className="flex justify-end border-b border-outline-variant/30 px-4 py-4">
          <TableSearchInput
            value={search}
            onChange={withPageReset(setSearch)}
            placeholder="Filtrar por socio o DNI..."
            label="Filtrar socios por nombre o DNI"
          />
        </div>

        <DataTable
          className="min-w-full"
          tableClassName="min-w-[720px]"
          headers={(
            <>
              <th className="px-4 py-3 font-semibold" scope="col">Socio</th>
              <th className="px-4 py-3 font-semibold" scope="col">DNI</th>
              <th className="px-4 py-3 font-semibold" scope="col">Cuotas</th>
              <th className="px-4 py-3 font-semibold" scope="col">Saldo</th>
              <th className="px-4 py-3 font-semibold" scope="col">Cuotas pagas</th>
            </>
          )}
        >
          <TableMessageRow
            colSpan={5}
            isLoading={isLoading}
            isEmpty={visibleRows.length === 0}
            error={error}
            loadingText="Cargando resumen financiero..."
            errorText={error
              ? getErrorMessage(error, 'No se pudieron cargar los datos financieros.')
              : 'No se pudieron cargar los datos financieros.'}
            emptyText="No hay socios que coincidan con la búsqueda."
          />
          {!isLoading && !error && visibleRows.map((row) => (
            <tr
              key={row.socio_id}
              tabIndex={0}
              aria-label={`Ver estado de cuenta de ${row.nombre} ${row.apellido}`}
              onClick={() => navigate(`/finanzas/estado-cuenta?socio=${row.socio_id}`)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault()
                  navigate(`/finanzas/estado-cuenta?socio=${row.socio_id}`)
                }
              }}
              className="text-sm text-on-surface cursor-pointer hover:bg-surface-container-low focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    {`${row.nombre} ${row.apellido}`
                      .split(' ')
                      .map((part) => part[0])
                      .slice(0, 2)
                      .join('')}
                  </span>
                  <span className="font-medium">{row.nombre} {row.apellido}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-on-surface-variant">{formatDni(row.dni)}</td>
              <td className="px-4 py-3">{row.cuotas}</td>
              <td className="px-4 py-3 font-semibold">{formatAmount(row.saldo)}</td>
              <td className="px-4 py-3">{row.cuotasPagas}</td>
            </tr>
          ))}
        </DataTable>

        <TablePagination id="resumen-financiero-rows-per-page" {...paginationProps} />
      </section>
    </div>
  )
}

export default ResumenFinanciero
