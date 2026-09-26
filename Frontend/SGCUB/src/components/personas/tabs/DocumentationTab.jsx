//DEBE REVISARSE AL REALIZAR TODA LA LOGICA DE DOCUMENTACION, SOLO ES PARA PODER MOSTRAR ALGO EN EL LEGAJO


import { formatDate } from '../format'
import { PrimaryButton, SecondaryButton, TabHeader, EmptyState, KPI } from './parts'

const DIAS_AVISO_VENCIMIENTO = 30

const getDocumentStatus = (vencimiento) => {
  if (!vencimiento) return 'vigente'
  const dias = (new Date(`${vencimiento}T00:00:00`) - new Date()) / 86400000
  if (dias < 0) return 'vencido'
  return dias <= DIAS_AVISO_VENCIMIENTO ? 'por_vencer' : 'vigente'
}

const ETIQUETA_ESTADO = {
  vigente: { label: 'Vigente', clase: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  por_vencer: { label: 'Por vencer', clase: 'bg-amber-50 text-amber-700 border-amber-200' },
  vencido: { label: 'Vencido', clase: 'bg-error-container text-on-error-container border-error/20' },
}

export default function DocumentationTab({ documents = [], onUpload, onDownload }) {
  const documentsWithStatus = documents.map((document) => ({ ...document, status: getDocumentStatus(document.vencimiento) }))
  const countByStatus = (status) => documentsWithStatus.filter((document) => document.status === status).length

  return (
    <div className="flex flex-col gap-6">
      <TabHeader
        title="Documentación del jugador"
        description="Control de legajo documental, aptos físicos, fichas federativas y vencimientos"
        actions={(
          <>
            <SecondaryButton icon="folder_zip" onClick={onDownload} disabled={!onDownload || documents.length === 0}>
              Descargar legajo (ZIP)
            </SecondaryButton>
            <PrimaryButton icon="upload_file" onClick={onUpload} disabled={!onUpload}>
              Cargar documento
            </PrimaryButton>
          </>
        )}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI label="Total documentos" value={documents.length} icon="description" />
        <KPI label="Vigentes" value={countByStatus('vigente')} icon="verified" tone="ok" />
        <KPI label="Por vencer" value={countByStatus('por_vencer')} icon="schedule" tone="alert" />
        <KPI label="Vencidos" value={countByStatus('vencido')} icon="error" tone="error" />
      </div>

      {documentsWithStatus.length === 0 ? (
        <EmptyState
          icono="folder_off"
          titulo="Sin documentos cargados"
          descripcion="La carga de documentación (aptos médicos, fichas federativas, autorizaciones) todavía no está disponible en el sistema."
        />
      ) : (
        <div className="overflow-x-auto border border-outline-variant/30 rounded-xl bg-surface-container-lowest shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/70 border-b border-outline-variant/30 text-on-surface-variant text-sm uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Documento</th>
                <th className="py-3 px-4 font-semibold">Tipo</th>
                <th className="py-3 px-4 font-semibold">Vencimiento</th>
                <th className="py-3 px-4 font-semibold text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-base">
              {documentsWithStatus.map((document, index) => (
                <tr key={document.id ?? index} className="hover:bg-surface-container-low transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-on-surface">
                    <span className="inline-flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px] text-primary">description</span>
                      {document.nombre}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-on-surface-variant">{document.tipo || '—'}</td>
                  <td className="py-3.5 px-4 text-on-surface-variant">{document.vencimiento ? formatDate(document.vencimiento) : 'Sin vencimiento'}</td>
                  <td className="py-3.5 px-4 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold border ${ETIQUETA_ESTADO[document.status].clase}`}>
                      {ETIQUETA_ESTADO[document.status].label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
