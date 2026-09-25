export const cargoDe = (docente) => {
  const cargo = docente.cargo ?? docente.rol
  if (cargo?.nombre) return cargo.nombre
  if (typeof cargo === 'string') return cargo
  return ''
}

const nombreEstado = (docente) => {
  const estado = docente.estado
  if (estado?.nombre) return estado.nombre
  if (typeof estado === 'string') return estado
  return ''
}

// El modelo Docente no tiene estado propio todavía: si no viene informado se considera activo. Hay que hacer borrado logico del docente
export const esActivo = (docente) => {
  if (typeof docente.activo === 'boolean') return docente.activo
  if (docente.fecha_baja) return false
  const estado = nombreEstado(docente).toLowerCase()
  if (!estado) return true
  return estado.includes('activo') && !estado.includes('baja') && !estado.includes('inactivo')
}

export const exportarNominaCSV = (docentes, categoriasPorDocente = {}) => {
  const encabezados = ['Legajo', 'Nombre', 'Apellido', 'DNI', 'Teléfono', 'Email', 'Cargo', 'Categorías', 'Estado']
  const filas = docentes.map((docente) => [
    docente.legajo ?? '',
    docente.persona_detalle?.nombre ?? '',
    docente.persona_detalle?.apellido ?? '',
    docente.persona_detalle?.dni ?? '',
    docente.persona_detalle?.telefono ?? '',
    docente.persona_detalle?.email ?? '',
    cargoDe(docente),
    (categoriasPorDocente[docente.docente_id] ?? []).map((categoria) => categoria.nombre).join(', '),
    esActivo(docente) ? 'Activo' : 'De baja',
  ])
  const csv = [encabezados, ...filas]
    .map((fila) => fila.map((celda) => `"${String(celda).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const enlace = document.createElement('a')
  // BOM inicial para que Excel abra el CSV en UTF-8.
  const contenido = '﻿' + csv
  enlace.href = URL.createObjectURL(new Blob([contenido], { type: 'text/csv;charset=utf-8;' }))
  enlace.download = `nomina-docentes-${new Date().toISOString().slice(0, 10)}.csv`
  enlace.click()
  URL.revokeObjectURL(enlace.href)
}
