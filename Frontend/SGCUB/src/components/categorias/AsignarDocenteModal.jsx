import { useMemo, useState } from 'react'
import { Button, Group, Modal, Table, Text, TextInput } from '@mantine/core'
import { IconSearch, IconUserPlus } from '@tabler/icons-react'

function AsignarDocenteModal({ opened, onClose, docentes, docentesAsignados, onAssign, loading }) {
  const [busqueda, setBusqueda] = useState('')

  const docentesDisponibles = useMemo(() => {
    const asignados = new Set(
      docentesAsignados.map((docenteCategoria) => docenteCategoria.docente?.docente_id),
    )
    const termino = busqueda.trim().toLowerCase()

    return docentes.filter((docente) => {
      if (asignados.has(docente.docente_id)) {
        return false
      }

      const persona = docente.persona_detalle
      const valores = [persona?.nombre, persona?.apellido, docente.legajo]
        .filter((valor) => valor !== null && valor !== undefined)
        .map((valor) => String(valor).toLowerCase())

      return !termino || valores.some((valor) => valor.includes(termino))
    })
  }, [busqueda, docentes, docentesAsignados])

  const cerrar = () => {
    setBusqueda('')
    onClose()
  }

  return (
    <Modal opened={opened} onClose={cerrar} title="Asignar docente" size="lg">
      <TextInput
        label="Buscar docente"
        placeholder="Nombre, apellido o legajo"
        icon={<IconSearch size={16} />}
        value={busqueda}
        onChange={(event) => setBusqueda(event.currentTarget.value)}
        mb="md"
      />

      {docentesDisponibles.length === 0 ? (
        <Text color="dimmed" align="center" py="md">
          No hay docentes disponibles para asignar.
        </Text>
      ) : (
        <Table striped highlightOnHover withBorder>
          <thead>
            <tr>
              <th>Docente</th>
              <th>Legajo</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {docentesDisponibles.map((docente) => {
              const persona = docente.persona_detalle
              return (
                <tr key={docente.docente_id}>
                  <td>
                    {persona?.nombre} {persona?.apellido}
                  </td>
                  <td>{docente.legajo || '-'}</td>
                  <td>
                    <Group position="right">
                      <Button
                        size="xs"
                        leftIcon={<IconUserPlus size={15} />}
                        loading={loading === docente.docente_id}
                        onClick={() => onAssign(docente)}
                      >
                        Asignar
                      </Button>
                    </Group>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </Table>
      )}
    </Modal>
  )
}

export default AsignarDocenteModal
