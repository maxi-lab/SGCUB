import { useEffect, useRef, useState } from 'react'
import { api } from '../../api/conf'
import { PrimaryButton, SecondaryButton } from '../personas/tabs/parts'
import { RELATIONS } from './contacts'

const contactoVacio = {
  dni: '',
  telefono: '',
  nombre: '',
  apellido: '',
  email: '',
  relacion: '',
  responsable_legal: false,
}

const MIN_DIGITOS_BUSQUEDA = 3
const DEMORA_BUSQUEDA_MS = 300

const inputClass = 'w-full h-10 px-3 bg-surface-container-low rounded-lg text-base text-on-surface border border-outline-variant/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60'

function InputField({ label, required, className = '', children }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-base text-on-surface-variant font-semibold">
        {label}{required && <span className="text-error ml-0.5">*</span>}
      </span>
      {children}
    </label>
  )
}

export default function AddContactModal({ onClose, onSubmit }) {
  const [form, setForm] = useState(contactoVacio)
  const [saving, setSaving] = useState(false)
  const [searching, setSearching] = useState(false)
  const [coincidencias, setCoincidencias] = useState([])
  const [personaSeleccionada, setPersonaSeleccionada] = useState(null)
  const [error, setError] = useState('')
  const ultimaBusqueda = useRef(0)

  useEffect(() => {
    const cerrarConEscape = (event) => event.key === 'Escape' && !saving && onClose()
    window.addEventListener('keydown', cerrarConEscape)
    return () => window.removeEventListener('keydown', cerrarConEscape)
  }, [onClose, saving])

  // Busca coincidencias por prefijo de DNI mientras el usuario escribe.
  useEffect(() => {
    const dni = form.dni.trim()
    const busquedaId = ++ultimaBusqueda.current
    if (personaSeleccionada || dni.length < MIN_DIGITOS_BUSQUEDA) {
      setCoincidencias([])
      setSearching(false)
      return undefined
    }

    setSearching(true)
    const timer = setTimeout(async () => {
      try {
        const response = await api.get(`padron/persona/?dni_prefix=${encodeURIComponent(dni)}`)
        if (busquedaId === ultimaBusqueda.current) setCoincidencias(response.data ?? [])
      } catch (requestError) {
        console.error('Error buscando persona', requestError)
        if (busquedaId === ultimaBusqueda.current) setCoincidencias([])
      } finally {
        if (busquedaId === ultimaBusqueda.current) setSearching(false)
      }
    }, DEMORA_BUSQUEDA_MS)

    return () => clearTimeout(timer)
  }, [form.dni, personaSeleccionada])

  const change = (campo) => (event) => {
    const { type, checked, value } = event.target
    setForm((actual) => ({ ...actual, [campo]: type === 'checkbox' ? checked : value }))
  }

  const seleccionarPersona = (persona) => {
    setPersonaSeleccionada(persona)
    setForm((actual) => ({
      ...actual,
      dni: String(persona.dni ?? ''),
      nombre: persona.nombre ?? '',
      apellido: persona.apellido ?? '',
      telefono: persona.telefono ?? '',
      email: persona.email ?? '',
    }))
  }

  const quitarSeleccion = () => {
    setPersonaSeleccionada(null)
    setForm((actual) => ({ ...contactoVacio, relacion: actual.relacion, responsable_legal: actual.responsable_legal }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      await onSubmit({
        persona: {
          dni: form.dni,
          telefono: form.telefono,
          nombre: form.nombre,
          apellido: form.apellido,
          email: form.email || null,
        },
        relacion: form.relacion,
        responsable_legal: form.responsable_legal,
      })
      onClose()
    } catch (requestError) {
      setError(requestError.message || 'No se pudo agregar el contacto.')
    } finally {
      setSaving(false)
    }
  }

  const datosBloqueados = saving || Boolean(personaSeleccionada)

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-inverse-surface/40" onClick={() => !saving && onClose()}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-agregar-contacto"
        className="w-full max-w-lg bg-surface-container-lowest rounded-xl shadow-xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
        onSubmit={submit}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-4 border-b border-surface-container">
          <h2 id="titulo-agregar-contacto" className="text-xl font-bold text-on-surface">Agregar contacto</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-1.5 rounded text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2 flex flex-col gap-2">
            <InputField label="DNI" required>
              <div className="relative">
                <input
                  className={`${inputClass} pr-10`}
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="Ingresá el DNI para buscar"
                  value={form.dni}
                  onChange={change('dni')}
                  required
                  disabled={datosBloqueados}
                  autoFocus
                />
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 flex text-on-surface-variant pointer-events-none">
                  <span className={`material-symbols-outlined text-[20px] ${searching ? 'animate-spin' : ''}`}>
                    {searching ? 'progress_activity' : 'search'}
                  </span>
                </span>
              </div>
            </InputField>

            {personaSeleccionada && (
              <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-primary/10 text-sm text-on-surface">
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-xl text-primary">check_circle</span>
                  Persona existente seleccionada
                </span>
                <button
                  type="button"
                  onClick={quitarSeleccion}
                  disabled={saving}
                  className="font-semibold text-primary hover:underline cursor-pointer"
                >
                  Cambiar
                </button>
              </div>
            )}

            {!personaSeleccionada && coincidencias.length > 0 && (
              <ul className="flex flex-col rounded-lg border border-outline-variant/40 divide-y divide-outline-variant/30 overflow-hidden">
                {coincidencias.map((persona) => (
                  <li key={persona.dni}>
                    <button
                      type="button"
                      onClick={() => seleccionarPersona(persona)}
                      className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left hover:bg-surface-container-low transition-colors cursor-pointer"
                    >
                      <span className="flex flex-col">
                        <span className="text-base text-on-surface font-medium">
                          {`${persona.nombre ?? ''} ${persona.apellido ?? ''}`.trim() || 'Sin nombre'}
                        </span>
                        <span className="text-sm text-on-surface-variant">DNI {persona.dni}</span>
                      </span>
                      <span className="material-symbols-outlined text-[20px] text-on-surface-variant">arrow_forward</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <InputField label="Nombre" required>
            <input className={inputClass} value={form.nombre} onChange={change('nombre')} required disabled={datosBloqueados} />
          </InputField>
          <InputField label="Apellido" required>
            <input className={inputClass} value={form.apellido} onChange={change('apellido')} required disabled={datosBloqueados} />
          </InputField>
          <InputField label="Correo electrónico">
            <input className={inputClass} type="email" value={form.email} onChange={change('email')} disabled={datosBloqueados} />
          </InputField>
          <InputField label="Teléfono" required>
            <input className={inputClass} type="tel" value={form.telefono} onChange={change('telefono')} required disabled={datosBloqueados} />
          </InputField>
          <InputField label="Relación" required>
            <select className={inputClass} value={form.relacion} onChange={change('relacion')} required disabled={saving}>
              <option value="" disabled>Seleccionar...</option>
              {RELATIONS.map((relacion) => <option key={relacion} value={relacion}>{relacion}</option>)}
            </select>
          </InputField>
          <label className="flex items-center gap-2 sm:mt-7 cursor-pointer select-none">
            <input
              type="checkbox"
              className="w-4 h-4 accent-primary cursor-pointer"
              checked={form.responsable_legal}
              onChange={change('responsable_legal')}
              disabled={saving}
            />
            <span className="text-base text-on-surface font-medium">Responsable legal</span>
          </label>

          {error && (
            <p className="sm:col-span-2 px-3 py-2 rounded-lg bg-error-container/40 text-sm text-on-error-container">{error}</p>
          )}
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-surface-container">
          <SecondaryButton onClick={onClose} disabled={saving}>Cancelar</SecondaryButton>
          <PrimaryButton type="submit" icon="person_add" disabled={saving}>
            {saving ? 'Guardando...' : 'Agregar contacto'}
          </PrimaryButton>
        </div>
      </form>
    </div>
  )
}
