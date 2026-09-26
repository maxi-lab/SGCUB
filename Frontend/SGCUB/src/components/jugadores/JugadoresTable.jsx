import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

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

function JugadoresTable({ data, categorias = [], isLoading, error, onEdit, onDelete }) {
  const navigate = useNavigate()
  const [busqueda, setBusqueda] = useState('')
  const [categoria, setCategoria] = useState('todas')
  const [estado, setEstado] = useState('todos')
  const [filasPorPagina, setFilasPorPagina] = useState(25)
  const [pagina, setPagina] = useState(1)
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
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / filasPorPagina))
  const paginaActual = Math.min(pagina, totalPaginas)
  const desde = (paginaActual - 1) * filasPorPagina
  const visibles = filtrados.slice(desde, desde + filasPorPagina)

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg shadow-sm">
      <div className="p-4 border-b border-outline-variant/20 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-4 top-1.5 text-outline text-[18px]" aria-hidden="true">search</span>
            <input className="w-full h-10 pl-11 pr-4 bg-surface-container-low border border-outline-variant/40 rounded text-on-surface placeholder:text-outline font-body-sm text-lg focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-colors" placeholder="Filtrar por DNI, Nombre o Apellido..." type="text" value={busqueda} onChange={(event) => { setBusqueda(event.target.value); setPagina(1) }} aria-label="Filtrar jugadores" />
          </div>
          <select className="h-10 px-3 bg-surface-container-low border border-outline-variant/40 rounded text-on-surface font-body-sm text-lg font-medium focus:outline-none focus:border-primary cursor-pointer" value={categoria} onChange={(event) => { setCategoria(event.target.value); setPagina(1) }} aria-label="Filtrar por categoría">
            <option value="todas">Categoría: Todas</option>
            {categorias.map((item) => <option key={item.categoria_id} value={item.categoria_id}>{item.nombre}</option>)}
          </select>
          <select className="h-10 px-3 bg-surface-container-low border border-outline-variant/40 rounded text-on-surface font-body-sm text-lg font-medium focus:outline-none focus:border-primary cursor-pointer" value={estado} onChange={(event) => { setEstado(event.target.value); setPagina(1) }} aria-label="Filtrar por estado">
            <option value="todos">Estado: Todos</option>
            <option value="activo">Activo</option>
            <option value="baja">De baja / Inactivo</option>
          </select>
        </div>
        <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 lg:pt-0">
          <span className="text-lg text-on-surface-variant whitespace-nowrap">{filtrados.length === 0 ? 'Sin resultados' : `Mostrando ${desde + 1}-${desde + visibles.length} de ${filtrados.length.toLocaleString('es-AR')} jugadores`}</span>
          <button type="button" onClick={() => exportarCSV(filtrados)} disabled={filtrados.length === 0} className="inline-flex items-center gap-1.5 h-10 px-3 bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/40 text-on-surface rounded text-lg font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"><span className="material-symbols-outlined text-[16px]" aria-hidden="true">file_download</span><span>Exportar jugadores</span></button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-base border-collapse">
          <thead><tr className="bg-surface-container-low/60 border-b border-outline-variant/30 text-base font-semibold text-on-surface-variant uppercase tracking-wider"><th className="py-3 px-4" scope="col">N° Socio</th><th className="py-3 px-4" scope="col">Nombre y Apellido</th><th className="py-3 px-4" scope="col">DNI</th><th className="py-3 px-4" scope="col">Categoría principal</th><th className="py-3 px-4" scope="col">Categoría secundaria</th><th className="py-3 px-4" scope="col">Estado</th></tr></thead>
          <tbody className="divide-y divide-outline-variant/20 font-body-sm text-lg text-on-surface">
            {isLoading && <tr><td className="py-10 px-4 text-center text-on-surface-variant" colSpan={6}>Cargando jugadores...</td></tr>}
            {!isLoading && visibles.length === 0 && <tr><td className="py-10 px-4 text-center text-on-surface-variant" colSpan={6}>{error ? 'No se pudieron cargar los jugadores.' : 'No hay jugadores que coincidan con el filtro.'}</td></tr>}
            {!isLoading && visibles.map((jugador) => <tr key={jugador.jugador_id} onClick={() => navigate(`/padron/jugadores/${jugador.jugador_id}`)} className="hover:bg-surface-container-low/80 transition-colors cursor-pointer group"><td className="py-3 px-4 font-bold text-primary">{jugador.socio?.numero_socio ? `#${jugador.socio.numero_socio}` : '—'}</td><td className="py-3 px-4"><span className="font-medium text-on-surface block text-lg group-hover:text-primary transition-colors">{jugador.socio?.nombre} {jugador.socio?.apellido}</span></td><td className="py-3 px-4 text-on-surface-variant">{jugador.socio?.dni ?? '—'}</td><td className="py-3 px-4 text-on-surface-variant">{jugador.categoria?.nombre ?? '—'}</td><td className="py-3 px-4 text-on-surface-variant">{nombreCategoriaSecundaria(jugador)}</td><td className="py-3 px-4">{estadoActivo(jugador) ? <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-lg font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"><span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />Activo</span> : <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-lg font-medium bg-surface-container-high text-on-surface-variant border border-outline-variant/30"><span className="w-1.5 h-1.5 rounded-full bg-outline" />De baja</span>}</td></tr>)}
          </tbody>
        </table>
      </div>
      <div className="p-4 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-lg text-on-surface-variant"><div className="flex items-center gap-2"><label className="font-label-md" htmlFor="jugadores-rows-per-page">Filas por página:</label><select className="h-8 px-2 bg-surface-container-low border border-outline-variant/40 rounded text-on-surface font-body-sm text-lg focus:outline-none focus:border-primary cursor-pointer" id="jugadores-rows-per-page" value={filasPorPagina} onChange={(event) => { setFilasPorPagina(Number(event.target.value)); setPagina(1) }}><option value={25}>25</option><option value={50}>50</option><option value={100}>100</option></select><span className="ml-2">Página {paginaActual} de {totalPaginas}</span></div><div className="flex items-center gap-1"><button type="button" title="Página anterior" aria-label="Página anterior" disabled={paginaActual === 1} onClick={() => setPagina(Math.max(1, paginaActual - 1))} className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"><span className="material-symbols-outlined text-[18px]" aria-hidden="true">chevron_left</span></button>{paginasVisibles(paginaActual, totalPaginas).map((item, indice) => item === '...' ? <span key={`sep-${indice}`} className="px-1 text-outline">...</span> : <button key={item} type="button" onClick={() => setPagina(item)} aria-current={item === paginaActual ? 'page' : undefined} className={item === paginaActual ? 'w-8 h-8 flex items-center justify-center rounded bg-primary text-on-primary font-semibold font-label-md transition-colors' : 'w-8 h-8 flex items-center justify-center rounded border border-outline-variant/30 text-on-surface hover:bg-surface-container-low font-label-md transition-colors cursor-pointer'}>{item}</button>)}<button type="button" title="Página siguiente" aria-label="Página siguiente" disabled={paginaActual === totalPaginas} onClick={() => setPagina(Math.min(totalPaginas, paginaActual + 1))} className="w-8 h-8 flex items-center justify-center rounded border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"><span className="material-symbols-outlined text-[18px]" aria-hidden="true">chevron_right</span></button></div></div>
    </div>
  )
}

export default JugadoresTable
