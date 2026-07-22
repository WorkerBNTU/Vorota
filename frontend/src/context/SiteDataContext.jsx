import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { api } from '../api'



const SiteDataContext = createContext({

  content: null,

  settings: null,

  catalogMenu: [],

  loading: true,

  error: null,

})



export function useSiteData() {

  return useContext(SiteDataContext)

}



export function SiteDataProvider({ children }) {

  const [content, setContent] = useState(null)

  const [catalogMenu, setCatalogMenu] = useState([])

  const [loading, setLoading] = useState(true)

  const [error, setError] = useState(null)



  useEffect(() => {

    let cancelled = false

    Promise.all([api.getContent(), api.getCatalogMenu()])

      .then(([contentData, menuData]) => {

        if (!cancelled) {

          setContent(contentData)

          setCatalogMenu(menuData)

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

  }, [])



  // Без useMemo этот объект пересоздавался бы на каждый рендер провайдера
  // и заставлял бы перерисовываться вообще все компоненты сайта, читающие
  // useSiteData() (Header, Footer, все страницы) — а провайдер оборачивает
  // буквально весь сайт.
  const value = useMemo(() => ({
    content,
    settings: content?.settings ?? null,
    catalogMenu,
    loading,
    error,
  }), [content, catalogMenu, loading, error])

  return (
    <SiteDataContext.Provider value={value}>
      {children}
    </SiteDataContext.Provider>
  )
}
