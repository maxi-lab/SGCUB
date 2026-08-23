import { useMemo } from 'react'
import { ActionIcon, Button, Group, Text } from '@mantine/core'
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react'
import { MantineReactTable, useMantineReactTable } from 'mantine-react-table'
import '../shared/quiet-table.css'

function SociosTable({ data, isLoading, error, onAdd, onEdit, onDelete }) {
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
        id: 'telefono',
        accessorFn: (row) => row.telefono ?? row.persona?.telefono ?? '',
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
      className: 'quiet-table',
      striped: true,
      highlightOnHover: true,
      withBorder: true,
      withColumnBorders: true,
    },
    mantineTableHeadCellProps: {
      style: {
        fontSize: '11px',
        padding: '9px 12px',
      },
    },
    mantineTableBodyCellProps: {
      style: {
        fontSize: '13px',
        padding: '9px 12px',
      },
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