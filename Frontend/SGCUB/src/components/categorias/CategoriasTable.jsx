import { useMemo } from 'react'
import { ActionIcon, Button, Group, Text } from '@mantine/core'
import { IconEdit, IconPlus, IconTrash } from '@tabler/icons-react'
import { MantineReactTable, useMantineReactTable } from 'mantine-react-table'
import '../shared/quiet-table.css'

const GENERO_LABEL = {
  M: 'Masculino',
  F: 'Femenino',
}

function CategoriasTable({ data, isLoading, error, onAdd, onEdit, onDelete }) {
  const columns = useMemo(
    () => [
      {
        accessorKey: 'nombre',
        header: 'Nombre',
        size: 180,
        minSize: 140,
      },
      {
        accessorKey: 'anio_vigente',
        header: 'Año vigente',
        size: 110,
        minSize: 90,
      },
      {
        accessorKey: 'edad_minima',
        header: 'Edad mínima',
        size: 110,
        minSize: 90,
      },
      {
        accessorKey: 'edad_maxima',
        header: 'Edad máxima',
        size: 110,
        minSize: 90,
      },
      {
        id: 'genero',
        accessorFn: (row) => GENERO_LABEL[row.genero] ?? row.genero ?? '',
        header: 'Género',
        size: 120,
        minSize: 90,
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
          aria-label={`Editar categoría ${row.original.nombre}`}
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
          aria-label={`Eliminar categoría ${row.original.nombre}`}
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
          ? 'No se pudieron cargar las categorías.'
          : 'No hay categorías cargadas.'}
      </Text>
    ),
  })

  return <MantineReactTable table={table} />
}

export default CategoriasTable
