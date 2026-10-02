import { useState } from 'react'
import { Button, Group, Modal, Text } from '@mantine/core'
import CargoFields from './CargoFields'
import { validateCargo } from './docentesUtils'

function ActivateDocenteModal({ opened, onClose, onConfirm, docente, cargos = [], categorias = [], loading, error }) {
  const [cargo, setCargo] = useState('')
  const [seleccionadas, setSeleccionadas] = useState([])
  const [validationError, setValidationError] = useState('')

  const nombreCompleto = [docente?.persona_detalle?.nombre, docente?.persona_detalle?.apellido]
    .filter(Boolean)
    .join(' ') || 'este docente'
  const needsCargo = (docente?.asignaciones ?? []).length === 0

  const handleConfirm = () => {
    if (!needsCargo) return onConfirm()
    const message = validateCargo(cargo, seleccionadas)
    setValidationError(message)
    if (message) return
    onConfirm([{ cargo: Number(cargo), categorias: seleccionadas.map(Number) }])
  }

  return (
    <Modal opened={opened} onClose={onClose} size={needsCargo ? 'lg' : 'md'} title={
    <Text fw={700} size="xl" >
      Confirmar alta de docente
    </Text>
    } centered>
      <Text size="md">
        ¿Seguro que desea dar de alta al docente <strong>{nombreCompleto}</strong>?
      </Text>
      {needsCargo && (
        <div className="flex flex-col gap-4">
          <Text size="md" mt="md">
            Para darlo de alta, asignale al menos un cargo con sus categorías.
          </Text>
          <CargoFields
            cargo={cargo}
            onCargoChange={setCargo}
            seleccionadas={seleccionadas}
            onSeleccionadasChange={setSeleccionadas}
            cargos={cargos}
            categorias={categorias}
            disabled={loading}
          />
        </div>
      )}
      {(validationError || error) && (
        <Text color="red" size="base" mt="md">
          {validationError || error}
        </Text>
      )}
      <Group position="right" mt="xl">
        <Button variant="default" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>
        <Button color="teal" onClick={handleConfirm} loading={loading}>
          Dar de alta
        </Button>
      </Group>
    </Modal>
  )
}

export default ActivateDocenteModal
