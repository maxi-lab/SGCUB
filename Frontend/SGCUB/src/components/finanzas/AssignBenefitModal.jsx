import { useEffect, useState } from 'react'
import { postBeneficio } from '../../api/cuotas'
import { getEstadoCuenta } from '../../api/estadoCuenta'
import BecaDescuentoModal from './BecaDescuentoModal'

const EMPTY_LOAD = { socioId: null, cuenta: null, error: '' }

// Loads the socio's account statement and opens the benefit form for the requested cuota
function AssignBenefitModal({ opened, socioId, cuotaId, onClose, onSuccess }) {
  const [load, setLoad] = useState(EMPTY_LOAD)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!opened || !socioId) return undefined
    let active = true
    getEstadoCuenta(socioId)
      .then((cuenta) => active && setLoad({ socioId, cuenta, error: '' }))
      .catch(() => active && setLoad({ socioId, cuenta: null, error: 'No se pudo cargar la cuenta corriente del socio.' }))
    return () => { active = false }
  }, [opened, socioId])

  const cuota = load.cuenta?.cuotas?.find((item) => item.cuota_id === cuotaId) ?? null

  // Request errors propagate to the form, which shows them
  const applyBenefit = async (benefit) => {
    setSaving(true)
    try {
      await postBeneficio(cuota.cuota_id, benefit)
      onSuccess?.()
      onClose()
    } finally {
      setSaving(false)
    }
  }

  return (
    <BecaDescuentoModal
      opened={opened}
      cuota={cuota}
      onClose={() => !saving && onClose()}
      onSubmit={applyBenefit}
      isSaving={saving}
    />
  )
}

export default AssignBenefitModal
