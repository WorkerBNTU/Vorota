import { useState, useEffect } from 'react'
import { api } from '../api'
import useScrollOnOpen from './useScrollOnOpen'
import ImagePicker from './ImagePicker'
import { appendImagePick } from './imagePickerUtils'

export default function AdminPortfolio() {
  const [items, setItems] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const formRef = useScrollOnOpen(editing)

  const load = () => api.adminList('portfolio').then((d) => setItems(d.results || d)).catch(() => {})
  useEffect(() => { load() }, [])

  const startEdit = (item = null) => {
    setEditing(item?.id || 'new')
    setForm(item || { title: '', category: 'gates', description: '', order: 0, is_active: true })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => {
      if (k.endsWith('_url') || k === 'created_at') return
      if (typeof v === 'boolean') fd.append(k, v)
      else if (v !== null && v !== undefined) fd.append(k, v)
    })
    ;['image', 'image_before', 'image_after'].forEach((name) => appendImagePick(fd, e.target, name))

    if (editing === 'new') await api.adminCreate('portfolio', fd)
    else await api.adminUpdate('portfolio', editing, fd)

    setEditing(null)
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('Удалить работу?')) return
    await api.adminDelete('portfolio', id)
    load()
  }

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <button className="btn btn-primary btn-sm" onClick={() => startEdit()}>+ Добавить работу</button>
      </div>

      <div className="admin-card" style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr><th>Фото</th><th>Название</th><th>Категория</th><th>Активен</th><th></th></tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.image_url && <img src={item.image_url} alt="" style={{ width: 60, height: 40, objectFit: 'cover', borderRadius: 4 }} />}</td>
                <td>{item.title}</td>
                <td>{item.category}</td>
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
        {items.length === 0 && <p style={{ textAlign: 'center', padding: 24, color: 'var(--color-text-muted)' }}>Добавьте первую работу</p>}
      </div>

      {editing && (
        <div className="admin-card" ref={formRef}>
          <h3 style={{ marginBottom: 16 }}>{editing === 'new' ? 'Новая работа' : 'Редактирование'}</h3>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label>Название</label>
              <input value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Категория</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="gates">Ворота</option>
                <option value="barriers">Шлагбаумы</option>
                <option value="doors">Гаражные двери</option>
                <option value="repair">Ремонт</option>
              </select>
            </div>
            <div className="form-group">
              <label>Описание</label>
              <textarea value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
            </div>
            <ImagePicker name="image" label="Основное фото" currentUrl={form.image_url} resetKey={editing} />
            {form.category === 'repair' && (
              <>
                <ImagePicker name="image_before" label="Фото «До»" currentUrl={form.image_before_url} resetKey={editing} />
                <ImagePicker name="image_after" label="Фото «После»" currentUrl={form.image_after_url} resetKey={editing} />
              </>
            )}
            <div className="form-group">
              <label><input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Активен</label>
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
