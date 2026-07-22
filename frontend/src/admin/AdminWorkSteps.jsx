import { useState, useEffect } from 'react'
import { api } from '../api'
import useScrollOnOpen from './useScrollOnOpen'

export default function AdminWorkSteps() {
  const [items, setItems] = useState([])
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const formRef = useScrollOnOpen(editing)

  const load = () => api.adminList('work-steps').then((d) => setItems(d.results || d)).catch(() => {})
  useEffect(() => { load() }, [])

  const startEdit = (item = null) => {
    setEditing(item?.id || 'new')
    const nextNum = (items.reduce((m, s) => Math.max(m, s.step_number || 0), 0) || 0) + 1
    setForm(item || {
      step_number: nextNum,
      title: '',
      description: '',
      order: nextNum,
    })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const data = {
      step_number: Number(form.step_number) || 1,
      title: form.title || '',
      description: form.description || '',
      order: Number(form.order) || 0,
    }
    if (editing === 'new') await api.adminCreate('work-steps', data)
    else await api.adminUpdate('work-steps', editing, data)
    setEditing(null)
    load()
  }

  const handleDelete = async (id) => {
    if (!confirm('Удалить шаг?')) return
    await api.adminDelete('work-steps', id)
    load()
  }

  return (
    <>
      <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: 16 }}>
        Блок «Как мы работаем» на главной — нумерованные шаги от заявки до сдачи.
      </p>
      <div style={{ marginBottom: 16 }}>
        <button type="button" className="btn btn-primary btn-sm" onClick={() => startEdit()}>+ Добавить шаг</button>
      </div>

      <div className="admin-card" style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr><th>№</th><th>Заголовок</th><th>Порядок</th><th></th></tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{String(item.step_number).padStart(2, '0')}</td>
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
          <h3 style={{ marginBottom: 16 }}>{editing === 'new' ? 'Новый шаг' : 'Редактирование'}</h3>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label>Номер шага (на карточке)</label>
              <input type="number" min="1" value={form.step_number ?? 1} onChange={(e) => setForm({ ...form, step_number: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Заголовок</label>
              <input value={form.title ?? ''} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Описание</label>
              <textarea rows={3} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Порядок сортировки</label>
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
