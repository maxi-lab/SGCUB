import { isActiveStatus } from '../personas/format'

const nombreCargo =(cargo) => (typeof cargo === 'string' ? cargo : cargo?.nombre)

export const cargosDe = (asignaciones = []) =>
  [...new Set(asignaciones.map((asignacion) => nombreCargo(asignacion.cargo)).filter(Boolean))]

const GENERO_CATEGORIA = { M: 'Masculino', F: 'Femenino' }

export const etiquetaCategoria = (categoria) => {
  const genero = GENERO_CATEGORIA[categoria.genero]
  return genero ? `${categoria.nombre} · ${genero}` : categoria.nombre
}

export const esCategoriaAsignable = (categoria) => categoria.nombre !== 'No asignado'

export const esActivo = (docente) => isActiveStatus(docente.estado_nombre)

export const exportarNominaCSV = (docentes, categoriasPorDocente = {}) => {
  const encabezados = ['Legajo', 'Nombre', 'Apellido', 'DNI', 'Teléfono', 'Email', 'Cargo', 'Categorías', 'Estado']
  const filas = docentes.map((docente) => [
    docente.legajo ?? '',
    docente.persona_detalle?.nombre ?? '',
    docente.persona_detalle?.apellido ?? '',
    docente.persona_detalle?.dni ?? '',
    docente.persona_detalle?.telefono ?? '',
    docente.persona_detalle?.email ?? '',
    cargosDe(categoriasPorDocente[docente.docente_id]).join(', '),
    (categoriasPorDocente[docente.docente_id] ?? []).map((categoria) => categoria.nombre).join(', '),
    esActivo(docente) ? 'Activo' : 'De baja',
  ])
  const csv = [encabezados, ...filas]
    .map((fila) => fila.map((celda) => `"${String(celda).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const enlace = document.createElement('a')
  const contenido = csv
  enlace.href = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8;' }))
  enlace.download = `nomina-docentes-${new Date().toISOString().slice(0, 10)}.csv`
  enlace.click()
  URL.revokeObjectURL(enlace.href)
}
