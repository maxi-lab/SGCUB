import { useState, useEffect } from 'react'
import { formatDate } from '../format'
import { PrimaryButton, SecondaryButton, TabHeader, EmptyState, KPI } from './parts'
import useDocumentacion from '../../../hooks/useDocumentacion'

const DIAS_AVISO_VENCIMIENTO = 30

const getDocumentStatus = (vencimiento) => {
  if (!vencimiento) return 'vigente'
  const dias = (new Date(`${vencimiento}T00:00:00`) - new Date()) / 86400000
  if (dias < 0) return 'vencido'
  return dias <= DIAS_AVISO_VENCIMIENTO ? 'por_vencer' : 'vigente'
}

const ETIQUETA_ESTADO = {
  vigente: { label: 'Vigente / Aprobado', clase: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-600' },
  por_vencer: { label: 'Por vencer', clase: 'bg-amber-100 text-amber-800', dot: 'bg-amber-600' },
  vencido: { label: 'Vencido', clase: 'bg-error-container text-error', dot: 'bg-error' },
}

export default function DocumentationTab({ personaId }) {
  const {
    documentos: documents,
    tipos,
    estados,
    isLoading: loading,
    subirDocumento,
    borrarDocumento,
    getNombreTipo
  } = useDocumentacion(personaId)

  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [docToDelete, setDocToDelete] = useState(null)
  
  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    tipo_documento: '',
    estado_documento: '',
    nombre: '',
    archivoUrl: '',
    fecha_emision: '',
    fecha_recepcion: '',
    fecha_vencimiento: '',
    requiere_firma: false
  })

  // Set default values when tipos/estados load
  useEffect(() => {
    if (tipos.length > 0 && !uploadForm.tipo_documento) {
      setUploadForm(prev => ({ ...prev, tipo_documento: tipos[0].id_tipo_documento }))
    }
    if (estados.length > 0 && !uploadForm.estado_documento) {
      setUploadForm(prev => ({ ...prev, estado_documento: estados[0].id_estado_documento }))
    }
  }, [tipos, estados])

  const handleDeleteClick = (doc) => {
    setDocToDelete(doc)
    setDeleteModalOpen(true)
  }

  const confirmDelete = async () => {
    if (!docToDelete) return
    try {
      await borrarDocumento(docToDelete.id_documento)
      setDeleteModalOpen(false)
      setDocToDelete(null)
    } catch (error) {
      console.error('Error deleting document:', error)
    }
  }

  const handleUploadChange = (e) => {
    const { name, value, type, checked } = e.target
    setUploadForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleUploadSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...uploadForm,
        persona: personaId,
        archivoUrl: uploadForm.archivoUrl || 'http://dummy.url/doc.pdf',
        fecha_emision: uploadForm.fecha_emision ? new Date(uploadForm.fecha_emision).toISOString() : null,
        fecha_recepcion: uploadForm.fecha_recepcion ? new Date(uploadForm.fecha_recepcion).toISOString() : null,
        fecha_vencimiento: uploadForm.fecha_vencimiento ? new Date(uploadForm.fecha_vencimiento).toISOString() : null,
      }
      await subirDocumento(payload)
      setUploadModalOpen(false)
      // Reset form (keeping defaults if needed)
      setUploadForm(prev => ({
        ...prev, nombre: '', archivoUrl: '', fecha_emision: '', fecha_recepcion: '', fecha_vencimiento: '', requiere_firma: false
      }))
    } catch (error) {
      console.error('Error uploading document:', error)
    }
  }

  const documentsWithStatus = documents.map((document) => ({ 
    ...document, 
    status: getDocumentStatus(document.fecha_vencimiento?.split('T')[0]) 
  }))

  if (loading) return <div>Cargando documentación...</div>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-space-sm bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">folder_shared</span>
            <h2 className="font-headline-md text-headline-md text-on-surface">Documentación Requerida</h2>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Control de habilitaciones institucionales, certificados médicos laborales y títulos habilitantes reglamentarios.</p>
        </div>
        <button 
          onClick={() => setUploadModalOpen(true)}
          className="inline-flex items-center gap-space-xs px-space-md h-10 rounded-lg bg-primary text-on-primary hover:bg-primary/90 font-title-md text-title-md transition-colors shadow-sm shrink-0" 
          type="button">
          <span className="material-symbols-outlined text-[20px]">upload_file</span>
          <span className="">+ Subir nuevo documento</span>
        </button>
      </div>

      {documentsWithStatus.length === 0 ? (
        <EmptyState
          icono="folder_off"
          titulo="Sin documentos cargados"
          descripcion="La carga de documentación (aptos médicos, fichas federativas, autorizaciones) todavía no está disponible en el sistema."
        />
      ) : (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-surface-container-low text-outline font-label-md text-label-md tracking-wider uppercase border-b border-surface-container">
                  <th className="py-space-md px-space-lg">Documento / Concepto</th>
                  <th className="py-space-md px-space-md">Fecha de Emisión</th>
                  <th className="py-space-md px-space-md">Vencimiento</th>
                  <th className="py-space-md px-space-md text-center">Estado</th>
                  <th className="py-space-md px-space-lg text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-container">
                {documentsWithStatus.map((document, index) => {
                  const tipoNombre = getNombreTipo(document.tipo_documento)
                  return (
                    <tr key={document.id_documento ?? index} className="hover:bg-surface-bright transition-colors">
                      <td className="py-space-md px-space-lg">
                        <div className="flex items-center gap-space-sm">
                          <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary shrink-0">
                            <span className="material-symbols-outlined text-[22px]">policy</span>
                          </div>
                          <div>
                            <p className="font-title-md text-title-md text-on-surface">{document.nombre}</p>
                            <p className="font-body-sm text-body-sm text-outline">{tipoNombre}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-space-md px-space-md font-body-md text-body-md text-on-surface">
                        {document.fecha_emision ? formatDate(document.fecha_emision.split('T')[0]) : '—'}
                      </td>
                      <td className="py-space-md px-space-md font-body-md text-body-md text-on-surface">
                        <div className="flex flex-col">
                          <span className="">{document.fecha_vencimiento ? formatDate(document.fecha_vencimiento.split('T')[0]) : 'Sin vencimiento'}</span>
                        </div>
                      </td>
                      <td className="py-space-md px-space-md text-center">
                        <span className={`inline-flex items-center gap-1.5 px-space-sm py-0.5 rounded-full font-label-sm text-label-sm font-medium ${ETIQUETA_ESTADO[document.status].clase}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${ETIQUETA_ESTADO[document.status].dot}`}></span>
                          {ETIQUETA_ESTADO[document.status].label}
                        </span>
                      </td>
                      <td className="py-space-md px-space-lg text-right">
                        <div className="inline-flex items-center justify-end gap-space-xs">
                          <button className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors inline-flex items-center gap-1 font-label-md text-label-md" title="Descargar PDF" type="button">
                            <span className="material-symbols-outlined text-[18px]">download</span>
                            <span className="hidden xl:inline">Descargar</span>
                          </button>
                          <button onClick={() => handleDeleteClick(document)} className="p-2 rounded-lg text-on-surface-variant hover:bg-error-container hover:text-error transition-colors inline-flex items-center gap-1 font-label-md text-label-md" title="Eliminar archivo" type="button">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                            <span className="hidden xl:inline">Eliminar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {uploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-xs flex items-center justify-center p-space-md">
          <div className="bg-surface-container-lowest rounded-xl max-w-md w-full p-space-lg shadow-xl flex flex-col gap-space-md">
            <h3 className="font-headline-sm text-headline-sm text-on-surface">Cargar nueva documentación</h3>
            <form onSubmit={handleUploadSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-label-sm text-outline uppercase mb-1">Nombre del Documento</label>
                <input required type="text" name="nombre" value={uploadForm.nombre} onChange={handleUploadChange} className="w-full h-10 px-3 rounded-lg bg-surface-container-low border-none" />
              </div>
              <div>
                <label className="block text-label-sm text-outline uppercase mb-1">Tipo de Documento</label>
                <select required name="tipo_documento" value={uploadForm.tipo_documento} onChange={handleUploadChange} className="w-full h-10 px-3 rounded-lg bg-surface-container-low border-none">
                  <option value="">Seleccione...</option>
                  {tipos.map(t => (
                    <option key={t.id_tipo_documento} value={t.id_tipo_documento}>{t.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-label-sm text-outline uppercase mb-1">Estado</label>
                <select required name="estado_documento" value={uploadForm.estado_documento} onChange={handleUploadChange} className="w-full h-10 px-3 rounded-lg bg-surface-container-low border-none">
                  <option value="">Seleccione...</option>
                  {estados.map(e => (
                    <option key={e.id_estado_documento} value={e.id_estado_documento}>{e.nombre}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-label-sm text-outline uppercase mb-1">Fecha Emisión</label>
                  <input required type="date" name="fecha_emision" value={uploadForm.fecha_emision} onChange={handleUploadChange} className="w-full h-10 px-3 rounded-lg bg-surface-container-low border-none" />
                </div>
                <div>
                  <label className="block text-label-sm text-outline uppercase mb-1">Fecha Vencimiento</label>
                  <input required type="date" name="fecha_vencimiento" value={uploadForm.fecha_vencimiento} onChange={handleUploadChange} className="w-full h-10 px-3 rounded-lg bg-surface-container-low border-none" />
                </div>
              </div>
              <div>
                <label className="block text-label-sm text-outline uppercase mb-1">Archivo PDF</label>
                <input type="file" accept=".pdf" className="w-full" />
              </div>
              <div className="flex items-center justify-end gap-space-sm mt-4">
                <button type="button" onClick={() => setUploadModalOpen(false)} className="px-space-md h-10 rounded-lg bg-surface-container text-on-surface font-title-md hover:bg-surface-container-high transition-colors">Cancelar</button>
                <button type="submit" className="px-space-md h-10 rounded-lg bg-primary text-on-primary font-title-md hover:bg-primary/90 transition-colors">Subir Archivo</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && docToDelete && (
        <div className="fixed inset-0 z-50 bg-inverse-surface/40 backdrop-blur-xs flex items-center justify-center p-space-md">
          <div className="bg-surface-container-lowest rounded-xl max-w-md w-full p-space-lg shadow-xl flex flex-col gap-space-md">
            <div className="w-12 h-12 rounded-full bg-error-container text-error flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[28px]">warning</span>
            </div>
            <div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface">¿Eliminar {docToDelete.nombre}?</h3>
              <p className="font-body-md text-body-md text-on-surface-variant mt-space-xs">
                Esta acción dará de baja el documento del legajo digital y no se puede deshacer.
              </p>
            </div>
            <div className="flex items-center justify-end gap-space-sm mt-space-xs">
              <button onClick={() => setDeleteModalOpen(false)} className="px-space-md h-10 rounded-lg bg-surface-container text-on-surface font-title-md hover:bg-surface-container-high transition-colors" type="button">
                Cancelar
              </button>
              <button onClick={confirmDelete} className="px-space-md h-10 rounded-lg bg-error text-on-error font-title-md hover:opacity-90 transition-opacity" type="button">
                Confirmar baja
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
