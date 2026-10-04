import { api } from './conf'

export const getResumenFinanciero = async () => {
  const response = await api.get('finanzas/resumen/')
  return response.data
}
