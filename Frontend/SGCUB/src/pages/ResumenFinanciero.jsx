import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getCuotas } from '../api/cuotas'
import { getSocios } from '../api/socios'
import { formatAmount, formatDni, getErrorMessage } from '../components/personas/format'
import PageHeader from '../components/shared/PageHeader'
import DataTable from '../components/shared/DataTable'
import TableMessageRow from '../components/shared/TableMessageRow'
import TablePagination from '../components/shared/TablePagination'
import TableSearchInput from '../components/shared/TableSearchInput'
import usePagination from '../hooks/usePagination'

const summaryCards = [
  {
    label: 'Socios en mora',
    value: '0',
    suffix: 'socios',
    icon: 'warning',
    tone: 'rose',
  },
  {
    label: 'Monto adeudado total',
    value: '$ 0',
    icon: 'payments',
    tone: 'amber',
  },
  {
    label: 'Cuotas vencidas',
    value: '0',
    suffix: '',
    icon: 'receipt_long',
    tone: 'blue',
  },
]

const collectionMethods = [

  {
    label: 'Transferencia bancaria',
    amount: '$ 0',
    detail: 'Cobros por transferencia desde cuentas bancarias',
    
    tone: 'sky',
    icon: 'account_balance',
    bankLogo: 'B',
  },
  {
    label: 'Billetera virtual',
    amount: '$ 0',
    detail: 'Cobros digitales instantáneos con QR institucional',
    
    tone: 'sky',
    icon: 'shopping_bag',
  },
  {
    label: 'Pago en efectivo',
    amount: '$0',
    detail: 'Ventanilla y caja de cobro por administración',
    
    tone: 'violet',
    icon: 'payments',
  },
]

const toneStyles = {
  rose: 'bg-rose-50 text-rose-700 border border-rose-200',
  amber: 'bg-amber-50 text-amber-700 border border-amber-200',
  blue: 'bg-sky-50 text-sky-700 border border-sky-200',
  emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  violet: 'bg-violet-50 text-violet-700 border border-violet-200',
  sky: 'bg-sky-50 text-sky-700 border border-sky-200',
}

function ResumenFinanciero() {
  const navigate = useNavigate()
  const [socios, setSocios] = useState([])
  const [cuotas, setCuotas] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [sociosRecibidos, cuotasRecibidas] = await Promise.all([
          getSocios(),
          getCuotas(),
        ])
        setSocios(sociosRecibidos)
        setCuotas(cuotasRecibidas)
      } catch (requestError) {
        setError(requestError)
      } finally {
        setIsLoading(false)
      }
    }

    cargarDatos()
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
            <button
              type="button"
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-on-primary hover:bg-primary/90 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
              Registrar nuevo pago
            </button>
          </>
        )}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-on-surface-variant text-sm font-medium">
                <span className={`material-symbols-outlined rounded-md p-2 text-lg ${card.tone === 'rose' ? 'bg-rose-100 text-rose-700' : card.tone === 'amber' ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'}`} aria-hidden="true">
                  {card.icon}
                </span>
                <span>{card.label}</span>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-bold text-on-surface tracking-tight">{card.value}</span>
              {card.suffix && <span className="pb-1 text-sm text-on-surface-variant">{card.suffix}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
        {collectionMethods.map((method) => (
          <div
            key={method.label}
            className="rounded-xl border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {method.bankLogo ? (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-700 to-sky-500 text-sm font-bold text-white shadow-sm">
                    {method.bankLogo}
                  </div>
                ) : (
                  <span className={`material-symbols-outlined rounded-md p-2 text-lg ${method.tone === 'emerald' ? 'bg-emerald-100 text-emerald-700' : method.tone === 'sky' ? 'bg-sky-100 text-sky-700' : 'bg-violet-100 text-violet-700'}`} aria-hidden="true">
                    {method.icon}
                  </span>
                )}
                <div className="min-w-0">
                  <span className="block text-sm font-semibold text-on-surface">{method.label}</span>
                  {method.bankName && (
                    <span className="block text-[11px] text-on-surface-variant">{method.bankName}</span>
                  )}
                </div>
              </div>
              <span className={`rounded-full px-2 py-1 text-[11px] font-semibold ${toneStyles[method.tone]}`}>
                {method.status}
              </span>
            </div>
            <div className="text-3xl font-bold text-on-surface leading-none">{method.amount}</div>
            <p className="mt-3 text-sm text-on-surface-variant">{method.detail}</p>
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
