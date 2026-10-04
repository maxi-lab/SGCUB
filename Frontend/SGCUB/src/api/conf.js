import axios from 'axios'
import { clearTokens, getAccessToken, getRefreshToken, setTokens } from '../auth/tokens'

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/'

export const API_ORIGIN = new URL(baseURL).origin

const headers = {
  'Content-Type': 'application/json',
}

export const api = axios.create({
  baseURL,
  headers,
})

// Instancia sin interceptores: renovar el token no debe disparar otra renovación
const authClient = axios.create({
  baseURL,
  headers,
})

// Endpoints donde un 401 significa credenciales inválidas, no un token vencido
const AUTH_ENDPOINTS = ['auth/login/', 'auth/refresh/', 'auth/logout/']

let refreshPromise = null
let onSessionExpired = () => {}

// El AuthContext registra acá qué hacer cuando la sesión ya no se puede renovar
export const setOnSessionExpired = (callback) => {
  onSessionExpired = callback
}

const refreshAccessToken = async () => {
  const refresh = getRefreshToken()
  if (!refresh) throw new Error('No hay refresh token')

  const response = await authClient.post('auth/refresh/', { refresh })
  // El backend rota el refresh: hay que guardar ambos tokens
  setTokens(response.data)
  return response.data.access
}

api.interceptors.request.use((config) => {
  const access = getAccessToken()
  if (access) config.headers.Authorization = `Bearer ${access}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error
    const isAuthEndpoint = AUTH_ENDPOINTS.some((endpoint) => config?.url?.startsWith(endpoint))

    if (response?.status !== 401 || !config || config._retry || isAuthEndpoint) {
      return Promise.reject(error)
    }
    config._retry = true

    try {
      // Si varios pedidos reciben 401 a la vez, comparten una única renovación
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null
      })
      const access = await refreshPromise
      config.headers.Authorization = `Bearer ${access}`
      return api(config)
    } catch (refreshError) {
      // Un error de red no cierra la sesión: el refresh sigue siendo válido
      const sessionIsInvalid = !refreshError.isAxiosError || refreshError.response
      if (sessionIsInvalid) {
        clearTokens()
        onSessionExpired()
      }
      return Promise.reject(error)
    }
  },
)
