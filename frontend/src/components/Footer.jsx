import { Link } from 'react-router-dom'
import { useSiteData } from '../context/SiteDataContext'
import { SITE_DEFAULTS } from '../constants/siteDefaults'
import { catalogLink } from '../pages/CatalogPage'
import { telegramUrl } from '../utils/safeLinks'
import './Footer.css'

export default function Footer() {
  const { settings, catalogMenu } = useSiteData()
  const s = settings || {}
  const company = s.company_name || SITE_DEFAULTS.company_name
  const legalEntity = s.legal_entity_name || company
  const year = new Date().getFullYear()
  const tg = telegramUrl(s.telegram)

  const productSections = catalogMenu.filter((sec) => sec.slug !== 'company' && sec.slug !== 'uslugi')

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">{company}</Link>
            <p>{s.footer_description || 'Продажа, монтаж и обслуживание ворот, роллет, шлагбаумов и гаражных дверей.'}</p>
            <div className="messengers">
              {s.whatsapp && (
                <a href={`https://wa.me/${s.whatsapp.replace(/\D/g, '')}`} className="messenger-btn wa" target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
              )}
              {tg && (
                <a href={tg} className="messenger-btn tg" target="_blank" rel="noopener noreferrer">
                  Telegram
                </a>
              )}
            </div>
          </div>

          <div className="footer-col">
            <h4>Каталог</h4>
            <div className="footer-links">
              <Link to="/catalog">Все разделы</Link>
              {productSections.map((sec) => sec.entry_slug && (
                <Link key={sec.id} to={catalogLink(sec.entry_slug)}>{sec.title}</Link>
              ))}
            </div>
          </div>

          <div className="footer-col">
            <h4>Компания</h4>
            <div className="footer-links">
              <Link to={catalogLink('o-kompanii/o-nas')}>О нас</Link>
              <Link to={catalogLink('o-kompanii/otzyvy')}>Отзывы</Link>
              <Link to={catalogLink('uslugi/obzor')}>Услуги</Link>
              <Link to="/portfolio">Примеры работ</Link>
              <Link to="/contacts">Контакты</Link>
            </div>
          </div>

          <div className="footer-col footer-contact">
            <h4>Контакты</h4>
            <p><a href={`tel:${(s.phone || SITE_DEFAULTS.phone).replace(/\D/g, '')}`}>{s.phone || SITE_DEFAULTS.phone}</a></p>
            <p><a href={`mailto:${s.email || SITE_DEFAULTS.email}`}>{s.email || SITE_DEFAULTS.email}</a></p>
            <p>{s.address || SITE_DEFAULTS.address}</p>
            <p className="footer-hours">{s.working_hours || SITE_DEFAULTS.working_hours}</p>
          </div>
        </div>

        <div className="footer-bottom">
          <nav className="footer-legal-links" aria-label="Правовая информация">
            <Link to="/legal/privacy">Политика конфиденциальности</Link>
            <Link to="/legal/terms">Пользовательское соглашение</Link>
            <Link to="/legal/cookies">Политика cookie</Link>
          </nav>

          <div className="footer-meta">
            <p className="footer-copy">
              © {year} {legalEntity}{s.unp ? ` · УНП ${s.unp}` : ''}
            </p>
            {(s.bank_account || s.bank_name) && (
              <p className="footer-bank">
                {[
                  s.bank_account,
                  s.bank_name,
                  s.bank_address,
                  s.bank_bic ? `BIC ${s.bank_bic}` : '',
                ].filter(Boolean).join(', ')}
              </p>
            )}
            {s.copyright_extra && (
              <p className="footer-copy-extra">{s.copyright_extra}</p>
            )}
          </div>

          {s.price_disclaimer && (
            <p className="footer-price-disclaimer">{s.price_disclaimer}</p>
          )}
        </div>
      </div>
    </footer>
  )
}
