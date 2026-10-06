export default function HistorialModal({ isOpen, onClose, historial }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-on-surface/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl max-w-3xl w-full p-6 shadow-xl flex flex-col gap-4 max-h-[85vh] overflow-hidden">
        {/* Encabezado */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-container text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-[24px]">history</span>
            </div>
            <div className="flex flex-col">
              <h3 className="text-lg font-bold text-on-surface">
                Historial de Envíos Institucionales
              </h3>
              <p className="text-xs text-on-surface-variant">
                Registro de comunicaciones despachadas por canales oficiales de SCUB.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Lista */}
        <div className="overflow-y-auto flex-1 pr-1 border border-outline-variant/30 rounded-lg">
          {historial.length === 0 ? (
            <p className="p-6 text-center text-sm text-on-surface-variant">
              No hay envíos registrados todavía.
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-outline-variant/20">
              {historial.map((item) => (
                <div
                  key={item.id}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-container-low transition-colors"
                >
                  <div className="flex flex-col max-w-md">
                    <span className="font-semibold text-sm text-on-surface">
                      {item.asunto}
                    </span>
                    <span className="text-xs text-on-surface-variant mt-0.5">
                      Alcance: {item.alcance} • Canales: {item.canales} • Fecha:{' '}
                      {new Date(item.fecha).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 self-start sm:self-auto">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-bold text-primary">
                        {item.destinatarios_count}
                      </span>
                      <span className="text-[11px] text-on-surface-variant">
                        contactos
                      </span>
                    </div>
                    <span className="bg-primary/10 text-primary border border-primary/20 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                      {item.estado}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pie */}
        <div className="flex items-center justify-end pt-2 border-t border-outline-variant/20">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center px-4 py-2 rounded-lg border border-outline-variant/40 bg-surface-container-lowest text-on-surface hover:bg-surface-container-low text-sm font-medium transition-colors cursor-pointer"
          >
            Cerrar historial
          </button>
        </div>
      </div>
    </div>
  )
}
