import DataTable from '../shared/DataTable'
import TableMessageRow from '../shared/TableMessageRow'
import { formatAmount, formatDate } from '../personas/format'

const COLUMN_COUNT = 4

function ComprobantesTable({ comprobantes = [], isLoading, error, onSelect }) {
  const handleKeyDown = (event, comprobante) => {
    if (event.key === 'Enter' || event.key === ' ') onSelect?.(comprobante)
  }

  return (
    <section className="bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-sm overflow-hidden" aria-labelledby="comprobantes-title">
      <div className="p-5 border-b border-outline-variant/20 flex items-center justify-between gap-3">
        <div>
          <h2 id="comprobantes-title" className="text-xl font-bold text-on-surface">Comprobantes de pago</h2>
          <p className="text-sm text-on-surface-variant">Historial completo de comprobantes emitidos.</p>
        </div>
        <span className="material-symbols-outlined text-primary text-2xl">receipt_long</span>
      </div>
      <DataTable
        tableClassName="min-w-[620px]"
        headers={(
          <>
            <th className="py-3 px-4" scope="col">Número</th>
            <th className="py-3 px-4" scope="col">Fecha</th>
            <th className="py-3 px-4" scope="col">Pago asociado</th>
            <th className="py-3 px-4 text-right" scope="col">Monto total</th>
          </>
        )}
      >
        <TableMessageRow
          colSpan={COLUMN_COUNT}
          isLoading={isLoading}
          isEmpty={Boolean(error) || comprobantes.length === 0}
          error={error}
          loadingText="Cargando comprobantes..."
          errorText="No se pudieron cargar los comprobantes."
          emptyText="Todavía no hay comprobantes registrados."
        />

        {!isLoading && !error && comprobantes.map((comprobante) => (
          <tr
            key={comprobante.comprobante_id}
            onClick={() => onSelect?.(comprobante)}
            onKeyDown={(event) => handleKeyDown(event, comprobante)}
            tabIndex={0}
            role="button"
            className="hover:bg-surface-container-low focus:bg-surface-container-low focus:outline-none transition-colors cursor-pointer"
          >
            <td className="py-3.5 px-4 font-semibold text-primary">
              #{comprobante.numero}
              {comprobante.estado === 'Anulado' && (
                <span className="ml-2 inline-flex px-2 py-0.5 rounded-full text-xs font-semibold bg-error-container text-on-error-container">Anulado</span>
              )}
            </td>
            <td className="py-3.5 px-4 text-on-surface-variant">{formatDate(comprobante.fecha_emision)}</td>
            <td className="py-3.5 px-4 text-on-surface-variant">Pago #{comprobante.pago}</td>
            <td className="py-3.5 px-4 text-right font-semibold text-on-surface">{formatAmount(comprobante.monto_total)}</td>
          </tr>
        ))}
      </DataTable>
    </section>
  )
}

export default ComprobantesTable
