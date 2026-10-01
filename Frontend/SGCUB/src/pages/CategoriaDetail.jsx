import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { deleteCategoria, getCategoria, patchCategoria } from '../api/categorias'
import { deleteDocenteCategoria, docenteCategoriaByCategoria, postDocenteCategoria } from '../api/docenteCategoria'
import { getJugadoresByCategoria } from '../api/jugadores'
import AsignarDocenteModal from '../components/categorias/AsignarDocenteModal'
import CategoriaDocenteTable from '../components/categorias/CategoriaDocenteTable'
import CategoriaFormModal from '../components/categorias/CategoriaFormModal'
import CategoriaHeader from '../components/categorias/CategoriaHeader'
import CategoriaJugadoresTable from '../components/categorias/CategoriaJugadoresTable'
import ConfirmCategoriaModal from '../components/categorias/ConfirmCategoriaModal'
import { GENERO_BADGE_CLASSES, getGeneroLabel } from '../components/categorias/categoriaFormat'
import { LoadingFile, ErrorFile } from '../components/personas/FileStatus'
import { DeactivateButton, EditButton } from '../components/personas/HeaderPersona'
import PersonTabs from '../components/personas/TabsNavPersonas'
import { EmptyState, PrimaryButton, TabHeader } from '../components/personas/tabs/parts'
import { getErrorMessage } from '../components/personas/format'
import useDocentes from '../hooks/useDocentes'

const fetchDetail = (id) => Promise.all([
  getCategoria(id),
  docenteCategoriaByCategoria(id),
  getJugadoresByCategoria(id).catch(() => null),
])

const ErrorAlert = ({ message }) => (
  <div className="bg-error-container text-on-error-container p-3 rounded-lg border border-error/30 flex items-center gap-2.5" role="alert">
    <span className="material-symbols-outlined text-error">error</span>
    <p className="text-base font-medium">{message}</p>
  </div>
)

function CategoriaDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { docentes } = useDocentes()

  const [detail, setDetail] = useState({ id: null, categoria: null, docenteCategorias: [], jugadores: null, error: null })
  const isLoading = detail.id !== id
  const { categoria, docenteCategorias, jugadores, error } = detail

  const [modalKey, setModalKey] = useState(0)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeletionOpen, setIsDeletionOpen] = useState(false)
  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const [assigningDocenteId, setAssigningDocenteId] = useState(null)
  const [docentesError, setDocentesError] = useState('')

  useEffect(() => {
    let active = true
    fetchDetail(id)
      .then(([receivedCategoria, receivedDocenteCategorias, receivedJugadores]) => {
        if (active) {
          setDetail({
            id,
            categoria: receivedCategoria,
            docenteCategorias: receivedDocenteCategorias,
            jugadores: receivedJugadores,
            error: null,
          })
        }
      })
      .catch((requestError) => {
        if (active) {
          setDetail({
            id,
            categoria: null,
            docenteCategorias: [],
            jugadores: null,
            error: getErrorMessage(requestError, 'No se pudo cargar la información de la categoría.'),
          })
        }
      })
    return () => { active = false }
  }, [id])

  const openModal = (setOpened) => {
    setModalKey((key) => key + 1)
    setOpened(true)
  }

  const reloadDocenteCategorias = async () => {
    const receivedDocenteCategorias = await docenteCategoriaByCategoria(id)
    setDetail((current) => ({ ...current, docenteCategorias: receivedDocenteCategorias }))
  }

  const handleUpdate = async (data) => {
    const updated = await patchCategoria(categoria.categoria_id, data)
    setDetail((current) => ({ ...current, categoria: updated }))
  }

  const handleDelete = async () => {
    await deleteCategoria(categoria.categoria_id)
    navigate('/padron/categorias')
  }

  const handleAssignDocente = async (docente) => {
    setAssigningDocenteId(docente.docente_id)
    setDocentesError('')
    try {
      await postDocenteCategoria({ docente_id: docente.docente_id, categoria_id: categoria.categoria_id })
      await reloadDocenteCategorias()
    } catch (requestError) {
      setDocentesError(getErrorMessage(requestError, 'No se pudo asignar el docente a la categoría.'))
    } finally {
      setAssigningDocenteId(null)
    }
  }

  const handleRemoveDocente = async (docenteCategoriaId) => {
    setDocentesError('')
    try {
      await deleteDocenteCategoria(docenteCategoriaId)
      await reloadDocenteCategorias()
    } catch (requestError) {
      setDocentesError(getErrorMessage(requestError, 'No se pudo quitar el docente de la categoría.'))
    }
  }

  if (isLoading) return <LoadingFile text="Cargando detalle de la categoría..." />
  if (error || !categoria) {
    return (
      <ErrorFile
        message={error || 'La categoría solicitada no existe.'}
        backTo="/padron/categorias"
        backText="Volver a categorías"
      />
    )
  }

  const tabs = [
    {
      id: 'jugadores',
      label: 'Jugadores',
      icon: 'groups',
      badge: jugadores ? { label: jugadores.length, tono: 'neutro' } : null,
      content: (
        <div className="flex flex-col gap-4">
          <TabHeader
            title="Jugadores"
            description="Jugadores con esta categoría como principal o secundaria."
          />
          {!jugadores && <ErrorAlert message="No se pudieron cargar los jugadores de la categoría." />}
          {jugadores?.length === 0 && (
            <EmptyState icon="groups" title="Sin jugadores" description="Todavía no hay jugadores en esta categoría." />
          )}
          {jugadores?.length > 0 && <CategoriaJugadoresTable jugadores={jugadores} categoriaId={categoria.categoria_id} />}
        </div>
      ),
    },
    {
      id: 'docentes',
      label: 'Docentes',
      icon: 'school',
      badge: { label: docenteCategorias.length, tono: 'neutro' },
      content: (
        <div className="flex flex-col gap-4">
          <TabHeader
            title="Docentes"
            description="Cuerpo técnico asignado a esta categoría."
            actions={(
              <PrimaryButton icon="person_add" onClick={() => openModal(setIsAssignOpen)}>
                Asignar docente
              </PrimaryButton>
            )}
          />
          {docentesError && <ErrorAlert message={docentesError} />}
          {docenteCategorias.length === 0 ? (
            <EmptyState icon="school" title="Sin docentes" description="Todavía no hay docentes asignados a esta categoría." />
          ) : (
            <CategoriaDocenteTable docenteCategorias={docenteCategorias} onDelete={handleRemoveDocente} />
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col w-full pb-8">
      <CategoriaHeader
        breadcrumb={[
          { label: 'Categorías', to: '/padron/categorias' },
          { label: categoria.nombre },
        ]}
        title={categoria.nombre}
        badge={GENERO_BADGE_CLASSES[categoria.genero] && (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-semibold ${GENERO_BADGE_CLASSES[categoria.genero]}`}>
            {getGeneroLabel(categoria.genero)}
          </span>
        )}
        metadata={[
          { label: 'Año vigente', value: categoria.anio_vigente ?? '—' },
          { label: 'Edad máxima', value: categoria.edad_maxima != null ? `${categoria.edad_maxima} años` : '—' },
          { label: 'Género', value: getGeneroLabel(categoria.genero) },
        ]}
        actions={(
          <>
            <EditButton onClick={() => openModal(setIsFormOpen)}>Editar categoría</EditButton>
            <DeactivateButton icon="delete" onClick={() => openModal(setIsDeletionOpen)}>Eliminar</DeactivateButton>
          </>
        )}
      />

      <PersonTabs tabs={tabs} />

      <CategoriaFormModal
        key={`form-${modalKey}`}
        opened={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleUpdate}
        categoria={categoria}
      />

      <ConfirmCategoriaModal
        key={`delete-${modalKey}`}
        opened={isDeletionOpen}
        onClose={() => setIsDeletionOpen(false)}
        onConfirm={handleDelete}
        categoria={categoria}
      />

      <AsignarDocenteModal
        opened={isAssignOpen}
        onClose={() => !assigningDocenteId && setIsAssignOpen(false)}
        docentes={docentes}
        docentesAsignados={docenteCategorias}
        onAssign={handleAssignDocente}
        loading={assigningDocenteId}
      />
    </div>
  )
}

export default CategoriaDetail
