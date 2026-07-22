import { useState, useEffect } from 'react'
import { api } from '../api'
import ImagePicker from './ImagePicker'
import { appendImagePick } from './imagePickerUtils'

export default function AdminContent() {
  const [settings, setSettings] = useState(null)
  const [form, setForm] = useState({})
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.adminGetSettings().then((d) => {
      setSettings(d)
      setForm(d)
    }).catch(() => {})
  }, [])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([key, val]) => {
        if (val !== null && val !== undefined && key !== 'logo_url') {
          if (key === 'logo' && typeof val === 'string') return
          fd.append(key, val)
        }
      })
      appendImagePick(fd, e.target, 'logo')
      const updated = await api.adminUpdateSettings(fd)
      setSettings(updated)
      setForm(updated)
      setStatus({ type: 'success', text: 'Настройки сохранены' })
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  if (!settings) return <p>Загрузка...</p>

  const fields = [
    { name: 'company_name', label: 'Название компании' },
    { name: 'tagline', label: 'Слоган' },
    { name: 'phone', label: 'Телефон' },
    { name: 'email', label: 'Email' },
    { name: 'address', label: 'Адрес' },
    { name: 'map_latitude', label: 'Широта (запасной вариант)', placeholder: '53.864236' },
    { name: 'map_longitude', label: 'Долгота (запасной вариант)', placeholder: '27.527497' },
    { name: 'map_yandex_org_id', label: 'ID организации в Яндекс.Картах', placeholder: '54736687390' },
    { name: 'whatsapp', label: 'WhatsApp (номер без +)', placeholder: '375298880688' },
    { name: 'telegram', label: 'Telegram (username без @)', placeholder: 'vorotarb' },
    { name: 'working_hours', label: 'Часы работы' },
    { name: 'map_embed_url', label: 'Ссылка map-widget (необязательно — иначе строится по ID организации; maps/-/... не подходит)' },
    { name: 'footer_description', label: 'Описание в подвале', type: 'textarea' },
  ]

  const messengerHint =
    'Пока поля пустые — кнопки мессенджеров на сайте скрыты. После заполнения появятся в шапке/подвале, на контактах и во всплывающих кнопках.'

  const analyticsFields = [
    { name: 'yandex_metrika_id', label: 'ID счётчика Яндекс.Метрики', placeholder: 'например, 12345678' },
    { name: 'google_analytics_id', label: 'ID Google Analytics (GA4)', placeholder: 'например, G-XXXXXXXXXX' },
  ]

  return (
    <div className="admin-card">
      <h3 style={{ marginBottom: 4, fontFamily: 'var(--font-display)' }}>Компания и контакты</h3>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: 20 }}>
        Общие данные компании — используются в шапке, подвале и на странице контактов на всех страницах сайта.
        Заголовок и SEO самой главной страницы — во вкладке «Главная страница» в меню слева.
      </p>
      {status && <div className={`alert alert-${status.type}`}>{status.text}</div>}
      <form onSubmit={handleSubmit}>
        <ImagePicker name="logo" label="Логотип" currentUrl={settings.logo_url} resetKey="settings" />
        {fields.map((f) => (
          <div key={f.name} className="form-group">
            <label>{f.label}</label>
            {f.type === 'textarea' ? (
              <textarea name={f.name} value={form[f.name] || ''} onChange={handleChange} rows={3} />
            ) : (
              <input name={f.name} value={form[f.name] || ''} onChange={handleChange} placeholder={f.placeholder} />
            )}
            {(f.name === 'whatsapp' || f.name === 'telegram') && f.name === 'telegram' && (
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 4 }}>{messengerHint}</p>
            )}
          </div>
        ))}
        <h4 style={{ margin: '24px 0 12px' }}>Аналитика</h4>
        {analyticsFields.map((f) => (
          <div key={f.name} className="form-group">
            <label>{f.label}</label>
            <input name={f.name} value={form[f.name] || ''} onChange={handleChange} placeholder={f.placeholder} />
          </div>
        ))}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Сохранение...' : 'Сохранить'}
        </button>
      </form>
    </div>
  )
}
