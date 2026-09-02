import { useMemo } from 'react'
import { ActionIcon, Button, Group, Text } from '@mantine/core'
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react'
import { MantineReactTable, useMantineReactTable } from 'mantine-react-table'
import '../shared/quiet-table.css'

function DocentesTable({ data, isLoading, error, onAdd, onEdit, onDelete }) {
  const columns = useMemo(
    () => [
      {
        id: 'docente',
        accessorFn: (row) =>
          [row.persona_detalle?.nombre, row.persona_detalle?.apellido]
            .filter(Boolean)
            .join(' '),
        header: 'Docente',
        size: 180,
        minSize: 140,
      },
      {
        id: 'dni',
        accessorFn: (row) => row.persona_detalle?.dni ?? '',
        header: 'DNI',
        size: 110,
        minSize: 90,
      },
      {
        id: 'legajo',
        accessorKey: 'legajo',
        header: 'Legajo',
        size: 100,
        minSize: 80,
      },
      {
        id: 'telefono',
        accessorFn: (row) => row.persona_detalle?.telefono ?? '',
        header: 'Teléfono',
        size: 120,
        minSize: 100,
      },
      {
        id: 'email',
        accessorFn: (row) => row.persona_detalle?.email ?? '',
        header: 'Email',
        size: 190,
        minSize: 140,
      },
      {
        id: 'genero',
        accessorFn: (row) => row.persona_detalle?.genero_nombre ?? '',
        header: 'Género',
        size: 110,
        minSize: 90,
      },
      {
        id: 'fecha_ingreso',
        accessorKey: 'fecha_ingreso',
        header: 'Ingreso',
        size: 110,
        minSize: 90,
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
          aria-label={`Editar docente ${row.original.persona_detalle?.nombre ?? 'este docente'}`}
          onClick={(event) => {
            event.stopPropagation()
            onEdit?.(row.original)
          }}
        >
          <IconEdit size={18} />
        </ActionIcon>
        <ActionIcon
          color="red"
          variant="subtle"
          aria-label={`Eliminar docente ${row.original.persona_detalle?.nombre ?? 'este docente'}`}
          onClick={(event) => {
            event.stopPropagation()
            onDelete?.(row.original)
          }}
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
          ? 'No se pudieron cargar los docentes.'
          : 'No hay docentes cargados.'}
      </Text>
    ),
  })

  return <MantineReactTable table={table} />
}

export default DocentesTable
