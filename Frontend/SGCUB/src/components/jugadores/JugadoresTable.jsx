import { useMemo } from 'react'
import { ActionIcon, Button, Group, Text } from '@mantine/core'
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react'
import { MantineReactTable, useMantineReactTable } from 'mantine-react-table'
import '../shared/quiet-table.css'

function JugadoresTable({ data, isLoading, error, onAdd, onEdit, onDelete }) {
  const columns = useMemo(
    () => [
      {
        id: 'socio',
        accessorFn: (row) =>
          [row.socio?.nombre, row.socio?.apellido]
            .filter(Boolean)
            .join(' '),
        header: 'Socio',
      },
      {
        id: 'dni',
        accessorFn: (row) => row.socio?.dni ?? '',
        header: 'DNI',
      },
      {
        id: 'categoria',
        accessorFn: (row) => row.categoria?.nombre ?? '',
        header: 'Categoría',
      },
      {
        accessorKey: 'obra_social',
        header: 'Obra social',
      },
      {
        accessorKey: 'tallaIndumentaria',
        header: 'Talla',
      },
      {
        accessorKey: 'contactoEmergencia',
        header: 'Contacto de emergencia',
      },
    ],
    [],
  )

  const table = useMantineReactTable({
    columns,
    data: data ?? [],
    state: { isLoading },
    enableColumnActions: true,
    enableColumnFilters: false,
    enableDensityToggle: false,
    enableFullScreenToggle: false,
    enableHiding: true,
    enablePagination: true,
    enableSorting: true,
    enableColumnResizing: true,
    columnResizeMode: 'onChange',
    enableRowActions: true,
    positionActionsColumn: 'last',
    displayColumnDefOptions: {
      'mrt-row-actions': {
        header: 'Acciones',
        size: 80,
      },
    },
    initialState: {
      density: 'compact',
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
          aria-label={`Editar jugador de ${row.original.socio?.nombre ?? 'este socio'}`}
          onClick={() => onEdit?.(row.original)}
        >
          <IconEdit size={18} />
        </ActionIcon>
        <ActionIcon
          color="red"
          variant="subtle"
          aria-label={`Eliminar jugador de ${row.original.socio?.nombre ?? 'este socio'}`}
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
        {error
          ? 'No se pudieron cargar los jugadores.'
          : 'No hay jugadores cargados.'}
      </Text>
    ),
  })

  return <MantineReactTable table={table} />
}

export default JugadoresTable
