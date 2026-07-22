import type { ReactNode } from 'react'

export function CaptchaLightbox(props: {
  open: boolean
  question?: string
  answer: string
  onAnswerChange: (value: string) => void
  onSubmit: () => void
  onClose: () => void
  onRefresh: () => void
  loading?: boolean
  error?: string | null
}): ReactNode

export function SuccessLightbox(props: {
  open: boolean
  message?: string
  onDone: () => void
}): ReactNode
