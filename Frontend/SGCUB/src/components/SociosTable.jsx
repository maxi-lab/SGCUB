import { useMemo } from 'react'
import { ActionIcon, Button, Group, Text } from '@mantine/core'
import { IconEdit, IconEye, IconPlus, IconTrash } from '@tabler/icons-react'
import { MantineReactTable, useMantineReactTable } from 'mantine-react-table'

const defaultData = [
  {
    id: 1,
    nombre: 'Juan',
    apellido: 'Perez',
    dni: '12345678',
    telefono: '123456789',
  },
  {
    id: 2,
    nombre: 'Maria',
    apellido: 'Gonzalez',
    dni: '23456789',
    telefono: '987654321',
  },
]

function SociosTable({ data = defaultData, onAdd, onEdit, onDelete, onInspect }) {
  const columns = useMemo(
    () => [
      {
        accessorKey: 'nombre',
        header: 'Nombre',
      },
      {
        accessorKey: 'apellido',
        header: 'Apellido',
      },
      {
        accessorKey: 'dni',
        header: 'DNI',
      },
      {
        accessorKey: 'telefono',
        header: 'Teléfono',
      },
    ],
    [],
  )

  const table = useMantineReactTable({
    columns,
    data,
    enableColumnActions: false,
    enableColumnFilters: false,
    enableDensityToggle: false,
    enableFullScreenToggle: false,
    enableHiding: false,
    enablePagination: true,
    enableSorting: true,
    enableRowActions: true,
    positionActionsColumn: 'last',
    displayColumnDefOptions: {
      'mrt-row-actions': {
        header: 'Acciones',
        size: 150,
      },
    },
    renderTopToolbarCustomActions: () => (
      <Button leftIcon={<IconPlus size={16} />} onClick={onAdd}>
        Agregar
      </Button>
    ),
    renderRowActions: ({ row }) => (
      <Group spacing="xs" noWrap>
        <ActionIcon
          color="blue"
          variant="subtle"
          aria-label={`Inspeccionar ${row.original.nombre}`}
          onClick={() => onInspect?.(row.original)}
        >
          <IconEye size={18} />
        </ActionIcon>
        <ActionIcon
          color="teal"
          variant="subtle"
          aria-label={`Modificar ${row.original.nombre}`}
          onClick={() => onEdit?.(row.original)}
        >
          <IconEdit size={18} />
        </ActionIcon>
        <ActionIcon
          color="red"
          variant="subtle"
          aria-label={`Eliminar ${row.original.nombre}`}
          onClick={() => onDelete?.(row.original)}
        >
          <IconTrash size={18} />
        </ActionIcon>
      </Group>
    ),
    mantineTableProps: {
      striped: true,
      highlightOnHover: true,
      withBorder: true,
      withColumnBorders: true,
    },
    renderEmptyRowsFallback: () => (
      <Text align="center" py="xl">
        No hay socios o jugadores cargados.
      </Text>
    ),
  })

  return <MantineReactTable table={table} />
}

export default SociosTable
