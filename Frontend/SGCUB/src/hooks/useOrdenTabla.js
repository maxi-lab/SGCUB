import { useMemo, useState } from 'react'

const compararTexto = new Intl.Collator('es', { sensitivity: 'base', numeric: true }).compare

const vacio = (valor) => valor === null || valor === undefined || valor === ''

function comparar(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return a - b
  return compararTexto(String(a), String(b))
}

function useOrdenTabla(filas, valores, ordenInicial = { columna: null, direccion: null }) {
  const [orden, setOrden] = useState(ordenInicial)

  const ordenarPor = (columna) => setOrden((actual) => ({
    columna,
    direccion: actual.columna === columna && actual.direccion === 'asc' ? 'desc' : 'asc',
  }))

  const obtenerValor = orden.columna ? valores[orden.columna] : null
  const ordenadas = useMemo(() => {
    if (!obtenerValor) return filas
    const signo = orden.direccion === 'desc' ? -1 : 1
    return [...filas].sort((filaA, filaB) => {
      const a = obtenerValor(filaA)
      const b = obtenerValor(filaB)
      if (vacio(a) || vacio(b)) return vacio(a) - vacio(b)
      return comparar(a, b) * signo
    })
  }, [filas, obtenerValor, orden.direccion])

  return { ordenadas, orden, ordenarPor }
}

export default useOrdenTabla
