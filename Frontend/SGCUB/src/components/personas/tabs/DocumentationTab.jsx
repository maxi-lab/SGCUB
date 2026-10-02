import { useState, useEffect } from 'react'
import { formatDate } from '../format'
import { PrimaryButton, SecondaryButton, TabHeader, EmptyState, KPI } from './parts'
import useDocumentacion from '../../../hooks/useDocumentacion'
import DocumentacionUploadModal from '../../documental/DocumentacionUploadModal'
import DocumentacionDeleteModal from '../../documental/DocumentacionDeleteModal'

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

const getMediaUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/';
  const serverUrl = baseUrl.replace(/\/api\/?$/, '');
  return `${serverUrl}${path}`;
}

export default function DocumentationTab({ personaId, personaType }) {
  const {
    documentos: documents,
    tipos,
    estados,
    isLoading: loading,
    subirDocumento,
    actualizarDocumento,
    borrarDocumento,
    getNombreTipo
  } = useDocumentacion(personaId)

  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [docToDelete, setDocToDelete] = useState(null)
  
  const [isEditing, setIsEditing] = useState(false)
  const [docToEdit, setDocToEdit] = useState(null)

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    tipo_documento: '',
    estado_documento: '',
    nombre: '',
    archivo: null,
    archivoUrl_existing: null,
    borrar_archivo: false,
    fecha_emision: '',
    fecha_vencimiento: '',
  })

  // Filter tipos
  const tiposFiltrados = tipos.filter(t => {
    const isDocenteType = ['Antecedentes Penales', 'CV', 'DNI'].includes(t.nombre)
    if (personaType === 'docente') {
      return isDocenteType
    }
    // Jugadores ven el resto
    return !['Antecedentes Penales', 'CV'].includes(t.nombre)
  })

  const handleDeleteClick = (doc) => {
    setDocToDelete(doc)
    setDeleteModalOpen(true)
  }

  const handleEditClick = (doc) => {
    setIsEditing(true)
    setDocToEdit(doc)
    setUploadForm({
      tipo_documento: doc.tipo_documento || '',
      estado_documento: doc.estado_documento || '',
      nombre: doc.nombre || '',
      archivo: null,
      archivoUrl_existing: doc.archivoUrl || null,
      borrar_archivo: false,
      fecha_emision: doc.fecha_emision ? doc.fecha_emision.split('T')[0] : '',
      fecha_vencimiento: doc.fecha_vencimiento ? doc.fecha_vencimiento.split('T')[0] : '',
    })
    setUploadModalOpen(true)
  }

  const handleNewClick = () => {
    setIsEditing(false)
    setDocToEdit(null)
    setUploadForm({
      tipo_documento: '',
      estado_documento: '',
      nombre: '',
      archivo: null,
      archivoUrl_existing: null,
      borrar_archivo: false,
      fecha_emision: '',
      fecha_vencimiento: '',
    })
    setUploadModalOpen(true)
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
    const { name, value, type, files, checked } = e.target
    if (type === 'file') {
      setUploadForm(prev => ({ ...prev, archivo: files.length > 0 ? files[0] : null }))
    } else if (type === 'checkbox') {
      setUploadForm(prev => ({ ...prev, [name]: checked }))
    } else {
      setUploadForm(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleUploadSubmit = async (e) => {
    e.preventDefault()
    try {
      const formData = new FormData();
      formData.append('persona', personaId);
      formData.append('nombre', uploadForm.nombre);
      formData.append('tipo_documento', uploadForm.tipo_documento);
      formData.append('estado_documento', uploadForm.estado_documento);
      
      if (uploadForm.fecha_emision) {
        formData.append('fecha_emision', new Date(uploadForm.fecha_emision).toISOString());
      }
      if (uploadForm.fecha_vencimiento) {
        formData.append('fecha_vencimiento', new Date(uploadForm.fecha_vencimiento).toISOString());
      }
      if (uploadForm.archivo) {
        formData.append('archivoUrl', uploadForm.archivo);
      } else if (isEditing && uploadForm.borrar_archivo) {
        formData.append('archivoUrl', '');
      }
      
      if (isEditing) {
        await actualizarDocumento(docToEdit.id_documento, formData)
      } else {
        await subirDocumento(formData)
      }
      setUploadModalOpen(false)
      setUploadForm({
        tipo_documento: '', estado_documento: '', nombre: '', archivo: null, archivoUrl_existing: null, borrar_archivo: false, fecha_emision: '', fecha_vencimiento: ''
      })
      setIsEditing(false)
      setDocToEdit(null)
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
          onClick={handleNewClick}
          className="inline-flex items-center gap-space-xs px-space-md h-10 rounded-lg bg-primary text-on-primary hover:bg-primary/90 font-title-md text-title-md transition-colors shadow-sm shrink-0 cursor-pointer" 
          type="button">
          <span className="material-symbols-outlined text-[20px]">upload_file</span>
          <span className="">+ Cargar nuevo documento</span>
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
                        <span className={`inline-flex items-center gap-1.5 px-space-sm py-0.5 rounded-full font-label-sm text-label-sm font-medium ${ETIQUETA_ESTADO[document.status]?.clase}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${ETIQUETA_ESTADO[document.status]?.dot}`}></span>
                          {ETIQUETA_ESTADO[document.status]?.label || 'Desconocido'}
                        </span>
                      </td>
                      <td className="py-space-md px-space-lg text-right">
                        <div className="inline-flex items-center justify-end gap-space-xs">
                          {document.archivoUrl && (
                            <a href={getMediaUrl(document.archivoUrl)} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors inline-flex items-center gap-1 font-label-md text-label-md cursor-pointer" title="Descargar PDF">
                              <span className="material-symbols-outlined text-[18px]">download</span>
                              <span className="hidden xl:inline">Descargar</span>
                            </a>
                          )}
                          <button onClick={() => handleEditClick(document)} className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors inline-flex items-center gap-1 font-label-md text-label-md cursor-pointer" title="Editar" type="button">
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                            <span className="hidden xl:inline">Editar</span>
                          </button>
                          <button onClick={() => handleDeleteClick(document)} className="p-2 rounded-lg text-on-surface-variant hover:bg-error-container hover:text-error transition-colors inline-flex items-center gap-1 font-label-md text-label-md cursor-pointer" title="Eliminar archivo" type="button">
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

      <DocumentacionUploadModal 
        isOpen={uploadModalOpen} 
        onClose={() => setUploadModalOpen(false)} 
        onSubmit={handleUploadSubmit} 
        form={uploadForm} 
        onChange={handleUploadChange} 
        tipos={tiposFiltrados} 
        estados={estados} 
        isEditing={isEditing}
      />

      <DocumentacionDeleteModal 
        isOpen={deleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)} 
        onConfirm={confirmDelete} 
        document={docToDelete} 
      />
    </div>
  )
}
