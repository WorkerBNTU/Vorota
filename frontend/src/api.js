const API_BASE = import.meta.env.VITE_API_URL || '/api'
const GET_CACHE_TTL = 5 * 60 * 1000
const getCache = new Map()

function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`))
  return match ? decodeURIComponent(match[2]) : null
}

let csrfToken = null

async function ensureCsrf() {
  if (csrfToken) return csrfToken
  const data = await fetch(`${API_BASE}/auth/csrf/`, { credentials: 'include' }).then((r) => r.json())
  csrfToken = data.csrfToken || getCookie('csrftoken')
  return csrfToken
}

async function request(url, options = {}, isRetry = false) {
  const method = (options.method || 'GET').toUpperCase()
  const headers = {
    ...(!(options.body instanceof FormData) && options.body && { 'Content-Type': 'application/json' }),
    ...options.headers,
  }

  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const token = await ensureCsrf()
    if (token) headers['X-CSRFToken'] = token
  }

  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    credentials: 'include',
    headers,
  })

  if (res.status === 403 && method !== 'GET' && !isRetry) {
    csrfToken = null
    return request(url, options, true)
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const message = flattenApiMessage(err) || 'Ошибка запроса'
    const error = new Error(message)
    error.data = err
    error.status = res.status
    throw error
  }
  if (res.status === 204) return null
  return res.json()
}

/** DRF часто отдаёт поля ошибок массивами ErrorDetail → строка. */
function flattenApiMessage(err) {
  if (!err || typeof err !== 'object') return null
  const first = (value) => {
    if (value == null || value === false) return null
    if (typeof value === 'string') return value
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    if (Array.isArray(value)) return first(value[0])
    if (typeof value === 'object') return first(value.detail) || first(value.message) || null
    return null
  }
  if (Object.prototype.hasOwnProperty.call(err, 'captcha_required')) {
    return first(err.captcha_answer) || first(err.detail) || 'captcha_required'
  }
  return first(err.detail) || first(err.non_field_errors) || first(err.phone) || first(err.name) || null
}

export function isCaptchaRequiredError(error) {
  if (!error) return false
  if (error.message === 'captcha_required') return true
  const data = error.data
  if (!data || typeof data !== 'object') return false
  return Object.prototype.hasOwnProperty.call(data, 'captcha_required')
}

function cachedGet(url, ttl = GET_CACHE_TTL) {
  const now = Date.now()
  const entry = getCache.get(url)
  if (entry?.data && now - entry.ts < ttl) {
    return Promise.resolve(entry.data)
  }
  if (entry?.inflight) return entry.inflight

  const inflight = request(url)
    .then((data) => {
      getCache.set(url, { data, ts: Date.now(), inflight: null })
      return data
    })
    .catch((err) => {
      const current = getCache.get(url)
      if (current?.inflight === inflight) getCache.delete(url)
      throw err
    })

  getCache.set(url, { ...(entry || {}), inflight })
  return inflight
}

export function invalidatePublicCache() {
  getCache.clear()
}

export const api = {
  getContent: () => cachedGet('/content/'),
  getCatalogMenu: () => cachedGet('/catalog/menu/'),
  getCatalogPage: (slug) => cachedGet(`/catalog/pages/${slug}/`),
  getCatalogSection: (slug) => cachedGet(`/catalog/sections/${slug}/`),
  getPortfolio: (category) => cachedGet(`/portfolio/${category ? `?category=${category}` : ''}`),
  getCaptcha: () => request('/captcha/'),
  submitLead: (data) => request('/leads/', { method: 'POST', body: JSON.stringify(data) }),
  recordVisit: (path = '/') => request('/visits/', { method: 'POST', body: JSON.stringify({ path }) }),

  login: async (username, password) => {
    csrfToken = null
    await ensureCsrf()
    const result = await request('/auth/login/', { method: 'POST', body: JSON.stringify({ username, password }) })
    csrfToken = null
    return result
  },
  logout: async () => {
    const result = await request('/auth/logout/', { method: 'POST' })
    csrfToken = null
    return result
  },
  checkAuth: () => request('/auth/me/'),

  adminGetSettings: () => request('/admin/settings/'),
  adminUpdateSettings: (data) => {
    invalidatePublicCache()
    const isForm = data instanceof FormData
    return request('/admin/settings/', { method: 'PATCH', body: isForm ? data : JSON.stringify(data) })
  },
  adminList: (resource, params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/admin/${resource}/${qs ? `?${qs}` : ''}`)
  },
  adminCreate: (resource, data) => {
    invalidatePublicCache()
    const isForm = data instanceof FormData
    return request(`/admin/${resource}/`, { method: 'POST', body: isForm ? data : JSON.stringify(data) })
  },
  adminUpdate: (resource, id, data) => {
    invalidatePublicCache()
    const isForm = data instanceof FormData
    return request(`/admin/${resource}/${id}/`, { method: 'PATCH', body: isForm ? data : JSON.stringify(data) })
  },
  adminDelete: (resource, id) => {
    invalidatePublicCache()
    return request(`/admin/${resource}/${id}/`, { method: 'DELETE' })
  },
  adminLeads: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/admin/leads/${qs ? `?${qs}` : ''}`)
  },
  adminLeadStats: () => request('/admin/leads/stats/'),
  adminVisitStats: () => request('/admin/visits/stats/'),
  adminMediaLibrary: () => request('/admin/media-library/'),
  adminUpdateLead: (id, data) => request(`/admin/leads/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
}
