import { useState } from 'react'

import './ContentImage.css'

export default function ContentImage({ src, alt = '', className = '', aspectRatio = '4/3', priority = false, fill = false }) {
  const [failed, setFailed] = useState(false)
  const showPlaceholder = !src || failed

  if (showPlaceholder) {
    return (
      <div
        className={`content-image-placeholder ${className}`}
        style={fill ? { width: '100%', height: '100%' } : { aspectRatio }}
        role="img"
        aria-label={alt || 'Изображение'}
      >
        <span className="content-image-placeholder-icon" aria-hidden="true" />
        {alt && <span className="content-image-placeholder-label">{alt}</span>}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      // aspect-ratio задаётся и здесь, а не только на плейсхолдере — иначе
      // блок без явной высоты в CSS "прыгает" при подгрузке картинки (CLS).
      style={fill
        ? { width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }
        : { aspectRatio }}
      // priority — только для главной картинки в самом верху страницы
      // (то, что пользователь видит первым, LCP). Всё остальное — лениво,
      // чтобы не конкурировать за канал на мобильном интернете.
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : 'auto'}
      decoding={priority ? 'sync' : 'async'}
      onError={() => setFailed(true)}
    />
  )
}
