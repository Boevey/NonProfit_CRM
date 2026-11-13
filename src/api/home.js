import { apiRequest } from './client'

/* -------------------------------------------------------------------------- */
/* Public                                                                     */
/* -------------------------------------------------------------------------- */

export function fetchPublicHome() {
  return apiRequest('/home')
}

/* -------------------------------------------------------------------------- */
/* Admin                                                                      */
/* -------------------------------------------------------------------------- */

export function fetchAdminHome() {
  return apiRequest('/admin/home')
}

export function updateAdminHome(payload) {
  return apiRequest('/admin/home', {
    method: 'PUT',
    body: payload,
  })
}
