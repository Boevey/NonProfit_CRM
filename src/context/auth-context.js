import { createContext, useContext } from 'react'

// Kept in its own module so `AuthContext.jsx` only exports a component and
// React Fast Refresh can update it without a full page reload.
export const AuthContext = createContext(null)

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used inside an AuthProvider.')
  }

  return context
}
