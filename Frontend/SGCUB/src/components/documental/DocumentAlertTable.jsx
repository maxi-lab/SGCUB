import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const PAGE_SIZE = 5

const TONES = {
  warning: {
    icon: 'bg-secondary-fixed text-on-secondary-fixed',
    count: 'bg-secondary-fixed text-on-secondary-fixed',
    row: 'hover:bg-surface-container-low focus:bg-surface-container-low',
    name: 'group-hover:text-primary',
    document: 'text-on-surface',
    badge: 'bg-secondary-fixed text-on-secondary-fixed',
    loadMore: 'text-primary',
  },
  error: {
    icon: 'bg-error-container text-error',
    count: 'bg-error text-on-error',
    row: 'hover:bg-error-container/20 focus:bg-error-container/20',
    name: 'group-hover:text-error',
    document: 'text-error',
    badge: 'bg-error-container text-error',
    loadMore: 'text-error',
  },
}

const matchesSearch = (doc, search) => {
  const text = search.toLowerCase()
  return (doc.persona_nombre_completo || '').toLowerCase().includes(text) ||
    (doc.nombre || '').toLowerCase().includes(text)
}

export default function DocumentAlertTable({ title, icon, tone = 'warning', headers, rows, getBadgeLabel, getTypeName, emptyMessage }) {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [limit, setLimit] = useState(PAGE_SIZE)
  const style = TONES[tone] ?? TONES.warning

  const filteredRows = rows.filter(doc => matchesSearch(doc, search))
  const visibleRows = filteredRows.slice(0, limit)
  const openProfile = (doc) => navigate(`${doc.url_perfil}?tab=documentacion`)

  return (
    <div className="bg-surface-container-lowest rounded-xl shadow-sm flex flex-col overflow-hidden">
      <div className="p-space-lg bg-surface-container-lowest flex flex-col gap-space-md border-b border-surface-container">
        <div className="flex items-center gap-space-sm">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${style.icon}`}>
            <span className="material-symbols-outlined text-[18px]">{icon}</span>
          </div>
          <div className="flex items-center gap-2">
            <h2 className="font-headline-sm text-headline-sm text-on-surface">{title}</h2>
            <span className={`font-label-sm text-label-sm px-2 py-0.5 rounded-full font-bold ${style.count}`}>{rows.length}</span>
          </div>
        </div>
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-2.5 text-outline text-[18px]">search</span>
          <input
            className="w-full h-9 pl-9 pr-4 bg-surface-container-low text-on-surface placeholder:text-outline text-body-sm font-body-sm rounded-lg focus:outline-none focus:bg-surface-container-lowest transition-all"
            placeholder="Filtrar por jugador o documento..."
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
              {headers.map(header => (
                <th key={header} className="py-space-sm px-space-md font-semibold">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="font-body-sm text-body-sm text-on-surface">
            {visibleRows.map(doc => (
              <tr
                key={doc.id_documento}
                onClick={() => openProfile(doc)}
                onKeyDown={(e) => e.key === 'Enter' && openProfile(doc)}
                tabIndex={0}
                className={`transition-colors cursor-pointer group focus:outline-none ${style.row}`}
              >
                <td className="py-space-md px-space-md">
                  <div className="flex flex-col min-w-0">
                    <span className={`font-label-lg text-label-lg font-semibold text-on-surface truncate transition-colors ${style.name}`}>{doc.persona_nombre_completo || 'Desconocido'}</span>
                    <span className="font-body-sm text-body-sm text-on-surface-variant truncate">{doc.categoria_nombre || ''}</span>
                  </div>
                </td>
                <td className="py-space-md px-space-md">
                  <span className={`font-medium ${style.document}`}>{doc.nombre}</span>
                  <span className="block font-label-sm text-label-sm text-outline">{getTypeName(doc.tipo_documento)}</span>
                </td>
                <td className="py-space-md px-space-md whitespace-nowrap">
                  <span className="block font-medium text-on-surface">{doc.dueDateLabel}</span>
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-label-sm font-semibold mt-1 ${style.badge}`}>
                    {getBadgeLabel(doc)}
                  </span>
                </td>
              </tr>
            ))}
            {visibleRows.length === 0 && (
              <tr><td colSpan={headers.length} className="p-4 text-center text-outline">{emptyMessage}</td></tr>
            )}
          </tbody>
        </table>
      </div>
      {filteredRows.length > limit && (
        <div className="p-space-md bg-surface-container-low flex items-center justify-between">
          <span className="font-label-sm text-label-sm text-outline">Mostrando {limit} de {filteredRows.length}</span>
          <button
            onClick={() => setLimit(limit + PAGE_SIZE)}
            className={`font-label-md text-label-md font-semibold hover:underline ${style.loadMore}`}
          >
            Cargar más ↓
          </button>
        </div>
      )}
    </div>
  )
}
