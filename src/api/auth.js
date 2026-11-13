import { apiRequest, ensureCsrfCookie } from './client'

/**
 * Sign in an administrator. The CSRF cookie must exist before the POST.
 */
export async function login(credentials) {
  await ensureCsrfCookie()
  return apiRequest('/login', { method: 'POST', body: credentials })
}

/**
 * Destroy the current Sanctum session.
 */
export async function logout() {
  return apiRequest('/logout', { method: 'POST' })
}

/**
 * Read the currently authenticated administrator.
 */
export async function fetchCurrentUser() {
  return apiRequest('/user')
}
