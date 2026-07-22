import { useState, useEffect } from 'react'
import { api } from '../api'
import SeoFields from './SeoFields'

// Заголовок/подзаголовок в шапке главной страницы и её SEO — это те же
// поля SiteSettings, что раньше жили в общей форме «Контент сайта» вперемешку
// с телефоном/адресом и т.п. Здесь они рядом со «Слайдами» и «Блоком услуг»
// — все три вкладки правят ровно то, что показывается на "/".
export default function AdminHomeTexts() {
  const [form, setForm] = useState(null)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.adminGetSettings().then(setForm).catch(() => {})
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    try {
      const updated = await api.adminUpdateSettings({
        hero_title: form.hero_title || '',
        hero_subtitle: form.hero_subtitle || '',
        hero_badge: form.hero_badge || '',
        meta_title: form.meta_title || '',
        meta_description: form.meta_description || '',
      })
      setForm(updated)
      setStatus({ type: 'success', text: 'Сохранено' })
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  if (!form) return <p>Загрузка...</p>

  return (
    <div className="admin-card">
      <h3 style={{ marginBottom: 8, fontFamily: 'var(--font-display)' }}>Заголовок, бейдж и SEO главной</h3>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: 20 }}>
        Текст, который посетитель видит первым делом поверх слайдера на главной странице сайта.
      </p>
      {status && <div className={`alert alert-${status.type}`}>{status.text}</div>}
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Бейдж над заголовком</label>
          <input
            value={form.hero_badge || ''}
            onChange={(e) => setForm({ ...form, hero_badge: e.target.value })}
            placeholder="Официальный дилер DoorHan, BFT"
          />
          <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
            Если оставить пустым — бейдж на сайте не показывается.
          </p>
        </div>
        <div className="form-group">
          <label>Заголовок (H1) поверх слайдера</label>
          <input
            value={form.hero_title || ''}
            onChange={(e) => setForm({ ...form, hero_title: e.target.value })}
            placeholder="Современные ворота и автоматика под ключ"
          />
        </div>
        <div className="form-group">
          <label>Подзаголовок поверх слайдера</label>
          <textarea
            rows={2}
            value={form.hero_subtitle || ''}
            onChange={(e) => setForm({ ...form, hero_subtitle: e.target.value })}
            placeholder="От установки до управления со смартфона"
          />
        </div>
        <SeoFields
          metaTitle={form.meta_title}
          metaDescription={form.meta_description}
          onChangeTitle={(v) => setForm({ ...form, meta_title: v })}
          onChangeDescription={(v) => setForm({ ...form, meta_description: v })}
          titlePlaceholder={form.tagline ? `Если пусто — «${form.tagline}»` : 'Заголовок главной страницы (title)'}
          descriptionPlaceholder={form.footer_description ? `Если пусто — «${form.footer_description}»` : 'Описание главной страницы'}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Сохранение...' : 'Сохранить'}
        </button>
      </form>
    </div>
  )
}
