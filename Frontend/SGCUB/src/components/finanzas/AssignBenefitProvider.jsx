import { useCallback, useMemo, useState } from 'react'
import { AssignBenefitContext } from './assignBenefitContext'
import AssignBenefitModal from './AssignBenefitModal'

// Mounted once in the main layout, wrapping the payment provider, so any screen
// (the payment modal included) can open the benefit modal on top of it
function AssignBenefitProvider({ children }) {
  const [request, setRequest] = useState({ id: 0, opened: false, socioId: null, cuotaId: null, onSuccess: null })

  const openBenefit = useCallback(({ socioId, cuotaId = null, onSuccess = null }) => {
    setRequest((current) => ({ id: current.id + 1, opened: true, socioId, cuotaId, onSuccess }))
  }, [])

  // Keep the request data while closing so the modal doesn't flash empty during its exit animation
  const close = useCallback(() => setRequest((current) => ({ ...current, opened: false })), [])

  const value = useMemo(() => ({ openBenefit }), [openBenefit])

  return (
    <AssignBenefitContext.Provider value={value}>
      {children}
      <AssignBenefitModal
        key={request.id}
        opened={request.opened}
        socioId={request.socioId}
        cuotaId={request.cuotaId}
        onClose={close}
        onSuccess={request.onSuccess ?? undefined}
      />
    </AssignBenefitContext.Provider>
  )
}

export default AssignBenefitProvider
