// Valores de `Categoria.genero` en el backend (GENERO_CHOICES)
export const GENERO_OPTIONS = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
]

export const getGeneroLabel = (genero) =>
  GENERO_OPTIONS.find((option) => option.value === genero)?.label ?? '—'
