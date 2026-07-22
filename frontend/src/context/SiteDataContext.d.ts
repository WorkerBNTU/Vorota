import type { ReactNode } from 'react'

type SiteSettings = {
  consent_checkbox_label?: string
  [key: string]: unknown
}

export function useSiteData(): {
  settings: SiteSettings | null
  loading?: boolean
  error?: unknown
}

export function SiteDataProvider(props: { children: ReactNode }): ReactNode
