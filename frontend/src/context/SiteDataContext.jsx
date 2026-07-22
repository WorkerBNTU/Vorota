import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { api } from '../api'

const SiteDataContext = createContext({
  content: null,
  settings: null,
  catalogMenu: [],
  loading: true,
  error: null,
  reload: () => {},
})

export function useSiteData() {
  return useContext(SiteDataContext)
}

export function SiteDataProvider({ children }) {
  const [content, setContent] = useState(null)
  const [catalogMenu, setCatalogMenu] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [reloadToken, setReloadToken] = useState(0)

  const reload = useCallback(() => {
    setReloadToken((n) => n + 1)
  }, [])

  useEffect(() => {
    const onInvalidate = () => reload()
    window.addEventListener('vorota:public-cache-invalidate', onInvalidate)
    return () => window.removeEventListener('vorota:public-cache-invalidate', onInvalidate)
  }, [reload])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([api.getContent(), api.getCatalogMenu()])
      .then(([contentData, menuData]) => {
        if (!cancelled) {
          setContent(contentData)
          setCatalogMenu(menuData)
          setError(null)
          setLoading(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err)
          setLoading(false)
        }
      })
    return () => { cancelled = true }
  }, [reloadToken])

  const value = useMemo(() => ({
    content,
    settings: content?.settings ?? null,
    catalogMenu,
    loading,
    error,
    reload,
  }), [content, catalogMenu, loading, error, reload])

  return (
    <SiteDataContext.Provider value={value}>
      {children}
    </SiteDataContext.Provider>
  )
}
