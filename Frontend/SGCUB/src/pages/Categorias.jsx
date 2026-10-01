import { useMemo, useState } from 'react'
import CategoriaFormModal from '../components/categorias/CategoriaFormModal'
import CategoriasTable from '../components/categorias/CategoriasTable'
import ConfirmCategoriaModal from '../components/categorias/ConfirmCategoriaModal'
import PageHeader from '../components/shared/PageHeader'
import StatCard from '../components/shared/StatCard'
import useCategorias from '../hooks/useCategorias'

const format = (value) => value.toLocaleString('es-AR')

function Categorias() {
  const { categorias, isLoading, error, createCategoria, updateCategoria, deleteCategoria } = useCategorias()

  const [modalKey, setModalKey] = useState(0)
  const [form, setForm] = useState({ opened: false, categoria: null })
  const [deletion, setDeletion] = useState({ opened: false, categoria: null })
  const [notice, setNotice] = useState('')

  const totals = useMemo(() => ({
    total: format(categorias.length),
    male: format(categorias.filter((categoria) => categoria.genero === 'M').length),
    female: format(categorias.filter((categoria) => categoria.genero === 'F').length),
  }), [categorias])

  const openForm = (categoria = null) => {
    setModalKey((key) => key + 1)
    setForm({ opened: true, categoria })
  }

  const openDeletion = (categoria) => {
    setModalKey((key) => key + 1)
    setDeletion({ opened: true, categoria })
  }

  const handleSubmitForm = async (data) => {
    if (form.categoria) {
      await updateCategoria(form.categoria.categoria_id, data)
      setNotice(`Se actualizó la categoría ${data.nombre}.`)
      return
    }
    await createCategoria(data)
    setNotice(`Se creó la categoría ${data.nombre}.`)
  }

  const handleDelete = async () => {
    await deleteCategoria(deletion.categoria.categoria_id)
    setNotice(`Se eliminó la categoría ${deletion.categoria.nombre}.`)
  }

  return (
    <div className="w-full flex flex-col gap-5">
      <PageHeader
        breadcrumb={[{ label: 'Categorías' }]}
        title="Categorías"
        actions={(
          <button
            type="button"
            onClick={() => openForm()}
            className="inline-flex items-center gap-2 bg-primary text-on-primary hover:bg-primary/90 px-4 py-2 rounded shadow-sm font-label-lg text-base font-medium transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">add</span>
            <span className="text-xl"> Nueva categoría</span>
          </button>
        )}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-10">
        <StatCard label="Total categorías" value={totals.total} icon="sports_soccer" tone="neutral" />
        <StatCard label="Masculinas" value={totals.male} icon="man" tone="neutral" />
        <StatCard label="Femeninas" value={totals.female} icon="woman" tone="neutral" />
      </div>

      {notice && (
        <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-3 rounded-lg flex items-center gap-2.5" role="status">
          <span className="material-symbols-outlined text-emerald-700" aria-hidden="true">check_circle</span>
          <p className="text-base font-medium flex-1">{notice}</p>
          <button
            type="button"
            onClick={() => setNotice('')}
            className="p-1 rounded text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
            aria-label="Cerrar aviso"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
          </button>
        </div>
      )}

      <section aria-label="Categorías">
        <CategoriasTable
          data={categorias}
          isLoading={isLoading}
          error={error}
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
        onConfirm={handleDelete}
        categoria={deletion.categoria}
      />
    </div>
  )
}

export default Categorias
