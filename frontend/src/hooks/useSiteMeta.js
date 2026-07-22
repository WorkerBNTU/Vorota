import { useEffect } from 'react'
import { useSiteData } from '../context/SiteDataContext'
import { SITE_DEFAULTS } from '../constants/siteDefaults'

function upsertMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!content) {
    if (el) el.remove()
    return
  }
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertCanonical(href) {
  let el = document.head.querySelector('link[rel="canonical"]')
  if (!href) {
    if (el) el.remove()
    return
  }
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', 'canonical')
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

// Обновляет <title>/<meta description>/Open Graph и canonical для текущего
// маршрута. Имя сайта берётся из настроек (company_name).
export default function useSiteMeta({ title, description, image, path, noindex = false }) {
  const { settings } = useSiteData()
  const siteName = settings?.company_name || SITE_DEFAULTS.company_name

  useEffect(() => {
    const fullTitle = !title
      ? siteName
      : title.includes(siteName) ? title : `${title} — ${siteName}`
    document.title = fullTitle

    upsertMeta('name', 'description', description)
    upsertMeta('property', 'og:site_name', siteName)
    upsertMeta('property', 'og:type', 'website')
    upsertMeta('property', 'og:title', fullTitle)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:image', image)
    upsertMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary')

    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : null)

    if (path) {
      const canonicalHref = `${window.location.origin}${path}`
      upsertCanonical(canonicalHref)
      upsertMeta('property', 'og:url', canonicalHref)
    }
  }, [title, description, image, path, noindex, siteName])
}
