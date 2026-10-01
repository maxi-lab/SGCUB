import { useCallback, useEffect, useState } from 'react'
import {
  activateUsuario,
  deactivateUsuario,
  getRoles,
  getUsuarios,
  patchUsuario,
  postUsuario,
  resetUsuarioPassword,
} from '../api/usuarios'

const fetchData = () => Promise.all([getUsuarios(), getRoles()])

function useUsuarios() {
  const [usuarios, setUsuarios] = useState([])
  const [roles, setRoles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchUsuarios = useCallback(async () => {
    try {
      const [receivedUsuarios, receivedRoles] = await fetchData()
      setUsuarios(receivedUsuarios)
      setRoles(receivedRoles)
      setError(null)
    } catch (requestError) {
      setError(requestError)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const reloadUsuarios = useCallback(async () => {
    setIsLoading(true)
    await fetchUsuarios()
  }, [fetchUsuarios])

  const withRefresh = useCallback((request) => async (...args) => {
    const result = await request(...args)
    await fetchUsuarios()
    return result
  }, [fetchUsuarios])

  useEffect(() => {
    let cancelled = false
    fetchData()
      .then(([receivedUsuarios, receivedRoles]) => {
        if (cancelled) return
        setUsuarios(receivedUsuarios)
        setRoles(receivedRoles)
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return {
    usuarios,
    roles,
    isLoading,
    error,
    reloadUsuarios,
    createUsuario: withRefresh(postUsuario),
    updateUsuario: withRefresh(patchUsuario),
    deactivateUsuario: withRefresh(deactivateUsuario),
    activateUsuario: withRefresh(activateUsuario),
    resetPassword: resetUsuarioPassword,
  }
}

export default useUsuarios
