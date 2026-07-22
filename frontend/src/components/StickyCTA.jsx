import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useLeadModal } from './LeadModal'
import './FloatingUI.css'

const STICKY_PAGES = ['/portfolio', '/catalog', '/contacts']

export default function StickyCTA() {
  const location = useLocation()
  const { openModal } = useLeadModal()
  const visible = STICKY_PAGES.some((p) => location.pathname.startsWith(p))

  useEffect(() => {
    document.body.classList.toggle('has-sticky-cta', visible)
    return () => document.body.classList.remove('has-sticky-cta')
  }, [visible])

  if (!visible) return null

  return (
    <div className="sticky-cta">
      <button className="btn btn-primary btn-lg" onClick={() => openModal('мобильная кнопка')}>
        Оставить заявку
      </button>
    </div>
  )
}
