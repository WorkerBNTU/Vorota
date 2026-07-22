import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from '../api'

export default function VisitTracker() {
  const { pathname } = useLocation()

  useEffect(() => {
    if (pathname.startsWith('/admin')) return

    const today = new Date().toISOString().slice(0, 10)
    const storageKey = `visit_recorded_${today}`
    if (sessionStorage.getItem(storageKey)) return

    api.recordVisit(pathname)
      .then(() => sessionStorage.setItem(storageKey, '1'))
      .catch(() => {})
  }, [pathname])

  return null
}
