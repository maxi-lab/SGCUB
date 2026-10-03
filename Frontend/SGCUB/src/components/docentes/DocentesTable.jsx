import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FilterSelect from '../shared/FilterSelect'
import SortableHeader from '../shared/SortableHeader'
import TablePagination from '../shared/TablePagination'
import useOrdenTabla from '../../hooks/useOrdenTabla'
import { cargosDe, esActivo, exportarNominaCSV } from './docentesUtils'

const nombreCompleto = (docente) =>
  [docente.persona_detalle?.nombre, docente.persona_detalle?.apellido].filter(Boolean).join(' ')

const nombresCategorias = (categorias) =>
  categorias.length > 0 ? categorias.map((categoria) => categoria.nombre).join(', ') : '—'

const VALORES_ORDEN = {
  legajo: (docente) => (docente.legajo ? Number(docente.legajo) : null),
  nombre: (docente) => nombreCompleto(docente),
  estado: (docente) => (esActivo(docente) ? 0 : 1),
}
const ORDEN_INICIAL = { columna: 'legajo', direccion: 'desc' }

function DocentesTable({ data, categorias = [], categoriasPorDocente = {}, isLoading, error }) {
  const navigate = useNavigate()
  const [busqueda, setBusqueda] = useState('')
  const [cargo, setCargo] = useState('todos')
  const [categoria, setCategoria] = useState('todas')
  const [estado, setEstado] = useState('activo')
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [page, setPage] = useState(1)

  const docentes = useMemo(() => data ?? [], [data])

  const cargosDisponibles = useMemo(
    () => cargosDe(Object.values(categoriasPorDocente).flat()).sort(),
    [categoriasPorDocente],
  )

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return docentes.filter((docente) => {
      const categoriasDocente = categoriasPorDocente[docente.docente_id] ?? []
      if (cargo !== 'todos' && !cargosDe(categoriasDocente).includes(cargo)) return false
      if (categoria !== 'todas' && !categoriasDocente.some((item) => String(item.categoria_id) === categoria)) return false
      if (estado === 'activo' && !esActivo(docente)) return false
      if (estado === 'baja' && esActivo(docente)) return false
      if (!texto) return true
      return [docente.persona_detalle?.nombre, docente.persona_detalle?.apellido, docente.persona_detalle?.dni, docente.legajo]
        .some((campo) => String(campo ?? '').toLowerCase().includes(texto))
    })
  }, [docentes, categoriasPorDocente, busqueda, cargo, categoria, estado])

  const { ordenadas, orden, ordenarPor } = useOrdenTabla(filtrados, VALORES_ORDEN, ORDEN_INICIAL)
  const ordenar = (columna) => {
    ordenarPor(columna)
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(ordenadas.length / rowsPerPage))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * rowsPerPage
  const visible = ordenadas.slice(start, start + rowsPerPage)

  return (
    <div className="min-w-0 bg-surface-container-lowest border border-outline-variant/30 rounded-lg shadow-sm">
      <div className="p-4 border-b border-outline-variant/20 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        <div className="flex flex-1 min-w-0 flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5">
          <div className="relative w-full sm:w-auto sm:flex-1 sm:min-w-[16rem] sm:max-w-md">
            <span className="material-symbols-outlined absolute left-4 top-1.5 text-outline text-sm" aria-hidden="true">
              search
            </span>
            <input
              className="w-full h-10 pl-11 pr-4 bg-surface-container-low border border-outline-variant/40 rounded text-on-surface placeholder:text-outline font-body-sm text-sm focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-colors"
              placeholder="Filtrar por DNI, Nombre, Apellido o Legajo..."
              type="text"
              value={busqueda}
              onChange={(event) => {
                setBusqueda(event.target.value)
                setPage(1)
              }}
              aria-label="Filtrar docentes"
            />
          </div>
          <FilterSelect
            className="bg-surface-container-low border border-outline-variant/40 rounded text-on-surface font-body-sm text-sm font-medium focus:outline-none focus:border-primary cursor-pointer"
            value={cargo}
            onChange={(event) => {
              setCargo(event.target.value)
              setPage(1)
            }}
            aria-label="Filtrar por cargo"
          >
            <option value="todos">Cargo: Todos</option>
            {cargosDisponibles.map((item) => <option key={item} value={item}>{item}</option>)}
          </FilterSelect>
          <FilterSelect
            className="bg-surface-container-low border border-outline-variant/40 rounded text-on-surface font-body-sm text-sm font-medium focus:outline-none focus:border-primary cursor-pointer"
            value={categoria}
            onChange={(event) => {
              setCategoria(event.target.value)
              setPage(1)
            }}
            aria-label="Filtrar por categoría"
          >
            <option value="todas">Categoría: Todas</option>
            {categorias.map((item) => <option key={item.categoria_id} value={item.categoria_id}>{item.nombre}</option>)}
          </FilterSelect>
          <FilterSelect
            className="bg-surface-container-low border border-outline-variant/40 rounded text-on-surface font-body-sm text-sm font-medium focus:outline-none focus:border-primary cursor-pointer"
            value={estado}
            onChange={(event) => {
              setEstado(event.target.value)
              setPage(1)
            }}
            aria-label="Filtrar por estado"
          > 
            <option value="activo">Estado: Activo</option>
            <option value="todos">Estado: Todos</option>
            <option value="baja">De baja / Inactivo</option>
          </FilterSelect>
        </div>
        <div className="flex items-center justify-end xl:shrink-0">
          <button
            type="button"
            onClick={() => exportarNominaCSV(filtrados, categoriasPorDocente)}
            disabled={filtrados.length === 0}
            className="inline-flex items-center justify-center gap-1.5 h-10 px-3 w-full sm:w-auto shrink-0 bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/40 text-on-surface rounded text-lg font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[16px]" aria-hidden="true">file_download</span>
            <span>Exportar nómina</span>
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-base border-collapse">
          <thead>
            <tr className="bg-surface-container-low/60 border-b border-outline-variant/30 text-sm font-semibold text-on-surface-variant uppercase tracking-wider">
              <SortableHeader className="py-3 px-4 w-28 whitespace-nowrap" etiqueta="N° Legajo" columna="legajo" orden={orden} onOrdenar={ordenar} />
              <SortableHeader className="py-3 px-4" etiqueta="Nombre y Apellido" columna="nombre" orden={orden} onOrdenar={ordenar} />
              <th className="py-3 px-4" scope="col">DNI</th>
              <th className="py-3 px-4" scope="col">Cargo</th>
              <th className="py-3 px-4" scope="col">Categorías</th>
              <SortableHeader className="py-3 px-4" etiqueta="Estado" columna="estado" orden={orden} onOrdenar={ordenar} />
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20 font-body-sm text-lg text-on-surface">
            {isLoading && (
              <tr>
                <td className="py-10 px-4 text-center text-on-surface-variant" colSpan={6}>
                  Cargando docentes...
                </td>
              </tr>
            )}

            {!isLoading && visible.length === 0 && (
              <tr>
                <td className="py-10 px-4 text-center text-on-surface-variant" colSpan={6}>
                  {error ? 'No se pudieron cargar los docentes.' : 'No hay docentes que coincidan con el filtro.'}
                </td>
              </tr>
            )}

            {!isLoading && visible.map((docente) => (
              <tr
                key={docente.docente_id}
                onClick={() => navigate(`/padron/docentes/${docente.docente_id}`)}
                className="hover:bg-surface-container-low/80 transition-colors cursor-pointer group"
              >
                <td className="py-3 px-4 font-bold text-primary text-base pl-6">
                  {docente.legajo ? `#${docente.legajo}` : '—'}
                </td>
                <td className="py-3 px-4">
                  <span className="font-medium text-on-surface block text-base group-hover: transition-colors">
                    {nombreCompleto(docente) || '—'}
                  </span>
                </td>
                <td className="py-3 px-4 text-on-surface-variant text-sm">
                  {docente.persona_detalle?.dni ?? '—'}
                </td>
                <td className="py-3 px-4 text-on-surface-variant text-sm">
                  {cargosDe(categoriasPorDocente[docente.docente_id]).join(', ') || '—'}
                </td>
                <td className="py-3 px-4 text-on-surface-variant text-sm">
                  {nombresCategorias(categoriasPorDocente[docente.docente_id] ?? [])}
                </td>
                <td className="py-3 px-4 whitespace-nowrap">
                  {esActivo(docente) ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                      Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-medium bg-surface-container-high text-on-surface-variant border border-outline-variant/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-outline shrink-0" />
                      De baja
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <TablePagination
        id="docentes-rows-per-page"
        page={currentPage}
        totalPages={totalPages}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={(value) => {
          setRowsPerPage(value)
          setPage(1)
        }}
      />
    </div>
  )
}

export default DocentesTable
