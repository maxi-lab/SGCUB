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
        size: 180,
        minSize: 140,
      },
      {
        id: 'dni',
        accessorFn: (row) => row.socio?.dni ?? '',
        header: 'DNI',
        size: 110,
        minSize: 90,
      },
      {
        id: 'categoria',
        accessorFn: (row) => row.categoria?.nombre ?? '',
        header: 'Categoría',
        size: 130,
        minSize: 100,
      },
      {
        id: 'estado',
        accessorFn: (row) => row.estado?.nombre ?? '',
        header: 'Estado',
        size: 120,
        minSize: 90,
      },
      {
        accessorKey: 'obra_social',
        header: 'Obra social',
        size: 130,
        minSize: 100,
      },
      {
        accessorKey: 'tallaIndumentaria',
        header: 'Talla',
        size: 90,
        minSize: 70,
      },
      {
        accessorKey: 'contactoEmergencia',
        header: 'Contacto de emergencia',
        size: 180,
        minSize: 140,
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
        size: 70,
        minSize: 60,
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
        fontSize: '10px',
        padding: '6px 8px',
        whiteSpace: 'normal',
        lineHeight: 1.15,
      },
    },
    mantineTableBodyCellProps: {
      style: {
        fontSize: '12px',
        padding: '6px 8px',
        whiteSpace: 'normal',
        wordBreak: 'break-word',
        lineHeight: 1.2,
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
