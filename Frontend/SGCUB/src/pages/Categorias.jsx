import { useState } from 'react'
import AddCategoriaModal from '../components/categorias/AddCategoriaModal'
import DeleteCategoriaModal from '../components/categorias/DeleteCategoriaModal'
import CategoriasTable from '../components/categorias/CategoriasTable'
import useCategorias from '../hooks/useCategorias'

const formularioInicial = () => ({
  nombre: '',
  anio_vigente: new Date().getFullYear(),
  edad_minima: '',
  edad_maxima: '',
  genero: null,
})

const mensajeError = (requestError, fallback) =>
  Object.values(requestError.response?.data || {})
    .flat()
    .join(' ') || fallback

function Categorias() {
  const { categorias, isLoading, error, crearCategoria, editarCategoria, eliminarCategoria } =
    useCategorias()
  const [modalAbierto, setModalAbierto] = useState(false)
  const [categoriaEnEdicion, setCategoriaEnEdicion] = useState(null)
  const [formulario, setFormulario] = useState(formularioInicial)
  const [guardando, setGuardando] = useState(false)
  const [errorGuardado, setErrorGuardado] = useState('')
  const [categoriaAEliminar, setCategoriaAEliminar] = useState(null)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminacion, setErrorEliminacion] = useState('')

  const actualizarCampo = (campo, valor) =>
    setFormulario((actual) => ({ ...actual, [campo]: valor }))

  const abrirModal = () => {
    setErrorGuardado('')
    setCategoriaEnEdicion(null)
    setFormulario(formularioInicial())
    setModalAbierto(true)
  }

  const abrirEdicion = (categoria) => {
    setErrorGuardado('')
    setCategoriaEnEdicion(categoria)
    setFormulario({
      nombre: categoria.nombre ?? '',
      anio_vigente: categoria.anio_vigente ?? new Date().getFullYear(),
      edad_minima: categoria.edad_minima ?? '',
      edad_maxima: categoria.edad_maxima ?? '',
      genero: categoria.genero ?? null,
    })
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    if (!guardando) {
      setModalAbierto(false)
    }
  }

  const guardarCategoria = async (event) => {
    event.preventDefault()
    setGuardando(true)
    setErrorGuardado('')
    try {
      if (categoriaEnEdicion) {
        await editarCategoria(categoriaEnEdicion.categoria_id, formulario)
      } else {
        await crearCategoria(formulario)
      }
      setFormulario(formularioInicial())
      setCategoriaEnEdicion(null)
      setModalAbierto(false)
    } catch (requestError) {
      setErrorGuardado(
        mensajeError(
          requestError,
          categoriaEnEdicion
            ? 'No se pudo modificar la categoría.'
            : 'No se pudo agregar la categoría.',
        ),
      )
    } finally {
      setGuardando(false)
    }
  }

  const confirmarEliminacion = async () => {
    setEliminando(true)
    setErrorEliminacion('')
    try {
      await eliminarCategoria(categoriaAEliminar.categoria_id)
      setCategoriaAEliminar(null)
    } catch (requestError) {
      setErrorEliminacion(
        requestError.response?.data?.detail || 'No se pudo eliminar la categoría.',
      )
    } finally {
      setEliminando(false)
    }
  }

  return (
    <>
      <section className="padron-table-section" aria-label="Categorías">
        <CategoriasTable
          data={categorias}
          isLoading={isLoading}
          error={error}
          onAdd={abrirModal}
          onEdit={abrirEdicion}
          onDelete={(categoria) => {
            setErrorEliminacion('')
            setCategoriaAEliminar(categoria)
          }}
        />
      </section>

      <AddCategoriaModal
        opened={modalAbierto}
        onClose={cerrarModal}
        onSubmit={guardarCategoria}
        formulario={formulario}
        onChange={actualizarCampo}
        loading={guardando}
        error={errorGuardado}
        editing={Boolean(categoriaEnEdicion)}
      />

      <DeleteCategoriaModal
        opened={Boolean(categoriaAEliminar)}
        onClose={() => {
          if (!eliminando) {
            setCategoriaAEliminar(null)
          }
        }}
        onConfirm={confirmarEliminacion}
        categoria={categoriaAEliminar}
        loading={eliminando}
        error={errorEliminacion}
      />
    </>
  )
}

export default Categorias
