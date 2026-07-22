import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Link, NavLink } from 'react-router-dom'
import { useSiteData } from '../context/SiteDataContext'
import { useLeadModal } from './LeadModal'
import { SITE_DEFAULTS } from '../constants/siteDefaults'
import { catalogLink } from '../pages/CatalogPage'
import './Header.css'

const COMPANY_SLUG = 'o-kompanii/obzor'

export default function Header() {
  const { settings, catalogMenu } = useSiteData()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [openMenu, setOpenMenu] = useState(null)
  const { openModal } = useLeadModal()
  const closeTimerRef = useRef(null)

  // Мега-меню "Каталог" рендерится position:fixed (см. Header.css) — между
  // пунктом меню и панелью есть небольшой визуальный зазор, который курсор
  // пересекает не по идеальной прямой. Закрываем не мгновенно, а с
  // небольшой задержкой, чтобы успеть "долететь" до панели без флика.
  const openDropdown = (name) => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
    setOpenMenu(name)
  }

  const scheduleCloseDropdown = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    closeTimerRef.current = setTimeout(() => setOpenMenu(null), 250)
  }

  useEffect(() => () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
  }, [])

  const productSections = catalogMenu.filter((s) => s.slug !== 'company' && s.slug !== 'uslugi')
  const companySection = catalogMenu.find((s) => s.slug === 'company')
  const servicesSection = catalogMenu.find((s) => s.slug === 'uslugi')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen)
    return () => document.body.classList.remove('menu-open')
  }, [menuOpen])

  useEffect(() => {
    if (!menuOpen) return undefined
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const closeMobile = () => setMenuOpen(false)

  const phone = settings?.phone || SITE_DEFAULTS.phone
  const company = settings?.company_name || SITE_DEFAULTS.company_name

  const sectionHref = (section) => (
    section?.entry_slug ? catalogLink(section.entry_slug) : '/catalog'
  )

  const mobileMenu = menuOpen && createPortal(
    <div className="mobile-nav-layer" role="presentation">
      <div className="mobile-nav-overlay" onClick={closeMobile} aria-hidden="true" />
      <nav className="mobile-nav open" aria-label="Мобильная навигация">
        <div className="mobile-nav-header">
          <span className="mobile-nav-title">Меню</span>
          <button
            type="button"
            className="mobile-nav-close"
            onClick={closeMobile}
            aria-label="Закрыть меню"
          >
            ×
          </button>
        </div>

        <div className="mobile-nav-scroll">
          <NavLink to="/" end onClick={closeMobile}>Главная</NavLink>
          <Link to="/catalog" onClick={closeMobile}>Каталог</Link>

          {productSections.map((section) => (
            <details key={section.slug} className="mobile-nav-group">
              <summary>
                <span className="mobile-nav-group-label">{section.title}</span>
              </summary>
              <div className="mobile-nav-group-body">
                <Link to={sectionHref(section)} onClick={closeMobile} className="mobile-nav-sublink mobile-nav-sublink--head">
                  {section.title}
                </Link>
                {section.menu_pages?.map((page) => (
                  <Link key={page.id} to={catalogLink(page.slug)} onClick={closeMobile} className="mobile-nav-sublink">
                    {page.title}
                  </Link>
                ))}
              </div>
            </details>
          ))}

          {servicesSection && (
            <Link to={sectionHref(servicesSection)} onClick={closeMobile} className="mobile-nav-link">Услуги</Link>
          )}

          <NavLink to="/portfolio" onClick={closeMobile}>Работы</NavLink>

          {companySection && (
            <details className="mobile-nav-group">
              <summary>
                <span className="mobile-nav-group-label">О компании</span>
              </summary>
              <div className="mobile-nav-group-body">
                <Link to={catalogLink(COMPANY_SLUG)} onClick={closeMobile} className="mobile-nav-sublink mobile-nav-sublink--head">
                  О компании
                </Link>
                {companySection.menu_pages?.map((page) => (
                  <Link key={page.id} to={catalogLink(page.slug)} onClick={closeMobile} className="mobile-nav-sublink">
                    {page.title}
                  </Link>
                ))}
              </div>
            </details>
          )}

          <NavLink to="/contacts" onClick={closeMobile}>Контакты</NavLink>
        </div>

        <div className="mobile-nav-footer">
          <a href={`tel:${phone.replace(/\D/g, '')}`} className="mobile-nav-phone">{phone}</a>
          <button type="button" className="btn btn-primary" onClick={() => { openModal('мобильное меню'); closeMobile() }}>
            Оставить заявку
          </button>
        </div>
      </nav>
    </div>,
    document.body,
  )

  return (
    <header className={`header ${scrolled ? 'scrolled' : ''} ${menuOpen ? 'menu-visible' : ''}`}>
      <div className="container header-inner">
        <Link to="/" className="logo" onClick={closeMobile}>
          {settings?.logo_url ? (
            <img src={settings.logo_url} alt={company} />
          ) : (
            <span className="logo-text">{company}</span>
          )}
        </Link>

        <nav className="nav" aria-label="Основная навигация">
          <NavLink to="/" end>Главная</NavLink>

          <div
            className={`nav-dropdown ${openMenu === 'catalog' ? 'open' : ''}`}
            onMouseEnter={() => openDropdown('catalog')}
            onMouseLeave={scheduleCloseDropdown}
          >
            <Link to="/catalog" className="nav-dropdown-trigger">Каталог</Link>
            <div className="nav-dropdown-panel nav-dropdown-panel--wide">
              <div className="nav-dropdown-grid">
                {productSections.map((section) => (
                  <div key={section.slug} className="nav-dropdown-col">
                    <Link to={sectionHref(section)} className="nav-dropdown-heading">
                      {section.title}
                    </Link>
                    {section.menu_pages?.slice(0, 5).map((page) => (
                      <Link key={page.id} to={catalogLink(page.slug)}>{page.title}</Link>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {servicesSection && (
            <Link to={sectionHref(servicesSection)}>Услуги</Link>
          )}

          <NavLink to="/portfolio">Работы</NavLink>

          {companySection && (
            <div
              className={`nav-dropdown ${openMenu === 'company' ? 'open' : ''}`}
              onMouseEnter={() => openDropdown('company')}
              onMouseLeave={scheduleCloseDropdown}
            >
              <Link to={catalogLink(COMPANY_SLUG)} className="nav-dropdown-trigger">О компании</Link>
              <div className="nav-dropdown-panel">
                {companySection.menu_pages?.map((page) => (
                  <Link key={page.id} to={catalogLink(page.slug)}>{page.title}</Link>
                ))}
              </div>
            </div>
          )}

          <NavLink to="/contacts">Контакты</NavLink>
        </nav>

        <div className="header-actions">
          <a href={`tel:${phone.replace(/\D/g, '')}`} className="header-phone">{phone}</a>
          <button type="button" className="btn btn-primary btn-sm" onClick={() => openModal('шапка сайта')}>
            Заявка
          </button>
          <button
            type="button"
            className={`burger ${menuOpen ? 'active' : ''}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? 'Закрыть меню' : 'Открыть меню'}
            aria-expanded={menuOpen}
          >
            <span /><span /><span />
          </button>
        </div>
      </div>

      {mobileMenu}
    </header>
  )
}
