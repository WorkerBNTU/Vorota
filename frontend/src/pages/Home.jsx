import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSiteData } from '../context/SiteDataContext'
import { useLeadModal } from '../components/LeadModal'
import ContentImage from '../components/ContentImage'
import useSiteMeta from '../hooks/useSiteMeta'
import { catalogLink } from './CatalogPage'
import './Home.css'

const FALLBACK_SLIDES = [
  'linear-gradient(135deg, #2a3548 0%, #1a2332 100%)',
  'linear-gradient(135deg, #3d4a5c 0%, #1a2332 100%)',
  'linear-gradient(135deg, #1a2332 0%, #2a3548 100%)',
]

export default function Home() {
  const { content } = useSiteData()
  const [slideIndex, setSlideIndex] = useState(0)
  // Фон каждого слайда подключаем только тогда, когда слайд вот-вот
  // понадобится, а не все сразу при загрузке страницы — иначе 2-й/3-й
  // слайды тянут канал у самой важной картинки (первый экран, LCP),
  // особенно заметно на мобильном интернете.
  const [loadedSlides, setLoadedSlides] = useState(() => new Set([0]))
  const { openModal } = useLeadModal()

  useEffect(() => {
    const total = content?.hero_slides?.length || 3
    // Подгружаем следующий слайд заранее (не дожидаясь его показа), но
    // с задержкой — чтобы не мешать первой картинке в первые секунды.
    const preloadTimer = setTimeout(() => {
      setLoadedSlides((prev) => (prev.has(1) || total <= 1 ? prev : new Set(prev).add(1)))
    }, 1500)
    const timer = setInterval(() => {
      setSlideIndex((i) => {
        const next = (i + 1) % total
        setLoadedSlides((prev) => (prev.has(next) ? prev : new Set(prev).add(next)))
        return next
      })
    }, 5000)
    return () => { clearInterval(timer); clearTimeout(preloadTimer) }
  }, [content])

  const goToSlide = (i) => {
    setSlideIndex(i)
    setLoadedSlides((prev) => (prev.has(i) ? prev : new Set(prev).add(i)))
  }

  const settings = content?.settings || {}
  const slides = content?.hero_slides?.length ? content.hero_slides : null
  const services = content?.home_services || []
  const advantages = content?.advantages || []
  const steps = content?.work_steps || []

  useSiteMeta({
    title: settings.meta_title || settings.tagline,
    description: settings.meta_description || settings.footer_description,
    image: slides?.[0]?.image_url,
    path: '/',
  })

  return (
    <>
      <section className="hero">
        <div className="hero-bg">
          {slides ? slides.map((slide, i) => (
            <div
              key={slide.id}
              className={`hero-slide ${i === slideIndex ? 'active' : ''}`}
              style={loadedSlides.has(i) ? { backgroundImage: `url(${slide.image_url})` } : undefined}
            />
          )) : FALLBACK_SLIDES.map((bg, i) => (
            <div
              key={i}
              className={`hero-slide hero-slide-fallback ${i === slideIndex ? 'active' : ''}`}
              style={{ background: bg }}
            />
          ))}
        </div>

        <div className="container hero-content">
          {settings.hero_badge && (
            <span className="hero-badge">{settings.hero_badge}</span>
          )}
          <h1>{settings.hero_title || 'Купить ворота и роллеты в Беларуси'}</h1>
          <p>{settings.hero_subtitle || 'Продажа, монтаж и обслуживание по Минску, регионам и всей стране. Официальный дилер DoorHan.'}</p>
          <div className="hero-actions">
            <button type="button" className="btn btn-primary btn-lg" onClick={() => openModal('главная — первый экран')}>
              Получить консультацию
            </button>
            <Link to={catalogLink('uslugi/obzor')} className="btn btn-outline btn-lg hero-btn-outline">
              Наши услуги
            </Link>
          </div>
        </div>

        <div className="hero-dots">
          {(slides || FALLBACK_SLIDES).map((_, i) => (
            <button key={i} type="button" className={`hero-dot ${i === slideIndex ? 'active' : ''}`} onClick={() => goToSlide(i)} aria-label={`Слайд ${i + 1}`} />
          ))}
        </div>
      </section>

      <section className="section services-home">
        <div className="container">
          <h2 className="section-title">Чем мы занимаемся</h2>
          <p className="section-subtitle">Полный спектр услуг по воротам, роллетам, шлагбаумам и гаражным дверям</p>
          <div className="grid-4">
            {services.map((s) => (
              <Link key={s.id} to="/catalog" className="card service-card service-card-link">
                <div className="service-card-image">
                  <ContentImage src={s.image_url} alt={s.title} className="content-image-fill" aspectRatio="16/10" />
                </div>
                <h3>{s.title}</h3>
                <p>{s.short_description}</p>
              </Link>
            ))}
          </div>
          <div className="section-cta">
            <Link to="/catalog" className="btn btn-dark">Весь каталог</Link>
          </div>
        </div>
      </section>

      <section className="section advantages">
        <div className="container">
          <h2 className="section-title">Почему выбирают нас</h2>
          <div className="grid-2">
            {advantages.map((a) => (
              <div key={a.id} className="card advantage-item">
                <div className="advantage-image-wrap">
                  {a.image_url ? (
                    <ContentImage src={a.image_url} alt={a.title} className="content-image-fill" aspectRatio="1" />
                  ) : (
                    <div className="advantage-icon" aria-hidden="true">{a.icon || '✓'}</div>
                  )}
                </div>
                <div>
                  <h3>{a.title}</h3>
                  <p>{a.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section steps">
        <div className="container">
          <h2 className="section-title">Как мы работаем</h2>
          <p className="section-subtitle">От заявки до сдачи объекта — прозрачно и без сюрпризов</p>
          <div className="grid-4">
            {steps.map((step) => (
              <div key={step.id} className="step-card">
                <div className="step-number">{String(step.step_number).padStart(2, '0')}</div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <h2>Готовы обсудить ваш проект?</h2>
          <p>Оставьте заявку — перезвоним в ближайшее время и рассчитаем стоимость</p>
          <button type="button" className="btn btn-dark btn-lg" onClick={() => openModal('главная — CTA')}>
            Оставить заявку
          </button>
        </div>
      </section>
    </>
  )
}
