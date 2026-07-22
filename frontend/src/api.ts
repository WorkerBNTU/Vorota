const API_BASE = import.meta.env.VITE_API_URL || '/api'
const GET_CACHE_TTL = 60 * 1000

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export type LeadPayload = {
  name: string
  phone: string
  message?: string
  source?: string
  website?: string
  privacy_consent: boolean
  interest?: string
  city?: string
  opening_width?: string
  opening_height?: string
  drive_type?: string
  captcha_id?: string
  captcha_answer?: string
}

export type CaptchaResponse = {
  captcha_id: string
  question: string
}

export type AuthUser = {
  authenticated: boolean
  username?: string
  role?: 'admin' | 'manager' | null
  is_superuser?: boolean
  can_manage_content?: boolean
  can_manage_crm?: boolean
}

export type ApiErrorBody = Record<string, unknown> & {
  detail?: unknown
  captcha_required?: unknown
  captcha_answer?: unknown
  non_field_errors?: unknown
  phone?: unknown
  name?: unknown
}

export class ApiError extends Error {
  data: ApiErrorBody
  status: number

  constructor(message: string, status: number, data: ApiErrorBody = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

type CacheEntry = {
  data?: unknown
  ts?: number
  inflight?: Promise<unknown> | null
}

const getCache = new Map<string, CacheEntry>()

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`))
  return match ? decodeURIComponent(match[2]) : null
}

let csrfToken: string | null = null

async function ensureCsrf(): Promise<string | null> {
  if (csrfToken) return csrfToken
  const data = await fetch(`${API_BASE}/auth/csrf/`, { credentials: 'include' }).then(
    (r) => r.json() as Promise<{ csrfToken?: string }>,
  )
  csrfToken = data.csrfToken || getCookie('csrftoken')
  return csrfToken
}

type RequestOptions = Omit<RequestInit, 'body' | 'headers' | 'method'> & {
  method?: HttpMethod | string
  body?: BodyInit | null
  headers?: HeadersInit
}

async function request<T = unknown>(
  url: string,
  options: RequestOptions = {},
  isRetry = false,
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase()
  const headers: Record<string, string> = {
    ...(!(options.body instanceof FormData) && options.body
      ? { 'Content-Type': 'application/json' }
      : {}),
    ...(options.headers as Record<string, string> | undefined),
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
    return request<T>(url, options, true)
  }

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as ApiErrorBody
    const message = flattenApiMessage(err) || 'Ошибка запроса'
    throw new ApiError(message, res.status, err)
  }
  if (res.status === 204) return null as T
  return res.json() as Promise<T>
}

/** DRF часто отдаёт поля ошибок массивами ErrorDetail → строка. */
function flattenApiMessage(err: ApiErrorBody | null | undefined): string | null {
  if (!err || typeof err !== 'object') return null
  const first = (value: unknown): string | null => {
    if (value == null || value === false) return null
    if (typeof value === 'string') return value
    if (typeof value === 'number' || typeof value === 'boolean') return String(value)
    if (Array.isArray(value)) return first(value[0])
    if (typeof value === 'object') {
      const obj = value as Record<string, unknown>
      return first(obj.detail) || first(obj.message) || null
    }
    return null
  }
  if (Object.prototype.hasOwnProperty.call(err, 'captcha_required')) {
    return first(err.captcha_answer) || first(err.detail) || 'captcha_required'
  }
  return first(err.detail) || first(err.non_field_errors) || first(err.phone) || first(err.name) || null
}

export function isCaptchaRequiredError(error: unknown): boolean {
  if (!error) return false
  if (error instanceof Error && error.message === 'captcha_required') return true
  const data = error instanceof ApiError ? error.data : (error as { data?: ApiErrorBody })?.data
  if (!data || typeof data !== 'object') return false
  return Object.prototype.hasOwnProperty.call(data, 'captcha_required')
}

function cachedGet<T = unknown>(url: string, ttl = GET_CACHE_TTL): Promise<T> {
  const now = Date.now()
  const entry = getCache.get(url)
  if (entry?.data !== undefined && entry.ts !== undefined && now - entry.ts < ttl) {
    return Promise.resolve(entry.data as T)
  }
  if (entry?.inflight) return entry.inflight as Promise<T>

  const inflight = request<T>(url)
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

export function invalidatePublicCache(): void {
  getCache.clear()
}

export const api = {
  getContent: () => cachedGet('/content/'),
  getCatalogMenu: () => cachedGet('/catalog/menu/'),
  getCatalogPage: (slug: string) => cachedGet(`/catalog/pages/${slug}/`),
  getCatalogSection: (slug: string) => cachedGet(`/catalog/sections/${slug}/`),
  getPortfolio: (category?: string) =>
    cachedGet(`/portfolio/${category ? `?category=${category}` : ''}`),
  getCaptcha: () => request<CaptchaResponse>('/captcha/'),
  submitLead: (data: LeadPayload) =>
    request('/leads/', { method: 'POST', body: JSON.stringify(data) }),
  recordVisit: (path = '/') =>
    request('/visits/', { method: 'POST', body: JSON.stringify({ path }) }),

  login: async (username: string, password: string) => {
    csrfToken = null
    await ensureCsrf()
    const result = await request<AuthUser & { detail?: string }>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    })
    csrfToken = null
    return result
  },
  logout: async () => {
    const result = await request('/auth/logout/', { method: 'POST' })
    csrfToken = null
    return result
  },
  checkAuth: () => request<AuthUser>('/auth/me/'),

  adminGetSettings: () => request('/admin/settings/'),
  adminUpdateSettings: (data: FormData | Record<string, unknown>) => {
    invalidatePublicCache()
    const isForm = data instanceof FormData
    return request('/admin/settings/', {
      method: 'PATCH',
      body: isForm ? data : JSON.stringify(data),
    })
  },
  adminList: (resource: string, params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/admin/${resource}/${qs ? `?${qs}` : ''}`)
  },
  adminCreate: (resource: string, data: FormData | Record<string, unknown>) => {
    invalidatePublicCache()
    const isForm = data instanceof FormData
    return request(`/admin/${resource}/`, {
      method: 'POST',
      body: isForm ? data : JSON.stringify(data),
    })
  },
  adminUpdate: (resource: string, id: string | number, data: FormData | Record<string, unknown>) => {
    invalidatePublicCache()
    const isForm = data instanceof FormData
    return request(`/admin/${resource}/${id}/`, {
      method: 'PATCH',
      body: isForm ? data : JSON.stringify(data),
    })
  },
  adminDelete: (resource: string, id: string | number) => {
    invalidatePublicCache()
    return request(`/admin/${resource}/${id}/`, { method: 'DELETE' })
  },
  adminLeads: (params: Record<string, string> = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/admin/leads/${qs ? `?${qs}` : ''}`)
  },
  adminLeadStats: () => request('/admin/leads/stats/'),
  adminVisitStats: () => request('/admin/visits/stats/'),
  adminMediaLibrary: () => request('/admin/media-library/'),
  adminUpdateLead: (id: string | number, data: Record<string, unknown>) =>
    request(`/admin/leads/${id}/`, { method: 'PATCH', body: JSON.stringify(data) }),
}
