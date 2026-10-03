const MS_PER_DAY = 1000 * 60 * 60 * 24

export function parseDueDate(doc, today) {
  const [yyyy, mm, dd] = doc.fecha_vencimiento.split('T')[0].split('-')
  const dueDate = new Date(yyyy, mm - 1, dd)
  return {
    dueDateLabel: `${dd}/${mm}/${yyyy}`,
    daysFromToday: (dueDate - today) / MS_PER_DAY,
  }
}
