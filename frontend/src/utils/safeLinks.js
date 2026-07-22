/** Безопасный username для https://t.me/… */
export function telegramUrl(username) {
  const u = String(username || '').trim().replace(/^@+/, '')
  if (!/^[A-Za-z0-9_]{5,32}$/.test(u)) return null
  return `https://t.me/${u}`
}

/** Iframe Яндекс.Карт — тот же allowlist, что на бэкенде. */
export function isSafeMapEmbedUrl(url) {
  if (!url) return false
  try {
    const u = new URL(String(url).trim())
    const host = u.hostname.toLowerCase()
    const okHost = ['yandex.ru', 'www.yandex.ru', 'yandex.com', 'www.yandex.com'].includes(host)
    return (u.protocol === 'https:' || u.protocol === 'http:') && okHost && u.pathname.includes('/map-widget/')
  } catch {
    return false
  }
}
