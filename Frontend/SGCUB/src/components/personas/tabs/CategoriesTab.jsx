import { TabHeader, EmptyState } from './parts'

const cargoDe = (assignment) => {
  const cargo = assignment.cargo ?? assignment.rol
  if (cargo?.nombre) return cargo.nombre
  if (typeof cargo === 'string') return cargo
  return ''
}

export default function CategoriesTab({ assignments = [] }) {
  return (
    <div className="flex flex-col gap-6">
      <TabHeader
        title="Categorías asignadas"
        description="Categorías en las que participa el docente y el cargo que ocupa en cada una"
      />

      {assignments.length === 0 ? (
        <EmptyState
          icon="groups"
          title="Sin categorías asignadas"
          description="Este docente todavía no tiene categorías asignadas."
        />
      ) : (
        <div className="overflow-x-auto border border-outline-variant/30 rounded-xl bg-surface-container-lowest shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low/70 border-b border-outline-variant/30 text-on-surface-variant text-base uppercase tracking-wider">
                <th className="py-3 px-4 font-semibold">Cargo</th>
                <th className="py-3 px-4 font-semibold">Categoría</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-base">
              {assignments.map((assignment, index) => (
                <tr key={assignment.docente_categoria_id ?? index} className="hover:bg-surface-container-low transition-colors">
                  <td className="py-3.5 px-4 text-on-surface-variant">{cargoDe(assignment) || '—'}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-on-surface">{assignment.categoria?.nombre ?? '—'}</span>
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
