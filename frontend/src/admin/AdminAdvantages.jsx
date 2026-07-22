import { useState, useEffect } from 'react'
import { api } from '../api'
import useScrollOnOpen from './useScrollOnOpen'
import ImagePicker from './ImagePicker'
import { appendImagePick } from './imagePickerUtils'

export default function AdminAdvantages() {
  const [items, setItems] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const formRef = useScrollOnOpen(editing)

  const load = () => api.adminList('advantages').then((d) => setItems(d.results || d)).catch(() => {})
  useEffect(() => { load() }, [])

  const startEdit = (item = null) => {
    setEditing(item?.id || 'new')
    setForm(item || { title: '', description: '', icon: '✓', order: items.length + 1 })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => {
      if (k === 'image_url' || k === 'image') return
      if (v !== null && v !== undefined) fd.append(k, v)
    })
    appendImagePick(fd, e.target, 'image')
    if (editing === 'new') await api.adminCreate('advantages', fd)
    else await api.adminUpdate('advantages', editing, fd)
    setEditing(null)
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('Удалить преимущество?')) return
    await api.adminDelete('advantages', id)
    load()
  }

  return (
    <>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: 16 }}>
        Блок «Почему выбирают нас» на главной. Можно указать эмодзи-иконку и/или фото.
      </p>
      <div style={{ marginBottom: 16 }}>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => startEdit()}>+ Добавить</button>
      </div>

      <div className="admin-card" style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr><th>Фото</th><th>Заголовок</th><th>Порядок</th><th></th></tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>
                  {item.image_url
                    ? <img src={item.image_url} alt="" style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} />
                    : <span style={{ fontSize: '1.4rem' }}>{item.icon}</span>}
                </td>
                <td>{item.title}</td>
                <td>{item.order}</td>
                <td>
                  <button type="button" className="btn btn-outline btn-sm" style={{ marginRight: 8 }} onClick={() => startEdit(item)}>Изменить</button>
                  <button type="button" className="btn btn-outline btn-sm" style={{ color: 'var(--color-danger)' }} onClick={() => handleDelete(item.id)}>Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && (
        <div className="admin-card" ref={formRef}>
          <h3 style={{ marginBottom: 16 }}>{editing === 'new' ? 'Новое преимущество' : 'Редактирование'}</h3>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label>Заголовок</label>
              <input value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Описание</label>
              <textarea rows={3} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Иконка (эмодзи, если нет фото)</label>
              <input value={form.icon ?? ''} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
            </div>
            <ImagePicker name="image" label="Фото (необязательно)" currentUrl={form.image_url} resetKey={editing} />
            <div className="form-group">
              <label>Порядок</label>
              <input type="number" min="0" value={form.order ?? 0} onChange={(e) => setForm({ ...form, order: e.target.value })} />
            </div>
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
