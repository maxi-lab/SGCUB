import { useState } from 'react'
import { Button, Group, Modal, Text } from '@mantine/core'
import CargoFields from '../../docentes/CargoFields'
import { etiquetaCategoria, idsCategorias, validateCargo } from '../../docentes/docentesUtils'
import { TabHeader, EmptyState, PrimaryButton } from './parts'

const aPayload = (asignaciones) => asignaciones.map((asignacion) => ({
  cargo: Number(asignacion.cargo),
  categorias: asignacion.categorias.map((categoria) => Number(categoria.categoria_id ?? categoria)),
}))

function CargoModal({ asignacion, asignaciones, cargos, categorias, onClose, onSave }) {
  const editando = Boolean(asignacion)
  const [cargo, setCargo] = useState(editando ? String(asignacion.cargo) : '')
  const [seleccionadas, setSeleccionadas] = useState(editando ? idsCategorias(asignacion) : [])
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const guardar = async () => {
    const validationError = validateCargo(cargo, seleccionadas)
    if (validationError) return setError(validationError)
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
        <CargoFields
          cargo={cargo}
          onCargoChange={setCargo}
          seleccionadas={seleccionadas}
          onSeleccionadasChange={setSeleccionadas}
          cargos={cargos}
          categorias={categorias}
          otherAssignments={asignaciones.filter((a) => a !== asignacion)}
          disabled={guardando}
        />

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

function RemoveButton({ label, disabledReason, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={Boolean(disabledReason)}
      title={disabledReason ?? label}
      aria-label={label}
      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-sm font-semibold text-on-surface-variant hover:bg-error-container/60 hover:text-error transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-on-surface-variant"
    >
      <span className="material-symbols-outlined text-[20px]">delete</span>
      Eliminar
    </button>
  )
}

function ConfirmRemoveCargoModal({ asignacion, onClose, onConfirm }) {
  const [error, setError] = useState('')
  const [isRemoving, setIsRemoving] = useState(false)

  const handleConfirm = async () => {
    setIsRemoving(true)
    setError('')
    try {
      await onConfirm()
      onClose()
    } catch (removeError) {
      setError(removeError.message)
      setIsRemoving(false)
    }
  }

  return (
    <Modal
      opened
      onClose={() => !isRemoving && onClose()}
      centered
      title={<Text fw={700} size="xl">¿Eliminar este cargo?</Text>}
    >
      <div className="p-3 bg-surface-container-low rounded-lg space-y-2">
        <p className="text-base font-semibold text-on-surface">{asignacion.cargo_nombre ?? 'Cargo sin nombre'}</p>
        <ul className="flex flex-wrap gap-1.5">
          {asignacion.categorias.map((categoria) => (
            <li key={categoria.categoria_id} className="px-2.5 py-0.5 rounded-md bg-surface-container-high text-on-surface text-sm font-medium">
              {etiquetaCategoria(categoria)}
            </li>
          ))}
        </ul>
      </div>
      <Text size="md" mt="md">
        El docente dejará de tener este cargo en todas las categorías asociadas.
      </Text>
      {error && <Text color="red" size="sm" mt="md">{error}</Text>}
      <Group position="right" mt="xl">
        <Button variant="default" onClick={onClose} disabled={isRemoving}>Cancelar</Button>
        <Button color="red" onClick={handleConfirm} loading={isRemoving}>Eliminar cargo</Button>
      </Group>
    </Modal>
  )
}

export default function CategoriesTab({ asignaciones = [], cargos = [], categorias = [], editable = false, isActive = true, onSave }) {
  const [modalCargo, setModalCargo] = useState(null)
  const [cargoToRemove, setCargoToRemove] = useState(null)
  const removeDisabledReason = isActive && asignaciones.length === 1
    ? 'Un docente activo debe tener al menos un cargo'
    : undefined

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
                      <div className="flex items-center justify-end gap-1">
                        <BotonEditar
                          label={`Editar cargo ${asignacion.cargo_nombre ?? ''}`.trim()}
                          onClick={() => setModalCargo({ asignacion })}
                        />
                        <RemoveButton
                          label={`Eliminar cargo ${asignacion.cargo_nombre ?? ''}`.trim()}
                          disabledReason={removeDisabledReason}
                          onClick={() => setCargoToRemove(asignacion)}
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

      {cargoToRemove && (
        <ConfirmRemoveCargoModal
          asignacion={cargoToRemove}
          onClose={() => setCargoToRemove(null)}
          onConfirm={() => guardar(asignaciones.filter((asignacion) => asignacion !== cargoToRemove))}
        />
      )}
    </div>
  )
}
