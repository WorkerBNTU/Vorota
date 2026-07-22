import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './FormLightbox.css'

/**
 * Успех заявки: поверх страницы, плавно гаснет ~2 с.
 * Рендерится в portal, чтобы пережить закрытие модалки формы.
 */
export function SuccessLightbox({ open, message, onDone }) {
  const [phase, setPhase] = useState('in') // in | out
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  useEffect(() => {
    if (!open) {
      setPhase('in')
      return undefined
    }
    setPhase('in')
    const fadeTimer = window.setTimeout(() => setPhase('out'), 400)
    const doneTimer = window.setTimeout(() => onDoneRef.current?.(), 400 + 2000)
    return () => {
      window.clearTimeout(fadeTimer)
      window.clearTimeout(doneTimer)
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div
      className={`form-lightbox form-lightbox--toast is-${phase}`}
      role="status"
      aria-live="polite"
    >
      <div className="form-lightbox-card form-lightbox-card--success">
        <div className="form-lightbox-icon" aria-hidden="true">✓</div>
        <p>{message || 'Заявка отправлена! Мы свяжемся с вами в ближайшее время.'}</p>
      </div>
    </div>,
    document.body,
  )
}

/**
 * Капча в отдельном lightbox — появляется только когда сервер её запросил.
 */
export function CaptchaLightbox({
  open,
  question,
  answer,
  onAnswerChange,
  onSubmit,
  onClose,
  onRefresh,
  loading,
  error,
}) {
  if (!open) return null

  return createPortal(
    <div className="form-lightbox form-lightbox--modal" role="dialog" aria-modal="true" aria-labelledby="captcha-title">
      <button type="button" className="form-lightbox-backdrop" aria-label="Закрыть" onClick={onClose} />
      <div className="form-lightbox-card">
        <button type="button" className="form-lightbox-close" onClick={onClose} aria-label="Закрыть">×</button>
        <h3 id="captcha-title">Подтвердите, что вы не робот</h3>
        <p className="form-lightbox-lead">
          Это повторная или подозрительная отправка. Решите простой пример — заявка уйдёт сразу после ответа.
        </p>
        {error && <div className="alert alert-error">{error}</div>}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            // Portal остаётся ребёнком LeadForm в React-дереве: без stopPropagation
            // submit всплывает в основную форму и уходит второй запрос без капчи.
            e.stopPropagation()
            onSubmit?.()
          }}
        >
          <div className="form-group">
            <label htmlFor="lead-captcha-answer">Сколько будет {question}?</label>
            <input
              id="lead-captcha-answer"
              type="number"
              inputMode="numeric"
              autoFocus
              required
              value={answer}
              onChange={(e) => onAnswerChange?.(e.target.value)}
              placeholder="Ответ"
            />
          </div>
          <div className="form-lightbox-actions">
            <button type="button" className="btn btn-outline" onClick={onRefresh} disabled={loading}>
              Другой пример
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || !answer}>
              {loading ? 'Отправка…' : 'Отправить заявку'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
