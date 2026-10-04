import { useState } from 'react'
import { EmptyState, PrimaryButton, SecondaryButton, TabHeader } from './parts'
import useDocumentacion from '../../../hooks/useDocumentacion'
import DocumentacionUploadModal from '../../documental/DocumentacionUploadModal'
import DocumentacionDeleteModal from '../../documental/DocumentacionDeleteModal'
import PersonaDocumentsTable from '../../documental/PersonaDocumentsTable'

const EMPTY_UPLOAD_FORM = {
  tipo_documento: '',
  archivo: null,
  archivoUrl_existing: null,
  borrar_archivo: false,
  fecha_emision: '',
  fecha_vencimiento: '',
}

const SAVE_ERROR_MESSAGE = 'No se pudo guardar el documento.'

const getSaveErrorMessage = (requestError) => {
  const data = requestError.response?.data
  if (!data) return requestError.response ? SAVE_ERROR_MESSAGE : 'No se pudo conectar con el servidor.'
  if (typeof data === 'string') return SAVE_ERROR_MESSAGE
  if (data.detail) return data.detail
  return Object.values(data).flat().join(' ') || SAVE_ERROR_MESSAGE
}

export default function DocumentationTab({ personaId, personaType, personaInfo }) {
  const {
    tipos,
    isLoading: loading,
    subirDocumento,
    actualizarDocumento,
    borrarDocumento,
    getNombreTipo,
    documentosActivos,
    documentosHistoricos
  } = useDocumentacion(personaId)


  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [docToDelete, setDocToDelete] = useState(null)
  
  const [isEditing, setIsEditing] = useState(false)
  const [docToEdit, setDocToEdit] = useState(null)

  const [uploadForm, setUploadForm] = useState(EMPTY_UPLOAD_FORM)
  const [saveError, setSaveError] = useState(null)

  const tiposFiltrados = tipos.filter(t => {
    const isDocenteType = ['Antecedentes Penales', 'CV', 'DNI'].includes(t.nombre)
    if (personaType === 'docente') {
      return isDocenteType
    }
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
      archivo: null,
      archivoUrl_existing: doc.archivoUrl || null,
      borrar_archivo: false,
      fecha_emision: doc.fecha_emision ? doc.fecha_emision.split('T')[0] : '',
      fecha_vencimiento: doc.fecha_vencimiento ? doc.fecha_vencimiento.split('T')[0] : '',
    })
    setSaveError(null)
    setUploadModalOpen(true)
  }

  const handleNewClick = () => {
    setIsEditing(false)
    setDocToEdit(null)
    setUploadForm(EMPTY_UPLOAD_FORM)
    setSaveError(null)
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
    setSaveError(null)
    try {
      const formData = new FormData();
      formData.append('persona', personaId);
      formData.append('tipo_documento', uploadForm.tipo_documento);
      
      const appendDate = (field) => {
        if (uploadForm[field]) formData.append(field, `${uploadForm[field]}T00:00:00`);
        else if (isEditing) formData.append(field, '');
      }
      appendDate('fecha_emision');
      appendDate('fecha_vencimiento');
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
      setUploadForm(EMPTY_UPLOAD_FORM)
      setIsEditing(false)
      setDocToEdit(null)
    } catch (error) {
      console.error('Error uploading document:', error)
      setSaveError(getSaveErrorMessage(error))
    }
  }

  const handleDownloadZip = async () => {
    try {
      const { downloadZip } = await import('../../../api/documentacion');
      const blob = await downloadZip(personaId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = personaInfo?.dni ? `${personaInfo.dni}-${personaInfo.nombre}_${personaInfo.apellido}.zip`.replace(/\s+/g, '_') : `documentos_${personaId}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error descargando ZIP:", err);
      alert("Error al descargar el ZIP. Verifica que el usuario tenga documentos.");
    }
  }

  if (loading) return <div className="text-base text-on-surface-variant">Cargando documentación...</div>

  return (
    <div className="flex flex-col gap-6">
      <TabHeader
        title="Documentación Requerida"
        description="Control de habilitaciones institucionales, certificados médicos laborales y títulos habilitantes reglamentarios."
        actions={(
          <>
            <SecondaryButton icon="folder_zip" onClick={handleDownloadZip}>Descargar ZIP</SecondaryButton>
            <PrimaryButton icon="upload_file" onClick={handleNewClick}>Cargar documento</PrimaryButton>
          </>
        )}
      />

      {documentosActivos.length === 0 ? (
        <EmptyState
          icon="folder_off"
          title="Sin documentos cargados"
          description="Todavía no hay documentación cargada para esta persona."
        />
      ) : (
        <PersonaDocumentsTable
          documents={documentosActivos}
          getTypeName={getNombreTipo}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
      )}

      {documentosHistoricos.length > 0 && (
        <PersonaDocumentsTable
          title="Historial de Documentación"
          documents={documentosHistoricos}
          getTypeName={getNombreTipo}
          onDelete={handleDeleteClick}
          isHistory
        />
      )}

      <DocumentacionUploadModal 
        isOpen={uploadModalOpen} 
        onClose={() => setUploadModalOpen(false)} 
        onSubmit={handleUploadSubmit} 
        form={uploadForm} 
        onChange={handleUploadChange} 
        tipos={tiposFiltrados} 
        isEditing={isEditing}
        error={saveError}
      />

      <DocumentacionDeleteModal 
        isOpen={deleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)} 
        onConfirm={confirmDelete} 
        document={docToDelete} 
        typeName={docToDelete ? getNombreTipo(docToDelete.tipo_documento) : ''}
      />
    </div>
  )
}
