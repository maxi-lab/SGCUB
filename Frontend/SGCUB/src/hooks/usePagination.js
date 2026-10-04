import { useMemo, useState } from 'react'

// Client-side pagination. `paginationProps` plugs straight into <TablePagination />.
function usePagination(rows, initialRowsPerPage = 25) {
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(initialRowsPerPage)

  const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * rowsPerPage
  const visibleRows = useMemo(() => rows.slice(start, start + rowsPerPage), [rows, start, rowsPerPage])

  const resetPage = () => setPage(1)
  // Wraps a setter so that changing a filter or the sort goes back to the first page.
  const withPageReset = (setter) => (value) => {
    setter(value)
    setPage(1)
  }

  return {
    visibleRows,
    start,
    resetPage,
    withPageReset,
    paginationProps: {
      page: currentPage,
      totalPages,
      rowsPerPage,
      onPageChange: setPage,
      onRowsPerPageChange: withPageReset(setRowsPerPage),
    },
  }
}

export default usePagination
