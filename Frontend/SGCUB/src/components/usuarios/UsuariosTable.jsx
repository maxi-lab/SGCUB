import { useMemo, useState } from 'react'
import FilterSelect from '../shared/FilterSelect'
import SortableHeader from '../shared/SortableHeader'
import TablePagination from '../shared/TablePagination'
import useOrdenTabla from '../../hooks/useOrdenTabla'
import { formatDni, getRoleStyle } from './usuarioFormat'

const filterClass = 'bg-surface-container-low border border-outline-variant/40 rounded text-on-surface font-body-sm text-sm focus:outline-none focus:border-primary cursor-pointer'
const iconButtonClass = 'inline-flex items-center justify-center p-2 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container-low transition-colors cursor-pointer'

const SORT_VALUES = {
  dni: (usuario) => Number(usuario.dni) || null,
  name: (usuario) => `${usuario.first_name ?? ''} ${usuario.last_name ?? ''}`.trim(),
  role: (usuario) => usuario.role,
  status: (usuario) => (usuario.is_active ? 0 : 1),
}
const INITIAL_SORT = { columna: 'name', direccion: 'asc' }
const COLUMN_COUNT = 6

function UsuariosTable({ data, roles, isLoading, error, currentUserId, canEdit, onEdit, onResetPassword, onDeactivate, onActivate }) {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('todos')
  const [status, setStatus] = useState('activo')
  const [rowsPerPage, setRowsPerPage] = useState(25)
  const [page, setPage] = useState(1)

  const usuarios = useMemo(() => data ?? [], [data])

  const filtered = useMemo(() => {
    const text = search.trim().toLowerCase()
    const textDigits = text.replace(/\./g, '')
    return usuarios.filter((usuario) => {
      if (status === 'activo' && !usuario.is_active) return false
      if (status === 'baja' && usuario.is_active) return false
      if (role !== 'todos' && usuario.role !== role) return false
      if (!text) return true
      return [usuario.first_name, usuario.last_name, usuario.full_name, usuario.email]
        .some((field) => String(field ?? '').toLowerCase().includes(text))
        || (textDigits !== '' && usuario.dni.includes(textDigits))
    })
  }, [usuarios, search, status, role])

  const { ordenadas: sorted, orden: sort, ordenarPor: sortBy } = useOrdenTabla(filtered, SORT_VALUES, INITIAL_SORT)

  const withFirstPage = (setter) => (value) => {
    setter(value)
    setPage(1)
  }

  const resetFilters = () => {
    setSearch('')
    setRole('todos')
    setStatus('activo')
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(sorted.length / rowsPerPage))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * rowsPerPage
  const visible = sorted.slice(start, start + rowsPerPage)

  return (
    <div className="min-w-0 bg-surface-container-lowest border border-outline-variant/30 rounded-lg shadow-sm">
      <div className="p-4 border-b border-outline-variant/20 flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3">
        <div className="flex flex-1 min-w-0 flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5">
          <div className="relative w-full sm:w-auto sm:flex-1 sm:min-w-[16rem] sm:max-w-md">
            <span className="material-symbols-outlined absolute left-4 top-1.5 text-outline text-[18px]" aria-hidden="true">
              search
            </span>
            <input
              className="w-full h-10 pl-11 pr-4 bg-surface-container-low border border-outline-variant/40 rounded text-on-surface placeholder:text-outline font-body-sm text-sm focus:outline-none focus:border-primary focus:bg-surface-container-lowest transition-colors"
              placeholder="Filtrar por DNI, nombre o correo..."
              type="text"
              value={search}
              onChange={(event) => withFirstPage(setSearch)(event.target.value)}
              aria-label="Filtrar usuarios"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
            <FilterSelect
              className={filterClass}
              value={role}
              onChange={(event) => withFirstPage(setRole)(event.target.value)}
              aria-label="Filtrar por rol"
            >
              <option value="todos">Rol: Todos</option>
              {roles.map((roleName) => (
                <option key={roleName} value={roleName}>{roleName}</option>
              ))}
            </FilterSelect>
            <FilterSelect
              className={filterClass}
              value={status}
              onChange={(event) => withFirstPage(setStatus)(event.target.value)}
              aria-label="Filtrar por estado"
            >
              <option value="activo">Estado: Activo</option>
              <option value="todos">Estado: Todos</option>
              <option value="baja">Dados de baja</option>
            </FilterSelect>
            <button
              type="button"
              onClick={resetFilters}
              title="Restablecer filtros"
              aria-label="Restablecer filtros"
              className="inline-flex items-center justify-center h-10 w-10 shrink-0 rounded border border-outline-variant/40 bg-surface-container-low text-outline hover:text-primary hover:bg-surface-container-high transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">refresh</span>
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-surface-container-low/60 border-b border-outline-variant/30 text-sm font-semibold text-on-surface-variant uppercase tracking-wider">
              <SortableHeader className="py-3 px-4 pl-6 w-32 whitespace-nowrap" etiqueta="DNI" columna="dni" orden={sort} onOrdenar={withFirstPage(sortBy)} />
              <SortableHeader className="py-3 px-4" etiqueta="Nombre y Apellido" columna="name" orden={sort} onOrdenar={withFirstPage(sortBy)} />
              <th className="py-3 px-4" scope="col">Correo</th>
              <SortableHeader className="py-3 px-4" etiqueta="Rol" columna="role" orden={sort} onOrdenar={withFirstPage(sortBy)} />
              <SortableHeader className="py-3 px-4" etiqueta="Estado" columna="status" orden={sort} onOrdenar={withFirstPage(sortBy)} />
              {canEdit && <th className="py-3 px-4 pr-6 text-right" scope="col">Acciones</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20 font-body-sm text-on-surface">
            {isLoading && (
              <tr>
                <td className="py-10 px-4 text-center text-on-surface-variant" colSpan={COLUMN_COUNT}>
                  Cargando usuarios...
                </td>
              </tr>
            )}

            {!isLoading && visible.length === 0 && (
              <tr>
                <td className="py-10 px-4 text-center text-on-surface-variant" colSpan={COLUMN_COUNT}>
                  {error ? 'No se pudieron cargar los usuarios.' : 'No hay usuarios que coincidan con el filtro.'}
                </td>
              </tr>
            )}

            {!isLoading && visible.map((usuario) => {
              const roleStyle = getRoleStyle(usuario.role)
              const isSelf = usuario.id === currentUserId
              return (
                <tr key={usuario.id} className="hover:bg-surface-container-low/80 transition-colors">
                  <td className="py-3 px-12 pl-6 font-semibold text-on-surface text-base whitespace-nowrap">{formatDni(usuario.dni)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      
                      <span className="font-medium text-on-surface text-base whitespace-nowrap">
                        {usuario.full_name}
                        {isSelf && <span className="ml-2 text-sm font-normal text-on-surface-variant">(vos)</span>}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-on-surface-variant">{usuario.email || '—'}</td>
                  <td className="py-3 px-4">
                    {usuario.role ? (
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold ${roleStyle.badge}`}>
                        {usuario.role}
                      </span>
                    ) : (
                      <span className="text-on-surface-variant">Sin rol</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {usuario.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-medium bg-surface-container-high text-on-surface-variant border border-outline-variant/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-outline" />
                        Dado de baja
                      </span>
                    )}
                  </td>
                  {canEdit && (
                    <td className="py-2 px-4 pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <button type="button" className={iconButtonClass} onClick={() => onEdit(usuario)} title="Editar datos y rol" aria-label={`Editar a ${usuario.full_name}`}>
                          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">edit</span>
                        </button>
                        <button type="button" className={iconButtonClass} onClick={() => onResetPassword(usuario)} title="Resetear contraseña" aria-label={`Resetear la contraseña de ${usuario.full_name}`}>
                          <span className="material-symbols-outlined text-[20px]" aria-hidden="true">lock_reset</span>
                        </button>
                        {usuario.is_active && !isSelf && (
                          <button
                            type="button"
                            onClick={() => onDeactivate(usuario)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-error hover:bg-error-container/60 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">person_remove</span>
                            Dar de baja
                          </button>
                        )}
                        {!usuario.is_active && (
                          <button
                            type="button"
                            onClick={() => onActivate(usuario)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">person_check</span>
                            Reactivar
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <TablePagination
        id="usuarios-rows-per-page"
        page={currentPage}
        totalPages={totalPages}
        rowsPerPage={rowsPerPage}
        onPageChange={setPage}
        onRowsPerPageChange={withFirstPage(setRowsPerPage)}
      />
    </div>
  )
}

export default UsuariosTable
