import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { deleteSocio, getSocio } from '../api/socios'
import DeleteSocioModal from '../components/socios/DeleteSocioModal'
import PersonHeader, { EditButton, DeleteButton } from '../components/personas/HeaderPersona'
import PersonTabs from '../components/personas/TabsNavPersonas'
import PersonalDataTab from '../components/personas/tabs/PersonalDataTab'
import FinancialTab from '../components/personas/tabs/FinancialTab'
import { LoadingFile, ErrorFile } from '../components/personas/FileStatus'
import { yearsSince, isActiveStatus, formatDni, formatDate, formatNumber, yearsText } from '../components/personas/format'
import useFinancialStatus from '../hooks/useEstadoFinanciero'
import useLocalidades from '../hooks/useLocalidades'

function SocioDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { localidades } = useLocalidades()
  const financiero = useFinancialStatus(id)

  // Guarda el id cargado para derivar "cargando" sin setState síncrono en el effect.
  const [carga, setCarga] = useState({ id: null, datos: null, error: null })
  const loading = carga.id !== id
  const socio = carga.datos
  const error = carga.error

  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [errorEliminacion, setErrorEliminacion] = useState('')

  useEffect(() => {
    let activo = true
    getSocio(id)
      .then((datos) => activo && setCarga({ id, datos, error: null }))
      .catch((requestError) => {
        if (activo) setCarga({ id, datos: null, error: requestError.response?.data?.detail || 'Error al cargar el detalle del socio.' })
      })
    return () => { activo = false }
  }, [id])

  const confirmarEliminacion = async () => {
    setEliminando(true)
    setErrorEliminacion('')
    try {
      await deleteSocio(socio.socio_id)
      setModalEliminarAbierto(false)
      navigate('/padron/socios')
    } catch (requestError) {
      setErrorEliminacion(requestError.response?.data?.detail || 'No se pudo eliminar el socio.')
    } finally {
      setEliminando(false)
    }
  }

  if (loading) return <LoadingFile text="Cargando detalle del socio..." />
  if (error || !socio) {
    return <ErrorFile message={error || 'El socio solicitado no existe.'} backTo="/padron/socios" backText="Volver al padrón" />
  }

  const tabs = [
    {
      id: 'datos-personales',
      label: 'Datos personales',
      icon: 'person',
      content: <PersonalDataTab persona={socio} localidades={localidades} />,
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
          { label: 'Socios', to: '/padron/socios' },
          { label: `Socio ${formatNumber(socio.numero_socio)}` },
        ]}
        name={socio.nombre}
        surname={socio.apellido}
        status={socio.estado_socio_nombre ? { label: socio.estado_socio_nombre, isActive: isActiveStatus(socio.estado_socio_nombre) } : null}
        metadata={[
          { label: 'DNI', value: formatDni(socio.dni) },
          { label: 'Socio N°', value: formatNumber(socio.numero_socio), highlighted: true },
          { label: 'Fecha de alta', value: formatDate(socio.fecha_alta) },
          { label: 'Antigüedad', value: yearsText(yearsSince(socio.fecha_alta)) },
        ]}
        actions={(
          <>
            <EditButton onClick={() => navigate(`/padron/socios/${socio.socio_id}/editar`)} />
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

      <DeleteSocioModal
        opened={modalEliminarAbierto}
        onClose={() => !eliminando && setModalEliminarAbierto(false)}
        onConfirm={confirmarEliminacion}
        socio={socio}
        loading={eliminando}
        error={errorEliminacion}
      />
    </div>
  )
}

export default SocioDetail
