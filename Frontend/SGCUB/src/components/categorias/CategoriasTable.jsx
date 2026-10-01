import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FilterSelect from '../shared/FilterSelect'
import SortableHeader from '../shared/SortableHeader'
import TablePagination from '../shared/TablePagination'
import useOrdenTabla from '../../hooks/useOrdenTabla'
import { GENERO_OPTIONS, getGeneroLabel } from './categoriaFormat'

const filterClass = 'bg-surface-container-low border border-outline-variant/40 rounded text-on-surface font-body-sm text-sm focus:outline-none focus:border-primary cursor-pointer'
const iconButtonClass = 'inline-flex items-center justify-center p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors cursor-pointer'

const GENERO_BADGES = {
  M: 'bg-sky-50 text-sky-700 border border-sky-200',
  F: 'bg-pink-50 text-pink-700 border border-pink-200',
}

const SORT_VALUES = {
  name: (categoria) => categoria.nombre,
  year: (categoria) => categoria.anio_vigente,
  maxAge: (categoria) => categoria.edad_maxima,
  genero: (categoria) => getGeneroLabel(categoria.genero),
}
const INITIAL_SORT = { columna: 'maxAge', direccion: 'asc' }
const COLUMN_COUNT = 5

function CategoriasTable({ data, isLoading, error, onEdit, onDelete }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [genero, setGenero] = useState('todos')
  const [year, setYear] = useState('todos')
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [page, setPage] = useState(1)

  const categorias = useMemo(() => data ?? [], [data])

  const years = useMemo(
    () => [...new Set(categorias.map((categoria) => categoria.anio_vigente).filter(Boolean))].sort((a, b) => b - a),
    [categorias],
  )

  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase()
    return categorias.filter((categoria) => {
      if (genero !== 'todos' && categoria.genero !== genero) return false
      if (year !== 'todos' && String(categoria.anio_vigente) !== year) return false
      return !text || String(categoria.nombre ?? '').toLowerCase().includes(text)
    })
  }, [categorias, search, genero, year])

  const { ordenadas: sorted, orden: sort, ordenarPor: sortBy } = useOrdenTabla(filtered, SORT_VALUES, INITIAL_SORT)

  const withFirstPage = (setter) => (value) => {
    setter(value)
    setPage(1)
  }

  const resetFilters = () => {
    setSearch('')
    setGenero('todos')
    setYear('todos')
    setPage(1)
  }

  const handleAction = (action, categoria) => (event) => {
    event.stopPropagation()
    action(categoria)
  }

  const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * rowsPerPage
  const visible = sorted.slice(start, start + rowsPerPage)

  return (
    <div className="min-w-0 bg-surface-container-lowest border border-outline-variant/30 rounded-lg shadow-sm">
      <div className="p-4 border-b border-outline-variant/20 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        <div className="flex flex-1 min-w-0 flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5">
          <div className="relative w-full sm:w-auto sm:flex-1 sm:min-w-[16rem] sm:max-w-md">
            <span className="material-symbols-outlined absolute left-4 top-1.5 text-outline text-[18px]" aria-hidden="true">
              search
            </span>
            <input
              className="w-full h-10 pl-11 pr-4 bg-surface-container-low border border-outline-variant/40 rounded text-on-surface placeholder:text-outline font-body-sm text-sm focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-colors"
              placeholder="Filtrar por nombre..."
              type="text"
              value={search}
              onChange={(event) => withFirstPage(setSearch)(event.target.value)}
              aria-label="Filtrar categorías"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
            <FilterSelect
              className={filterClass}
              value={genero}
              onChange={(event) => withFirstPage(setGenero)(event.target.value)}
              aria-label="Filtrar por género"
            >
              <option value="todos">Género: Todos</option>
              {GENERO_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </FilterSelect>
            <FilterSelect
              className={filterClass}
              value={year}
              onChange={(event) => withFirstPage(setYear)(event.target.value)}
              aria-label="Filtrar por año vigente"
            >
              <option value="todos">Año: Todos</option>
              {years.map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </FilterSelect>
            <button
              type="button"
              onClick={resetFilters}
              title="Restablecer filtros"
              aria-label="Restablecer filtros"
              className="inline-flex items-center justify-center h-10 w-10 shrink-0 rounded border border-outline-variant/40 bg-surface-container-low text-outline hover:text-primary hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-surface-container-low/60 border-b border-outline-variant/30 text-sm font-semibold text-on-surface-variant uppercase tracking-wider">
              <SortableHeader className="py-3 px-4 pl-6" etiqueta="Nombre" columna="name" orden={sort} onOrdenar={withFirstPage(sortBy)} />
              <SortableHeader className="py-3 px-4" etiqueta="Año vigente" columna="year" orden={sort} onOrdenar={withFirstPage(sortBy)} />
              <SortableHeader className="py-3 px-4" etiqueta="Edad máxima" columna="maxAge" orden={sort} onOrdenar={withFirstPage(sortBy)} />
              <SortableHeader className="py-3 px-4" etiqueta="Género" columna="genero" orden={sort} onOrdenar={withFirstPage(sortBy)} />
              <th className="py-3 px-4 pr-6 text-right" scope="col">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20 font-body-sm text-on-surface">
            {isLoading && (
              <tr>
                <td className="py-10 px-4 text-center text-on-surface-variant" colSpan={COLUMN_COUNT}>
                  Cargando categorías...
                </td>
              </tr>
            )}

            {!isLoading && visible.length === 0 && (
              <tr>
                <td className="py-10 px-4 text-center text-on-surface-variant" colSpan={COLUMN_COUNT}>
                  {error ? 'No se pudieron cargar las categorías.' : 'No hay categorías que coincidan con el filtro.'}
                </td>
              </tr>
            )}

            {!isLoading && visible.map((categoria) => (
              <tr
                key={categoria.categoria_id}
                onClick={() => navigate(`/padron/categorias/${categoria.categoria_id}`)}
                className="hover:bg-surface-container-low/80 transition-colors cursor-pointer"
              >
                <td className="py-3 px-4 pl-6 font-medium text-on-surface text-base">{categoria.nombre}</td>
                <td className="py-3 px-4 text-on-surface-variant">{categoria.anio_vigente ?? '—'}</td>
                <td className="py-3 px-4 text-on-surface-variant">
                  {categoria.edad_maxima != null ? `${categoria.edad_maxima} años` : '—'}
                </td>
                <td className="py-3 px-4">
                  {GENERO_BADGES[categoria.genero] ? (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold ${GENERO_BADGES[categoria.genero]}`}>
                      {getGeneroLabel(categoria.genero)}
                    </span>
                  ) : (
                    <span className="text-on-surface-variant">—</span>
                  )}
                </td>
                <td className="py-2 px-4 pr-6">
                  <div className="flex items-center justify-end gap-1">
                    <button type="button" className={iconButtonClass} onClick={handleAction(onEdit, categoria)} title="Editar categoría" aria-label={`Editar ${categoria.nombre}`}>
                      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">edit</span>
                    </button>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center p-2 rounded-lg text-on-surface-variant hover:text-error hover:bg-error-container/60 transition-colors cursor-pointer"
                      onClick={handleAction(onDelete, categoria)}
                      title="Eliminar categoría"
                      aria-label={`Eliminar ${categoria.nombre}`}
                    >
                      <span className="material-symbols-outlined text-[20px]" aria-hidden="true">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TablePagination
        id="categorias-rows-per-page"
        page={currentPage}
        totalPages={totalPages}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={withFirstPage(setRowsPerPage)}
      />
    </div>
  )
}

export default CategoriasTable
