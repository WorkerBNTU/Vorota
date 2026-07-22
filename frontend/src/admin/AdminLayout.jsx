import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../api'
import './admin.css'

export default function AdminLayout() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    api.checkAuth()
      .then(() => setChecking(false))
      .catch(() => navigate('/admin/login'))
  }, [navigate])

  const logout = async () => {
    try {
      await api.logout()
    } catch {
      /* session expired */
    }
    navigate('/admin/login')
  }

  if (checking) {
    return <div className="admin-login-page"><p style={{ color: '#fff' }}>Загрузка...</p></div>
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <h2>ВоротаРБ</h2>
        <nav className="admin-nav">
          <NavLink to="/admin" end>Дашборд</NavLink>

          <div className="admin-nav-group">Страницы сайта</div>
          <NavLink to="/admin/home">Главная страница</NavLink>
          <NavLink to="/admin/catalog">Каталог</NavLink>
          <NavLink to="/admin/portfolio">Портфолио</NavLink>

          <div className="admin-nav-group">Настройки</div>
          <NavLink to="/admin/content">Компания и контакты</NavLink>
          <NavLink to="/admin/legal">Правовая информация</NavLink>

          <div className="admin-nav-group">Продажи</div>
          <NavLink to="/admin/leads">Заявки (CRM)</NavLink>
        </nav>
        <div style={{ padding: '24px' }}>
          <a href="/" target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.85rem', color: 'var(--color-accent)' }}>
            Открыть сайт →
          </a>
        </div>
      </aside>
      <main className="admin-main">
        <div className="admin-header">
          <h1>Панель управления</h1>
          <button className="btn btn-outline btn-sm" onClick={logout}>Выйти</button>
        </div>
        <Outlet />
      </main>
    </div>
  )
}
