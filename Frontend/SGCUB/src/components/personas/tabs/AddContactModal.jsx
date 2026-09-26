import { useEffect, useState } from 'react'
import { api } from '../../../api/conf'
import { PrimaryButton, SecondaryButton } from './parts'

const RELACIONES = ['Madre', 'Padre', 'Tutor', 'Abuelo', 'Hermano', 'Otro']

const contactoVacio = {
  dni: '',
  telefono: '',
  nombre: '',
  apellido: '',
  email: '',
  relacion: '',
  responsable_legal: false,
}

const inputClass = 'w-full h-10 px-3 bg-surface-container-low rounded-lg text-base text-on-surface border border-outline-variant/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:opacity-60'

function InputField({ label, required, className = '', children }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className="text-sm text-on-surface-variant font-semibold">
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
  const [error, setError] = useState('')

  useEffect(() => {
    const cerrarConEscape = (event) => event.key === 'Escape' && !saving && onClose()
    window.addEventListener('keydown', cerrarConEscape)
    return () => window.removeEventListener('keydown', cerrarConEscape)
  }, [onClose, saving])

  const change = (campo) => (event) => {
    const { type, checked, value } = event.target
    setForm((actual) => ({ ...actual, [campo]: type === 'checkbox' ? checked : value }))
  }

  const buscarPersona = async () => {
    if (!form.dni) return
    setSearching(true)
    try {
      const response = await api.get(`padron/persona/?dni=${encodeURIComponent(form.dni)}`)
      const persona = response.data?.[0]
      if (persona) {
        setForm((actual) => ({
          ...actual,
          nombre: persona.nombre ?? '',
          apellido: persona.apellido ?? '',
          telefono: persona.telefono ?? '',
          email: persona.email ?? '',
        }))
      }
    } catch (requestError) {
      console.error('Error buscando persona', requestError)
    } finally {
      setSearching(false)
    }
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
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-surface-container">
          <h3 id="titulo-agregar-contacto" className="text-lg font-bold text-on-surface">Agregar contacto</h3>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="p-1.5 rounded text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InputField label="DNI" required>
            <div className="relative">
              <input className={`${inputClass} pr-10`} value={form.dni} onChange={change('dni')} onBlur={buscarPersona} required disabled={saving} />
              <button
                type="button"
                onClick={buscarPersona}
                disabled={searching || saving}
                title="Buscar persona por DNI"
                aria-label="Buscar persona por DNI"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 rounded text-on-surface-variant hover:text-primary cursor-pointer"
              >
                <span className={`material-symbols-outlined text-[20px] ${searching ? 'animate-spin' : ''}`}>{searching ? 'progress_activity' : 'search'}</span>
              </button>
            </div>
          </InputField>
          <InputField label="Teléfono" required>
            <input className={inputClass} type="tel" value={form.telefono} onChange={change('telefono')} required disabled={saving} />
          </InputField>
          <InputField label="Nombre" required>
            <input className={inputClass} value={form.nombre} onChange={change('nombre')} required disabled={saving} />
          </InputField>
          <InputField label="Apellido" required>
            <input className={inputClass} value={form.apellido} onChange={change('apellido')} required disabled={saving} />
          </InputField>
          <InputField label="Correo electrónico" className="sm:col-span-2">
            <input className={inputClass} type="email" value={form.email} onChange={change('email')} disabled={saving} />
          </InputField>
          <InputField label="Relación" required>
            <select className={inputClass} value={form.relacion} onChange={change('relacion')} required disabled={saving}>
              <option value="" disabled>Seleccionar...</option>
              {RELACIONES.map((relacion) => <option key={relacion} value={relacion}>{relacion}</option>)}
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
