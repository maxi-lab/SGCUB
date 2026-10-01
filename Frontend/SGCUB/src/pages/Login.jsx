import { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import FullPageLoader from '../components/shared/FullPageLoader'

const HELP_MESSAGES = {
  forgotPassword: 'Para restablecer tu contraseña, contactá a la Administración del club.',
  noCredentials: 'Las cuentas las crea la Administración del club. Acercate con tu DNI para solicitar el acceso.',
}

const getErrorMessage = (error) => {
  if (!error.response) return 'No se pudo conectar con el servidor. Intentá nuevamente.'
  if (error.response.status === 401) return 'DNI o contraseña incorrectos.'
  if (error.response.status === 429) return 'Demasiados intentos. Esperá un minuto y volvé a intentar.'
  return 'Ocurrió un error inesperado. Intentá nuevamente.'
}

export default function Login() {
  const { user, isLoading, login } = useAuth()
  const location = useLocation()

  const [dni, setDni] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [helpMessage, setHelpMessage] = useState('')

  // Vuelve a la página que se intentó abrir antes de iniciar sesión (ver ProtectedRoute)
  const redirectTo = location.state?.from ?? '/'

  if (isLoading) return <FullPageLoader />
  // También cubre el login exitoso: al cargarse el usuario se redirige solo
  if (user) return <Navigate to={redirectTo} replace />

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await login(dni, password)
    } catch (loginError) {
      setError(getErrorMessage(loginError))
      setIsSubmitting(false)
    }
  }

  return (
    <main className="w-full min-h-screen flex items-center justify-center p-space-lg bg-background">
      <div className="flex flex-col w-full items-center justify-center py-space-xl px-space-md min-h-[calc(100vh-4rem)]">
        <div className="relative w-full max-w-md">
          <div className="absolute -top-16 -left-16 w-64 h-64 bg-primary-fixed/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-secondary-container/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative bg-surface-container-lowest rounded-xl shadow-2xl p-space-xl flex flex-col items-center">
            <div className="flex flex-col items-center text-center w-full mb-space-lg">
              <div className="relative mb-space-md group">
                <div className="absolute inset-0 bg-primary-container/20 rounded-full blur-md opacity-60 group-hover:opacity-100 transition-opacity" />
                <img
                  alt="Club Universitario de Berisso"
                  className="relative w-24 h-24 object-contain drop-shadow-md transition-transform duration-300 transform group-hover:scale-105"
                  src="/escudo-sin-fondo.png"
                />
              </div>
              <h1 className="text-display-md font-display-md text-on-surface tracking-tight leading-none mb-1">SGCUB</h1>
              <p className="text-body-sm font-body-sm text-on-surface-variant font-medium">Sistema de Gestión Interna</p>
            </div>

            <form className="w-full space-y-space-md" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-label-md font-label-md text-on-surface font-semibold" htmlFor="dni">
                  DNI
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline text-title-md pointer-events-none select-none">
                    badge
                  </span>
                  <input
                    className="w-full h-11 pl-10 pr-3.5 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-lg outline-none transition-all placeholder:text-outline-variant focus:ring-2 focus:ring-primary-container focus:bg-white shadow-sm"
                    id="dni"
                    placeholder="Ingrese su DNI"
                    type="text"
                    inputMode="numeric"
                    autoComplete="username"
                    autoFocus
                    required
                    value={dni}
                    onChange={(event) => setDni(event.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-label-md font-label-md text-on-surface font-semibold" htmlFor="password">
                  Contraseña
                </label>
                <div className="relative flex items-center">
                  <span className="material-symbols-outlined absolute left-3 text-outline text-title-md pointer-events-none select-none">
                    lock
                  </span>
                  <input
                    className="w-full h-11 pl-10 pr-11 bg-surface-container-lowest text-on-surface font-body-md text-body-md rounded-lg outline-none transition-all placeholder:text-outline-variant focus:ring-2 focus:ring-primary-container focus:bg-white shadow-sm"
                    id="password"
                    placeholder="••••••••"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    className="absolute right-2 p-1.5 text-outline hover:text-on-surface rounded transition-colors flex items-center justify-center focus:outline-none"
                    title="Mostrar u ocultar contraseña"
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                  >
                    <span className="material-symbols-outlined text-title-md">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {error && (
                <div
                  className="bg-error-container text-on-error-container px-3 py-2.5 rounded-lg border border-error/30 flex items-center gap-2"
                  role="alert"
                >
                  <span className="material-symbols-outlined text-error text-title-md">error</span>
                  <p className="text-body-sm font-medium">{error}</p>
                </div>
              )}

              <div className="pt-1">
                <button
                  className="w-full h-11 bg-primary hover:bg-on-primary-container active:scale-[0.99] text-on-primary font-headline-sm text-headline-sm rounded-lg flex items-center justify-center gap-2 shadow-md transition-all duration-200 cursor-pointer disabled:cursor-wait disabled:opacity-80"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-title-md">progress_activity</span>
                      <span>Validando acceso...</span>
                    </>
                  ) : (
                    <>
                      <span>Iniciar sesión</span>
                      <span className="material-symbols-outlined text-title-md">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>

              <div className="text-center pt-2">
                <button
                  className="inline-flex items-center gap-1 text-primary hover:text-on-primary-container text-body-sm font-label-lg font-medium transition-colors group"
                  type="button"
                  onClick={() => setHelpMessage(HELP_MESSAGES.forgotPassword)}
                >
                  <span className="material-symbols-outlined text-label-md">lock_reset</span>
                  <span className="group-hover:underline">¿Olvidaste tu contraseña?</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  )
}
