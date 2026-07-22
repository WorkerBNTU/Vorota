// JSON-LD (schema.org). Публичный URL — из settings.site_url (Django SITE_URL),
// чтобы prerender за http://frontend не писал канон/схему с внутренним хостом.

import { getSiteOrigin } from './seoMeta'

const BELARUS_CITIES = ['Минск', 'Витебск', 'Гомель', 'Гродно', 'Брест', 'Могилёв']

function parsePostalAddress(address) {
  if (!address) return undefined
  const text = String(address).trim()
  const localityMatch = text.match(/г\.\s*([А-Яа-яЁёA-Za-z-]+)/)
  const postalMatch = text.match(/\b(\d{6})\b/)
  return {
    '@type': 'PostalAddress',
    streetAddress: text,
    addressLocality: localityMatch ? localityMatch[1] : undefined,
    postalCode: postalMatch ? postalMatch[1] : undefined,
    addressCountry: 'BY',
  }
}

function areaServedBelarus() {
  return [
    { '@type': 'Country', name: 'Беларусь' },
    ...BELARUS_CITIES.map((name) => ({ '@type': 'City', name })),
  ]
}

export function buildOrganizationSchema(settings) {
  if (!settings) return null
  const origin = getSiteOrigin(settings)
  const address = parsePostalAddress(settings.address)
  const lat = settings.map_latitude
  const lon = settings.map_longitude
  const geo =
    lat != null && lon != null && lat !== '' && lon !== ''
      ? {
          '@type': 'GeoCoordinates',
          latitude: Number(lat),
          longitude: Number(lon),
        }
      : undefined

  return {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    name: settings.company_name,
    description: settings.footer_description || settings.tagline,
    url: origin || undefined,
    telephone: settings.phone,
    email: settings.email,
    address,
    geo,
    areaServed: areaServedBelarus(),
    // Несколько брендов: DoorHan — дилерство, плюс другие в ассортименте.
    brand: [
      { '@type': 'Brand', name: 'DoorHan' },
      { '@type': 'Brand', name: 'BFT' },
    ],
    knowsAbout: ['ворота', 'роллеты', 'шлагбаумы', 'автоматика', 'DoorHan', 'BFT'],
    openingHours: settings.working_hours || undefined,
    image: settings.logo_url || undefined,
    logo: settings.logo_url || undefined,
    hasMap: settings.map_page_url || undefined,
  }
}

export function buildBreadcrumbSchema(breadcrumbs, currentTitle, settings) {
  if (!breadcrumbs?.length && !currentTitle) return null
  const origin = getSiteOrigin(settings)
  const items = [
    { name: 'Главная', path: '/' },
    { name: 'Каталог', path: '/catalog' },
    ...(breadcrumbs || []).map((crumb) => ({ name: crumb.title, path: `/catalog/${crumb.slug}` })),
  ]
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: origin ? `${origin}${item.path}` : item.path,
    })),
  }
}

export function buildProductSchema(page, settings) {
  if (!page || page.page_type !== 'product') return null
  const origin = getSiteOrigin(settings)
  const url = origin ? `${origin}/catalog/${page.slug}` : `/catalog/${page.slug}`
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: page.title,
    description: page.meta_description || page.excerpt || undefined,
    image: page.image_url || undefined,
    brand: page.manufacturer
      ? { '@type': 'Brand', name: page.manufacturer }
      : undefined,
    model: page.model || undefined,
    url,
    offers: page.price != null
      ? {
          '@type': 'Offer',
          priceCurrency: 'BYN',
          price: String(page.price),
          availability: /нет в наличии|под заказ/i.test(page.availability || '')
            ? 'https://schema.org/PreOrder'
            : 'https://schema.org/InStock',
          url,
          areaServed: areaServedBelarus(),
        }
      : undefined,
  }
}

export function buildServiceSchema(page, settings) {
  if (!page || page.page_type !== 'service') return null
  const origin = getSiteOrigin(settings)
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: page.title,
    description: page.meta_description || page.excerpt || undefined,
    image: page.image_url || undefined,
    provider: settings ? { '@type': 'Organization', name: settings.company_name } : undefined,
    areaServed: areaServedBelarus(),
    brand: page.manufacturer
      ? { '@type': 'Brand', name: page.manufacturer }
      : undefined,
    url: origin ? `${origin}/catalog/${page.slug}` : `/catalog/${page.slug}`,
  }
}
