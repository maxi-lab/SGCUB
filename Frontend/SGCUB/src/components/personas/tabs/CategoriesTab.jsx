import { useState } from 'react'
import { Button, Group, Modal, Text } from '@mantine/core'
import { esCategoriaAsignable, etiquetaCategoria } from '../../docentes/docentesUtils'
import { SelectSimple } from '../../shared/DropDownMenu'
import { TabHeader, EmptyState, PrimaryButton } from './parts'

const aPayload = (asignaciones) => asignaciones.map((asignacion) => ({
  cargo: Number(asignacion.cargo),
  categorias: asignacion.categorias.map((categoria) => Number(categoria.categoria_id ?? categoria)),
}))

const idsCategorias = (asignacion) => asignacion.categorias.map((categoria) => String(categoria.categoria_id))

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

function CargoModal({ asignacion, asignaciones, cargos, categorias, onClose, onSave }) {
  const editando = Boolean(asignacion)
  const [cargo, setCargo] = useState(editando ? String(asignacion.cargo) : '')
  const [seleccionadas, setSeleccionadas] = useState(editando ? idsCategorias(asignacion) : [])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const otras = asignaciones.filter((a) => a !== asignacion)
  const cargosUsados = new Set(otras.map((a) => String(a.cargo)))
  // Una categoría no puede estar en dos cargos del mismo docente.
  const cargoDeCategoria = Object.fromEntries(
    otras.flatMap((a) => idsCategorias(a).map((categoriaId) => [categoriaId, a.cargo_nombre])),
  )

  const alternar = (categoriaId) => setSeleccionadas((actuales) => (
    actuales.includes(categoriaId) ? actuales.filter((id) => id !== categoriaId) : [...actuales, categoriaId]
  ))

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
  const propsGrupo = { seleccionadas, cargoDeCategoria, deshabilitado: guardando, onToggle: alternar }

  const guardar = async () => {
    if (!cargo) return setError('Seleccione un cargo.')
    if (seleccionadas.length === 0) return setError('Seleccione al menos una categoría.')
    setGuardando(true)
    setError('')
    const nueva = { cargo, categorias: seleccionadas }
    const resultado = editando
      ? asignaciones.map((a) => (a === asignacion ? nueva : a))
      : [...asignaciones, nueva]
    try {
      await onSave(resultado)
      onClose()
    } catch (saveError) {
      setError(saveError.message)
      setGuardando(false)
    }
  }

  return (
    <Modal
      opened
      onClose={() => !guardando && onClose()}
      centered
      size="lg"
      title={<Text fw={700} size="xl">{editando ? 'Editar cargo' : 'Agregar cargo'}</Text>}
    >
      <div className="flex flex-col gap-4">
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
            onChange={setCargo}
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

        {error && <Text color="red" size="base">{error}</Text>}

        <Group position="right" mt="sm">
          <Button variant="default" onClick={onClose} disabled={guardando}>Cancelar</Button>
          <Button onClick={guardar} loading={guardando}>{editando ? 'Guardar cambios' : 'Agregar cargo'}</Button>
        </Group>
      </div>
    </Modal>
  )
}

function BotonEditar({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      aria-label={label}
      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-sm font-semibold text-on-surface-variant hover:bg-surface-container-high hover:text-primary transition-colors cursor-pointer"
    >
      <span className="material-symbols-outlined text-[20px]">edit</span>
      Editar
    </button>
  )
}

export default function CategoriesTab({ asignaciones = [], cargos = [], categorias = [], editable = false, onSave }) {
  const [modalCargo, setModalCargo] = useState(null)

  const guardar = (nuevas) => onSave(aPayload(nuevas))

  return (
    <div className="flex flex-col gap-6">
      <TabHeader
        title="Categorías asignadas"
        description="Cargos que ocupa el docente y las categorías en las que participa con cada uno"
        actions={editable && (
          <PrimaryButton icon="add" onClick={() => setModalCargo({ asignacion: null })}>Agregar cargo</PrimaryButton>
        )}
      />

      {asignaciones.length === 0 ? (
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
                <th className="py-3 px-4 font-semibold">Categorías</th>
                {editable && <th className="py-3 px-4 font-semibold text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-base">
              {asignaciones.map((asignacion) => (
                <tr key={asignacion.cargo} className="align-top hover:bg-surface-container-low transition-colors">
                  <td className="py-3.5 px-4 font-semibold text-on-surface whitespace-nowrap">{asignacion.cargo_nombre ?? '—'}</td>
                  <td className="py-3 px-4">
                    <ul className="flex flex-wrap gap-1.5">
                      {asignacion.categorias.map((categoria) => (
                        <li
                          key={categoria.categoria_id}
                          className="px-2.5 py-0.5 rounded-md bg-surface-container-high text-on-surface text-base font-medium"
                        >
                          {etiquetaCategoria(categoria)}
                        </li>
                      ))}
                    </ul>
                  </td>
                  {editable && (
                    <td className="py-2 px-4">
                      <div className="flex items-center justify-end">
                        <BotonEditar
                          label={`Editar cargo ${asignacion.cargo_nombre ?? ''}`.trim()}
                          onClick={() => setModalCargo({ asignacion })}
                        />
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalCargo && (
        <CargoModal
          asignacion={modalCargo.asignacion}
          asignaciones={asignaciones}
          cargos={cargos}
          categorias={categorias}
          onClose={() => setModalCargo(null)}
          onSave={guardar}
        />
      )}
    </div>
  )
}
