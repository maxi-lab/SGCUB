import { useEffect, useState } from 'react'
import { Modal } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { getEstadoCuenta } from '../../api/estadoCuenta'
import { getSocio } from '../../api/socios'
import { formatDni, formatNumber } from '../personas/format'
import { formatPeriod } from '../shared/periodFormat'
import BenefitForm from './BenefitForm'

const EMPTY_LOAD = { socioId: null, socio: null, cuenta: null, error: '' }

const MODAL_Z_INDEX = 300

function HeaderMessage({ icon, tone = 'text-on-surface-variant', spin = false, children }) {
  return (
    <span className={`flex items-center gap-2 text-base font-normal ${tone}`} role={tone === 'text-error' ? 'alert' : 'status'}>
      <span className={`material-symbols-outlined text-[20px] ${spin ? 'animate-spin' : ''}`} aria-hidden="true">{icon}</span>
      {children}
    </span>
  )
}

function AssignBenefitModal({ opened, socioId, cuotaId, onClose, onSuccess }) {
  const isMobile = useMediaQuery('(max-width: 640px)')
  const [load, setLoad] = useState(EMPTY_LOAD)

  useEffect(() => {
    if (!opened || !socioId) return undefined
    let active = true
    Promise.all([getSocio(socioId), getEstadoCuenta(socioId)])
      .then(([socio, cuenta]) => active && setLoad({ socioId, socio, cuenta, error: '' }))
      .catch(() => active && setLoad({ socioId, socio: null, cuenta: null, error: 'No se pudo cargar la cuenta corriente del socio.' }))
    return () => { active = false }
  }, [opened, socioId])

  const loading = load.socioId !== socioId
  const ready = !loading && !load.error && load.socio && load.cuenta
  const socio = load.socio
  const cuota = cuotaId ? load.cuenta?.cuotas?.find((item) => item.cuota_id === cuotaId) : null

  const handleSuccess = () => {
    onSuccess?.()
    onClose()
  }

  const title = (
    <span className="flex flex-col min-w-0">
      <span className="text-sm uppercase tracking-wider font-semibold text-primary">Asignar beca o descuento a</span>
      {ready ? (
        <>
          <span className="text-xl font-bold text-on-surface truncate">{socio.apellido}, {socio.nombre}</span>
          <span className="text-base font-normal text-on-surface-variant">
            DNI {formatDni(socio.dni)} · Socio {formatNumber(socio.numero_socio)}
            {cuota && ` · Cuota ${formatPeriod(cuota.periodo)}`}
          </span>
        </>
      ) : loading ? (
        <HeaderMessage icon="progress_activity" spin>Cargando estado de cuenta...</HeaderMessage>
      ) : (
        <HeaderMessage icon="error" tone="text-error">{load.error || 'No se encontró la cuenta corriente del socio.'}</HeaderMessage>
      )}
    </span>
  )

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={title}
      styles={{ header: { alignItems: 'flex-start' }, title: { flex: 1, minWidth: 0 } }}
      size="min(1240px, 95vw)"
      fullScreen={isMobile}
      centered
      padding="xl"
      zIndex={MODAL_Z_INDEX}
    >
      {ready ? (
        <BenefitForm
          socio={load.socio}
          cuenta={load.cuenta}
          initialCuotaId={cuotaId}
          onCancel={onClose}
          onSuccess={handleSuccess}
        />
      ) : (
        <BenefitForm key="empty" initialCuotaId={cuotaId} onCancel={onClose} />
      )}
    </Modal>
  )
}

export default AssignBenefitModal
