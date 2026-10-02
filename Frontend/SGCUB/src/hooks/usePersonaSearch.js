import { useCallback, useEffect, useState } from 'react'
import { searchPersonas } from '../api/personas'

const MIN_QUERY_LENGTH = 2
const SEARCH_DELAY_MS = 300

const EMPTY_RESPONSE = { term: '', results: [], error: null }

const fullName = (persona) => `${persona.nombre ?? ''} ${persona.apellido ?? ''}`.trim() || 'Sin nombre'

export const toSearchResults = (personas) => personas.flatMap((persona) => {
  const { socio_id, jugador_id, docente_id, vinculos = [] } = persona.perfiles ?? {}
  const base = { personaId: persona.persona_id, name: fullName(persona), dni: persona.dni }
  const results = []

  if (socio_id && !jugador_id) {
    results.push({ ...base, key: `socio-${socio_id}`, profile: 'socio', label: 'Socio', path: `/padron/socios/${socio_id}` })
  }
  if (jugador_id) {
    results.push({ ...base, key: `jugador-${jugador_id}`, profile: 'jugador', label: 'Jugador', path: `/padron/jugadores/${jugador_id}` })
  }
  if (docente_id) {
    results.push({ ...base, key: `docente-${docente_id}`, profile: 'docente', label: 'Docente', path: `/padron/docentes/${docente_id}` })
  }
  vinculos.forEach((vinculo) => {
    results.push({
      ...base,
      key: `vinculo-${persona.persona_id}-${vinculo.jugador_id}`,
      profile: 'vinculo',
      label: 'Vínculo familiar',
      detail: `Vínculo de ${vinculo.jugador_nombre} (${vinculo.relacion})`,
      path: `/padron/jugadores/${vinculo.jugador_id}?tab=familiar`,
    })
  })

  return results
})

function usePersonaSearch() {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState(EMPTY_RESPONSE)

  const term = query.trim()
  const isActive = term.length >= MIN_QUERY_LENGTH
  const isCurrent = isActive && response.term === term

  useEffect(() => {
    if (!isActive) return undefined

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      try {
        const personas = await searchPersonas(term, { signal: controller.signal })
        setResponse({ term, results: toSearchResults(personas ?? []), error: null })
      } catch (requestError) {
        if (controller.signal.aborted) return
        console.error('Error al buscar personas:', requestError)
        setResponse({ term, results: [], error: requestError })
      }
    }, SEARCH_DELAY_MS)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [term, isActive])

  const clear = useCallback(() => setQuery(''), [])

  return {
    query,
    setQuery,
    clear,
    isActive,
    isSearching: isActive && !isCurrent,
    results: isCurrent ? response.results : [],
    error: isCurrent ? response.error : null,
  }
}

export default usePersonaSearch
