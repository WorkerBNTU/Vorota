import { useSiteData } from '../context/SiteDataContext'
import './FloatingUI.css'

export default function FloatingMessengers() {
  const { settings } = useSiteData()

  if (!settings?.whatsapp && !settings?.telegram) return null

  return (
    <div className="fab-messengers" aria-label="Мессенджеры">
      {settings.whatsapp && (
        <a
          href={`https://wa.me/${settings.whatsapp.replace(/\D/g, '')}`}
          className="fab-btn wa"
          target="_blank"
          rel="noopener noreferrer"
          title="WhatsApp"
          aria-label="Написать в WhatsApp"
        >
          💬
        </a>
      )}
      {settings.telegram && (
        <a
          href={`https://t.me/${settings.telegram}`}
          className="fab-btn tg"
          target="_blank"
          rel="noopener noreferrer"
          title="Telegram"
          aria-label="Написать в Telegram"
        >
          ✈️
        </a>
      )}
    </div>
  )
}
