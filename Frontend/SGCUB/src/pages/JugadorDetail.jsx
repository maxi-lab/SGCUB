import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { deleteJugador, getJugador, patchJugador } from '../api/jugadores'
import DeleteJugadorModal from '../components/jugadores/DeleteJugadorModal'
import EditJugadorModal from '../components/jugadores/EditJugadorModal'
import PersonHeader, { EditButton, DeleteButton } from '../components/personas/HeaderPersona'
import PersonTabs from '../components/personas/TabsNavPersonas'
import PersonalDataTab from '../components/personas/tabs/PersonalDataTab'
import FamilyTab from '../components/personas/tabs/FamilyTab'
import FinancialTab from '../components/personas/tabs/FinancialTab'
import DocumentationTab from '../components/personas/tabs/DocumentationTab'
import { LoadingFile, ErrorFile } from '../components/personas/FileStatus'
import { isActiveStatus, formatDni, formatDate, formatNumber, getErrorMessage } from '../components/personas/format'
import useCategorias from '../hooks/useCategorias'
import useFinancialStatus from '../hooks/useEstadoFinanciero'
import useEstados from '../hooks/useEstados'
import useJugadores from '../hooks/useJugadores'
import useLocalidades from '../hooks/useLocalidades'
import useSocio from '../hooks/useSocio'

const getFormFromPlayer = (player) => ({
  socio: String(player.socio?.socio_id ?? ''),
  nuevo_socio: {
    nombre: player.socio?.nombre ?? '',
    apellido: player.socio?.apellido ?? '',
    dni: player.socio?.dni ?? '',
    telefono: player.socio?.telefono ?? '',
    email: player.socio?.email ?? '',
  },
  categoria: String(player.categoria?.categoria_id ?? ''),
  estado: String(player.estado?.estado_id ?? ''),
  obra_social: player.obra_social ?? '',
  tallaIndumentaria: player.tallaIndumentaria ?? '',
  contactos_emergencia: (player.contactos_emergencia ?? []).map((c) => ({
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
  })),
})

function JugadorDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  // Guarda el id cargado para derivar "cargando" sin setState síncrono en el effect.
  const [carga, setCarga] = useState({ id: null, datos: null, error: null })
  const loading = carga.id !== id
  const jugador = carga.datos
  const error = carga.error
  const setJugador = (datos) => setCarga((actual) => ({ ...actual, datos }))

  const { socios } = useSocio()
  const { jugadores } = useJugadores()
  const { categorias } = useCategorias()
  const { estados } = useEstados()
  const { localidades } = useLocalidades()
  const financiero = useFinancialStatus(jugador?.socio?.socio_id)

  const [modalEdicionAbierto, setModalEdicionAbierto] = useState(false)
  const [guardandoEdicion, setGuardandoEdicion] = useState(false)
  const [errorEdicion, setErrorEdicion] = useState('')
  const [formulario, setFormulario] = useState(null)

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

  const abrirModalEdicion = () => {
    setErrorEdicion('')
    setFormulario(getFormFromPlayer(jugador))
    setModalEdicionAbierto(true)
  }

  const guardarEdicion = async (event) => {
    event.preventDefault()
    setGuardandoEdicion(true)
    setErrorEdicion('')
    try {
      const actualizado = await patchJugador(jugador.jugador_id, {
        socio: formulario.socio,
        categoria: formulario.categoria,
        estado: formulario.estado,
        obra_social: formulario.obra_social,
        tallaIndumentaria: formulario.tallaIndumentaria,
        contactos_emergencia: formulario.contactos_emergencia,
      })
      setJugador(actualizado)
      setModalEdicionAbierto(false)
    } catch (requestError) {
      setErrorEdicion(getErrorMessage(requestError, 'No se pudo editar el jugador.'))
    } finally {
      setGuardandoEdicion(false)
    }
  }

  // Se envía la lista completa de contactos porque el PATCH del jugador la reemplaza.
  const agregarContacto = async (contacto) => {
    try {
      const actualizado = await patchJugador(jugador.jugador_id, {
        contactos_emergencia: [...getFormFromPlayer(jugador).contactos_emergencia, contacto],
      })
      setJugador(actualizado)
    } catch (requestError) {
      throw new Error(getErrorMessage(requestError, 'No se pudo agregar el contacto.'), { cause: requestError })
    }
  }

  const eliminarContacto = async (contacto) => {
    try {
      const contactosRestantes = getFormFromPlayer(jugador).contactos_emergencia
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
            <EditButton onClick={abrirModalEdicion} />
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

      {formulario && (
        <EditJugadorModal
          opened={modalEdicionAbierto}
          onClose={() => !guardandoEdicion && setModalEdicionAbierto(false)}
          onSubmit={guardarEdicion}
          formulario={formulario}
          onChange={(campo, valor) => setFormulario((actual) => ({ ...actual, [campo]: valor }))}
          socios={socios}
          jugadores={jugadores}
          categorias={categorias}
          estados={estados}
          loading={guardandoEdicion}
          error={errorEdicion}
        />
      )}

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
