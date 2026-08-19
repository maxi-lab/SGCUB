import { useMemo } from 'react'
import { ActionIcon, Button, Group, Text } from '@mantine/core'
import { IconEdit, IconEye, IconPlus, IconTrash } from '@tabler/icons-react'
import { MantineReactTable, useMantineReactTable } from 'mantine-react-table'

function SociosTable({ data, isLoading, error, onAdd, onEdit, onDelete, onInspect }) {
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
    data: data ?? [],
    state: { isLoading },
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
        {error ? 'No se pudieron cargar los socios.' : 'No hay socios cargados.'}
      </Text>
    ),
  })

  return <MantineReactTable table={table} />
}

export default SociosTable
