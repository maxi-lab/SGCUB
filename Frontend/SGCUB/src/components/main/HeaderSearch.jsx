import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import usePersonaSearch from '../../hooks/usePersonaSearch'
import { formatDni } from '../personas/format'

const LISTBOX_ID = 'header-search-results'

const PROFILE_TONES = {
  socio: 'bg-primary/10 text-primary',
  jugador: 'bg-emerald-50 text-emerald-700',
  docente: 'bg-amber-50 text-amber-700',
  vinculo: 'bg-surface-container-high text-on-surface-variant',
}

function SearchMessage({ icon, children }) {
  return (
    <div className="flex items-center gap-2 px-3 py-3 text-sm text-on-surface-variant">
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
      {children}
    </div>
  )
}

export default function HeaderSearch() {
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const { query, setQuery, clear, isActive, isSearching, results, error } = usePersonaSearch()
  const [isOpen, setIsOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const highlightedIndex = Math.min(activeIndex, results.length - 1)
  const showDropdown = isOpen && isActive

  const select = (result) => {
    navigate(result.path)
    clear()
    setIsOpen(false)
    inputRef.current?.blur()
  }

  const handleChange = (event) => {
    setQuery(event.target.value)
    setActiveIndex(0)
    setIsOpen(true)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setIsOpen(false)
      return
    }
    if (!showDropdown || results.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((highlightedIndex + 1) % results.length)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((highlightedIndex - 1 + results.length) % results.length)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      select(results[highlightedIndex])
    }
  }

  const renderContent = () => {
    if (isSearching) return <SearchMessage icon="progress_activity">Buscando...</SearchMessage>
    if (error) return <SearchMessage icon="error">No se pudo realizar la búsqueda.</SearchMessage>
    if (results.length === 0) return <SearchMessage icon="person_off">Sin resultados.</SearchMessage>

    return (
      <ul id={LISTBOX_ID} role="listbox" className="flex flex-col divide-y divide-outline-variant/30 max-h-96 overflow-y-auto">
        {results.map((result, index) => {
          const isHighlighted = index === highlightedIndex
          return (
            <li key={result.key} id={`${LISTBOX_ID}-${index}`} role="option" aria-selected={isHighlighted}>
              <button
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => select(result)}
                className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-left transition-colors cursor-pointer ${isHighlighted ? 'bg-surface-container-low' : ''}`}
              >
                <span className="flex flex-col min-w-0">
                  <span className="text-base text-on-surface font-medium truncate">{result.name}</span>
                  <span className="text-sm text-on-surface-variant truncate">
                    <span className="font-mono">DNI {formatDni(result.dni)}</span>
                    {result.detail && ` · ${result.detail}`}
                  </span>
                </span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded-md text-sm font-medium ${PROFILE_TONES[result.profile]}`}>{result.label}</span>
                  <span className="material-symbols-outlined text-[20px] text-on-surface-variant">arrow_forward</span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <div className="relative flex items-center">
      <span className="material-symbols-outlined absolute left-3 text-outline text-[20px]">search</span>
      <input
        ref={inputRef}
        className="w-full h-10 pl-10 pr-20 bg-surface-container-low border border-outline-variant/40 rounded text-on-surface placeholder:text-outline text-base focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-colors"
        placeholder="Buscar por DNI, Nombre, Apellido o N° de Socio..."
        type="text"
        role="combobox"
        aria-expanded={showDropdown}
        aria-controls={LISTBOX_ID}
        aria-autocomplete="list"
        aria-activedescendant={showDropdown && results.length > 0 ? `${LISTBOX_ID}-${highlightedIndex}` : undefined}
        value={query}
        onChange={handleChange}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        onKeyDown={handleKeyDown}
      />

      {showDropdown && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 rounded-lg border border-outline-variant/40 bg-surface-container-lowest shadow-lg overflow-hidden">
          {renderContent()}
        </div>
      )}
    </div>
  )
}
