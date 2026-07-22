import MarkdownContent from './MarkdownContent'
import ContentImage from './ContentImage'
import './TestimonialGrid.css'

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export default function TestimonialGrid({ items }) {
  if (!items?.length) return null

  return (
    <div className="testimonial-grid">
      {items.map((item, i) => (
        <figure key={i} className="testimonial-card">
          <div className="testimonial-header">
            {item.avatar_url ? (
              <div className="testimonial-avatar-photo">
                <ContentImage
                  src={item.avatar_url}
                  alt={item.name || 'Фото автора отзыва'}
                  fill
                />
              </div>
            ) : (
              <div className="testimonial-avatar" aria-hidden="true">{initials(item.name || '?')}</div>
            )}
            {(item.name || item.city) && (
              <figcaption className="testimonial-author">
                {item.name && <span className="testimonial-name">{item.name}</span>}
                {item.city && <span className="testimonial-city">{item.city}</span>}
              </figcaption>
            )}
          </div>
          <blockquote className="testimonial-body">
            <MarkdownContent content={item.body} />
          </blockquote>
        </figure>
      ))}
    </div>
  )
}
