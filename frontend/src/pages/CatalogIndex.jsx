import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSiteData } from '../context/SiteDataContext'
import ContentImage from '../components/ContentImage'
import useSiteMeta from '../hooks/useSiteMeta'
import { catalogLink } from './CatalogPage'
import './CatalogIndex.css'

function SectionCard({ section }) {
  const href = section.entry_slug ? catalogLink(section.entry_slug) : '/catalog'
  const coverImage = section.menu_pages?.[0]?.image_url || null

  return (
    <div className="catalog-index-card">
      <Link to={href} className="catalog-index-card-main">
        <div className="catalog-index-card-image">
          <ContentImage src={coverImage} alt={section.title} className="content-image-fill" aspectRatio="16/9" />
        </div>
        <h2>{section.title}</h2>
      </Link>
      {section.menu_pages?.length > 0 && (
        <ul className="catalog-index-links">
          {section.menu_pages.map((page) => (
            <li key={page.id}>
              <Link to={catalogLink(page.slug)}>{page.title}</Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function CatalogIndex() {
  const { catalogMenu } = useSiteData()
  const [loading, setLoading] = useState(!catalogMenu.length)

  useEffect(() => {
    if (catalogMenu.length) setLoading(false)
  }, [catalogMenu])

  useSiteMeta({
    title: 'Каталог',
    description: 'Ворота, роллеты, автоматика, шлагбаумы, гаражные двери и услуги по установке и обслуживанию.',
    path: '/catalog',
  })

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <nav className="breadcrumbs">
            <Link to="/">Главная</Link>
            <span> / Каталог</span>
          </nav>
          <h1>Каталог</h1>
          <p>Ворота, роллеты, автоматика, шлагбаумы, услуги и многое другое</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          {loading ? (
            <p>Загрузка...</p>
          ) : (
            <div className="catalog-index-grid">
              {catalogMenu.map((section) => (
                <SectionCard key={section.id} section={section} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
