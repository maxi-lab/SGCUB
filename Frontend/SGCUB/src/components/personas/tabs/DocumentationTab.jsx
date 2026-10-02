import React from 'react'
import { useState, useEffect } from 'react'
import { formatDate } from '../format'
import { PrimaryButton, SecondaryButton, TabHeader, EmptyState, KPI } from './parts'
import useDocumentacion from '../../../hooks/useDocumentacion'
import DocumentacionUploadModal from '../../documental/DocumentacionUploadModal'
import DocumentacionDeleteModal from '../../documental/DocumentacionDeleteModal'

const DIAS_AVISO_VENCIMIENTO = 30

const getDocumentStatus = (vencimiento) => {
  if (!vencimiento) return 'vigente'
  const dias = (new Date(`${vencimiento}T23:59:59`) - new Date()) / 86400000
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

export default function DocumentationTab({ personaId, personaType, personaInfo }) {
  const {
    documentos: documents,
    tipos,
    estados,
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
        formData.append('fecha_emision', `${uploadForm.fecha_emision}T00:00:00`);
      }
      if (uploadForm.fecha_vencimiento) {
        formData.append('fecha_vencimiento', `${uploadForm.fecha_vencimiento}T00:00:00`);
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

  const activos = React.useMemo(() => {
    return [...documentosActivos].sort((a, b) => {
      if (!a.fecha_vencimiento && !b.fecha_vencimiento) return 0;
      if (!a.fecha_vencimiento) return 1;
      if (!b.fecha_vencimiento) return -1;
      return new Date(a.fecha_vencimiento) - new Date(b.fecha_vencimiento);
    });
  }, [documentosActivos]);

  const historicos = React.useMemo(() => {
    return [...documentosHistoricos].sort((a, b) => {
      if (!a.fecha_vencimiento && !b.fecha_vencimiento) return 0;
      if (!a.fecha_vencimiento) return 1;
      if (!b.fecha_vencimiento) return -1;
      return new Date(b.fecha_vencimiento) - new Date(a.fecha_vencimiento);
    });
  }, [documentosHistoricos]);

  if (loading) return <div>Cargando documentación...</div>

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-space-md bg-surface-container-lowest p-space-lg rounded-xl shadow-sm">
        <div className="w-full md:w-auto">
          <div className="flex items-center flex-wrap gap-2">
            <span className="material-symbols-outlined text-primary text-[24px]">folder_shared</span>
            <h2 className="font-headline-md text-headline-md text-on-surface">Documentación Requerida</h2>
          </div>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Control de habilitaciones institucionales, certificados médicos laborales y títulos habilitantes reglamentarios.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-space-sm self-stretch md:self-auto md:w-auto">
          <button 
            onClick={async () => {
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
            }}
            className="inline-flex items-center justify-center gap-space-xs px-space-md h-10 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface transition-colors shadow-sm font-label-lg font-semibold shrink-0 cursor-pointer w-full sm:w-max" 
            type="button">
            <span className="material-symbols-outlined text-[20px]">folder_zip</span>
            <span className="">Descargar ZIP</span>
          </button>
          <button 
            onClick={handleNewClick}
            className="inline-flex items-center justify-center gap-space-xs px-space-md h-10 rounded-lg bg-primary text-on-primary hover:bg-primary/90 font-title-md text-title-md transition-colors shadow-sm shrink-0 cursor-pointer w-full sm:w-max" 
            type="button">
            <span className="material-symbols-outlined text-[20px]">upload_file</span>
            <span className="">+ Cargar</span>
          </button>
        </div>
      </div>

      {activos.length === 0 ? (
        <EmptyState
          icono="folder_off"
          titulo="Sin documentos cargados"
          descripcion="Todavía no hay documentación cargada para esta persona."
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
                {activos.map((document, index) => {
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
                            <button 
                              onClick={async () => {
                                const url = getMediaUrl(document.archivoUrl);
                                try {
                                  const response = await fetch(url, { method: 'HEAD' });
                                  if (!response.ok) {
                                    alert("El archivo físico ya no existe o fue eliminado del servidor.");
                                  } else {
                                    window.open(url, '_blank');
                                  }
                                } catch (err) {
                                  alert("El archivo físico ya no existe o fue eliminado del servidor.");
                                }
                              }}
                              className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors inline-flex items-center gap-1 font-label-md text-label-md cursor-pointer" 
                              title="Descargar PDF" 
                              type="button">
                              <span className="material-symbols-outlined text-[18px]">download</span>
                              <span className="hidden xl:inline">Descargar</span>
                            </button>
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

      {historicos.length > 0 && (
        <div className="mt-8 bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container overflow-hidden">
          <div className="bg-surface-container-low px-space-lg py-space-md border-b border-surface-container">
            <h3 className="font-title-md text-title-md text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-on-surface-variant">history</span>
              Historial de Documentación Vencida
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                  <th className="py-space-sm px-space-lg font-semibold w-1/3">Tipo de Documento</th>
                  <th className="py-space-sm px-space-lg font-semibold w-1/4">Fechas</th>
                  <th className="py-space-sm px-space-lg font-semibold text-center w-1/4">Estado</th>
                  <th className="py-space-sm px-space-lg font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="font-body-sm text-body-sm text-on-surface divide-y divide-surface-container">
                {historicos.map((document) => (
                  <tr key={document.id_documento} className="hover:bg-surface-container-low/50 transition-colors opacity-75">
                    <td className="py-space-md px-space-lg">
                      <div className="font-medium text-on-surface">{document.nombre}</div>
                      <div className="font-label-sm text-label-sm text-outline mt-0.5">{getNombreTipo(document.tipo_documento)}</div>
                    </td>
                    <td className="py-space-md px-space-lg">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-on-surface-variant">
                          <span>{formatDate(document.fecha_emision)} - {formatDate(document.fecha_vencimiento)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-space-md px-space-lg text-center">
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs font-semibold bg-surface-container-high text-on-surface-variant">
                        Histórico
                      </span>
                    </td>
                    <td className="py-space-md px-space-lg text-right">
                      <div className="inline-flex items-center justify-end gap-space-xs">
                        {document.archivoUrl && (
                          <button 
                            onClick={async () => {
                              const url = getMediaUrl(document.archivoUrl);
                              try {
                                const response = await fetch(url, { method: 'HEAD' });
                                if (!response.ok) {
                                  alert("El archivo físico ya no existe o fue eliminado del servidor.");
                                } else {
                                  window.open(url, '_blank');
                                }
                              } catch (err) {
                                alert("El archivo físico ya no existe o fue eliminado del servidor.");
                              }
                            }}
                            className="p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors inline-flex items-center gap-1 font-label-md text-label-md cursor-pointer" 
                            title="Descargar PDF" 
                            type="button">
                            <span className="material-symbols-outlined text-[18px]">download</span>
                          </button>
                        )}
                        <button onClick={() => handleDeleteClick(document)} className="p-2 rounded-lg text-on-surface-variant hover:bg-error-container hover:text-error transition-colors inline-flex items-center gap-1 font-label-md text-label-md cursor-pointer" title="Eliminar" type="button">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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
