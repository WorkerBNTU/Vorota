import { useSiteData } from '../context/SiteDataContext'
import { telegramUrl } from '../utils/safeLinks'
import './FloatingUI.css'

export default function FloatingMessengers() {
  const { settings } = useSiteData()
  const tg = telegramUrl(settings?.telegram)

  if (!settings?.whatsapp && !tg) return null

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
      {tg && (
        <a
          href={tg}
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
