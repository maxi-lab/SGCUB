import { useContext } from 'react'
import { AssignBenefitContext } from '../components/finanzas/assignBenefitContext'

// Returns { openBenefit({ socioId, cuotaId?, onSuccess? }) }
export default function useAssignBenefit() {
  const context = useContext(AssignBenefitContext)
  if (!context) throw new Error('useAssignBenefit must be used inside AssignBenefitProvider')
  return context
}
