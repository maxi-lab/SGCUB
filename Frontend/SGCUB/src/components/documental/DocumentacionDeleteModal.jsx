import { useEffect } from 'react'

export default function DocumentacionDeleteModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  document 
}) {
  useEffect(() => {
    if (isOpen) {
      window.document.body.style.overflow = 'hidden'
      return () => { window.document.body.style.overflow = 'auto' }
    }
  }, [isOpen])

  if (!isOpen || !document) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }

  return (
    <div 
      className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-sm flex items-center justify-center p-space-md"
      onClick={handleBackdropClick}
    >
      <div className="bg-surface-container-lowest rounded-xl max-w-md w-full p-space-lg shadow-xl flex flex-col gap-space-md">
        <div className="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[28px]">warning</span>
        </div>
        <div>
          <h3 className="font-headline-sm text-headline-sm text-on-surface">¿Eliminar {document.nombre}?</h3>
          <p className="font-body-md text-body-md text-on-surface-variant mt-space-xs">
            Esta acción dará de baja el documento del legajo digital y no se puede deshacer.
          </p>
        </div>
        <div className="flex items-center justify-end gap-space-sm mt-space-xs">
          <button onClick={onClose} className="px-space-md h-10 rounded-lg bg-surface-container text-on-surface font-title-md hover:bg-surface-container-high transition-colors cursor-pointer" type="button">
            Cancelar
          </button>
          <button onClick={onConfirm} className="px-space-md h-10 rounded-lg bg-error text-on-error font-title-md hover:opacity-90 transition-opacity cursor-pointer" type="button">
            Confirmar baja
          </button>
        </div>
      </div>
    </div>
  )
}
