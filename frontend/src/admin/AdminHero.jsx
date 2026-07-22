import { useState, useEffect } from 'react'
import { api } from '../api'
import useScrollOnOpen from './useScrollOnOpen'
import ImagePicker from './ImagePicker'
import { appendImagePick } from './imagePickerUtils'

export default function AdminHero() {
  const [items, setItems] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const formRef = useScrollOnOpen(editing)

  const load = () => api.adminList('hero-slides').then((d) => setItems(d.results || d)).catch(() => {})
  useEffect(() => { load() }, [])

  const startEdit = (item = null) => {
    setEditing(item?.id || 'new')
    setForm(item || { title: '', order: 0, is_active: true })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const fd = new FormData()
    Object.entries(form).forEach(([k, v]) => {
      if (k.endsWith('_url')) return
      if (typeof v === 'boolean') fd.append(k, v)
      else if (v !== null && v !== undefined) fd.append(k, v)
    })
    appendImagePick(fd, e.target, 'image')

    if (editing === 'new') await api.adminCreate('hero-slides', fd)
    else await api.adminUpdate('hero-slides', editing, fd)

    setEditing(null)
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('Удалить слайд?')) return
    await api.adminDelete('hero-slides', id)
    load()
  }

  return (
    <>
      <div style={{ marginBottom: 16 }}>
        <button className="btn btn-primary btn-sm" onClick={() => startEdit()}>+ Добавить слайд</button>
      </div>

      <div className="admin-card" style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr><th>Фото</th><th>Заголовок</th><th>Порядок</th><th>Активен</th><th></th></tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.image_url && <img src={item.image_url} alt="" style={{ width: 80, height: 45, objectFit: 'cover', borderRadius: 4 }} />}</td>
                <td>{item.title || '—'}</td>
                <td>{item.order}</td>
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
        {items.length === 0 && (
          <p style={{ textAlign: 'center', padding: 24, color: 'var(--color-text-muted)' }}>
            Добавьте фото ворот/роллет для слайдера на главной
          </p>
        )}
      </div>

      {editing && (
        <div className="admin-card" ref={formRef}>
          <h3 style={{ marginBottom: 16 }}>{editing === 'new' ? 'Новый слайд' : 'Редактирование слайда'}</h3>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label>Заголовок (необязательно)</label>
              <input value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <ImagePicker name="image" label="Изображение" currentUrl={form.image_url} resetKey={editing} />
            <div className="form-group">
              <label>Порядок</label>
              <input type="number" value={form.order ?? 0} onChange={(e) => setForm({ ...form, order: +e.target.value })} />
            </div>
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
