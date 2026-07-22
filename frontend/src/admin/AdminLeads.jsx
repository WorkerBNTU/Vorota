import { useState, useEffect } from 'react'
import { api } from '../api'
import useScrollOnOpen from './useScrollOnOpen'

const STATUS_OPTIONS = [
  { value: 'new', label: 'Новая' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'completed', label: 'Завершена' },
  { value: 'rejected', label: 'Отказ' },
]

export default function AdminLeads() {
  const [leads, setLeads] = useState([])
  const [filters, setFilters] = useState({ status: '', search: '', date_from: '', date_to: '' })
  const [selected, setSelected] = useState(null)
  const [notes, setNotes] = useState('')
  const detailRef = useScrollOnOpen(selected?.id)

  const load = () => {
    const params = {}
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v })
    api.adminLeads(params).then((d) => setLeads(d.results || d)).catch(() => {})
  }

  useEffect(() => { load() }, [filters])

  const updateStatus = async (id, status) => {
    await api.adminUpdateLead(id, { status })
    load()
    if (selected?.id === id) setSelected({ ...selected, status })
  }

  const saveNotes = async () => {
    if (!selected) return
    await api.adminUpdateLead(selected.id, { internal_notes: notes })
    load()
    setSelected({ ...selected, internal_notes: notes })
  }

  const formatDate = (d) => new Date(d).toLocaleString('ru-RU')

  return (
    <>
      <div className="admin-filters">
        <select value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="">Все статусы</option>
          {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <input placeholder="Поиск..." value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })} />
        <input type="date" value={filters.date_from}
          onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} />
        <input type="date" value={filters.date_to}
          onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} />
      </div>

      <div className="admin-card" style={{ overflowX: 'auto' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Имя</th>
              <th>Телефон</th>
              <th>Интерес</th>
              <th>Город</th>
              <th>Источник</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id}>
                <td>{formatDate(lead.created_at)}</td>
                <td>{lead.name}</td>
                <td><a href={`tel:${lead.phone}`}>{lead.phone}</a></td>
                <td style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {lead.interest || '—'}
                </td>
                <td>{lead.city || '—'}</td>
                <td>{lead.source}</td>
                <td><span className={`status-badge status-${lead.status}`}>{lead.status_display}</span></td>
                <td>
                  <button className="btn btn-sm btn-outline" style={{ fontSize: '0.8rem', padding: '6px 12px' }}
                    onClick={() => { setSelected(lead); setNotes(lead.internal_notes || '') }}>
                    Открыть
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {leads.length === 0 && <p style={{ textAlign: 'center', padding: 24, color: 'var(--color-text-muted)' }}>Заявок пока нет</p>}
      </div>

      {selected && (
        <div className="admin-card" ref={detailRef}>
          <h3 style={{ marginBottom: 16, fontFamily: 'var(--font-display)' }}>
            Заявка от {selected.name}
          </h3>
          <p><strong>Телефон:</strong> <a href={`tel:${selected.phone}`}>{selected.phone}</a></p>
          <p><strong>Сообщение:</strong> {selected.message || '—'}</p>
          <p><strong>Интерес:</strong> {selected.interest || '—'}</p>
          <p><strong>Город:</strong> {selected.city || '—'}</p>
          {(selected.opening_width || selected.opening_height) && (
            <p>
              <strong>Проём:</strong>{' '}
              {[selected.opening_width, selected.opening_height].filter(Boolean).join(' × ') || '—'}
            </p>
          )}
          {selected.drive_type && (
            <p><strong>Привод:</strong> {selected.drive_type_display || selected.drive_type}</p>
          )}
          <p><strong>Дата:</strong> {formatDate(selected.created_at)}</p>
          <p><strong>Источник:</strong> {selected.source}</p>

          <div className="form-group" style={{ marginTop: 16 }}>
            <label>Статус</label>
            <select value={selected.status} onChange={(e) => updateStatus(selected.id, e.target.value)}>
              {STATUS_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Внутренние заметки</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
              placeholder="Например: перезвонили, договорились на среду" />
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-primary btn-sm" onClick={saveNotes}>Сохранить заметки</button>
            <button className="btn btn-outline btn-sm" onClick={() => setSelected(null)}>Закрыть</button>
          </div>
        </div>
      )}
    </>
  )
}
