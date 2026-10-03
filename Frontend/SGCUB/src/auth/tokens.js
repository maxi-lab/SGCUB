// Tokens JWT de la sesión, guardados en localStorage para sobrevivir a un F5
const ACCESS_TOKEN_KEY = 'sgcub_access_token'
const REFRESH_TOKEN_KEY = 'sgcub_refresh_token'

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY)

export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY)

// Recibe la respuesta de login/refresh: { access, refresh }
export const setTokens = ({ access, refresh }) => {
  if (access) localStorage.setItem(ACCESS_TOKEN_KEY, access)
  if (refresh) localStorage.setItem(REFRESH_TOKEN_KEY, refresh)
}

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}
