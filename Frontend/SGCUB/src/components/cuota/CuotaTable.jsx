import { useMemo, useState } from 'react'
import DataTable from '../shared/DataTable'
import FilterSelect from '../shared/FilterSelect'
import TableMessageRow from '../shared/TableMessageRow'
import TablePagination from '../shared/TablePagination'
import TableSearchInput from '../shared/TableSearchInput'
import usePagination from '../../hooks/usePagination'

const STATUS_LABELS = {
  EnFecha: 'En fecha',
  Vencida: 'Vencida',
  Paga: 'Paga',
}

const STATUS_BADGE_CLASSES = {
  Paga: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Vencida: 'bg-red-50 text-red-700 border-red-200',
}
const DEFAULT_STATUS_BADGE_CLASS = 'bg-sky-50 text-sky-700 border-sky-200'

const FILTER_CLASS = 'bg-surface-container-low border border-outline-variant/40 rounded text-on-surface font-body-sm text-sm font-medium focus:outline-none focus:border-primary cursor-pointer'
const COLUMN_COUNT = 7

const formatDate = (value) => {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

const socioName = (cuota) => {
  const socio = cuota?.socio
  if (!socio) return 'Sin socio'

  const fullName = `${socio.nombre ?? ''} ${socio.apellido ?? ''}`.trim()
  return fullName || socio.dni || 'Sin socio'
}

const cuotaAmount = (cuota) => {
  if (cuota.monto_total !== undefined) return Number(cuota.monto_total)
  return (cuota.items ?? []).reduce(
    (total, item) => total + (item.es_descuento ? -Number(item.monto) : Number(item.monto)),
    0,
  )
}

function CuotaTable({ data = [], isLoading = false, error = null, onAdd, onEdit, onDelete }) {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('todos')

  const cuotas = useMemo(() => data ?? [], [data])

  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase()

    return cuotas.filter((cuota) => {
      if (status !== 'todos' && String(cuota.estado_cuota) !== status) return false
      if (!text) return true

      return [
        cuota.periodo,
        cuota.cuota_id,
        socioName(cuota),
        cuota.socio?.dni,
      ].some((field) => String(field ?? '').toLowerCase().includes(text))
    })
  }, [cuotas, search, status])

  const { visibleRows, start, withPageReset, paginationProps } = usePagination(filtered)

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg shadow-sm">
      <div className="p-4 border-b border-outline-variant/20 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-1 min-w-0 flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5">
          <TableSearchInput
            value={search}
            onChange={withPageReset(setSearch)}
            placeholder="Buscar por período, socio o DNI..."
            label="Filtrar cuotas"
          />
          <FilterSelect
            className={FILTER_CLASS}
            value={status}
            onChange={(event) => withPageReset(setStatus)(event.target.value)}
            aria-label="Filtrar cuotas por estado"
          >
            <option value="todos">Estado: Todos</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </FilterSelect>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 lg:pt-0">
          <span className="text-base text-on-surface-variant whitespace-nowrap">
            {filtered.length === 0
              ? 'Sin resultados'
              : `Mostrando ${start + 1}-${start + visibleRows.length} de ${filtered.length.toLocaleString('es-AR')} cuotas`}
          </span>
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 h-10 px-3 bg-primary text-on-primary rounded text-lg font-medium transition-colors cursor-pointer hover:opacity-95"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
            <span>Agregar</span>
          </button>
        </div>
      </div>

      <DataTable
        tableClassName="text-base"
        bodyClassName="text-lg"
        headers={(
          <>
            <th className="py-3 px-4" scope="col">Período</th>
            <th className="py-3 px-4" scope="col">Socio</th>
            <th className="py-3 px-4" scope="col">Venc. 1</th>
            <th className="py-3 px-4" scope="col">Venc. 2</th>
            <th className="py-3 px-4 text-right" scope="col">Monto</th>
            <th className="py-3 px-4" scope="col">Estado</th>
            <th className="py-3 px-4 text-right" scope="col">Acciones</th>
          </>
        )}
      >
        <TableMessageRow
          colSpan={COLUMN_COUNT}
          isLoading={isLoading}
          isEmpty={visibleRows.length === 0}
          error={error}
          loadingText="Cargando cuotas..."
          errorText="No se pudieron cargar las cuotas."
          emptyText="No hay cuotas que coincidan con el filtro."
        />

        {!isLoading && visibleRows.map((cuota) => (
          <tr key={cuota.cuota_id} className="hover:bg-surface-container-low/80 transition-colors">
            <td className="py-3 px-4 font-medium">{cuota.periodo}</td>
            <td className="py-3 px-4 text-on-surface-variant">{socioName(cuota)}</td>
            <td className="py-3 px-4 text-on-surface-variant">{formatDate(cuota.fecha_venc1)}</td>
            <td className="py-3 px-4 text-on-surface-variant">{formatDate(cuota.fecha_venc2)}</td>
            <td className="py-3 px-4 text-right font-semibold">{cuotaAmount(cuota).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</td>
            <td className="py-3 px-4">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold border ${STATUS_BADGE_CLASSES[cuota.estado_cuota] ?? DEFAULT_STATUS_BADGE_CLASS}`}>
                {STATUS_LABELS[cuota.estado_cuota] ?? cuota.estado_cuota ?? '—'}
              </span>
            </td>
            <td className="py-3 px-4 text-right">
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  title="Editar cuota"
                  aria-label={`Editar cuota ${cuota.periodo}`}
                  onClick={() => onEdit?.(cuota)}
                  className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-low transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">edit</span>
                </button>
                <button
                  type="button"
                  title="Eliminar cuota"
                  aria-label={`Eliminar cuota ${cuota.periodo}`}
                  onClick={() => onDelete?.(cuota)}
                  className="w-8 h-8 flex items-center justify-center rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
                </button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>

      <TablePagination id="cuotas-rows-per-page" {...paginationProps} />
    </div>
  )
}

export default CuotaTable
