export function isNationalComplete(national: string, country: string): boolean
export function toE164(national: string, country: string): string
export function getPrefix(country: string): string
export function maxNationalLength(country: string): number
export function sanitizeNationalInput(raw: string, country: string): string
export function toggleCountry(country: string): string
export function getMaskSegments(national: string, country: string): Array<{
  type: string
  text: string
  digitPos?: number
}>
