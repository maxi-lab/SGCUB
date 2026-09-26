import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { deleteJugador, getJugador, patchJugador } from '../api/jugadores'
import DeleteJugadorModal from '../components/jugadores/DeleteJugadorModal'
import PersonHeader, { EditButton, DeleteButton } from '../components/personas/HeaderPersona'
import PersonTabs from '../components/personas/TabsNavPersonas'
import PersonalDataTab from '../components/personas/tabs/PersonalDataTab'
import FamilyTab from '../components/personas/tabs/FamilyTab'
import FinancialTab from '../components/personas/tabs/FinancialTab'
import DocumentationTab from '../components/personas/tabs/DocumentationTab'
import { LoadingFile, ErrorFile } from '../components/personas/FileStatus'
import { isActiveStatus, formatDni, formatDate, formatNumber, getErrorMessage } from '../components/personas/format'
import useFinancialStatus from '../hooks/useEstadoFinanciero'
import useLocalidades from '../hooks/useLocalidades'

const getContacts = (player) => (player.contactos_emergencia ?? []).map((c) => ({
  contacto_emergencia_id: c.contacto_emergencia_id,
  persona: {
    nombre: c.persona?.nombre ?? '',
    apellido: c.persona?.apellido ?? '',
    dni: c.persona?.dni ?? '',
    telefono: c.persona?.telefono ?? '',
    email: c.persona?.email ?? null,
  },
  relacion: c.relacion ?? '',
  responsable_legal: Boolean(c.responsable_legal),
}))

function JugadorDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [carga, setCarga] = useState({ id: null, datos: null, error: null })
  const loading = carga.id !== id
  const jugador = carga.datos
  const error = carga.error
  const setJugador = (datos) => setCarga((actual) => ({ ...actual, datos }))

  const { localidades } = useLocalidades()
  const financiero = useFinancialStatus(jugador?.socio?.socio_id)

  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminacion, setErrorEliminacion] = useState('')

  useEffect(() => {
    let activo = true
    getJugador(id)
      .then((datos) => activo && setCarga({ id, datos, error: null }))
      .catch((requestError) => {
        if (activo) setCarga({ id, datos: null, error: requestError.response?.data?.detail || 'No se pudo cargar la información del jugador.' })
      })
    return () => { activo = false }
  }, [id])


  const agregarContacto = async (contacto) => {
    try {
      const actualizado = await patchJugador(jugador.jugador_id, {
        contactos_emergencia: [...getContacts(jugador), contacto],
      })
      setJugador(actualizado)
    } catch (requestError) {
      throw new Error(getErrorMessage(requestError, 'No se pudo agregar el contacto.'), { cause: requestError })
    }
  }

  const eliminarContacto = async (contacto) => {
    try {
      const contactosRestantes = getContacts(jugador)
        .filter((item) => item.contacto_emergencia_id !== contacto.contacto_emergencia_id)
      const actualizado = await patchJugador(jugador.jugador_id, {
        contactos_emergencia: contactosRestantes,
      })
      setJugador(actualizado)
    } catch (requestError) {
      throw new Error(getErrorMessage(requestError, 'No se pudo eliminar el contacto.'), { cause: requestError })
    }
  }

  const confirmarEliminacion = async () => {
    setEliminando(true)
    setErrorEliminacion('')
    try {
      await deleteJugador(jugador.jugador_id)
      setModalEliminarAbierto(false)
      navigate('/padron/jugadores')
    } catch (requestError) {
      setErrorEliminacion(requestError.response?.data?.detail || 'No se pudo eliminar el jugador.')
    } finally {
      setEliminando(false)
    }
  }

  if (loading) return <LoadingFile text="Cargando detalle del jugador..." />
  if (error || !jugador) {
    return (
      <ErrorFile
        message={error || 'El jugador solicitado no existe o no se pudo encontrar.'}
        backTo="/padron/jugadores"
        backText="Volver a jugadores"
      />
    )
  }

  const socio = jugador.socio ?? {}
  const contactos = jugador.contactos_emergencia ?? []

  const tabs = [
    {
      id: 'datos-personales',
      label: 'Datos personales',
      icon: 'person',
      content: (
        <PersonalDataTab
          persona={socio}
          localidades={localidades}
          deportivo={{
            categoria: jugador.categoria?.nombre,
            categoria_secundaria: jugador.categoria_secundaria?.nombre,
            estado: jugador.estado?.nombre,
            obra_social: jugador.obra_social,
            talla: jugador.tallaIndumentaria,
          }}
        />
      ),
    },
    {
      id: 'familiar',
      label: 'Familiar / Contactos',
      icon: 'family_restroom',
      badge: contactos.length ? { label: contactos.length, tono: 'info' } : undefined,
      content: <FamilyTab contacts={contactos} onAdd={agregarContacto} onDelete={eliminarContacto} />,
    },
    {
      id: 'documentacion',
      label: 'Documentación',
      icon: 'folder_shared',
      content: <DocumentationTab />,
    },
    {
      id: 'financiero',
      label: 'Financiero',
      icon: 'account_balance_wallet',
      badge: financiero.isLoading || financiero.error ? undefined : financiero.situacion,
      content: <FinancialTab {...financiero} />,
    },
  ]

  return (
    <div className="flex flex-col w-full pb-8">
      <PersonHeader
        breadcrumb={[
          { label: 'Personas' },
          { label: 'Jugadores', to: '/padron/jugadores' },
          { label: `Jugador ${formatNumber(jugador.jugador_id)}` },
        ]}
        name={socio.nombre}
        surname={socio.apellido}
        status={jugador.estado?.nombre ? { label: jugador.estado.nombre, isActive: isActiveStatus(jugador.estado.nombre) } : null}
        metadata={[
          { label: 'DNI', value: formatDni(socio.dni) },
          { label: 'Socio N°', value: formatNumber(socio.numero_socio), highlighted: true },
          { label: 'Categoría', value: jugador.categoria?.nombre || '—' },
          { label: 'Fecha de alta', value: formatDate(socio.fecha_alta) },
        ]}
        actions={(
          <>
            <EditButton onClick={() => navigate(`/padron/jugadores/${jugador.jugador_id}/editar`)} />
            <DeleteButton
              onClick={() => {
                setErrorEliminacion('')
                setModalEliminarAbierto(true)
              }}
            />
          </>
        )}
      />

      <PersonTabs tabs={tabs} />

      <DeleteJugadorModal
        opened={modalEliminarAbierto}
        onClose={() => !eliminando && setModalEliminarAbierto(false)}
        onConfirm={confirmarEliminacion}
        jugador={jugador}
        loading={eliminando}
        error={errorEliminacion}
      />
    </div>
  )
}

export default JugadorDetail
