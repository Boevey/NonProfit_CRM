/**
 * Central fetch wrapper for the Laravel API.
 *
 * Sanctum's SPA mode uses an HttpOnly session cookie plus a readable
 * XSRF-TOKEN cookie. Every request sends credentials and every write sends
 * the decoded XSRF token back in the X-XSRF-TOKEN header.
 */

const configuredBase = import.meta.env.VITE_API_BASE_URL ?? '/api'
export const API_BASE = configuredBase.replace(/\/+$/, '')
export const CSRF_COOKIE_URL =
  import.meta.env.VITE_SANCTUM_CSRF_URL ?? '/sanctum/csrf-cookie'

export class ApiError extends Error {
  constructor(message, { status = 0, errors = {}, payload = null } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
    this.payload = payload
  }
}

function readCookie(name) {
  if (typeof document === 'undefined') {
    return null
  }

  const match = document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${name}=`))

  return match ? match.slice(name.length + 1) : null
}

let csrfRequest = null

/**
 * Ask Laravel to set a fresh XSRF-TOKEN cookie before a stateful request.
 */
export async function ensureCsrfCookie() {
  if (!csrfRequest) {
    csrfRequest = fetch(CSRF_COOKIE_URL, {
      credentials: 'include',
      headers: { Accept: 'application/json' },
    })
      .then((response) => {
        if (!response.ok) {
          throw new ApiError('Unable to start a secure session.', {
            status: response.status,
          })
        }
      })
      .finally(() => {
        csrfRequest = null
      })
  }

  return csrfRequest
}

function buildUrl(path) {
  if (/^https?:\/\//i.test(path)) {
    return path
  }

  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`
}

/**
 * Perform an API request and normalize success/error payloads.
 *
 * @param {string} path
 * @param {{
 *   method?: string,
 *   body?: unknown,
 *   isForm?: boolean,
 *   headers?: Record<string, string>,
 *   signal?: AbortSignal,
 *   retryOnCsrf?: boolean,
 * }} options
 */
export async function apiRequest(path, options = {}) {
  const {
    method = 'GET',
    body,
    isForm = false,
    headers = {},
    signal,
    retryOnCsrf = true,
  } = options

  const requestHeaders = { Accept: 'application/json', ...headers }
  const init = {
    method,
    credentials: 'include',
    headers: requestHeaders,
    signal,
  }

  if (body !== undefined && body !== null) {
    if (isForm) {
      init.body = body
    } else {
      requestHeaders['Content-Type'] = 'application/json'
      init.body = JSON.stringify(body)
    }
  }

  if (!['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) {
    const token = readCookie('XSRF-TOKEN')

    if (token) {
      requestHeaders['X-XSRF-TOKEN'] = decodeURIComponent(token)
    }
  }

  const response = await fetch(buildUrl(path), init)

  // A 419 means the CSRF token expired. Refresh it once and retry.
  if (response.status === 419 && retryOnCsrf) {
    await ensureCsrfCookie()
    return apiRequest(path, { ...options, retryOnCsrf: false })
  }

  const text = await response.text()
  let payload = null

  if (text) {
    try {
      payload = JSON.parse(text)
    } catch {
      payload = text
    }
  }

  if (!response.ok) {
    const message =
      (payload && typeof payload === 'object' && payload.message) ||
      `The request failed (${response.status}).`

    throw new ApiError(message, {
      status: response.status,
      errors:
        payload && typeof payload === 'object' && payload.errors
          ? payload.errors
          : {},
      payload,
    })
  }

  return payload
}
