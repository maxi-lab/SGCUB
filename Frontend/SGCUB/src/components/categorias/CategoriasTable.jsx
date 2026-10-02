import { useMemo, useState } from 'react'
import CategoriasGeneroTable from './CategoriasGeneroTable'
import { GENERO_OPTIONS } from './categoriaFormat'

function CategoriasTable({ data, isLoading, error }) {
  const [search, setSearch] = useState('')

  const byGenero = useMemo(() => {
    const text = search.trim().toLowerCase()
    const filtered = (data ?? []).filter((categoria) =>
      !text || String(categoria.nombre ?? '').toLowerCase().includes(text))
    return Object.fromEntries(GENERO_OPTIONS.map(({ value }) => [
      value,
      filtered.filter((categoria) => categoria.genero === value),
    ]))
  }, [data, search])

  return (
    <div className="min-w-0 flex flex-col gap-4">
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-lg shadow-sm p-4">
        <div className="relative w-full sm:max-w-md">
          <span className="material-symbols-outlined absolute left-4 top-1.5 text-outline text-[18px]" aria-hidden="true">
            search
          </span>
          <input
            className="w-full h-10 pl-11 pr-4 bg-surface-container-low border border-outline-variant/40 rounded text-on-surface placeholder:text-outline font-body-sm text-sm focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-colors"
            placeholder="Filtrar por nombre..."
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            aria-label="Filtrar categorías"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
        {['M', 'F'].map((genero) => (
          <CategoriasGeneroTable
            key={genero}
            genero={genero}
            categorias={byGenero[genero]}
            isLoading={isLoading}
            error={error}
          />
        ))}
      </div>
    </div>
  )
}

export default CategoriasTable
