// Хелперы для JSON-LD (schema.org) — используются вместе с <JsonLd />.
// window.location.origin, а не захардкоженный домен: так корректно работает
// и в проде (vorota-rb.by), и при локальной разработке/просмотре снапшотов.

export function buildOrganizationSchema(settings) {
  if (!settings) return null
  const origin = window.location.origin
  return {
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    name: settings.company_name,
    description: settings.footer_description || settings.tagline,
    url: origin,
    telephone: settings.phone,
    email: settings.email,
    address: settings.address
      ? { '@type': 'PostalAddress', streetAddress: settings.address, addressCountry: 'BY' }
      : undefined,
    openingHours: settings.working_hours || undefined,
    image: settings.logo_url || undefined,
    logo: settings.logo_url || undefined,
  }
}

export function buildBreadcrumbSchema(breadcrumbs, currentTitle) {
  if (!breadcrumbs?.length && !currentTitle) return null
  const origin = window.location.origin
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
      item: `${origin}${item.path}`,
    })),
  }
}

export function buildProductSchema(page) {
  if (!page || page.page_type !== 'product') return null
  const origin = window.location.origin
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: page.title,
    description: page.meta_description || page.excerpt || undefined,
    image: page.image_url || undefined,
    brand: page.manufacturer ? { '@type': 'Brand', name: page.manufacturer } : undefined,
    model: page.model || undefined,
    url: `${origin}/catalog/${page.slug}`,
    offers: page.price != null
      ? {
          '@type': 'Offer',
          priceCurrency: 'BYN',
          price: String(page.price),
          availability: /нет в наличии|под заказ/i.test(page.availability || '')
            ? 'https://schema.org/PreOrder'
            : 'https://schema.org/InStock',
          url: `${origin}/catalog/${page.slug}`,
        }
      : undefined,
  }
}

export function buildServiceSchema(page, settings) {
  if (!page || page.page_type !== 'service') return null
  const origin = window.location.origin
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: page.title,
    description: page.meta_description || page.excerpt || undefined,
    image: page.image_url || undefined,
    provider: settings ? { '@type': 'Organization', name: settings.company_name } : undefined,
    areaServed: 'Беларусь',
    url: `${origin}/catalog/${page.slug}`,
  }
}
