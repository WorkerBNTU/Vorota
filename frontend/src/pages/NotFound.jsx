import { Link } from 'react-router-dom'
import useSiteMeta from '../hooks/useSiteMeta'

export default function NotFound() {
  useSiteMeta({
    title: 'Страница не найдена',
    description: 'Запрашиваемая страница не существует или была перемещена.',
    noindex: true,
  })

  return (
    <section className="section">
      <div className="container" style={{ textAlign: 'center', padding: '48px 0' }}>
        <h1>404 — страница не найдена</h1>
        <p style={{ marginBottom: 24 }}>
          Возможно, страница была перемещена, удалена или адрес введён с ошибкой.
        </p>
        <Link to="/" className="btn btn-primary" style={{ marginRight: 12 }}>На главную</Link>
        <Link to="/catalog">В каталог</Link>
      </div>
    </section>
  )
}
