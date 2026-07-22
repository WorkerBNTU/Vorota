import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import MarkdownContent from '../components/MarkdownContent'
import ContentImage from '../components/ContentImage'
import JsonLd from '../components/JsonLd'
import NewsFeed from '../components/NewsFeed'
import TestimonialGrid from '../components/TestimonialGrid'
import { useLeadModal } from '../components/LeadModal'
import { useSiteData } from '../context/SiteDataContext'
import useSiteMeta from '../hooks/useSiteMeta'
import { catalogPageSeoDescription, catalogPageSeoTitle } from '../utils/seoMeta'
import { buildBreadcrumbSchema, buildProductSchema, buildServiceSchema } from '../utils/structuredData'
import { parseFeedItems, parseTestimonials } from '../utils/feedContent'
import { attachAvatars, attachFeedImages, groupPageMedia } from '../utils/pageMedia'
import './Catalog.css'

export function catalogLink(slug) {
  return `/catalog/${slug}`
}

function PageCard({ page }) {
  return (
    <Link to={catalogLink(page.slug)} className="catalog-card">
      <div className="catalog-card-image">
        <ContentImage src={page.image_url} alt={page.title} className="content-image-fill" />
      </div>
      <div className="catalog-card-body">
        <h3>{page.title}</h3>
        {page.excerpt && <p>{page.excerpt}</p>}
        {page.price != null && (
          <div className="catalog-card-price">{Number(page.price).toLocaleString('ru-RU')} р.</div>
        )}
      </div>
    </Link>
  )
}

export default function CatalogPage() {
  const { '*': path } = useParams()
  const [page, setPage] = useState(null)
  const [error, setError] = useState(false)
  const { openModal } = useLeadModal()
  const { settings } = useSiteData()

  useEffect(() => {
    if (!path) return
    setError(false)
    api.getCatalogPage(path)
      .then(setPage)
      .catch(() => setError(true))
  }, [path])

  useSiteMeta({
    title: error ? 'Страница не найдена' : page ? catalogPageSeoTitle(page) : undefined,
    description: page ? catalogPageSeoDescription(page) : undefined,
    image: page?.image_url,
    path: page ? `/catalog/${page.slug}` : undefined,
    noindex: error,
  })

  if (error) {
    return (
      <section className="section">
        <div className="container">
          <h1>Страница не найдена</h1>
          <p style={{ marginBottom: 16 }}>Возможно, страница была перемещена или удалена.</p>
          <Link to="/catalog" className="btn btn-primary" style={{ marginRight: 12 }}>Каталог</Link>
          <Link to="/">На главную</Link>
        </div>
      </section>
    )
  }

  if (!page) {
    return <section className="section"><div className="container"><p>Загрузка...</p></div></section>
  }

  const isProduct = page.page_type === 'product'
  const isFeed = page.page_type === 'news' || page.page_type === 'promotions'
  const isTestimonials = page.page_type === 'testimonials'
  // Раздел может содержать и подразделы (обзорные/обычные страницы), и
  // конкретные товары — показываем их отдельными блоками, а не одной
  // смешанной сеткой, чтобы не путать «Гаражные ворота — обзор» с
  // карточками конкретных моделей Doorhan внутри.
  const subsectionChildren = page.children?.filter((c) => c.page_type !== 'product') || []
  const productChildren = page.children?.filter((c) => c.page_type === 'product') || []
  const media = groupPageMedia(page.gallery)

  const feedItems = isFeed
    ? attachFeedImages(parseFeedItems(page.content), media.feed)
    : []
  const testimonialItems = isTestimonials
    ? attachAvatars(parseTestimonials(page.content), media.avatars)
    : []

  const isLeaf = subsectionChildren.length === 0 && productChildren.length === 0
  const isServicePage = page.page_type === 'service' || page.slug.startsWith('uslugi/')
  const noLeadCtaSlugs = new Set([
    'o-kompanii/vakansii',
    'o-kompanii/o-nas',
    'o-kompanii/sertifikaty-i-licenzii',
  ])
  const showLeadCta = isLeaf && !isProduct && !isFeed && !isTestimonials && !noLeadCtaSlugs.has(page.slug)

  return (
    <>
      <JsonLd data={buildBreadcrumbSchema(page.breadcrumbs, page.title, settings)} />
      <JsonLd data={buildProductSchema(page, settings)} />
      <JsonLd data={buildServiceSchema(page, settings)} />

      <section className="page-hero catalog-hero">
        <div className="container">
          <nav className="breadcrumbs">
            <Link to="/">Главная</Link>
            <span> / </span>
            <Link to="/catalog">Каталог</Link>
            {page.breadcrumbs?.map((crumb, i) => (
              <span key={crumb.slug}>
                {' / '}
                {i < page.breadcrumbs.length - 1
                  ? <Link to={catalogLink(crumb.slug)}>{crumb.title}</Link>
                  : <span>{crumb.title}</span>}
              </span>
            ))}
          </nav>
          <h1>{page.title}</h1>
          {page.excerpt && !isProduct && <p>{page.excerpt}</p>}
        </div>
      </section>

      <section className="section">
        <div className="container">
          {isProduct ? (
            <div className="catalog-product">
              <div className="catalog-product-image">
                <ContentImage src={page.image_url} alt={page.title} aspectRatio="4/3" priority />
              </div>
              <div className="catalog-product-info">
                {page.price != null && (
                  <div className="catalog-product-price">
                    {Number(page.price).toLocaleString('ru-RU')} р.
                  </div>
                )}
                <ul className="catalog-product-specs">
                  {page.manufacturer && <li><strong>Производитель:</strong> {page.manufacturer}</li>}
                  {page.model && <li><strong>Модель:</strong> {page.model}</li>}
                  {page.availability && <li><strong>Наличие:</strong> {page.availability}</li>}
                </ul>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => openModal(`товар: ${page.title}`, { interest: page.title })}
                >
                  Заказать / Узнать подробнее
                </button>
              </div>
            </div>
          ) : !isTestimonials && page.image_url ? (
            <div className="catalog-feature-image">
              <ContentImage src={page.image_url} alt={page.title} fill priority />
            </div>
          ) : null}

          {isProduct && media.variants.length > 0 && (
            <div className="catalog-variants">
              <h2>Варианты</h2>
              <div className="catalog-gallery-grid">
                {media.variants.map((img) => (
                  <figure key={img.id} className="catalog-gallery-item">
                    <ContentImage src={img.image_url} alt={img.caption || page.title} className="content-image-fill" />
                    {img.caption && <figcaption>{img.caption}</figcaption>}
                  </figure>
                ))}
              </div>
            </div>
          )}

          {isFeed && <NewsFeed items={feedItems} kind={page.page_type} />}
          {isTestimonials && <TestimonialGrid items={testimonialItems} />}
          {!isFeed && !isTestimonials && <MarkdownContent content={page.content} />}

          {media.inline.length > 0 && (
            <div className="catalog-inline-images">
              <div className="catalog-gallery-grid">
                {media.inline.map((img) => (
                  <figure key={img.id} className="catalog-gallery-item">
                    <ContentImage src={img.image_url} alt={img.caption || page.title} className="content-image-fill" />
                    {img.caption && <figcaption>{img.caption}</figcaption>}
                  </figure>
                ))}
              </div>
            </div>
          )}

          {subsectionChildren.length > 0 && (
            <div className="catalog-children">
              <h2>Разделы и страницы</h2>
              <div className="catalog-grid">
                {subsectionChildren.map((child) => <PageCard key={child.id} page={child} />)}
              </div>
            </div>
          )}

          {productChildren.length > 0 && (
            <div className="catalog-children">
              <h2>{isProduct ? 'Похожие товары' : 'Товары'}</h2>
              <div className="catalog-grid">
                {productChildren.map((child) => <PageCard key={child.id} page={child} />)}
              </div>
            </div>
          )}

          {showLeadCta && (
            <div className="catalog-lead-cta">
              <button
                type="button"
                className="btn btn-primary btn-lg"
                onClick={() => openModal(
                  isServicePage ? `услуга: ${page.title}` : `каталог: ${page.title}`,
                  { interest: page.title },
                )}
              >
                {isServicePage ? 'Заказать услугу' : 'Оставить заявку'}
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  )
}
