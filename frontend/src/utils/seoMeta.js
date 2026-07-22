/** Публичный origin сайта: SITE_URL с API, иначе window (dev). */
export function getSiteOrigin(settings) {
  const fromApi = (settings?.site_url || '').replace(/\/$/, '')
  if (fromApi) return fromApi
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin
  }
  return ''
}

/**
 * Fallback SEO для страниц каталога без заполненных meta_* —
 * Беларусь + бренд (DoorHan), без упора только в Минск.
 */
export function catalogPageSeoTitle(page) {
  if (!page) return undefined
  if (page.meta_title?.trim()) return page.meta_title.trim()
  const title = (page.title || '').trim()
  if (!title) return undefined
  if (/купить/i.test(title)) return title
  const brand = (page.manufacturer || 'DoorHan').trim()
  if (page.page_type === 'service') {
    return `${title} в Беларуси — ВоротаРБ`
  }
  return `Купить ${title} — ${brand} | ВоротаРБ`
}

export function catalogPageSeoDescription(page) {
  if (!page) return undefined
  if (page.meta_description?.trim()) return page.meta_description.trim()
  const base = (page.excerpt || page.title || '').trim()
  if (!base) return undefined
  return (
    `${base} Продажа, монтаж и обслуживание по Минску, Витебску, Гомелю, ` +
    `Бресту, Гродно, Могилёву и всей Беларуси. Официальный дилер DoorHan — ВоротаРБ.`
  )
}
