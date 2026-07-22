export const MASK_GROUPS = {
  ru: [3, 3, 2, 2],
  by: [2, 3, 2, 2],
}

export function getPrefix(country) {
  return country === 'ru' ? '+7' : '+375'
}

export function maxNationalLength(country) {
  return MASK_GROUPS[country].reduce((a, b) => a + b, 0)
}

export function toE164(national, country) {
  if (country === 'by') return `375${national}`
  return `7${national}`
}

export function isNationalComplete(national, country) {
  return national.length === maxNationalLength(country)
}

/** Сегменты маски для отрисовки: цифра или пустой слот «_» */
export function getMaskSegments(national, country) {
  const groups = MASK_GROUPS[country]
  const segments = []
  let pos = 0

  segments.push({ type: 'sep', text: ' (' })
  groups.forEach((len, gi) => {
    for (let i = 0; i < len; i++) {
      const digit = national[pos]
      segments.push({
        type: digit ? 'digit' : 'slot',
        text: digit || '_',
        digitPos: pos,
      })
      pos++
    }
    if (gi === 0) segments.push({ type: 'sep', text: ') ' })
    else if (gi === 1) segments.push({ type: 'sep', text: '-' })
    else if (gi === 2) segments.push({ type: 'sep', text: '-' })
  })

  return segments
}

export function sanitizeNationalInput(raw, country) {
  return (raw || '').replace(/\D/g, '').slice(0, maxNationalLength(country))
}

export function toggleCountry(country) {
  return country === 'ru' ? 'by' : 'ru'
}
