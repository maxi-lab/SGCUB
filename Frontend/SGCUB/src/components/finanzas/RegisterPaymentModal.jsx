import { useEffect, useState } from 'react'
import { Modal } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { getSocio } from '../../api/socios'
import { getEstadoCuenta } from '../../api/estadoCuenta'
import useAssignBenefit from '../../hooks/useAssignBenefit'
import { isActiveStatus } from '../personas/format'
import PagoForm from './PagoForm'
import SocioPicker from './SocioPicker'

const EMPTY_LOAD = { socioId: null, socio: null, cuenta: null, error: '' }

function HeaderMessage({ icon, tone = 'text-on-surface-variant', spin = false, children }) {
  return (
    <p className={`flex items-center gap-2 h-11 text-base ${tone}`} role={tone === 'text-error' ? 'alert' : 'status'}>
      <span className={`material-symbols-outlined text-[20px] ${spin ? 'animate-spin' : ''}`} aria-hidden="true">{icon}</span>
      {children}
    </p>
  )
}

// Always shows the payment form layout. Until a valid socio is loaded the form is empty and its
// header holds the socio search (or the loading / error state); then the sections fill in.
// Without `initialSocioId` the modal starts with the search.
function RegisterPaymentModal({ opened, initialSocioId = null, initialCuotaIds, onClose, onSuccess }) {
  const isMobile = useMediaQuery('(max-width: 640px)')
  const [socioId, setSocioId] = useState(initialSocioId)
  const [load, setLoad] = useState(EMPTY_LOAD)
  const { openBenefit } = useAssignBenefit()

  useEffect(() => {
    if (!opened || !socioId) return undefined
    let active = true
    Promise.all([getSocio(socioId), getEstadoCuenta(socioId)])
      .then(([socio, cuenta]) => active && setLoad({ socioId, socio, cuenta, error: '' }))
      .catch(() => active && setLoad({ socioId, socio: null, cuenta: null, error: 'No se pudo cargar la cuenta corriente del socio.' }))
    return () => { active = false }
  }, [opened, socioId])

  const reloadAccount = (loadedSocioId) => getEstadoCuenta(loadedSocioId)
    .then((cuenta) => setLoad((current) => (current.socioId === loadedSocioId ? { ...current, cuenta } : current)))
    .catch(() => {})

  const assignBenefit = () => openBenefit({
    socioId: load.socioId,
    onSuccess: () => {
      reloadAccount(load.socioId)
      onSuccess?.()
    },
  })

  const loading = Boolean(socioId) && load.socioId !== socioId
  const loaded = Boolean(socioId) && !loading && !load.error && load.socio && load.cuenta
  const ready = loaded && isActiveStatus(load.socio.estado_administrativo_nombre)

  const emptyHeader = () => {
    if (!socioId) return <SocioPicker compact onSelect={(socio) => setSocioId(socio.socio_id)} />
    if (loading) return <HeaderMessage icon="progress_activity" spin>Cargando estado de cuenta...</HeaderMessage>
    if (!loaded) {
      return <HeaderMessage icon="error" tone="text-error">{load.error || 'No se encontró la cuenta corriente del socio.'}</HeaderMessage>
    }
    return <HeaderMessage icon="person_off" tone="text-error">El socio está dado de baja. No se pueden registrar pagos a socios inactivos.</HeaderMessage>
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      aria-label="Registrar pago"
      title={(
        <button
          type="button"
          onClick={() => setSocioId(null)}
          disabled={!socioId}
          className="inline-flex items-center gap-1 ml-2 rounded-md text-sm font-semibold text-primary hover:bg-primary/5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-default disabled:hover:bg-transparent"
        >
          <span className="material-symbols-outlined text-[18px] -ml-1" aria-hidden="true">arrow_back</span>
          Elegir otro socio
        </button>
      )}
      size="min(1240px, 95vw)"
      fullScreen={isMobile}
      centered
      padding="xl"
    >
      {ready ? (
        // Keyed by socio so the selection state starts fresh for each one
        <PagoForm
          key={load.socio.socio_id}
          socio={load.socio}
          cuenta={load.cuenta}
          initialCuotaIds={initialCuotaIds}
          onCancel={onClose}
          onSuccess={onSuccess}
          onAssignBenefit={assignBenefit}
        />
      ) : (
        <PagoForm key="empty" emptyHeader={emptyHeader()} onCancel={onClose} />
      )}
    </Modal>
  )
}

export default RegisterPaymentModal
