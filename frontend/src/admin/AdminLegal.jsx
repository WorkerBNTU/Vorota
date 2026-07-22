import { useEffect, useState } from 'react'
import { api } from '../api'
import MarkdownEditor from './MarkdownEditor'

const TABS = [
  { id: 'company', label: 'Компания в футере' },
  { id: 'prices', label: 'Цены и оферта' },
  { id: 'privacy', label: 'Политика конфиденциальности' },
  { id: 'terms', label: 'Пользовательское соглашение' },
  { id: 'cookies', label: 'Cookie' },
  { id: 'consent', label: 'Согласие в форме' },
]

export default function AdminLegal() {
  const [form, setForm] = useState(null)
  const [tab, setTab] = useState('company')
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.adminGetSettings().then(setForm).catch(() => setStatus({ type: 'error', text: 'Не удалось загрузить' }))
  }, [])

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus(null)
    try {
      const payload = {
        legal_entity_name: form.legal_entity_name || '',
        unp: form.unp || '',
        bank_account: form.bank_account || '',
        bank_name: form.bank_name || '',
        bank_address: form.bank_address || '',
        bank_bic: form.bank_bic || '',
        copyright_extra: form.copyright_extra || '',
        price_disclaimer: form.price_disclaimer || '',
        privacy_policy: form.privacy_policy || '',
        privacy_updated_at: form.privacy_updated_at || null,
        terms_of_use: form.terms_of_use || '',
        terms_updated_at: form.terms_updated_at || null,
        cookie_policy: form.cookie_policy || '',
        cookie_updated_at: form.cookie_updated_at || null,
        consent_checkbox_label: form.consent_checkbox_label || '',
      }
      const updated = await api.adminUpdateSettings(payload)
      setForm(updated)
      setStatus({ type: 'success', text: 'Правовая информация сохранена' })
    } catch (err) {
      setStatus({ type: 'error', text: err.message })
    } finally {
      setLoading(false)
    }
  }

  if (!form) return <p>Загрузка...</p>

  return (
    <div className="admin-card">
      <h3 style={{ marginBottom: 4, fontFamily: 'var(--font-display)' }}>Правовая информация</h3>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: 12 }}>
        Тексты для подвала сайта, страниц /legal/* и чекбокса в форме заявки.
        Черновики под Закон РБ № 99-З; перед продакшеном при необходимости уточните сроки у юриста.
        Чекбокс согласия на сайте <strong>не отмечен заранее</strong> — так требует ст. 5 Закона № 99-З.
      </p>

      <div className="admin-tabs" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 20 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            className={`btn btn-sm ${tab === t.id ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {status && <div className={`alert alert-${status.type}`}>{status.text}</div>}

      <form onSubmit={handleSubmit}>
        {tab === 'company' && (
          <>
            <div className="form-group">
              <label>Юридическое наименование</label>
              <input
                value={form.legal_entity_name || ''}
                onChange={(e) => setField('legal_entity_name', e.target.value)}
                placeholder='ООО «ВоротаРБ»'
              />
            </div>
            <div className="form-group">
              <label>УНП</label>
              <input
                value={form.unp || ''}
                onChange={(e) => setField('unp', e.target.value)}
                placeholder="692057005"
              />
            </div>
            <div className="form-group">
              <label>Расчётный счёт (IBAN)</label>
              <input
                value={form.bank_account || ''}
                onChange={(e) => setField('bank_account', e.target.value)}
                placeholder="BY61ALFA…"
              />
            </div>
            <div className="form-group">
              <label>Банк</label>
              <input
                value={form.bank_name || ''}
                onChange={(e) => setField('bank_name', e.target.value)}
                placeholder='ЗАО «АЛЬФА-Банк»'
              />
            </div>
            <div className="form-group">
              <label>Адрес банка</label>
              <input
                value={form.bank_address || ''}
                onChange={(e) => setField('bank_address', e.target.value)}
                placeholder="г. Минск, ул. Мясникова, 70"
              />
            </div>
            <div className="form-group">
              <label>BIC</label>
              <input
                value={form.bank_bic || ''}
                onChange={(e) => setField('bank_bic', e.target.value)}
                placeholder="ALFABY2X"
              />
            </div>
            <div className="form-group">
              <label>Доп. текст об авторских правах</label>
              <textarea
                rows={3}
                value={form.copyright_extra || ''}
                onChange={(e) => setField('copyright_extra', e.target.value)}
              />
            </div>
          </>
        )}

        {tab === 'prices' && (
          <div className="form-group">
            <label>Дисклеймер о ценах (звёздочка внизу сайта)</label>
            <textarea
              rows={8}
              value={form.price_disclaimer || ''}
              onChange={(e) => setField('price_disclaimer', e.target.value)}
            />
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: 8 }}>
              Показывается одним блоком в подвале, как на сайтах производителей (Алютех и др.):
              справочный характер, не публичная оферта, ориентировочные цены.
            </p>
          </div>
        )}

        {tab === 'privacy' && (
          <>
            <div className="form-group">
              <label>Дата обновления</label>
              <input
                type="date"
                value={form.privacy_updated_at || ''}
                onChange={(e) => setField('privacy_updated_at', e.target.value || null)}
              />
            </div>
            <div className="form-group">
              <label>Текст политики (Markdown)</label>
              <MarkdownEditor
                value={form.privacy_policy || ''}
                onChange={(v) => setField('privacy_policy', v)}
              />
            </div>
          </>
        )}

        {tab === 'terms' && (
          <>
            <div className="form-group">
              <label>Дата обновления</label>
              <input
                type="date"
                value={form.terms_updated_at || ''}
                onChange={(e) => setField('terms_updated_at', e.target.value || null)}
              />
            </div>
            <div className="form-group">
              <label>Текст соглашения (Markdown)</label>
              <MarkdownEditor
                value={form.terms_of_use || ''}
                onChange={(v) => setField('terms_of_use', v)}
              />
            </div>
          </>
        )}

        {tab === 'cookies' && (
          <>
            <div className="form-group">
              <label>Дата обновления</label>
              <input
                type="date"
                value={form.cookie_updated_at || ''}
                onChange={(e) => setField('cookie_updated_at', e.target.value || null)}
              />
            </div>
            <div className="form-group">
              <label>Политика cookie (Markdown)</label>
              <MarkdownEditor
                value={form.cookie_policy || ''}
                onChange={(v) => setField('cookie_policy', v)}
              />
            </div>
          </>
        )}

        {tab === 'consent' && (
          <div className="form-group">
            <label>Текст чекбокса в форме заявки</label>
            <textarea
              rows={3}
              value={form.consent_checkbox_label || ''}
              onChange={(e) => setField('consent_checkbox_label', e.target.value)}
            />
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: 8 }}>
              Рядом на сайте будет ссылка на Политику конфиденциальности.
              Галочку пользователь ставит сам (нельзя включать «по умолчанию»).
            </p>
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Сохранение…' : 'Сохранить'}
        </button>
      </form>
    </div>
  )
}
