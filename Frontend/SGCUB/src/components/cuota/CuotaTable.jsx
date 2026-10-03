import { useMemo, useState } from 'react'

const ESTADO_LABEL = {
  EnFecha: 'En fecha',
  Vencida: 'Vencida',
  Paga: 'Paga',
}

const paginasVisibles = (paginaActual, totalPaginas) => {
  if (totalPaginas <= 5) {
    return Array.from({ length: totalPaginas }, (_, indice) => indice + 1)
  }

  const paginas = new Set([1, totalPaginas, paginaActual, paginaActual - 1, paginaActual + 1])
  const ordenadas = [...paginas]
    .filter((pagina) => pagina >= 1 && pagina <= totalPaginas)
    .sort((a, b) => a - b)

  const resultado = []
  ordenadas.forEach((pagina, indice) => {
    if (indice > 0 && pagina - ordenadas[indice - 1] > 1) {
      resultado.push('...')
    }
    resultado.push(pagina)
  })

  return resultado
}

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

const nombreSocio = (cuota) => {
  const socio = cuota?.socio
  if (!socio) return 'Sin socio'

  const nombre = `${socio.nombre ?? ''} ${socio.apellido ?? ''}`.trim()
  return nombre || socio.dni || 'Sin socio'
}

const montoCuota = (cuota) => {
  if (cuota.monto_total !== undefined) return Number(cuota.monto_total)
  return (cuota.items ?? []).reduce(
    (total, item) => total + (item.es_descuento ? -Number(item.monto) : Number(item.monto)),
    0,
  )
}

function CuotaTable({ data = [], isLoading = false, error = null, onAdd, onEdit, onDelete }) {
  const [busqueda, setBusqueda] = useState('')
  const [estado, setEstado] = useState('todos')
  const [filasPorPagina, setFilasPorPagina] = useState(25)
  const [pagina, setPagina] = useState(1)

  const cuotas = useMemo(() => data ?? [], [data])

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()

    return cuotas.filter((cuota) => {
      if (estado !== 'todos' && String(cuota.estado_cuota) !== estado) return false
      if (!texto) return true

      return [
        cuota.periodo,
        cuota.cuota_id,
        nombreSocio(cuota),
        cuota.socio?.dni,
      ].some((campo) => String(campo ?? '').toLowerCase().includes(texto))
    })
  }, [cuotas, busqueda, estado])

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / filasPorPagina))
  const paginaActual = Math.min(pagina, totalPaginas)
  const desde = (paginaActual - 1) * filasPorPagina
  const visibles = filtradas.slice(desde, desde + filasPorPagina)

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg shadow-sm">
      <div className="p-4 border-b border-outline-variant/20 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-4 top-1.5 text-outline text-[18px]" aria-hidden="true">search</span>
            <input
              className="w-full h-10 pl-11 pr-4 bg-surface-container-low border border-outline-variant/40 rounded text-on-surface placeholder:text-outline font-body-sm text-lg focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-colors"
              placeholder="Buscar por período, socio o DNI..."
              type="text"
              value={busqueda}
              onChange={(event) => {
                setBusqueda(event.target.value)
                setPagina(1)
              }}
              aria-label="Filtrar cuotas"
            />
          </div>

          <select
            className="h-10 px-3 bg-surface-container-low border border-outline-variant/40 rounded text-on-surface font-body-sm text-lg font-medium focus:outline-none focus:border-primary cursor-pointer"
            value={estado}
            onChange={(event) => {
              setEstado(event.target.value)
              setPagina(1)
            }}
            aria-label="Filtrar cuotas por estado"
          >
            <option value="todos">Estado: Todos</option>
            <option value="EnFecha">En fecha</option>
            <option value="Vencida">Vencida</option>
            <option value="Paga">Paga</option>
          </select>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 lg:pt-0">
          <span className="text-lg text-on-surface-variant whitespace-nowrap">
            {filtradas.length === 0
              ? 'Sin resultados'
              : `Mostrando ${desde + 1}-${Math.min(desde + visibles.length, filtradas.length)} de ${filtradas.length.toLocaleString('es-AR')} cuotas`}
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

      <div className="overflow-x-auto">
        <table className="w-full text-left text-base border-collapse">
          <thead>
            <tr className="bg-surface-container-low/60 border-b border-outline-variant/30 text-base font-semibold text-on-surface-variant uppercase tracking-wider">
              <th className="py-3 px-4" scope="col">Período</th>
              <th className="py-3 px-4" scope="col">Socio</th>
              <th className="py-3 px-4" scope="col">Venc. 1</th>
              <th className="py-3 px-4" scope="col">Venc. 2</th>
              <th className="py-3 px-4 text-right" scope="col">Monto</th>
              <th className="py-3 px-4" scope="col">Estado</th>
              <th className="py-3 px-4 text-right" scope="col">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-outline-variant/20 font-body-sm text-lg text-on-surface">
            {isLoading && (
              <tr>
                <td className="py-10 px-4 text-center text-on-surface-variant" colSpan={7}>Cargando cuotas...</td>
              </tr>
            )}

            {!isLoading && visibles.length === 0 && (
              <tr>
                <td className="py-10 px-4 text-center text-on-surface-variant" colSpan={7}>
                  {error ? 'No se pudieron cargar las cuotas.' : 'No hay cuotas que coincidan con el filtro.'}
                </td>
              </tr>
            )}

            {!isLoading && visibles.map((cuota) => (
              <tr key={cuota.cuota_id} className="hover:bg-surface-container-low/80 transition-colors">
                <td className="py-3 px-4 font-medium">{cuota.periodo}</td>
                <td className="py-3 px-4 text-on-surface-variant">{nombreSocio(cuota)}</td>
                <td className="py-3 px-4 text-on-surface-variant">{formatDate(cuota.fecha_venc1)}</td>
                <td className="py-3 px-4 text-on-surface-variant">{formatDate(cuota.fecha_venc2)}</td>
                <td className="py-3 px-4 text-right font-semibold">{montoCuota(cuota).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}</td>
                <td className="py-3 px-4">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold border ${
                      cuota.estado_cuota === 'Paga'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : cuota.estado_cuota === 'Vencida'
                          ? 'bg-red-50 text-red-700 border-red-200'
                          : 'bg-sky-50 text-sky-700 border-sky-200'
                    }`}
                  >
                    {ESTADO_LABEL[cuota.estado_cuota] ?? cuota.estado_cuota ?? '—'}
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
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-lg text-on-surface-variant">
        <div className="flex items-center gap-2">
          <label className="font-label-md" htmlFor="cuotas-rows-per-page">Filas por página:</label>
          <select
            className="h-8 px-2 bg-surface-container-low border border-outline-variant/40 rounded text-on-surface font-body-sm text-lg focus:outline-none focus:border-primary cursor-pointer"
            id="cuotas-rows-per-page"
            value={filasPorPagina}
            onChange={(event) => {
              setFilasPorPagina(Number(event.target.value))
              setPagina(1)
            }}
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
          <span className="ml-2">Página {paginaActual} de {totalPaginas}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Página anterior"
            aria-label="Página anterior"
            disabled={paginaActual === 1}
            onClick={() => setPagina(Math.max(1, paginaActual - 1))}
            className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chevron_left</span>
          </button>

          {paginasVisibles(paginaActual, totalPaginas).map((item, indice) =>
            item === '...' ? (
              <span key={`sep-${indice}`} className="px-1 text-outline">...</span>
            ) : (
              <button
                key={item}
                type="button"
                onClick={() => setPagina(item)}
                aria-current={item === paginaActual ? 'page' : undefined}
                className={
                  item === paginaActual
                    ? 'w-8 h-8 flex items-center justify-center rounded bg-primary text-on-primary font-semibold font-label-md transition-colors'
                    : 'w-8 h-8 flex items-center justify-center rounded border border-outline-variant/30 text-on-surface hover:bg-surface-container-low font-label-md transition-colors cursor-pointer'
                }
              >
                {item}
              </button>
            ),
          )}

          <button
            type="button"
            title="Página siguiente"
            aria-label="Página siguiente"
            disabled={paginaActual === totalPaginas}
            onClick={() => setPagina(Math.min(totalPaginas, paginaActual + 1))}
            className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chevron_right</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default CuotaTable
