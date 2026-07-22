import { useState } from 'react'
import AdminHero from './AdminHero'
import AdminServices from './AdminServices'
import AdminHomeTexts from './AdminHomeTexts'
import AdminAdvantages from './AdminAdvantages'
import AdminWorkSteps from './AdminWorkSteps'

const TABS = [
  { key: 'slides', label: 'Слайдер' },
  { key: 'texts', label: 'Заголовок, бейдж и SEO' },
  { key: 'services', label: 'Блок «Наши услуги»' },
  { key: 'advantages', label: 'Почему выбирают нас' },
  { key: 'steps', label: 'Как мы работаем' },
]

export default function AdminHome() {
  const [tab, setTab] = useState('slides')

  return (
    <>
      <p style={{ color: 'var(--color-text-muted)', marginTop: -8, marginBottom: 20 }}>
        Управление тем, что видит посетитель на главной странице сайта (<a href="/" target="_blank" rel="noopener noreferrer">открыть →</a>).
      </p>
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`btn btn-sm ${tab === t.key ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'slides' && <AdminHero />}
      {tab === 'texts' && <AdminHomeTexts />}
      {tab === 'services' && <AdminServices />}
      {tab === 'advantages' && <AdminAdvantages />}
      {tab === 'steps' && <AdminWorkSteps />}
    </>
  )
}
