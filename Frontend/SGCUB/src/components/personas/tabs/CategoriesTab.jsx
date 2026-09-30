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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 max-h-72 overflow-y-auto border border-outline-variant/40 rounded-lg p-2">
            {categorias.filter(esCategoriaAsignable).map((c) => {
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
                    disabled={Boolean(ocupadaPor) || guardando}
                    onChange={() => alternar(categoriaId)}
                  />
                  <span className="truncate">{etiquetaCategoria(c)}</span>
                </label>
              )
            })}
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

function EliminarModal({ fila, onClose, onConfirm }) {
  const [eliminando, setEliminando] = useState(false)
  const [error, setError] = useState('')

  const confirmar = async () => {
    setEliminando(true)
    setError('')
    try {
      await onConfirm()
      onClose()
    } catch (deleteError) {
      setError(deleteError.message)
      setEliminando(false)
    }
  }

  return (
    <Modal
      opened
      onClose={() => !eliminando && onClose()}
      centered
      title={<Text fw={700} size="xl">Quitar categoría</Text>}
    >
      <Text size="md">
        ¿Seguro que desea quitar la categoría <strong>{fila.categoria.nombre}</strong> del cargo <strong>{fila.cargoNombre}</strong>?
      </Text>
      {fila.ultimaDelCargo && (
        <Text size="sm" c="dimmed" mt="xs">Es la última categoría de este cargo, por lo que también se quitará el cargo.</Text>
      )}
      {error && <Text color="red" size="base" mt="md">{error}</Text>}
      <Group position="right" mt="xl">
        <Button variant="default" onClick={onClose} disabled={eliminando}>Cancelar</Button>
        <Button color="red" onClick={confirmar} loading={eliminando}>Quitar</Button>
      </Group>
    </Modal>
  )
}

function BotonIcono({ icon, label, onClick, disabled, tone = 'default' }) {
  const color = tone === 'danger' ? 'text-error hover:bg-error-container/40' : 'text-on-surface-variant hover:bg-surface-container-high hover:text-primary'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`p-1.5 rounded transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent ${color}`}
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
    </button>
  )
}

export default function CategoriesTab({ asignaciones = [], cargos = [], categorias = [], editable = false, onSave }) {
  const [modalCargo, setModalCargo] = useState(null)
  const [filaAEliminar, setFilaAEliminar] = useState(null)

  const filas = asignaciones.flatMap((asignacion) => asignacion.categorias.map((categoria) => ({
    clave: `${asignacion.cargo}-${categoria.categoria_id}`,
    asignacion,
    categoria,
    cargoNombre: asignacion.cargo_nombre ?? '—',
    ultimaDelCargo: asignacion.categorias.length === 1,
  })))
  const unicaFila = filas.length === 1

  const guardar = (nuevas) => onSave(aPayload(nuevas))

  const eliminar = (fila) => guardar(asignaciones
    .map((a) => (a === fila.asignacion
      ? { ...a, categorias: a.categorias.filter((c) => c.categoria_id !== fila.categoria.categoria_id) }
      : a))
    .filter((a) => a.categorias.length > 0))

  return (
    <div className="flex flex-col gap-6">
      <TabHeader
        title="Categorías asignadas"
        description="Categorías en las que participa el docente y el cargo que ocupa en cada una"
        actions={editable && (
          <PrimaryButton icon="add" onClick={() => setModalCargo({ asignacion: null })}>Agregar cargo</PrimaryButton>
        )}
      />

      {filas.length === 0 ? (
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
                {editable && <th className="py-3 px-4 font-semibold text-right">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20 text-base">
              {filas.map((fila) => (
                <tr key={fila.clave} className="hover:bg-surface-container-low transition-colors">
                  <td className="py-3.5 px-4 text-on-surface-variant">{fila.cargoNombre}</td>
                  <td className="py-3.5 px-4">
                    <span className="font-semibold text-on-surface">{fila.categoria.nombre ?? '—'}</span>
                  </td>
                  {editable && (
                    <td className="py-2 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <BotonIcono
                          icon="edit"
                          label={`Editar cargo ${fila.cargoNombre}`}
                          onClick={() => setModalCargo({ asignacion: fila.asignacion })}
                        />
                        <BotonIcono
                          icon="delete"
                          tone="danger"
                          label={unicaFila ? 'El docente debe tener al menos una categoría' : `Quitar ${fila.categoria.nombre}`}
                          disabled={unicaFila}
                          onClick={() => setFilaAEliminar(fila)}
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

      {filaAEliminar && (
        <EliminarModal
          fila={filaAEliminar}
          onClose={() => setFilaAEliminar(null)}
          onConfirm={() => eliminar(filaAEliminar)}
        />
      )}
    </div>
  )
}
