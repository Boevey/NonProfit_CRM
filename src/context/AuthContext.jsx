import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import * as authApi from '../api/auth'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Restore an existing Sanctum session on a hard refresh.
  useEffect(() => {
    let isActive = true

    authApi
      .fetchCurrentUser()
      .then((payload) => {
        if (isActive) {
          setUser(payload?.user ?? null)
        }
      })
      .catch(() => {
        if (isActive) {
          setUser(null)
        }
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [])

  const login = useCallback(async (credentials) => {
    const payload = await authApi.login(credentials)
    setUser(payload?.user ?? null)
    return payload?.user ?? null
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      // Even if the network call fails, drop local state so protected routes
      // cannot keep rendering stale administrator content.
      setUser(null)
    }
  }, [])

  const refresh = useCallback(async () => {
    const payload = await authApi.fetchCurrentUser()
    const nextUser = payload?.user ?? null
    setUser(nextUser)
    return nextUser
  }, [])

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      refresh,
    }),
    [user, isLoading, login, logout, refresh],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
