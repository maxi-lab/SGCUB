import { useNavigate } from 'react-router-dom'
import SortableHeader from '../shared/SortableHeader'
import useOrdenTabla from '../../hooks/useOrdenTabla'
import { formatEdadMaxima, GENERO_BADGE_CLASSES } from './categoriaFormat'

const SORT_VALUES = {
  name: (categoria) => categoria.nombre,
  maxAge: (categoria) => categoria.edad_maxima,
  jugadores: (categoria) => categoria.cantidad_jugadores,
  docentes: (categoria) => categoria.cantidad_docentes,
}
const INITIAL_SORT = { columna: 'maxAge', direccion: 'desc' }
const COLUMN_COUNT = 4
const TITLES = { M: 'CATEGORÍAS MASCULINAS', F: 'CATEGORÍAS FEMENINAS' }

function CategoriasGeneroTable({ genero, categorias, isLoading, error }) {
  const navigate = useNavigate()
  const { ordenadas: sorted, orden: sort, ordenarPor: sortBy } = useOrdenTabla(categorias, SORT_VALUES, INITIAL_SORT)

  return (
    <div className="min-w-0 bg-surface-container-lowest border border-outline-variant/30 rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-outline-variant/20 flex items-center gap-3">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-base font-semibold ${GENERO_BADGE_CLASSES[genero]}`}>
          {TITLES[genero]}
        </span>
        {!isLoading && <span className="ml-auto text-sm text-on-surface-variant">{categorias.length} categorías</span>}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-surface-container-low/60 border-b border-outline-variant/30 text-sm font-semibold text-on-surface-variant uppercase tracking-wider">
              <SortableHeader className="py-3 px-4" etiqueta="Edad" columna="maxAge" orden={sort} onOrdenar={sortBy} />
              <SortableHeader className="py-3 px-4 pl-6" etiqueta="Nombre" columna="name" orden={sort} onOrdenar={sortBy} />
              <SortableHeader className="py-3 px-4 text-center" etiqueta="Jugadores" columna="jugadores" orden={sort} onOrdenar={sortBy} />
              <SortableHeader className="py-3 px-4 text-center" etiqueta="Docentes" columna="docentes" orden={sort} onOrdenar={sortBy} />
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/20 font-body-sm text-on-surface">
            {isLoading && (
              <tr>
                <td className="py-10 px-4 text-center text-on-surface-variant" colSpan={COLUMN_COUNT}>
                  Cargando categorías...
                </td>
              </tr>
            )}

            {!isLoading && sorted.length === 0 && (
              <tr>
                <td className="py-10 px-4 text-center text-on-surface-variant" colSpan={COLUMN_COUNT}>
                  {error ? 'No se pudieron cargar las categorías.' : 'No hay categorías que coincidan con el filtro.'}
                </td>
              </tr>
            )}

            {!isLoading && sorted.map((categoria) => (
              <tr
                key={categoria.categoria_id}
                onClick={() => navigate(`/padron/categorias/${categoria.categoria_id}`)}
                className="hover:bg-surface-container-low/80 transition-colors cursor-pointer"
              >
                <td className="py-3 px-4 text-on-surface-variant">{formatEdadMaxima(categoria.edad_maxima)}</td>
                <td className="py-3 px-4 pl-6 font-medium text-on-surface text-base">{categoria.nombre}</td>
                <td className="py-3 px-4 text-center font-bold text-on-surface-variant">{categoria.cantidad_jugadores ?? '—'}</td>
                <td className="py-3 px-4 text-center font-bold text-on-surface-variant">{categoria.cantidad_docentes ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default CategoriasGeneroTable
