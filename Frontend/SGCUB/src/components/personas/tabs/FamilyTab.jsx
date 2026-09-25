import { useEffect, useState } from 'react'
import { formatDni } from '../format'
import { PrimaryButton, Field, TabHeader, EmptyState } from './parts'
import AddContactModal from '../../jugadores/AddContactModal'

function LegalGuardianBadge({ isLegalGuardian }) {
  return isLegalGuardian ? (
    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-base font-semibold border border-emerald-200">Sí</span>
  ) : (
    <span className="inline-flex items-center justify-center px-2.5 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant text-base font-medium border border-outline-variant/30">No</span>
  )
}

function ContactDetailsModal({ contact, onClose }) {
  useEffect(() => {
    const closeWithEscape = (event) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', closeWithEscape)
    return () => window.removeEventListener('keydown', closeWithEscape)
  }, [onClose])

  const person = contact.persona ?? {}
  const name = `${person.nombre ?? ''} ${person.apellido ?? ''}`.trim() || 'Sin nombre'

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 bg-inverse-surface/40" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-detalle-contacto"
        className="w-full max-w-lg bg-surface-container-lowest rounded-xl shadow-xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-4 border-b border-surface-container">
          <div className="flex flex-col gap-1">
            <h2 id="titulo-detalle-contacto" className="text-xl font-bold text-on-surface">{name}</h2>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {contact.relacion && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface text-base font-medium">{contact.relacion}</span>
              )}
              <span className={`text-base font-semibold ${contact.responsable_legal ? 'text-emerald-700' : 'text-on-surface-variant'}`}>
                {contact.responsable_legal ? 'Es responsable legal del jugador' : 'Solo contacto de emergencia'}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>
        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="DNI" value={person.dni ? formatDni(person.dni) : ''} icon="badge" />
          <Field label="Teléfono" value={person.telefono} icon="call" />
          <Field label="Correo electrónico" value={person.email} icon="mail" className="sm:col-span-2" />
        </div>
      </div>
    </div>
  )
}

function DeleteContactModal({ contact, onClose, onConfirm }) {
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const person = contact.persona ?? {}
  const name = `${person.nombre ?? ''} ${person.apellido ?? ''}`.trim() || 'este contacto'

  useEffect(() => {
    const closeWithEscape = (event) => event.key === 'Escape' && !deleting && onClose()
    window.addEventListener('keydown', closeWithEscape)
    return () => window.removeEventListener('keydown', closeWithEscape)
  }, [deleting, onClose])

  const confirmDelete = async () => {
    setDeleting(true)
    setError('')
    try {
      await onConfirm(contact)
      onClose()
    } catch (requestError) {
      setError(requestError.message || 'No se pudo eliminar el contacto.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-inverse-surface/40" onClick={() => !deleting && onClose()}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-contact-title"
        className="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 py-4 border-b border-surface-container">
          <div>
            <h3 id="delete-contact-title" className="text-lg font-bold text-on-surface">Eliminar contacto</h3>
            <p className="mt-1 text-base text-on-surface-variant">¿Estás seguro de eliminar a {name}?</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="p-1.5 rounded text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors cursor-pointer disabled:opacity-50"
            aria-label="Cerrar"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>
        <div className="p-6">
          <p className="text-base text-on-surface-variant">Esta acción quitará el vínculo familiar del jugador.</p>
          {error && <p className="mt-4 px-3 py-2 rounded-lg bg-error-container/40 text-base text-on-error-container" role="alert">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 px-6 py-4 border-t border-surface-container">
          <button
            type="button"
            onClick={onClose}
            disabled={deleting}
            className="inline-flex items-center gap-2 h-10 px-4 bg-surface-container-low hover:bg-surface-container text-on-surface border border-outline-variant/40 rounded-lg text-base font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 h-10 px-4 bg-error text-on-error hover:bg-error/90 rounded-lg text-base font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            <span className={`material-symbols-outlined text-[20px] ${deleting ? 'animate-spin' : ''}`}>{deleting ? 'progress_activity' : 'delete'}</span>
            {deleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function FamilyTab({ contacts = [], onAdd, onDelete }) {
  const [selectedContact, setSelectedContact] = useState(null)
  const [contactToDelete, setContactToDelete] = useState(null)
  const [addModalOpen, setAddModalOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <TabHeader
        title="Vínculos familiares y contactos de emergencia"
        description="Personas vinculadas al jugador para notificaciones y responsabilidad legal"
        actions={onAdd && (
          <PrimaryButton icon="person_add" onClick={() => setAddModalOpen(true)}>Agregar contacto</PrimaryButton>
        )}
      />

      {contacts.length === 0 ? (
        <EmptyState
          icon="family_restroom"
          title="Sin contactos registrados"
          description="Este jugador todavía no tiene familiares ni contactos de emergencia cargados."
        />
      ) : (
        <div className="overflow-x-auto border border-outline-variant/30 rounded-xl bg-surface-container-lowest shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/70 border-b border-outline-variant/30 text-on-surface-variant text-base uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Nombre y apellido</th>
                <th className="py-3 px-4 font-semibold">DNI</th>
                <th className="py-3 px-4 font-semibold">Teléfono</th>
                <th className="py-3 px-4 font-semibold">Vínculo</th>
                <th className="py-3 px-4 font-semibold text-center">Responsable legal</th>
                <th className="py-3 px-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-base">
              {contacts.map((contact, index) => (
                <tr
                  key={contact.contacto_emergencia_id ?? index}
                  className="hover:bg-surface-container-low transition-colors cursor-pointer group"
                  onClick={() => setSelectedContact(contact)}
                >
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-on-surface group-hover:text-primary transition-colors inline-flex items-center gap-1.5">
                      {`${contact.persona?.nombre ?? ''} ${contact.persona?.apellido ?? ''}`.trim() || 'Sin nombre'}
                      <span className="material-symbols-outlined text-[16px] text-primary opacity-0 group-hover:opacity-100 transition-opacity">open_in_new</span>
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-on-surface-variant">{contact.persona?.dni ? formatDni(contact.persona.dni) : '—'}</td>
                  <td className="py-3.5 px-4"><span className="font-mono text-base text-on-surface">{contact.persona?.telefono || '—'}</span></td>
                  <td className="py-3.5 px-4">
                    {contact.relacion ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface text-base font-medium">{contact.relacion}</span>
                    ) : '—'}
                  </td>
                  <td className="py-3.5 px-4 text-center"><LegalGuardianBadge isLegalGuardian={contact.responsable_legal} /></td>
                  <td className="py-3.5 px-4 text-center">
                    {onDelete && (
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation()
                          setContactToDelete(contact)
                        }}
                        className="inline-flex items-center justify-center p-2 rounded-lg text-error hover:bg-error-container/60 transition-colors cursor-pointer"
                        aria-label={`Eliminar contacto ${contact.persona?.nombre ?? ''} ${contact.persona?.apellido ?? ''}`.trim()}
                        title="Eliminar contacto"
                      >
                        <span className="material-symbols-outlined text-[20px]">delete</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedContact && <ContactDetailsModal contact={selectedContact} onClose={() => setSelectedContact(null)} />}
      {contactToDelete && onDelete && (
        <DeleteContactModal contact={contactToDelete} onClose={() => setContactToDelete(null)} onConfirm={onDelete} />
      )}
      {addModalOpen && <AddContactModal onClose={() => setAddModalOpen(false)} onSubmit={onAdd} />}
    </div>
  )
}
