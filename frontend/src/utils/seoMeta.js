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
 * Fallback SEO для страниц каталога без meta_*.
 * Главный акцент — Беларусь; бренд в title только если задан manufacturer у страницы
 * (DoorHan / BFT / …), без подстановки DoorHan по умолчанию.
 */
export function catalogPageSeoTitle(page) {
  if (!page) return undefined
  if (page.meta_title?.trim()) return page.meta_title.trim()
  const title = (page.title || '').trim()
  if (!title) return undefined
  if (/купить/i.test(title)) return title
  if (page.page_type === 'service') {
    return `${title} в Беларуси — ВоротаРБ`
  }
  const brand = (page.manufacturer || '').trim()
  if (brand) return `Купить ${title} — ${brand} | ВоротаРБ`
  return `Купить ${title} в Беларуси — ВоротаРБ`
}

export function catalogPageSeoDescription(page) {
  if (!page) return undefined
  if (page.meta_description?.trim()) return page.meta_description.trim()
  const base = (page.excerpt || page.title || '').trim()
  if (!base) return undefined
  const brand = (page.manufacturer || '').trim()
  const brandNote = brand
    ? ` Бренд: ${brand}.`
    : ' В том числе DoorHan, BFT и другие бренды.'
  return (
    `${base} Продажа, монтаж и обслуживание по Минску, Витебску, Гомелю, ` +
    `Бресту, Гродно, Могилёву и всей Беларуси.${brandNote} ВоротаРБ.`
  )
}
