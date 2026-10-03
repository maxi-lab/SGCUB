import { useEffect, useRef } from 'react'

export default function DocumentacionUploadModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  form, 
  onChange, 
  tipos, 
  isEditing
}) {
  const fileInputRef = useRef(null)

  const handleClearFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onChange({ target: { name: 'archivo', type: 'file', files: [] } })
  }

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = 'auto' }
    }
  }, [isOpen])

  if (!isOpen) return null;

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
      <div className="bg-surface-container-lowest rounded-xl max-w-md w-full p-space-lg shadow-xl flex flex-col gap-space-md max-h-[90vh] overflow-y-auto">
        <h3 className="font-headline-sm text-headline-sm text-on-surface">{isEditing ? 'Editar documentación' : 'Cargar nueva documentación'}</h3>
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-label-sm text-outline uppercase mb-1">Tipo de Documento</label>
            <select required name="tipo_documento" value={form.tipo_documento} onChange={onChange} className="w-full h-10 px-3 rounded-lg bg-surface-container-low border-none cursor-pointer focus:ring-2 focus:ring-primary-container outline-none">
              <option value="">Seleccione...</option>
              {tipos.map(t => (
                <option key={t.id_tipo_documento} value={t.id_tipo_documento}>{t.nombre}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-label-sm text-outline uppercase mb-1">Fecha Emisión</label>
              <input type="date" name="fecha_emision" value={form.fecha_emision} onChange={onChange} className="w-full h-10 px-3 rounded-lg bg-surface-container-low border-none cursor-pointer focus:ring-2 focus:ring-primary-container outline-none" />
            </div>
            <div>
              <label className="block text-label-sm text-outline uppercase mb-1">Fecha Vencimiento</label>
              <input type="date" name="fecha_vencimiento" value={form.fecha_vencimiento} onChange={onChange} className="w-full h-10 px-3 rounded-lg bg-surface-container-low border-none cursor-pointer focus:ring-2 focus:ring-primary-container outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-label-sm text-outline uppercase mb-1">Archivo PDF (Opcional)</label>
            <div className="relative w-full flex items-center gap-2">
              <input 
                type="file" 
                name="archivo" 
                accept=".pdf"
                onChange={onChange}
                ref={fileInputRef}
                className="block w-full text-sm text-on-surface-variant file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-container file:text-on-primary-container hover:file:bg-primary hover:file:text-on-primary file:cursor-pointer file:transition-colors cursor-pointer bg-surface-container-low rounded-lg p-2"
              />
              {form.archivo && (
                <button 
                  type="button" 
                  onClick={handleClearFile}
                  className="w-10 h-10 shrink-0 rounded-lg bg-surface-container-high hover:bg-error-container text-on-surface-variant hover:text-error flex items-center justify-center transition-colors cursor-pointer"
                  title="Quitar archivo seleccionado"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              )}
            </div>
            {isEditing && form.archivoUrl_existing && !form.archivo && (
              <label className="flex items-center gap-2 mt-2 text-label-md cursor-pointer">
                <input 
                  type="checkbox" 
                  name="borrar_archivo" 
                  checked={form.borrar_archivo} 
                  onChange={onChange} 
                  className="w-4 h-4 rounded border-outline text-primary focus:ring-primary-container"
                />
                <span className="text-on-surface-variant">Eliminar archivo cargado actualmente</span>
              </label>
            )}
          </div>
          <div className="flex items-center justify-end gap-space-sm mt-4">
            <button type="button" onClick={onClose} className="px-space-md h-10 rounded-lg bg-surface-container text-on-surface font-title-md hover:bg-surface-container-high transition-colors cursor-pointer">Cancelar</button>
            <button type="submit" className="px-space-md h-10 rounded-lg bg-primary text-on-primary font-title-md hover:bg-primary/90 transition-colors cursor-pointer">{isEditing ? 'Guardar Cambios' : 'Cargar Documento'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
