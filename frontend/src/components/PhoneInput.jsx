import { useRef, useState } from 'react'
import {
  getMaskSegments,
  getPrefix,
  isNationalComplete,
  maxNationalLength,
  sanitizeNationalInput,
  toggleCountry,
} from '../utils/phone'
import './PhoneInput.css'

export default function PhoneInput({
  nationalDigits,
  country,
  onChange,
  id = 'phone',
  required = true,
}) {
  const inputRef = useRef(null)
  const [focused, setFocused] = useState(false)
  const segments = getMaskSegments(nationalDigits, country)
  const prefix = getPrefix(country)
  const complete = isNationalComplete(nationalDigits, country)

  const focusField = () => inputRef.current?.focus()

  const handlePrefixClick = (e) => {
    e.stopPropagation()
    onChange('', toggleCountry(country))
    requestAnimationFrame(() => inputRef.current?.focus())
  }

  const handleInput = (e) => {
    onChange(sanitizeNationalInput(e.target.value, country), country)
  }

  const segmentClass = (seg) => {
    if (seg.type === 'digit') return 'phone-mask-digit'
    if (seg.type === 'sep') return 'phone-mask-sep'
    const isActive = focused && !complete && seg.digitPos === nationalDigits.length
    return isActive ? 'phone-mask-slot phone-mask-slot--active' : 'phone-mask-slot'
  }

  return (
    <div
      className={`phone-mask-field${focused ? ' phone-mask-field--focused' : ''}`}
      onClick={focusField}
    >
      <div className="phone-mask-display" aria-hidden="true">
        <button
          type="button"
          className="phone-mask-prefix"
          onClick={handlePrefixClick}
          title={country === 'ru' ? 'Переключить на +375' : 'Переключить на +7'}
          tabIndex={-1}
        >
          {prefix}
        </button>
        {segments.map((seg, i) => (
          <span key={i} className={segmentClass(seg)}>
            {seg.type === 'slot' && seg.digitPos === nationalDigits.length && focused && !complete
              ? <span className="phone-mask-caret-char">{seg.text}</span>
              : seg.text}
          </span>
        ))}
      </div>

      <input
        ref={inputRef}
        id={id}
        className="phone-mask-capture"
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        value={nationalDigits}
        onChange={handleInput}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        required={required}
        aria-label={`Телефон ${prefix}`}
        aria-invalid={nationalDigits ? !complete : undefined}
        maxLength={maxNationalLength(country)}
      />
    </div>
  )
}
