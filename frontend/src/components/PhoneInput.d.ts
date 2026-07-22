import type { ReactNode } from 'react'

export type PhoneCountry = 'by' | 'ru'

export default function PhoneInput(props: {
  nationalDigits: string
  country: PhoneCountry
  onChange: (national: string, country: PhoneCountry) => void
  id?: string
  required?: boolean
}): ReactNode
