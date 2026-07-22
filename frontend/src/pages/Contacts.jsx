import LeadForm from '../components/LeadForm'
import { Link } from 'react-router-dom'
import { useSiteData } from '../context/SiteDataContext'
import { SITE_DEFAULTS } from '../constants/siteDefaults'
import ContentImage from '../components/ContentImage'
import useSiteMeta from '../hooks/useSiteMeta'
import { catalogLink } from './CatalogPage'
import './Contacts.css'

const CONTACT_ITEMS = [
  { key: 'phone', label: 'Телефон', imageSrc: null },
  { key: 'email', label: 'Email', imageSrc: null },
  { key: 'address', label: 'Адрес', imageSrc: null },
  { key: 'working_hours', label: 'Часы работы', imageSrc: null },
]

export default function Contacts() {
  const { settings } = useSiteData()
  const s = settings || {}

  const values = {
    phone: s.phone || SITE_DEFAULTS.phone,
    email: s.email || SITE_DEFAULTS.email,
    address: s.address || SITE_DEFAULTS.address,
    working_hours: s.working_hours || SITE_DEFAULTS.working_hours,
  }

  useSiteMeta({
    title: 'Контакты',
    description: `Свяжитесь с нами: ${values.phone}, ${values.address}. ${values.working_hours}.`,
    path: '/contacts',
  })

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Контакты</h1>
          <p>Свяжитесь с нами любым удобным способом — ответим в ближайшее время</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="contacts-grid">
            <div>
              <div className="card contact-info-card">
                {CONTACT_ITEMS.map((item) => (
                  <div key={item.key} className="contact-item">
                    <div className="contact-image-wrap">
                      <ContentImage src={item.imageSrc} alt={item.label} className="content-image-fill" aspectRatio="1" />
                    </div>
                    <div>
                      <h4>{item.label}</h4>
                      {item.key === 'phone' && (
                        <a href={`tel:${values.phone.replace(/\D/g, '')}`}>{values.phone}</a>
                      )}
                      {item.key === 'email' && (
                        <a href={`mailto:${values.email}`}>{values.email}</a>
                      )}
                      {item.key === 'address' && <p>{values.address}</p>}
                      {item.key === 'working_hours' && <p>{values.working_hours}</p>}
                    </div>
                  </div>
                ))}

                <div className="messengers">
                  {s.whatsapp && (
                    <a href={`https://wa.me/${s.whatsapp.replace(/\D/g, '')}`} className="messenger-btn wa" target="_blank" rel="noopener noreferrer">
                      WhatsApp
                    </a>
                  )}
                  {s.telegram && (
                    <a href={`https://t.me/${s.telegram}`} className="messenger-btn tg" target="_blank" rel="noopener noreferrer">
                      Telegram
                    </a>
                  )}
                </div>
              </div>

              <p className="contacts-requisites-link">
                <Link to={catalogLink('o-kompanii/kontakty')}>Реквизиты и полная контактная информация →</Link>
              </p>
            </div>

            <div className="card contacts-form-card">
              <h2>Обратная связь</h2>
              <p>Оставьте заявку — мы перезвоним и проконсультируем бесплатно</p>
              <LeadForm source="страница контактов" />
            </div>
          </div>

          {s.map_url && (
            <div className="map-section">
              <div className="map-caption">
                <strong>{s.company_name || 'Офис'}</strong>
                {values.address && <span> — {values.address}</span>}
              </div>
              <div className="map-container">
                <iframe
                  src={s.map_url}
                  title={`Карта — ${s.company_name || 'офис'}`}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              {s.map_page_url && (
                <p className="map-external-link">
                  <a href={s.map_page_url} target="_blank" rel="noopener noreferrer">
                    Открыть карточку организации в Яндекс.Картах →
                  </a>
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  )
}
