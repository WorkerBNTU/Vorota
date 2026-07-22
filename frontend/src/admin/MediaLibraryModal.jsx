import { useEffect, useState } from 'react'
import { api } from '../api'

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return ''
  if (bytes < 1024) return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} КБ`
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
}

export default function MediaLibraryModal({ onClose, onSelect }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    api.adminMediaLibrary()
      .then((data) => setItems(data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = search
    ? items.filter((item) => item.path.toLowerCase().includes(search.toLowerCase()))
    : items

  return (
    <div className="media-modal-overlay" onClick={onClose}>
      <div className="media-modal" onClick={(e) => e.stopPropagation()}>
        <div className="media-modal-header">
          <h3>Выбрать изображение</h3>
          <button type="button" className="media-modal-close" onClick={onClose} aria-label="Закрыть">×</button>
        </div>
        <div className="media-modal-search-wrap">
          <input
            type="text"
            className="media-modal-search"
            placeholder="Поиск по имени файла..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="media-modal-body">
          {loading && <p style={{ color: 'var(--color-text-muted)' }}>Загрузка...</p>}
          {error && <div className="alert alert-error">{error}</div>}
          {!loading && !error && filtered.length === 0 && (
            <p style={{ color: 'var(--color-text-muted)' }}>
              {items.length === 0 ? 'На сервере пока нет загруженных изображений' : 'Ничего не найдено'}
            </p>
          )}
          {!loading && !error && filtered.length > 0 && (
            <div className="media-modal-grid">
              {filtered.map((item) => (
                <button
                  type="button"
                  key={item.path}
                  className="media-modal-item"
                  onClick={() => onSelect(item)}
                  title={item.path}
                >
                  <img src={item.url} alt="" loading="lazy" />
                  <span className="media-modal-item-name">{item.path.split('/').pop()}</span>
                  <span className="media-modal-item-size">{formatSize(item.size)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
