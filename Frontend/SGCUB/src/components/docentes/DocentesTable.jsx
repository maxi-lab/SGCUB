import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cargoDe, esActivo } from './docentesUtils'

const nombreCompleto = (docente) =>
  [docente.persona_detalle?.nombre, docente.persona_detalle?.apellido].filter(Boolean).join(' ')

const nombresCategorias = (categorias) =>
  categorias.length > 0 ? categorias.map((categoria) => categoria.nombre).join(', ') : '—'

const paginasVisibles = (paginaActual, totalPaginas) => {
  if (totalPaginas <= 5) return Array.from({ length: totalPaginas }, (_, indice) => indice + 1)
  const paginas = new Set([1, totalPaginas, paginaActual, paginaActual - 1, paginaActual + 1])
  const ordenadas = [...paginas].filter((pagina) => pagina >= 1 && pagina <= totalPaginas).sort((a, b) => a - b)
  const resultado = []
  ordenadas.forEach((pagina, indice) => {
    if (indice > 0 && pagina - ordenadas[indice - 1] > 1) resultado.push('...')
    resultado.push(pagina)
  })
  return resultado
}

function DocentesTable({ data, categorias = [], categoriasPorDocente = {}, isLoading, error }) {
  const navigate = useNavigate()
  const [busqueda, setBusqueda] = useState('')
  const [cargo, setCargo] = useState('todos')
  const [categoria, setCategoria] = useState('todas')
  const [estado, setEstado] = useState('todos')
  const [filasPorPagina, setFilasPorPagina] = useState(25)
  const [pagina, setPagina] = useState(1)

  const docentes = useMemo(() => data ?? [], [data])

  const cargosDisponibles = useMemo(
    () => [...new Set(docentes.map(cargoDe).filter(Boolean))].sort(),
    [docentes],
  )

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return docentes.filter((docente) => {
      const categoriasDocente = categoriasPorDocente[docente.docente_id] ?? []
      if (cargo !== 'todos' && cargoDe(docente) !== cargo) return false
      if (categoria !== 'todas' && !categoriasDocente.some((item) => String(item.categoria_id) === categoria)) return false
      if (estado === 'activo' && !esActivo(docente)) return false
      if (estado === 'baja' && esActivo(docente)) return false
      if (!texto) return true
      return [docente.persona_detalle?.nombre, docente.persona_detalle?.apellido, docente.persona_detalle?.dni, docente.legajo]
        .some((campo) => String(campo ?? '').toLowerCase().includes(texto))
    })
  }, [docentes, categoriasPorDocente, busqueda, cargo, categoria, estado])

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / filasPorPagina))
  // Si el filtro dejó menos páginas que la actual, mostramos la última disponible.
  const paginaActual = Math.min(pagina, totalPaginas)
  const desde = (paginaActual - 1) * filasPorPagina
  const visibles = filtrados.slice(desde, desde + filasPorPagina)

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg shadow-sm">
      {/* Barra de filtros */}
      <div className="p-4 border-b border-outline-variant/20 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-4 top-1.5 text-outline text-[18px]" aria-hidden="true">
              search
            </span>
            <input
              className="w-full h-10 pl-11 pr-4 bg-surface-container-low border border-outline-variant/40 rounded text-on-surface placeholder:text-outline font-body-sm text-lg focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-colors"
              placeholder="Filtrar por DNI, Nombre, Apellido o Legajo..."
              type="text"
              value={busqueda}
              onChange={(event) => {
                setBusqueda(event.target.value)
                setPagina(1)
              }}
              aria-label="Filtrar docentes"
            />
          </div>
          <select
            className="h-10 px-3 bg-surface-container-low border border-outline-variant/40 rounded text-on-surface font-body-sm text-lg font-medium focus:outline-none focus:border-primary cursor-pointer"
            value={cargo}
            onChange={(event) => {
              setCargo(event.target.value)
              setPagina(1)
            }}
            aria-label="Filtrar por cargo"
          >
            <option value="todos">Cargo: Todos</option>
            {cargosDisponibles.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select
            className="h-10 px-3 bg-surface-container-low border border-outline-variant/40 rounded text-on-surface font-body-sm text-lg font-medium focus:outline-none focus:border-primary cursor-pointer"
            value={categoria}
            onChange={(event) => {
              setCategoria(event.target.value)
              setPagina(1)
            }}
            aria-label="Filtrar por categoría"
          >
            <option value="todas">Categoría: Todas</option>
            {categorias.map((item) => <option key={item.categoria_id} value={item.categoria_id}>{item.nombre}</option>)}
          </select>
          <select
            className="h-10 px-3 bg-surface-container-low border border-outline-variant/40 rounded text-on-surface font-body-sm text-lg font-medium focus:outline-none focus:border-primary cursor-pointer"
            value={estado}
            onChange={(event) => {
              setEstado(event.target.value)
              setPagina(1)
            }}
            aria-label="Filtrar por estado"
          >
            <option value="todos">Estado: Todos</option>
            <option value="activo">Activo</option>
            <option value="baja">De baja / Inactivo</option>
          </select>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 lg:pt-0">
          <span className="text-lg text-on-surface-variant whitespace-nowrap">
            {filtrados.length === 0
              ? 'Sin resultados'
              : `Mostrando ${desde + 1}-${desde + visibles.length} de ${filtrados.length.toLocaleString('es-AR')} docentes`}
          </span>
        </div>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-base border-collapse">
          <thead>
            <tr className="bg-surface-container-low/60 border-b border-outline-variant/30 text-base font-semibold text-on-surface-variant uppercase tracking-wider">
              <th className="py-3 px-4" scope="col">Legajo</th>
              <th className="py-3 px-4" scope="col">Nombre y Apellido</th>
              <th className="py-3 px-4" scope="col">DNI</th>
              <th className="py-3 px-4" scope="col">Cargo</th>
              <th className="py-3 px-4" scope="col">Categorías</th>
              <th className="py-3 px-4" scope="col">Estado</th>
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

            {!isLoading && visibles.length === 0 && (
              <tr>
                <td className="py-10 px-4 text-center text-on-surface-variant" colSpan={6}>
                  {error ? 'No se pudieron cargar los docentes.' : 'No hay docentes que coincidan con el filtro.'}
                </td>
              </tr>
            )}

            {!isLoading && visibles.map((docente) => (
              <tr
                key={docente.docente_id}
                onClick={() => navigate(`/padron/docentes/${docente.docente_id}`)}
                className="hover:bg-surface-container-low/80 transition-colors cursor-pointer group"
              >
                <td className="py-3 px-4 font-bold text-primary">
                  {docente.legajo ? `#${docente.legajo}` : '—'}
                </td>
                <td className="py-3 px-4">
                  <span className="font-medium text-on-surface block text-lg group-hover:text-primary transition-colors">
                    {nombreCompleto(docente) || '—'}
                  </span>
                </td>
                <td className="py-3 px-4 text-on-surface-variant">{docente.persona_detalle?.dni ?? '—'}</td>
                <td className="py-3 px-4 text-on-surface-variant">{cargoDe(docente) || '—'}</td>
                <td className="py-3 px-4 text-on-surface-variant">
                  {nombresCategorias(categoriasPorDocente[docente.docente_id] ?? [])}
                </td>
                <td className="py-3 px-4">
                  {esActivo(docente) ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-lg font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      Activo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-lg font-medium bg-surface-container-high text-on-surface-variant border border-outline-variant/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-outline" />
                      De baja
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      <div className="p-4 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-lg text-on-surface-variant">
        <div className="flex items-center gap-2">
          <label className="font-label-md" htmlFor="docentes-rows-per-page">Filas por página:</label>
          <select
            className="h-8 px-2 bg-surface-container-low border border-outline-variant/40 rounded text-on-surface font-body-sm text-lg focus:outline-none focus:border-primary cursor-pointer"
            id="docentes-rows-per-page"
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
                className={item === paginaActual
                  ? 'w-8 h-8 flex items-center justify-center rounded bg-primary text-on-primary font-semibold font-label-md transition-colors'
                  : 'w-8 h-8 flex items-center justify-center rounded border border-outline-variant/30 text-on-surface hover:bg-surface-container-low font-label-md transition-colors cursor-pointer'}
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

export default DocentesTable
