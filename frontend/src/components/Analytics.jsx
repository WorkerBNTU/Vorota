import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useSiteData } from '../context/SiteDataContext'

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = resolve
    script.onerror = reject
    document.head.appendChild(script)
  })
}

// Яндекс.Метрика и Google Analytics (GA4) подключаются, только если в
// настройках сайта (админка → «Настройки» → «Аналитика») заданы
// соответствующие ID. Плагины не привязаны к сборке — можно включить/
// выключить в любой момент без редеплоя. Виртуальные просмотры страниц
// при переходах внутри SPA шлём вручную (иначе счётчики видят только
// самый первый показанный маршрут).
export default function Analytics() {
  const { settings } = useSiteData()
  const location = useLocation()
  const ymInitialized = useRef(false)
  const gaInitialized = useRef(false)
  const ymFirstHitSent = useRef(false)

  const ymId = settings?.yandex_metrika_id
  const gaId = settings?.google_analytics_id

  useEffect(() => {
    if (!ymId || ymInitialized.current) return
    ymInitialized.current = true
    window.ym = window.ym || function ym(...args) { (window.ym.a = window.ym.a || []).push(args) }
    window.ym.l = Date.now()
    loadScript('https://mc.yandex.ru/metrika/tag.js')
      .then(() => {
        window.ym(ymId, 'init', {
          clickmap: true,
          trackLinks: true,
          accurateTrackBounce: true,
          webvisor: true,
        })
      })
      .catch(() => {})
  }, [ymId])

  useEffect(() => {
    if (!gaId || gaInitialized.current) return
    gaInitialized.current = true
    window.dataLayer = window.dataLayer || []
    window.gtag = window.gtag || function gtag(...args) { window.dataLayer.push(args) }
    window.gtag('js', new Date())
    // send_page_view: false — просмотры шлём сами при каждой смене
    // маршрута (ниже), иначе первая страница задвоится.
    window.gtag('config', gaId, { send_page_view: false })
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${gaId}`).catch(() => {})
  }, [gaId])

  useEffect(() => {
    const path = location.pathname + location.search
    if (gaId && window.gtag) {
      window.gtag('event', 'page_view', { page_path: path })
    }
    if (ymId && window.ym) {
      // init() уже отправил хит по первому маршруту — не дублируем.
      if (!ymFirstHitSent.current) {
        ymFirstHitSent.current = true
      } else {
        window.ym(ymId, 'hit', path)
      }
    }
  }, [location, ymId, gaId])

  return null
}
