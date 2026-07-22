import MarkdownContent from './MarkdownContent'
import ContentImage from './ContentImage'
import './NewsFeed.css'

export default function NewsFeed({ items, kind = 'news' }) {
  if (!items?.length) return null

  return (
    <div className="news-feed">
      {items.map((item, i) => (
        <article key={i} className={`news-feed-item ${item.isExpired ? 'is-expired' : ''}`}>
          <div className="news-feed-item-marker" />
          <div className="news-feed-item-body">
            <div className="news-feed-item-meta">
              {item.dateLabel && <span className="news-feed-date">{item.dateLabel}</span>}
              {kind === 'promotions' && (
                <span className={`news-feed-badge ${item.isExpired ? 'expired' : 'active'}`}>
                  {item.isExpired ? 'Акция завершена' : 'Акция действует'}
                </span>
              )}
            </div>
            {item.image_url && (
              <div className="news-feed-item-image">
                <ContentImage src={item.image_url} alt={item.title || ''} aspectRatio="16/9" />
              </div>
            )}
            {item.title && <h3>{item.title}</h3>}
            <MarkdownContent content={item.body} />
          </div>
        </article>
      ))}
    </div>
  )
}
