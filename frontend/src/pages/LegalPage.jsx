import { Link, useParams } from 'react-router-dom'
import MarkdownContent from '../components/MarkdownContent'
import { useSiteData } from '../context/SiteDataContext'
import useSiteMeta from '../hooks/useSiteMeta'
import './Legal.css'

const DOCS = {
  privacy: {
    title: 'Политика конфиденциальности',
    field: 'privacy_policy',
    updatedField: 'privacy_updated_at',
  },
  terms: {
    title: 'Пользовательское соглашение',
    field: 'terms_of_use',
    updatedField: 'terms_updated_at',
  },
  cookies: {
    title: 'Политика cookie',
    field: 'cookie_policy',
    updatedField: 'cookie_updated_at',
  },
}

export default function LegalPage() {
  const { doc } = useParams()
  const { settings, loading } = useSiteData()
  const meta = DOCS[doc]

  useSiteMeta({
    title: meta?.title || 'Правовая информация',
    description: meta?.title,
    path: meta ? `/legal/${doc}` : undefined,
    noindex: !meta,
  })

  if (!meta) {
    return (
      <section className="section">
        <div className="container">
          <h1>Страница не найдена</h1>
          <Link to="/">На главную</Link>
        </div>
      </section>
    )
  }

  if (loading || !settings) {
    return (
      <section className="section">
        <div className="container"><p>Загрузка…</p></div>
      </section>
    )
  }

  const content = settings[meta.field] || ''
  const updated = settings[meta.updatedField]

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <nav className="breadcrumbs">
            <Link to="/">Главная</Link>
            <span> / </span>
            <span>Правовая информация</span>
            <span> / </span>
            <span>{meta.title}</span>
          </nav>
          <h1>{meta.title}</h1>
          {updated && (
            <p className="legal-updated">Обновлено: {formatDate(updated)}</p>
          )}
        </div>
      </section>
      <section className="section legal-doc">
        <div className="container legal-doc-inner">
          <nav className="legal-nav">
            <Link to="/legal/privacy" className={doc === 'privacy' ? 'is-active' : ''}>
              Политика конфиденциальности
            </Link>
            <Link to="/legal/terms" className={doc === 'terms' ? 'is-active' : ''}>
              Пользовательское соглашение
            </Link>
            <Link to="/legal/cookies" className={doc === 'cookies' ? 'is-active' : ''}>
              Политика cookie
            </Link>
          </nav>
          {content
            ? <MarkdownContent content={content} />
            : <p>Документ пока не заполнен. Отредактируйте его в админке → «Правовая информация».</p>}
        </div>
      </section>
    </>
  )
}

function formatDate(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
}
