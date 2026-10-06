import { useEffect, useState } from 'react'
import { Modal } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { getSocio } from '../../api/socios'
import { getEstadoCuenta } from '../../api/estadoCuenta'
import { LoadingFile } from '../personas/FileStatus'
import { isActiveStatus } from '../personas/format'
import PagoForm from './PagoForm'
import SocioPicker from './SocioPicker'

const EMPTY_LOAD = { socioId: null, socio: null, cuenta: null, error: '' }

function ModalMessage({ icon, children }) {
  return (
    <div className="py-12 flex flex-col items-center gap-3 text-center text-on-surface-variant">
      <span className="material-symbols-outlined text-4xl text-outline" aria-hidden="true">{icon}</span>
      <p className="text-base max-w-md">{children}</p>
    </div>
  )
}

// Without `initialSocioId` the modal starts by asking for the socio
function RegisterPaymentModal({ opened, initialSocioId = null, initialCuotaIds, onClose, onSuccess }) {
  const isMobile = useMediaQuery('(max-width: 640px)')
  const [socioId, setSocioId] = useState(initialSocioId)
  const [load, setLoad] = useState(EMPTY_LOAD)

  useEffect(() => {
    if (!opened || !socioId) return undefined
    let active = true
    Promise.all([getSocio(socioId), getEstadoCuenta(socioId)])
      .then(([socio, cuenta]) => active && setLoad({ socioId, socio, cuenta, error: '' }))
      .catch(() => active && setLoad({ socioId, socio: null, cuenta: null, error: 'No se pudo cargar la cuenta corriente del socio.' }))
    return () => { active = false }
  }, [opened, socioId])

  const loading = Boolean(socioId) && load.socioId !== socioId
  const canChangeSocio = !initialSocioId && Boolean(socioId)

  const renderContent = () => {
    if (!socioId) {
      return <SocioPicker onSelect={(socio) => setSocioId(socio.socio_id)} description="Elegí el socio al que le vas a registrar el pago." />
    }
    if (loading) return <LoadingFile text="Cargando estado de cuenta..." />
    if (load.error || !load.socio || !load.cuenta) {
      return <ModalMessage icon="error">{load.error || 'No se encontró la cuenta corriente del socio.'}</ModalMessage>
    }
    if (!isActiveStatus(load.socio.estado_administrativo_nombre)) {
      return <ModalMessage icon="person_off">El socio está dado de baja. No se pueden registrar pagos a socios inactivos.</ModalMessage>
    }
    return (
      <PagoForm
        socio={load.socio}
        cuenta={load.cuenta}
        initialCuotaIds={initialCuotaIds}
        onCancel={onClose}
        onSuccess={onSuccess}
      />
    )
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<span className="text-xl font-bold text-on-surface">Registrar pago</span>}
      size="min(1240px, 95vw)"
      fullScreen={isMobile}
      centered
      padding="xl"
    >
      {canChangeSocio && (
        <button
          type="button"
          onClick={() => setSocioId(null)}
          className="mb-4 inline-flex items-center gap-1 px-2 py-1 -ml-2 rounded-md text-sm font-semibold text-primary hover:bg-primary/5 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]" aria-hidden="true">arrow_back</span>
          Elegir otro socio
        </button>
      )}
      {renderContent()}
    </Modal>
  )
}

export default RegisterPaymentModal
