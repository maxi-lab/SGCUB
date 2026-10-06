import { useCallback, useEffect, useState } from 'react'
import { getBecasBySocio } from '../api/becas'
import { getEstadoCuenta } from '../api/estadoCuenta'

const fetchAccount = (socioId) => getEstadoCuenta(socioId).catch((requestError) => {
  if (requestError.response?.status === 404) return null
  throw requestError
})

// The scholarships section shows its own error, so a failure there doesn't hide the account
const fetchScholarships = (socioId) => getBecasBySocio(socioId).catch(() => null)

const fetchFinances = (socioId) => Promise.all([fetchAccount(socioId), fetchScholarships(socioId)])

// Loads the socio's account statement and scholarships; reload refreshes them without showing the loading state
export default function useSocioFinances(socioId) {
  const [load, setLoad] = useState({ socioId: null, error: null, account: null, becas: [] })

  useEffect(() => {
    if (!socioId) return undefined
    let active = true
    fetchFinances(socioId)
      .then(([account, becas]) => active && setLoad({ socioId, error: null, account, becas }))
      .catch(() => active && setLoad({ socioId, error: 'No se pudo cargar el estado de cuenta.', account: null, becas: [] }))
    return () => { active = false }
  }, [socioId])

  const reload = useCallback(() => fetchFinances(socioId)
    .then(([account, becas]) => setLoad({ socioId, error: null, account, becas }))
    .catch(() => setLoad((current) => ({ ...current, error: 'Los cambios se guardaron, pero no se pudo actualizar el estado de cuenta.' }))), [socioId])

  const loaded = Boolean(socioId) && load.socioId === socioId
  return {
    loading: Boolean(socioId) && !loaded,
    error: loaded ? load.error : null,
    account: loaded ? load.account : null,
    becas: loaded ? load.becas : [],
    reload,
  }
}
