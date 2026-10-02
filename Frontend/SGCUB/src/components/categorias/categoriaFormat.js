// Valores de `Categoria.genero` en el backend (GENERO_CHOICES)
export const GENERO_OPTIONS = [
  { value: 'M', label: 'Masculino' },
  { value: 'F', label: 'Femenino' },
]

export const getGeneroLabel = (genero) =>
  GENERO_OPTIONS.find((option) => option.value === genero)?.label ?? '—'

export const GENERO_BADGE_CLASSES = {
  M: 'bg-sky-50 text-sky-700 border border-sky-200',
  F: 'bg-pink-50 text-pink-700 border border-pink-200',
}

const NO_AGE_LIMIT = 99

export const formatEdadMaxima = (edadMaxima) =>
  edadMaxima == null || edadMaxima === NO_AGE_LIMIT ? '—' : `${edadMaxima} años`
