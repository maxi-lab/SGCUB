import { esCategoriaAsignable, idsCategorias } from './docentesUtils'
import { SelectSimple } from '../shared/DropDownMenu'

const GENEROS_CATEGORIA = [
  { genero: 'M', titulo: 'Masculino' },
  { genero: 'F', titulo: 'Femenino' },
]

function GrupoCategorias({ titulo, categorias, seleccionadas, cargoDeCategoria, deshabilitado, onToggle }) {
  return (
    <div className="flex flex-col gap-1 min-w-0">
      <p className="px-2 pb-1 text-sm font-semibold uppercase tracking-wider text-on-surface-variant border-b border-outline-variant/30">
        {titulo}
      </p>
      {categorias.length === 0 && <p className="px-2 py-1.5 text-sm text-outline">Sin categorías.</p>}
      {categorias.map((c) => {
        const categoriaId = String(c.categoria_id)
        const ocupadaPor = cargoDeCategoria[categoriaId]
        return (
          <label
            key={categoriaId}
            className={`flex items-center gap-2 px-2 py-1.5 rounded text-base ${ocupadaPor ? 'text-outline cursor-not-allowed' : 'text-on-surface hover:bg-surface-container-low cursor-pointer'}`}
            title={ocupadaPor ? `Asignada como ${ocupadaPor}` : undefined}
          >
            <input
              type="checkbox"
              className="w-4 h-4 accent-primary cursor-pointer disabled:cursor-not-allowed shrink-0"
              checked={seleccionadas.includes(categoriaId)}
              disabled={Boolean(ocupadaPor) || deshabilitado}
              onChange={() => onToggle(categoriaId)}
            />
            <span className="truncate">{c.nombre}</span>
          </label>
        )
      })}
    </div>
  )
}

/**
 * Selector de cargo y de sus categorías. `otherAssignments` son los demás cargos del docente:
 * sus cargos y categorías quedan deshabilitados porque no pueden repetirse.
 */
function CargoFields({
  cargo,
  onCargoChange,
  seleccionadas,
  onSeleccionadasChange,
  cargos,
  categorias,
  otherAssignments = [],
  disabled = false,
}) {
  const cargosUsados = new Set(otherAssignments.map((a) => String(a.cargo)))
  // Una categoría no puede estar en dos cargos del mismo docente.
  const cargoDeCategoria = Object.fromEntries(
    otherAssignments.flatMap((a) => idsCategorias(a).map((categoriaId) => [categoriaId, a.cargo_nombre])),
  )

  const alternar = (categoriaId) => onSeleccionadasChange(
    seleccionadas.includes(categoriaId) ? seleccionadas.filter((id) => id !== categoriaId) : [...seleccionadas, categoriaId],
  )

  const asignables = categorias
    .filter(esCategoriaAsignable)
    // Más grandes primero; a igual edad máxima, en el orden en que fueron cargadas.
    .sort((a, b) => (b.edad_maxima ?? 0) - (a.edad_maxima ?? 0) || a.categoria_id - b.categoria_id)
  const gruposPorGenero = [
    ...GENEROS_CATEGORIA.map(({ genero, titulo }) => ({
      genero,
      titulo,
      categorias: asignables.filter((c) => c.genero === genero),
    })),
    {
      genero: null,
      titulo: 'Otras',
      categorias: asignables.filter((c) => !GENEROS_CATEGORIA.some(({ genero }) => genero === c.genero)),
    },
  ]
  const propsGrupo = { seleccionadas, cargoDeCategoria, deshabilitado: disabled, onToggle: alternar }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="modal-cargo" className="text-base font-semibold text-on-surface">Cargo <span className="text-error">*</span></label>
        <SelectSimple
          id="modal-cargo"
          opciones={cargos.map((c) => ({
            valor: String(c.cargo_id),
            etiqueta: c.nombre,
            deshabilitadaPor: cargosUsados.has(String(c.cargo_id)) ? 'Ya asignado' : undefined,
          }))}
          valor={cargo}
          onChange={onCargoChange}
          conError={false}
          placeholder="Seleccione cargo..."
        />
      </div>

      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-base font-semibold text-on-surface mb-1.5">
          Categorías <span className="text-error">*</span>
          <span className="text-sm font-normal text-on-surface-variant ml-1">(una o varias)</span>
        </legend>
        <div className="max-h-80 overflow-y-auto border border-outline-variant/40 rounded-lg p-2 flex flex-col gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            {gruposPorGenero.filter((grupo) => grupo.genero !== null).map((grupo) => (
              <GrupoCategorias key={grupo.genero} titulo={grupo.titulo} categorias={grupo.categorias} {...propsGrupo} />
            ))}
          </div>
          {gruposPorGenero.filter((grupo) => grupo.genero === null && grupo.categorias.length > 0).map((grupo) => (
            <GrupoCategorias key="otras" titulo={grupo.titulo} categorias={grupo.categorias} {...propsGrupo} />
          ))}
        </div>
      </fieldset>
    </>
  )
}

export default CargoFields
