import { useState } from 'react'
import CategoriaFormModal from '../components/categorias/CategoriaFormModal'
import CategoriasTable from '../components/categorias/CategoriasTable'
import ConfirmCategoriaModal from '../components/categorias/ConfirmCategoriaModal'
import useCategorias from '../hooks/useCategorias'

function Categorias() {
  const { categorias, isLoading, error, createCategoria, updateCategoria, deleteCategoria } = useCategorias()

  const [modalKey, setModalKey] = useState(0)
  const [form, setForm] = useState({ opened: false, categoria: null })
  const [deletion, setDeletion] = useState({ opened: false, categoria: null })

  const openForm = (categoria = null) => {
    setModalKey((key) => key + 1)
    setForm({ opened: true, categoria })
  }

  const openDeletion = (categoria) => {
    setModalKey((key) => key + 1)
    setDeletion({ opened: true, categoria })
  }

  const handleSubmitForm = (data) => (form.categoria
    ? updateCategoria(form.categoria.categoria_id, data)
    : createCategoria(data))

  return (
    <>
      <section className="padron-table-section" aria-label="Categorías">
        <CategoriasTable
          data={categorias}
          isLoading={isLoading}
          error={error}
          onAdd={() => openForm()}
          onEdit={openForm}
          onDelete={openDeletion}
        />
      </section>

      <CategoriaFormModal
        key={`form-${modalKey}`}
        opened={form.opened}
        onClose={() => setForm((current) => ({ ...current, opened: false }))}
        onSubmit={handleSubmitForm}
        categoria={form.categoria}
      />

      <ConfirmCategoriaModal
        key={`delete-${modalKey}`}
        opened={deletion.opened}
        onClose={() => setDeletion((current) => ({ ...current, opened: false }))}
        onConfirm={() => deleteCategoria(deletion.categoria.categoria_id)}
        categoria={deletion.categoria}
      />
    </>
  )
}

export default Categorias
