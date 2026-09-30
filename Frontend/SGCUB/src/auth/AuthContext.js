import { createContext } from 'react'

// Valor: { user, isLoading, login, logout, hasPermission } (ver AuthProvider)
export const AuthContext = createContext(null)
