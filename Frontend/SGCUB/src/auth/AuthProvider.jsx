import { useCallback, useEffect, useMemo, useState } from 'react'
import { getCurrentUser, login as loginRequest, logout as logoutRequest } from '../api/auth'
import { setOnSessionExpired } from '../api/conf'
import { AuthContext } from './AuthContext'
import { getAccessToken } from './tokens'

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // Si hay un token guardado (ej. después de un F5), se espera a /me/ antes de decidir si hay sesión
  const [isLoading, setIsLoading] = useState(() => Boolean(getAccessToken()))

  useEffect(() => {
    setOnSessionExpired(() => setUser(null))
    return () => setOnSessionExpired(() => {})
  }, [])

  useEffect(() => {
    if (!getAccessToken()) return undefined

    let cancelled = false
    getCurrentUser()
      .then((currentUser) => {
        if (!cancelled) setUser(currentUser)
      })
      .catch(() => {
        // Sin usuario se redirige al login; si el token era inválido, el interceptor ya lo borró
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  const login = useCallback(async (dni, password) => {
    await loginRequest(dni, password)
    setUser(await getCurrentUser())
  }, [])

  const refreshUser = useCallback(async () => {
    setUser(await getCurrentUser())
  }, [])

  const logout = useCallback(async () => {
    // Al quedar sin usuario, las rutas protegidas redirigen a /login
    setUser(null)
    await logoutRequest()
  }, [])

  // Recibe un código "<app_label>.<codename>", el mismo formato que ROLE_PERMISSIONS del backend
  const hasPermission = useCallback(
    (code) => Boolean(user && (user.is_superuser || user.permissions.includes(code))),
    [user],
  )

  const value = useMemo(
    () => ({ user, isLoading, login, logout, refreshUser, hasPermission }),
    [user, isLoading, login, logout, refreshUser, hasPermission],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
