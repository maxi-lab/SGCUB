// Pie de tabla con filas por página y botones de página (mismo diseño que SociosTable)

const ROWS_PER_PAGE_OPTIONS = [25, 50, 100]

const visiblePages = (currentPage, totalPages) => {
  if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const pages = new Set([1, totalPages, currentPage, currentPage - 1, currentPage + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)
  const result = []
  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) result.push('...')
    result.push(page)
  })
  return result
}

const navButtonClass = 'w-8 h-8 flex items-center justify-center rounded border border-outline-variant/30 text-on-surface-variant hover:bg-surface-container-low transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer'

export default function TablePagination({ page, totalPages, rowsPerPage, onPageChange, onRowsPerPageChange, id = 'rows-per-page' }) {
  return (
    <div className="p-4 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-base text-on-surface-variant">
      <div className="flex items-center gap-2">
        <label className="font-label-md" htmlFor={id}>Filas por página:</label>
        <select
          className="h-8 px-2 bg-surface-container-low border border-outline-variant/40 rounded text-on-surface font-body-sm text-base focus:outline-none focus:border-primary cursor-pointer"
          id={id}
          value={rowsPerPage}
          onChange={(event) => onRowsPerPageChange(Number(event.target.value))}
        >
          {ROWS_PER_PAGE_OPTIONS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        <span className="ml-2">Página {page} de {totalPages}</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          title="Página anterior"
          aria-label="Página anterior"
          disabled={page === 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
          className={navButtonClass}
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chevron_left</span>
        </button>

        {visiblePages(page, totalPages).map((item, index) =>
          item === '...' ? (
            <span key={`sep-${index}`} className="px-1 text-outline">...</span>
          ) : (
            <button
              key={item}
              type="button"
              onClick={() => onPageChange(item)}
              aria-current={item === page ? 'page' : undefined}
              className={item === page
                ? `${navButtonClass} bg-surface-container-low`
                : 'w-8 h-8 flex items-center justify-center rounded border border-outline-variant/30 text-on-surface hover:bg-surface-container-low font-label-md transition-colors cursor-pointer'}
            >
              {item}
            </button>
          ),
        )}

        <button
          type="button"
          title="Página siguiente"
          aria-label="Página siguiente"
          disabled={page === totalPages}
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          className={navButtonClass}
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">chevron_right</span>
        </button>
      </div>
    </div>
  )
}
