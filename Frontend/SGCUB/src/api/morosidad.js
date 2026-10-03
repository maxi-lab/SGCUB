import { api } from './conf'

export const getReporteMorosidad = async ({ alcance, q, categoria, socioIds, socioId }) => {
  const params = { alcance }
  if (q) params.q = q
  if (categoria) params.categoria = categoria
  if (socioIds?.length) params.socio_ids = socioIds.join(',')
  if (socioId) params.socio_id = socioId

  const response = await api.get('finanzas/morosidad/', { params })
  return response.data
}