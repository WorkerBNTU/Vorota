import { useState, useEffect } from 'react'
import { api } from '../api'
import useScrollOnOpen from './useScrollOnOpen'
import ImagePicker from './ImagePicker'
import { appendImagePick } from './imagePickerUtils'

const TRANSLIT = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i',
  й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't',
  у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '',
  э: 'e', ю: 'yu', я: 'ya',
}

function slugify(text) {
  return (text || '')
    .toLowerCase()
    .split('')
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || `service-${Date.now()}`
}

export default function AdminServices() {
  const [items, setItems] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const formRef = useScrollOnOpen(editing)

  const load = () => api.adminList('services').then((d) => setItems(d.results || d)).catch(() => {})
  useEffect(() => { load() }, [])

  const startEdit = (item = null) => {
    setEditing(item?.id || 'new')
    setForm(item || {
      title: '', slug: '', category: 'gates', short_description: '', full_description: '',
      options: '', icon: '🚪', order: 0, is_active: true, show_on_home: false,
    })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    // slug/категория/полное описание больше не показываются на сайте
    // (см. подсказку в форме) — если админ их не трогал, подставляем
    // значения сами, чтобы не требовать заполнения того, что не видно.
    const normalized = {
      ...form,
      slug: form.slug || slugify(form.title),
      full_description: form.full_description || form.short_description || form.title,
    }
    const fd = new FormData()
    Object.entries(normalized).forEach(([k, v]) => {
      if (k.endsWith('_url') || k === 'options_list') return
      if (typeof v === 'boolean') fd.append(k, v)
      else if (v !== null && v !== undefined) fd.append(k, v)
    })
    appendImagePick(fd, e.target, 'image')

    if (editing === 'new') await api.adminCreate('services', fd)
    else await api.adminUpdate('services', editing, fd)

    setEditing(null)
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('Удалить услугу?')) return
    await api.adminDelete('services', id)
    load()
  }

  return (
    <>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: 16 }}>
        Карточки блока «Чем мы занимаемся» на главной странице (показываются только те, у которых включено «На главной»). Ссылка с каждой карточки ведёт в общий каталог.
      </p>
      <div style={{ marginBottom: 16 }}>
        <button className="btn btn-primary btn-sm" onClick={() => startEdit()}>+ Добавить карточку</button>
      </div>

      <div className="admin-card" style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr><th>Название</th><th>На главной</th><th>Активна</th><th></th></tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.icon} {item.title}</td>
                <td>{item.show_on_home ? '✓' : '—'}</td>
                <td>{item.is_active ? '✓' : '—'}</td>
                <td>
                  <button className="btn btn-outline btn-sm" style={{ marginRight: 8, fontSize: '0.8rem', padding: '4px 10px' }}
                    onClick={() => startEdit(item)}>Изменить</button>
                  <button className="btn btn-outline btn-sm" style={{ fontSize: '0.8rem', padding: '4px 10px', color: 'var(--color-danger)' }}
                    onClick={() => handleDelete(item.id)}>Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="admin-card" ref={formRef}>
          <h3 style={{ marginBottom: 16 }}>{editing === 'new' ? 'Новая услуга' : 'Редактирование'}</h3>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label>Название</label>
              <input value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Иконка (эмодзи)</label>
              <input value={form.icon ?? ''} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Краткое описание (под названием на карточке)</label>
              <textarea value={form.short_description || ''} onChange={(e) => setForm({ ...form, short_description: e.target.value })} rows={2} />
            </div>
            <ImagePicker name="image" label="Изображение" currentUrl={form.image_url} resetKey={editing} />
            <div className="form-group">
              <label>Порядок</label>
              <input type="number" min="0" value={form.order ?? 0} onChange={(e) => setForm({ ...form, order: e.target.value })} />
            </div>
            <div className="form-group">
              <label><input type="checkbox" checked={form.show_on_home} onChange={(e) => setForm({ ...form, show_on_home: e.target.checked })} /> На главной</label>
            </div>
            <div className="form-group">
              <label><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Активна</label>
            </div>
            <details style={{ margin: '16px 0' }}>
              <summary style={{ cursor: 'pointer', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                Дополнительные поля (сейчас нигде на сайте не отображаются)
              </summary>
              <div style={{ marginTop: 12 }}>
                {['slug', 'full_description', 'options'].map((f) => (
                  <div key={f} className="form-group">
                    <label>{f}</label>
                    {['full_description', 'options'].includes(f) ? (
                      <textarea value={form[f] || ''} onChange={(e) => setForm({ ...form, [f]: e.target.value })} rows={3} />
                    ) : (
                      <input value={form[f] ?? ''} onChange={(e) => setForm({ ...form, [f]: e.target.value })} />
                    )}
                  </div>
                ))}
                <div className="form-group">
                  <label>Категория</label>
                  <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    <option value="gates">Ворота и роллеты</option>
                    <option value="install">Монтаж</option>
                    <option value="service">Обслуживание</option>
                    <option value="barriers">Шлагбаумы</option>
                    <option value="doors">Гаражные двери</option>
                  </select>
                </div>
              </div>
            </details>
            <div style={{ display: 'flex', gap: 12 }}>
              <button type="submit" className="btn btn-primary btn-sm">Сохранить</button>
              <button type="button" className="btn btn-outline btn-sm" onClick={() => setEditing(null)}>Отмена</button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
