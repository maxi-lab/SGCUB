import { useMemo, useState } from 'react'
import { Button, Group, Modal, MultiSelect, Select, Stack, Text } from '@mantine/core'
import { esActivo, esCategoriaAsignable, etiquetaCategoria } from '../docentes/docentesUtils'
import { getErrorMessage } from '../personas/format'

const docenteLabel = (docente) => {
  const persona = docente.persona_detalle ?? {}
  const name = [persona.apellido, persona.nombre].filter(Boolean).join(', ') || 'Sin nombre'
  return docente.legajo ? `${name} · Legajo #${docente.legajo}` : name
}

const assignedCategoriaIds = (docente) =>
  (docente?.asignaciones ?? []).flatMap((asignacion) => asignacion.categorias.map((categoria) => categoria.categoria_id))

const currentAssignmentsText = (docente) =>
  (docente?.asignaciones ?? [])
    .map((asignacion) => `${asignacion.cargo_nombre ?? 'Sin cargo'} (${asignacion.categorias.map((categoria) => categoria.nombre).join(', ')})`)
    .join(' · ')

const buildAsignaciones = (docente, cargoId, categoriaIds) => {
  const asignaciones = (docente.asignaciones ?? []).map((asignacion) => ({
    cargo: asignacion.cargo,
    categorias: asignacion.categorias.map((categoria) => categoria.categoria_id),
  }))
  const sameCargo = asignaciones.find((asignacion) => asignacion.cargo === cargoId)
  if (sameCargo) sameCargo.categorias.push(...categoriaIds)
  else asignaciones.push({ cargo: cargoId, categorias: categoriaIds })
  return asignaciones
}

function AssignDocenteModal({ opened, onClose, onSubmit, categoria, docentes, cargos, categorias, assignedDocenteIds }) {
  const [docenteId, setDocenteId] = useState(null)
  const [cargoId, setCargoId] = useState(null)
  const [categoriaIds, setCategoriaIds] = useState([String(categoria.categoria_id)])
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  const docenteOptions = useMemo(
    () => docentes
      .filter((docente) => esActivo(docente) && !assignedDocenteIds.includes(docente.docente_id))
      .map((docente) => ({ value: String(docente.docente_id), label: docenteLabel(docente) }))
      .sort((a, b) => a.label.localeCompare(b.label, 'es')),
    [docentes, assignedDocenteIds],
  )

  const selectedDocente = docentes.find((docente) => String(docente.docente_id) === docenteId)

  const categoriaOptions = useMemo(() => {
    const alreadyAssigned = assignedCategoriaIds(selectedDocente)
    return categorias
      .filter((item) => esCategoriaAsignable(item) && !alreadyAssigned.includes(item.categoria_id))
      .map((item) => ({ value: String(item.categoria_id), label: `${etiquetaCategoria(item)} (${item.anio_vigente})` }))
  }, [categorias, selectedDocente])

  const cargoOptions = cargos.map((cargo) => ({ value: String(cargo.cargo_id), label: cargo.nombre }))

  const selectDocente = (value) => {
    setDocenteId(value)
    setCategoriaIds([String(categoria.categoria_id)])
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsSaving(true)
    setError('')
    try {
      await onSubmit(selectedDocente, buildAsignaciones(selectedDocente, Number(cargoId), categoriaIds.map(Number)))
      onClose()
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'No se pudo asignar el docente.'))
      setIsSaving(false)
    }
  }

  return (
    <Modal
      opened={opened}
      onClose={() => !isSaving && onClose()}
      centered
      size="lg"
      title={<Text fw={700} size="xl">Asignar docente</Text>}
    >
      <form onSubmit={handleSubmit}>
        <Stack>
          <Select
            label="Docente"
            placeholder="Buscar por apellido, nombre o legajo..."
            data={docenteOptions}
            value={docenteId}
            onChange={selectDocente}
            description={selectedDocente ? `Asignaciones actuales: ${currentAssignmentsText(selectedDocente) || 'ninguna'}` : undefined}
            nothingFound="No hay docentes activos para asignar."
            searchable
            required
            data-autofocus
          />
          <Select
            label="Cargo"
            placeholder="Seleccione un cargo..."
            data={cargoOptions}
            value={cargoId}
            onChange={setCargoId}
            disabled={!docenteId}
            required
          />
          <MultiSelect
            label="Categorías"
            placeholder="Seleccione una o más categorías..."
            description="Además de esta categoría, puede sumar otras con el mismo cargo."
            data={categoriaOptions}
            value={categoriaIds}
            onChange={setCategoriaIds}
            disabled={!cargoId}
            nothingFound="El docente ya tiene todas las categorías."
            searchable
            required
          />
          {error && <Text color="red" size="sm">{error}</Text>}
          <Group position="right" mt="md">
            <Button type="button" variant="default" onClick={onClose} disabled={isSaving}>
              Cancelar
            </Button>
            <Button type="submit" loading={isSaving} disabled={!docenteId || !cargoId || categoriaIds.length === 0}>
              Asignar
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  )
}

export default AssignDocenteModal
