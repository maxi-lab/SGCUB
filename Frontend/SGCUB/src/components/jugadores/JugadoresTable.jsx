import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FilterSelect from '../shared/FilterSelect'
import SortableHeader from '../shared/SortableHeader'
import TablePagination from '../shared/TablePagination'
import useOrdenTabla from '../../hooks/useOrdenTabla'

const estadoActivo = (jugador) => {
  const estado = (jugador.estado?.nombre ?? '').toLowerCase()
  return estado.includes('activo') && !estado.includes('baja') && !estado.includes('inactivo')
}

const nombreCategoriaSecundaria = (jugador) => {
  const secundaria = jugador.categoria_secundaria ?? jugador.categoriaSecundaria
  if (secundaria?.nombre) return secundaria.nombre
  if (typeof secundaria === 'string') return secundaria
  if (Array.isArray(jugador.categorias_secundarias)) {
    return jugador.categorias_secundarias.map((categoria) => categoria.nombre ?? categoria).join(', ')
  }
  return '—'
}

const exportarCSV = (jugadores) => {
  const encabezados = ['N° Socio', 'Nombre y apellido', 'DNI', 'Categoría principal', 'Categoría secundaria', 'Estado']
  const filas = jugadores.map((jugador) => [
    jugador.socio?.numero_socio ?? '',
    `${jugador.socio?.nombre ?? ''} ${jugador.socio?.apellido ?? ''}`.trim(),
    jugador.socio?.dni ?? '',
    jugador.categoria?.nombre ?? '',
    nombreCategoriaSecundaria(jugador),
    jugador.estado?.nombre ?? '',
  ])
  const csv = [encabezados, ...filas]
    .map((fila) => fila.map((celda) => `"${String(celda).replace(/"/g, '""')}"`).join(','))
    .join('\n')
  const enlace = document.createElement('a')
  enlace.href = URL.createObjectURL(new Blob([`${csv}`], { type: 'text/csv;charset=utf-8;' }))
  enlace.download = `padron-jugadores-${new Date().toISOString().slice(0, 10)}.csv`
  enlace.click()
  URL.revokeObjectURL(enlace.href)
}

// Valor por el que se ordena cada columna. Estado: activos primero en orden ascendente.
const VALORES_ORDEN = {
  numero: (jugador) => (jugador.socio?.numero_socio ? Number(jugador.socio.numero_socio) : null),
  nombre: (jugador) => `${jugador.socio?.nombre ?? ''} ${jugador.socio?.apellido ?? ''}`.trim(),
  estado: (jugador) => (estadoActivo(jugador) ? 0 : 1),
}
// Al cargar: los más recientes primero.
const ORDEN_INICIAL = { columna: 'numero', direccion: 'desc' }

function JugadoresTable({ data, categorias = [], isLoading, error, onEdit }) {
  const navigate = useNavigate()
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState('todas')
  const [estado, setEstado] = useState('activo')
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [page, setPage] = useState(1)
  const jugadores = useMemo(() => data ?? [], [data])
  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return jugadores.filter((jugador) => {
      if (categoria !== 'todas' && String(jugador.categoria?.categoria_id) !== categoria) return false
      if (estado === 'activo' && !estadoActivo(jugador)) return false
      if (estado === 'baja' && estadoActivo(jugador)) return false
      if (!texto) return true
      return [jugador.socio?.nombre, jugador.socio?.apellido, jugador.socio?.dni, jugador.categoria?.nombre]
        .some((campo) => String(campo ?? '').toLowerCase().includes(texto))
    })
  }, [jugadores, busqueda, categoria, estado])
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
            <span className="material-symbols-outlined absolute left-4 top-1.5 text-outline text-sm" aria-hidden="true">search</span>
            <input className="w-full h-10 pl-11 pr-4 bg-surface-container-low border border-outline-variant/40 rounded text-on-surface placeholder:text-outline font-body-sm text-sm focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-colors" placeholder="Filtrar por DNI, Nombre o Apellido..." type="text" value={busqueda} onChange={(event) => { setBusqueda(event.target.value); setPage(1) }} aria-label="Filtrar jugadores" />
          </div>
          <FilterSelect className="bg-surface-container-low border border-outline-variant/40 rounded text-on-surface font-body-sm text-sm font-medium focus:outline-none focus:border-primary cursor-pointer" value={categoria} onChange={(event) => { setCategoria(event.target.value); setPage(1) }} aria-label="Filtrar por categoría">
            <option value="todas">Categoría: Todas</option>
            {categorias.map((item) => <option key={item.categoria_id} value={item.categoria_id}>{item.nombre}</option>)}
          </FilterSelect>
          <FilterSelect className="bg-surface-container-low border border-outline-variant/40 rounded text-on-surface font-body-sm text-sm font-medium focus:outline-none focus:border-primary cursor-pointer" value={estado} onChange={(event) => { setEstado(event.target.value); setPage(1) }} aria-label="Filtrar por estado">
            <option value="activo">Estado: Activo</option>
            <option value="todos">Estado: Todos</option>
            <option value="baja">De baja / Inactivo</option>
          </FilterSelect>
        </div>
        <div className="flex items-center justify-end xl:shrink-0">
          <button type="button" onClick={() => exportarCSV(filtrados)} disabled={filtrados.length === 0} className="inline-flex items-center justify-center gap-1.5 h-10 px-3 w-full sm:w-auto shrink-0 bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/40 text-on-surface rounded text-lg font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"><span className="material-symbols-outlined text-[16px]" aria-hidden="true">file_download</span><span>Exportar jugadores</span></button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-base border-collapse">
          <thead><tr className="bg-surface-container-low/60 border-b border-outline-variant/30 text-sm font-semibold text-on-surface-variant uppercase tracking-wider"><SortableHeader className="py-3 px-4 w-28 whitespace-nowrap" etiqueta="N° Socio" columna="numero" orden={orden} onOrdenar={ordenar} /><SortableHeader className="py-3 px-4" etiqueta="Nombre y Apellido" columna="nombre" orden={orden} onOrdenar={ordenar} /><th className="py-3 px-4" scope="col">DNI</th><th className="py-3 px-4" scope="col">Categoría principal</th><th className="py-3 px-4" scope="col">Categoría secundaria</th><SortableHeader className="py-3 px-4" etiqueta="Estado" columna="estado" orden={orden} onOrdenar={ordenar} /></tr></thead>
          <tbody className="divide-y divide-outline-variant/20 font-body-sm text-sm text-on-surface">
            {isLoading && <tr><td className="py-10 px-4 text-center text-on-surface-variant" colSpan={6}>Cargando jugadores...</td></tr>}
            {!isLoading && visible.length === 0 && <tr><td className="py-10 px-4 text-center text-on-surface-variant" colSpan={6}>{error ? 'No se pudieron cargar los jugadores.' : 'No hay jugadores que coincidan con el filtro.'}</td></tr>}
            {!isLoading && visible.map((jugador) => <tr key={jugador.jugador_id} onClick={() => navigate(`/padron/jugadores/${jugador.jugador_id}`)} className="hover:bg-surface-container-low/80 transition-colors cursor-pointer group"><td className="py-3 px-4 font-bold text-primary text-base pl-6">{jugador.socio?.numero_socio ? `#${jugador.socio.numero_socio}` : '—'}</td><td className="py-3 px-4"><span className="font-medium text-on-surface block text-base group-hover: transition-colors">{jugador.socio?.nombre} {jugador.socio?.apellido}</span></td><td className="py-3 px-4 text-on-surface-variant">{jugador.socio?.dni ?? '—'}</td><td className="py-3 px-4 text-on-surface-variant">{jugador.categoria?.nombre ?? '—'}</td><td className="py-3 px-4 text-on-surface-variant">{nombreCategoriaSecundaria(jugador)}</td><td className="py-3 px-4">{estadoActivo(jugador) ? <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />Activo</span> : <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-medium bg-surface-container-high text-on-surface-variant border border-outline-variant/30"><span className="w-1.5 h-1.5 rounded-full bg-outline" />De baja</span>}</td></tr>)}
          </tbody>
        </table>
      </div>
      <TablePagination
        id="jugadores-rows-per-page"
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

export default JugadoresTable
