import { useEffect, useState } from 'react'
import { api } from '../api/conf'
import AddDocenteModal from '../components/docentes/AddDocenteModal'
import DocentesTable from '../components/docentes/DocentesTable'
import { exportarNominaCSV } from '../components/docentes/docentesUtils'
import PageHeader from '../components/shared/PageHeader'
import StatCard from '../components/shared/StatCard'
import useCategorias from '../hooks/useCategorias'
import useDocentes from '../hooks/useDocentes'
import useGeneros from '../hooks/useGeneros'
import useLocalidades from '../hooks/useLocalidades'

const formularioInicial = () => ({
  nombre: '', apellido: '', dni: '', email: '', telefono: '',
  fecha_nacimiento: '', genero: '', genero_otro: '',
  domicilio_calle: '', domicilio_numero: '', domicilio_piso: '',
  domicilio_departamento: '', domicilio_entre_calle_1: '', domicilio_entre_calle_2: '',
  domicilio_barrio: '', domicilio_localidad: '', legajo: '', fecha_ingreso: '', persona: null,
})

function Docentes() {
  const { docentes, isLoading, error, crearDocente } = useDocentes()
  const { categorias } = useCategorias()
  const { generos } = useGeneros()
  const { localidades } = useLocalidades()
  const [categoriasPorDocente, setCategoriasPorDocente] = useState({})
  const [modalAbierto, setModalAbierto] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [errorGuardado, setErrorGuardado] = useState('')
  const [formulario, setFormulario] = useState(formularioInicial)

  useEffect(() => {
    let cancelado = false
    api.get('padron/docente-categoria/')
      .then((response) => {
        if (cancelado) return
        const agrupadas = {}
        ;(response.data ?? []).forEach(({ docente, categoria }) => {
          if (!docente || !categoria) return
          agrupadas[docente.docente_id] = [...(agrupadas[docente.docente_id] ?? []), categoria]
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

  const actualizarCampo = (campo, valor) => setFormulario((actual) => ({ ...actual, [campo]: valor }))

  const abrirModal = () => {
    setErrorGuardado('')
    setFormulario(formularioInicial())
    setModalAbierto(true)
  }

  const guardarDocente = async (event) => {
    event.preventDefault()
    setGuardando(true)
    setErrorGuardado('')

    try {
      let personaId = formulario.persona
      if (!personaId) {
        const personasResponse = await api.get(`padron/persona/?dni=${encodeURIComponent(formulario.dni)}`)
        const personaExistente = personasResponse.data?.[0]

        if (personaExistente) {
          personaId = personaExistente.persona_id
        } else {
          const personaResponse = await api.post('padron/persona/', {
            nombre: formulario.nombre,
            apellido: formulario.apellido,
            dni: formulario.dni,
            email: formulario.email,
            telefono: formulario.telefono,
            fecha_nacimiento: formulario.fecha_nacimiento || null,
            genero: formulario.genero || null,
            genero_otro: formulario.genero_otro || '',
            domicilio_calle: formulario.domicilio_calle,
            domicilio_numero: formulario.domicilio_numero,
            domicilio_piso: formulario.domicilio_piso,
            domicilio_departamento: formulario.domicilio_departamento,
            domicilio_entre_calle_1: formulario.domicilio_entre_calle_1,
            domicilio_entre_calle_2: formulario.domicilio_entre_calle_2,
            domicilio_barrio: formulario.domicilio_barrio,
            domicilio_localidad: formulario.domicilio_localidad || null,
          })
          personaId = personaResponse.data.persona_id
        }
      }
      await crearDocente({
        persona: personaId,
        legajo: Number(formulario.legajo),
        ...(formulario.fecha_ingreso ? { fecha_ingreso: formulario.fecha_ingreso } : {}),
      })
      setFormulario(formularioInicial())
      setModalAbierto(false)
    } catch (requestError) {
      const errorData = requestError.response?.data
      let errorMsg = 'No se pudo agregar el docente.'
      if (errorData) {
        if (typeof errorData === 'string') {
          errorMsg = errorData
        } else if (errorData.detail) {
          errorMsg = errorData.detail
        } else {
          errorMsg = Object.entries(errorData)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(' ') : typeof v === 'object' ? JSON.stringify(v) : v}`)
            .join(' | ')
        }
      }
      setErrorGuardado(errorMsg)
    } finally {
      setGuardando(false)
    }
  }

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
              onClick={abrirModal}
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

      <AddDocenteModal
        opened={modalAbierto}
        onClose={() => !guardando && setModalAbierto(false)}
        onSubmit={guardarDocente}
        formulario={formulario}
        onChange={actualizarCampo}
        docentes={docentes}
        generos={generos}
        localidades={localidades}
        loading={guardando}
        error={errorGuardado}
      />
    </div>
  )
}

export default Docentes
