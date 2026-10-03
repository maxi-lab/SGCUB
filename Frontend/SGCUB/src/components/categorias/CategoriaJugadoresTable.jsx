import { useNavigate } from 'react-router-dom'
import { formatDni, isActiveStatus } from '../personas/format'

function CategoriaJugadoresTable({ jugadores, categoriaId }) {
  const navigate = useNavigate()

  return (
    <div className="overflow-x-auto border border-outline-variant/30 rounded-lg">
      <table className="w-full text-left text-sm border-collapse">
        <thead>
          <tr className="bg-surface-container-low/60 border-b border-outline-variant/30 text-sm font-semibold text-on-surface-variant uppercase tracking-wider">
            <th className="py-3 px-4 pl-6 w-28 whitespace-nowrap" scope="col">N° Socio</th>
            <th className="py-3 px-4" scope="col">Nombre y Apellido</th>
            <th className="py-3 px-4" scope="col">DNI</th>
            <th className="py-3 px-4" scope="col">Categoría</th>
            <th className="py-3 px-4" scope="col">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/20 font-body-sm text-on-surface">
          {jugadores.map((jugador) => {
            const isMain = jugador.categoria?.categoria_id === categoriaId
            return (
              <tr
                key={jugador.jugador_id}
                onClick={() => navigate(`/padron/jugadores/${jugador.jugador_id}`)}
                className="hover:bg-surface-container-low/80 transition-colors cursor-pointer"
              >
                <td className="py-3 px-4 pl-6 font-bold text-primary text-base">
                  {jugador.socio?.numero_socio ? `#${jugador.socio.numero_socio}` : '—'}
                </td>
                <td className="py-3 px-4 font-medium text-base">
                  {jugador.socio?.nombre} {jugador.socio?.apellido}
                </td>
                <td className="py-3 px-4 text-on-surface-variant">{formatDni(jugador.socio?.dni)}</td>
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold ${isMain ? 'bg-primary-fixed/30 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                    {isMain ? 'Principal' : 'Secundaria'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  {isActiveStatus(jugador.estado?.nombre) ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      {jugador.estado.nombre}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-sm font-medium bg-surface-container-high text-on-surface-variant border border-outline-variant/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-outline" />
                      {jugador.estado?.nombre ?? 'Sin estado'}
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default CategoriaJugadoresTable
