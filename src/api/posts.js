import { apiRequest } from './client'

function toQuery(params) {
  const search = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value))
    }
  })

  const query = search.toString()

  return query ? `?${query}` : ''
}

/* -------------------------------------------------------------------------- */
/* Public                                                                     */
/* -------------------------------------------------------------------------- */

export function fetchPublicPosts({ page = 1, perPage = 9, search = '' } = {}) {
  return apiRequest(
    `/blogs${toQuery({ page, per_page: perPage, q: search })}`,
  )
}

export function fetchPublicPost(slug) {
  return apiRequest(`/blogs/${encodeURIComponent(slug)}`)
}

/* -------------------------------------------------------------------------- */
/* Admin                                                                      */
/* -------------------------------------------------------------------------- */

export function fetchAdminPosts({
  page = 1,
  perPage = 10,
  status = '',
  search = '',
} = {}) {
  return apiRequest(
    `/admin/blogs${toQuery({
      page,
      per_page: perPage,
      status,
      q: search,
    })}`,
  )
}

export function fetchAdminPost(id) {
  return apiRequest(`/admin/blogs/${id}`)
}

export function createPost(formData) {
  return apiRequest('/admin/blogs', {
    method: 'POST',
    body: formData,
    isForm: true,
  })
}

/**
 * Laravel supports method spoofing so multipart PUT requests work reliably.
 */
export function updatePost(id, formData) {
  formData.append('_method', 'PUT')

  return apiRequest(`/admin/blogs/${id}`, {
    method: 'POST',
    body: formData,
    isForm: true,
  })
}

export function deletePost(id) {
  return apiRequest(`/admin/blogs/${id}`, { method: 'DELETE' })
}
