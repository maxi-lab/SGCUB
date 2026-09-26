import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/conf'
import DocentesTable from '../components/docentes/DocentesTable'
import { exportarNominaCSV } from '../components/docentes/docentesUtils'
import PageHeader from '../components/shared/PageHeader'
import StatCard from '../components/shared/StatCard'
import useCategorias from '../hooks/useCategorias'
import useDocentes from '../hooks/useDocentes'

function Docentes() {
  const navigate = useNavigate()
  const { docentes, isLoading, error } = useDocentes()
  const { categorias } = useCategorias()
  const [categoriasPorDocente, setCategoriasPorDocente] = useState({})

  useEffect(() => {
    let cancelado = false
    api.get('padron/docente-categoria/')
      .then((response) => {
        if (cancelado) return
        const agrupadas = {}
        ;(response.data ?? []).forEach(({ docente, categoria, cargo }) => {
          if (!docente || !categoria) return
          agrupadas[docente.docente_id] = [...(agrupadas[docente.docente_id] ?? []), { ...categoria, cargo }]
        })
        setCategoriasPorDocente(agrupadas)
      })
      .catch(() => {
        if (!cancelado) setCategoriasPorDocente({})
      })
    return () => {
      cancelado = true
    }
  }, [])

  return (
    <div className="w-full flex flex-col gap-5">
      <PageHeader
        breadcrumb={[{ label: 'Personas' }, { label: 'Docentes' }]}
        title="Docentes y Cuerpo Técnico"
        actions={(
          <>
            <button
              type="button"
              onClick={() => exportarNominaCSV(docentes, categoriasPorDocente)}
              disabled={docentes.length === 0}
              className="inline-flex items-center gap-2 bg-surface-container-low hover:bg-surface-container-high border border-outline-variant/40 text-on-surface px-4 py-2 rounded shadow-sm font-label-lg text-base font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">file_download</span>
              <span className="text-xl">Exportar nómina</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('/padron/docentes/nuevo')}
              className="inline-flex items-center gap-2 bg-primary text-on-primary hover:bg-primary/90 px-4 py-2 rounded shadow-sm font-label-lg text-base font-medium transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]" aria-hidden="true">person_add</span>
              <span className="text-xl"> Nuevo docente</span>
            </button>
          </>
        )}
      />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
        <StatCard label="Total Docentes" value={docentes.length.toLocaleString('es-AR')} icon="school" tone="neutral" />
      </div>
      <section aria-label="Docentes">
        <DocentesTable
          data={docentes}
          categorias={categorias}
          categoriasPorDocente={categoriasPorDocente}
          isLoading={isLoading}
          error={error}
        />
      </section>
    </div>
  )
}

export default Docentes
