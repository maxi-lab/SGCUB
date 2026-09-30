import { formatDni } from '../personas/format'

const TONOS_ETIQUETA = {
  error: 'bg-error/10 text-error',
  info: 'bg-primary/10 text-primary',
}

export function ListaSugerenciasPersona({ id, coincidencias, etiquetaDe, onSelect }) {
  return (
    <ul
      id={id}
      role="listbox"
      className="absolute z-20 left-0 right-0 top-full mt-1 flex flex-col rounded-lg border border-outline-variant/40 bg-surface-container-lowest shadow-lg divide-y divide-outline-variant/30 overflow-hidden"
    >
      {coincidencias.map((persona) => {
        const etiqueta = etiquetaDe(persona)
        return (
          <li key={persona.dni} role="option" aria-selected={false}>
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => onSelect(persona)}
              className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left hover:bg-surface-container-low transition-colors cursor-pointer"
            >
              <span className="flex flex-col min-w-0">
                <span className="text-base text-on-surface font-medium truncate">
                  {`${persona.nombre ?? ''} ${persona.apellido ?? ''}`.trim() || 'Sin nombre'}
                </span>
                <span className="text-sm text-on-surface-variant font-mono">DNI {formatDni(persona.dni)}</span>
              </span>
              <span className="flex items-center gap-2 shrink-0">
                {etiqueta && (
                  <span className={`px-2 py-0.5 rounded-md text-sm font-medium ${TONOS_ETIQUETA[etiqueta.tono]}`}>{etiqueta.texto}</span>
                )}
                <span className="material-symbols-outlined text-[20px] text-on-surface-variant">arrow_forward</span>
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

export function BotonCambiarPersona({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-sm font-semibold text-primary hover:bg-primary/10 transition-colors cursor-pointer shrink-0"
    >
      <span className="material-symbols-outlined text-base">swap_horiz</span>
      Cambiar
    </button>
  )
}
