import { ActionIcon, Group, Table, Text, Tooltip } from '@mantine/core'
import { IconTrash } from '@tabler/icons-react'

function CategoriaDocenteTable({ docenteCategorias, onDelete }) {
	if (docenteCategorias.length === 0) {
		return (
			<Text color="dimmed" size="sm" align="center" py="md">
				No hay docentes asociados a esta categoría.
			</Text>
		)
	}

	return (
		<Table striped highlightOnHover withBorder withColumnBorders>
			<thead>
				<tr>
					<th>Docente</th>
					<th>Legajo</th>
					<th>Contacto</th>
					<th />
				</tr>
			</thead>
			<tbody>
				{docenteCategorias.map((docenteCategoria) => {
					const docente = docenteCategoria.docente
					const persona = docente?.persona_detalle

					return (
						<tr key={docenteCategoria.docente_categoria_id}>
							<td>
								<Text weight={500} size="sm">
									{persona ? `${persona.nombre} ${persona.apellido}` : 'Docente sin nombre'}
								</Text>
							</td>
							<td>{docente?.legajo || '-'}</td>
							<td>{persona?.email || persona?.telefono || '-'}</td>
							<td>
								<Group position="right">
									<Tooltip label="Eliminar asociación">
										<ActionIcon
											color="red"
											variant="light"
											onClick={() => onDelete(docenteCategoria.docente_categoria_id)}
										>
											<IconTrash size={16} />
										</ActionIcon>
									</Tooltip>
								</Group>
							</td>
						</tr>
					)
				})}
			</tbody>
		</Table>
	)
}

export default CategoriaDocenteTable
