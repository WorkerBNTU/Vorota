import { useState, useEffect } from 'react'
import { Link, useOutletContext } from 'react-router-dom'
import { api } from '../api'

function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function AdminDashboard() {
  const { auth } = useOutletContext() || {}
  const canContent = Boolean(auth?.can_manage_content)
  const [leadStats, setLeadStats] = useState(null)
  const [visitStats, setVisitStats] = useState(null)

  useEffect(() => {
    api.adminLeadStats().then(setLeadStats).catch(() => {})
    if (canContent) {
      api.adminVisitStats().then(setVisitStats).catch(() => {})
    }
  }, [canContent])

  return (
    <>
      {canContent && (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="value">{visitStats?.today ?? '—'}</div>
              <div className="label">Посещений сегодня</div>
            </div>
            <div className="stat-card">
              <div className="value">{visitStats?.week ?? '—'}</div>
              <div className="label">За 7 дней</div>
            </div>
            <div className="stat-card">
              <div className="value">{visitStats?.total ?? '—'}</div>
              <div className="label">Всего уникальных</div>
            </div>
            <div className="stat-card">
              <div className="value">{leadStats?.new ?? '—'}</div>
              <div className="label">Новые заявки</div>
            </div>
          </div>

          <div className="admin-card">
            <h3 style={{ marginBottom: 8, fontFamily: 'var(--font-display)' }}>Последнее посещение</h3>
            {visitStats?.last_visit ? (
              <p style={{ fontSize: '0.95rem', marginBottom: 4 }}>
                <strong>{formatDateTime(visitStats.last_visit.visited_at)}</strong>
                {' — IP '}
                {visitStats.last_visit.ip_address}
                {visitStats.last_visit.path && ` — ${visitStats.last_visit.path}`}
              </p>
            ) : (
              <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>Пока нет зафиксированных посещений</p>
            )}
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginTop: 12 }}>
              Учитываются только реальные пользователи: один IP — одно посещение в день, роботы поисковиков отфильтрованы.
            </p>
          </div>

          {visitStats?.recent?.length > 0 && (
            <div className="admin-card" style={{ overflowX: 'auto' }}>
              <h3 style={{ marginBottom: 16, fontFamily: 'var(--font-display)' }}>Недавние посещения</h3>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Дата и время</th>
                    <th>IP</th>
                    <th>Страница</th>
                    <th>Откуда</th>
                  </tr>
                </thead>
                <tbody>
                  {visitStats.recent.map((v) => (
                    <tr key={v.id}>
                      <td>{formatDateTime(v.visited_at)}</td>
                      <td><code>{v.ip_address}</code></td>
                      <td>{v.path || '/'}</td>
                      <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {v.referer || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {!canContent && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="value">{leadStats?.new ?? '—'}</div>
            <div className="label">Новые заявки</div>
          </div>
          <div className="stat-card">
            <div className="value">{leadStats?.in_progress ?? '—'}</div>
            <div className="label">В работе</div>
          </div>
          <div className="stat-card">
            <div className="value">{leadStats?.completed ?? '—'}</div>
            <div className="label">Завершённые</div>
          </div>
          <div className="stat-card">
            <div className="value">{leadStats?.total ?? '—'}</div>
            <div className="label">Всего заявок</div>
          </div>
        </div>
      )}

      <div className="admin-card">
        <h3 style={{ marginBottom: 16, fontFamily: 'var(--font-display)' }}>Заявки</h3>
        {canContent && (
          <div className="stats-grid" style={{ marginBottom: 16 }}>
            <div className="stat-card">
              <div className="value">{leadStats?.in_progress ?? '—'}</div>
              <div className="label">В работе</div>
            </div>
            <div className="stat-card">
              <div className="value">{leadStats?.completed ?? '—'}</div>
              <div className="label">Завершённые</div>
            </div>
            <div className="stat-card">
              <div className="value">{leadStats?.total ?? '—'}</div>
              <div className="label">Всего заявок</div>
            </div>
          </div>
        )}
        <Link to="/admin/leads" className="btn btn-primary btn-sm">Обработать заявки</Link>
      </div>

      {canContent && (
        <div className="admin-card">
          <h3 style={{ marginBottom: 16, fontFamily: 'var(--font-display)' }}>Быстрые действия</h3>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/admin/home" className="btn btn-outline btn-sm">Главная страница</Link>
            <Link to="/admin/portfolio" className="btn btn-outline btn-sm">Добавить работу</Link>
            <Link to="/admin/content" className="btn btn-outline btn-sm">Изменить контакты</Link>
            <Link to="/admin/catalog" className="btn btn-outline btn-sm">Каталог</Link>
          </div>
        </div>
      )}
    </>
  )
}
