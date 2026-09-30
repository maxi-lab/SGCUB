import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { claseInput } from '../socios/socioForm'

const ALTO_OPCION = 40
const OPCIONES_VISIBLES = 6
const SEPARACION = 4
const MARGEN_VIEWPORT = 16

function useDropDownMenu() {
  const [abierto, setAbierto] = useState(false)
  const [posicion, setPosicion] = useState(null)
  const boton = useRef(null)
  const lista = useRef(null)

  useLayoutEffect(() => {
    if (!abierto) return undefined
    const ubicar = () => {
      const rect = boton.current.getBoundingClientRect()
      const altoDeseado = ALTO_OPCION * OPCIONES_VISIBLES + 2
      const espacioAbajo = window.innerHeight - rect.bottom - SEPARACION - MARGEN_VIEWPORT
      const espacioArriba = rect.top - SEPARACION - MARGEN_VIEWPORT
      const abrirArriba = espacioAbajo < Math.min(altoDeseado, ALTO_OPCION * 3) && espacioArriba > espacioAbajo
      const base = { left: rect.left, width: rect.width }
      setPosicion(abrirArriba
        ? { ...base, bottom: window.innerHeight - rect.top + SEPARACION, maxHeight: Math.min(altoDeseado, espacioArriba) }
        : { ...base, top: rect.bottom + SEPARACION, maxHeight: Math.min(altoDeseado, Math.max(espacioAbajo, ALTO_OPCION)) })
    }
    ubicar()
    window.addEventListener('scroll', ubicar, true)
    window.addEventListener('resize', ubicar)
    return () => {
      window.removeEventListener('scroll', ubicar, true)
      window.removeEventListener('resize', ubicar)
    }
  }, [abierto])

  useEffect(() => {
    if (!abierto) return undefined
    const cerrarAlClickearFuera = (event) => {
      if (!boton.current?.contains(event.target) && !lista.current?.contains(event.target)) setAbierto(false)
    }
    const cerrarConEscape = (event) => event.key === 'Escape' && setAbierto(false)
    document.addEventListener('mousedown', cerrarAlClickearFuera)
    document.addEventListener('keydown', cerrarConEscape)
    return () => {
      document.removeEventListener('mousedown', cerrarAlClickearFuera)
      document.removeEventListener('keydown', cerrarConEscape)
    }
  }, [abierto])

  return { abierto, setAbierto, posicion, boton, lista }
}

function BotonDropDownMenu({ dropDownMenu, id, conError, children }) {
  const { abierto, setAbierto, boton } = dropDownMenu
  return (
    <>
      <button
        ref={boton}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-invalid={conError || undefined}
        onClick={() => setAbierto((actual) => !actual)}
        className={claseInput(conError, 'pr-10 text-left cursor-pointer truncate')}
      >
        {children}
      </button>
      <span className="material-symbols-outlined absolute right-3 top-3 text-outline text-base pointer-events-none">
        {abierto ? 'expand_less' : 'expand_more'}
      </span>
    </>
  )
}

function ListaDropDownMenu({ dropDownMenu, multiple, children }) {
  const { abierto, posicion, lista } = dropDownMenu
  if (!abierto || !posicion) return null
  return createPortal(
    <ul
      ref={lista}
      role="listbox"
      aria-multiselectable={multiple || undefined}
      style={{
        position: 'fixed',
        top: posicion.top,
        bottom: posicion.bottom,
        left: posicion.left,
        width: posicion.width,
        maxHeight: posicion.maxHeight,
        overflowY: 'auto',
        overscrollBehavior: 'contain',
        zIndex: 1000,
        margin: 0,
        padding: 0,
        listStyle: 'none',
      }}
      className="bg-surface-container-lowest border border-outline-variant/50 rounded shadow-lg"
    >
      {children}
    </ul>,
    document.body,
  )
}

const claseOpcion = (deshabilitada) => `flex items-center justify-between gap-3 px-3.5 text-base w-full text-left ${
  deshabilitada ? 'text-outline cursor-not-allowed' : 'text-on-surface hover:bg-surface-container-low cursor-pointer'
}`

export function SelectSimple({ id, opciones, valor, onChange, conError, placeholder }) {
  const dropDownMenu = useDropDownMenu()
  const etiqueta = opciones.find((o) => o.valor === valor)?.etiqueta

  const elegir = (nuevoValor) => {
    onChange(nuevoValor)
    dropDownMenu.setAbierto(false)
    dropDownMenu.boton.current?.focus()
  }

  return (
    <div className="relative">
      <BotonDropDownMenu dropDownMenu={dropDownMenu} id={id} conError={conError}>
        {etiqueta ?? <span className="text-outline">{placeholder}</span>}
      </BotonDropDownMenu>

      <ListaDropDownMenu dropDownMenu={dropDownMenu}>
        {opciones.map((opcion) => {
          const seleccionada = opcion.valor === valor
          const deshabilitada = Boolean(opcion.deshabilitadaPor)
          return (
            <li key={opcion.valor} role="option" aria-selected={seleccionada} aria-disabled={deshabilitada || undefined}>
              <button
                type="button"
                style={{ height: ALTO_OPCION }}
                disabled={deshabilitada}
                onClick={() => elegir(opcion.valor)}
                className={`${claseOpcion(deshabilitada)} ${seleccionada ? 'font-semibold' : ''}`}
              >
                <span className="truncate">{opcion.etiqueta}</span>
                {seleccionada && <span className="material-symbols-outlined text-base text-primary shrink-0">check</span>}
                {deshabilitada && <span className="text-sm shrink-0">{opcion.deshabilitadaPor}</span>}
              </button>
            </li>
          )
        })}
      </ListaDropDownMenu>
    </div>
  )
}

export function SelectMultiple({ id, opciones, seleccionadas, onToggle, conError, placeholder = 'Seleccione categorías...' }) {
  const dropDownMenu = useDropDownMenu()
  const etiquetas = opciones.filter((o) => seleccionadas.includes(o.valor)).map((o) => o.etiqueta)

  return (
    <div className="relative">
      <BotonDropDownMenu dropDownMenu={dropDownMenu} id={id} conError={conError}>
        {etiquetas.length > 0 ? etiquetas.join(', ') : <span className="text-outline">{placeholder}</span>}
      </BotonDropDownMenu>

      <ListaDropDownMenu dropDownMenu={dropDownMenu} multiple>
        {opciones.length === 0 && (
          <li className="px-3.5 flex items-center text-base text-outline" style={{ height: ALTO_OPCION }}>No hay categorías cargadas.</li>
        )}
        {opciones.map((opcion) => {
          const seleccionada = seleccionadas.includes(opcion.valor)
          const deshabilitada = Boolean(opcion.deshabilitadaPor)
          return (
            <li key={opcion.valor} role="option" aria-selected={seleccionada} aria-disabled={deshabilitada || undefined}>
              <label style={{ height: ALTO_OPCION }} className={claseOpcion(deshabilitada)}>
                <span className="flex items-center gap-2.5 truncate">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-primary cursor-pointer disabled:cursor-not-allowed shrink-0"
                    checked={seleccionada}
                    disabled={deshabilitada}
                    onChange={() => onToggle(opcion.valor)}
                  />
                  {opcion.etiqueta}
                </span>
                {deshabilitada && <span className="text-sm shrink-0">Asignada como {opcion.deshabilitadaPor}</span>}
              </label>
            </li>
          )
        })}
      </ListaDropDownMenu>
    </div>
  )
}
