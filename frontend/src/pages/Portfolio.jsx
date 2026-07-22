import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'
import BeforeAfterSlider from '../components/BeforeAfterSlider'
import useSiteMeta from '../hooks/useSiteMeta'
import './Portfolio.css'

const CATEGORIES = [
  { value: '', label: 'Все' },
  { value: 'gates', label: 'Ворота' },
  { value: 'barriers', label: 'Шлагбаумы' },
  { value: 'doors', label: 'Гаражные двери' },
  { value: 'repair', label: 'Ремонт' },
]

const CATEGORY_LABELS = {
  gates: 'Ворота',
  barriers: 'Шлагбаумы',
  doors: 'Гаражные двери',
  repair: 'Ремонт',
}

export default function Portfolio() {
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('')
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    api.getPortfolio(filter || undefined).then((d) => setItems(d.results || d)).catch(() => {})
  }, [filter])

  useSiteMeta({
    title: 'Примеры работ — ворота в Беларуси',
    description:
      'Реальные проекты ВоротаРБ: установка ворот, роллет, шлагбаумов и ремонт автоматики в Минске и по всей Беларуси. DoorHan, BFT и другие бренды.',
    path: '/portfolio',
  })

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Примеры работ</h1>
          <p>Реальные проекты: от установки ворот до ремонта автоматики</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="filters">
            {CATEGORIES.map((c) => (
              <button
                key={c.value}
                className={`filter-btn ${filter === c.value ? 'active' : ''}`}
                onClick={() => setFilter(c.value)}
              >
                {c.label}
              </button>
            ))}
          </div>

          {items.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 0' }}>
              <p style={{ color: 'var(--color-text-muted)', marginBottom: 16 }}>
                Мы готовим галерею выполненных проектов. А пока — посмотрите наш каталог или оставьте заявку.
              </p>
              <Link to="/catalog" className="btn btn-primary">Перейти в каталог</Link>
            </div>
          ) : (            <div className="portfolio-grid">
              {items.map((item) => (
                <div key={item.id} className="card portfolio-item" onClick={() => setSelected(item)}>
                  {item.category === 'repair' && item.image_before_url && item.image_after_url ? (
                    <div className="portfolio-before-after">
                      <div className="ba-before">
                        <img src={item.image_before_url} alt="До" loading="lazy" />
                        <span>До</span>
                      </div>
                      <div className="ba-after">
                        <img src={item.image_after_url} alt="После" loading="lazy" />
                        <span>После</span>
                      </div>
                    </div>
                  ) : (
                    <img src={item.image_url} alt={item.title} loading="lazy" />
                  )}
                  <div className="portfolio-overlay">
                    <span>{CATEGORY_LABELS[item.category] || item.category}</span>
                    <h3>{item.title}</h3>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {selected && (
        <div className="lightbox" onClick={() => setSelected(null)}>
          <button className="lightbox-close" onClick={() => setSelected(null)}>×</button>
          <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
            {selected.category === 'repair' && selected.image_before_url && selected.image_after_url ? (
              <BeforeAfterSlider
                beforeSrc={selected.image_before_url}
                afterSrc={selected.image_after_url}
              />
            ) : (
              <img src={selected.image_url} alt={selected.title} />
            )}
            <div className="lightbox-info">
              <h2 style={{ fontFamily: 'var(--font-display)', marginBottom: 8 }}>{selected.title}</h2>
              <p style={{ color: 'var(--color-text-muted)' }}>{selected.description}</p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
