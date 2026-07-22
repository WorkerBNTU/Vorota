import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { api, isCaptchaRequiredError } from '../api'
import { useSiteData } from '../context/SiteDataContext'
import { CaptchaLightbox, SuccessLightbox } from './FormLightbox'
import PhoneInput from './PhoneInput'
import { isNationalComplete, toE164 } from '../utils/phone'
import './LeadForm.css'

/** Категории интереса: value + нужны ли размеры проёма / привод */
export const LEAD_INTERESTS = [
  { value: 'Секционные ворота', needsOpening: true },
  { value: 'Откатные ворота', needsOpening: true },
  { value: 'Распашные ворота', needsOpening: true },
  { value: 'Промышленные ворота', needsOpening: true },
  { value: 'Роллеты', needsOpening: true },
  { value: 'Шлагбаумы', needsOpening: false },
  { value: 'Гаражные / стальные двери', needsOpening: true },
  { value: 'Ремонт / обслуживание', needsOpening: false },
  { value: 'Автоматика / приводы', needsOpening: false },
  { value: 'Консультация', needsOpening: false },
  { value: 'Другое', needsOpening: false },
]

const DRIVE_OPTIONS = [
  { value: '', label: 'Не указано' },
  { value: 'electric', label: 'С электроприводом' },
  { value: 'manual', label: 'Ручные' },
  { value: 'unknown', label: 'Пока не знаю' },
]

function guessInterestFromSource(source = '') {
  const text = String(source)
  // «товар: Секционные ворота DoorHan…» / «услуга: Ремонт ворот»
  const m = text.match(/^(?:товар|услуга|каталог):\s*(.+)$/i)
  return m ? m[1].trim().slice(0, 200) : ''
}

function interestNeedsOpening(interest) {
  if (!interest) return false
  const known = LEAD_INTERESTS.find((i) => i.value === interest)
  if (known) return known.needsOpening
  // Свободный текст с каталога — показываем размеры, если похоже на изделия
  return /ворот|роллет|двер/i.test(interest)
}

export default function LeadForm({
  source = 'сайт',
  initialInterest = '',
  onSuccess,
  onLeadSent,
  compact = false,
}) {
  const guessed = useMemo(
    () => initialInterest || guessInterestFromSource(source),
    [initialInterest, source],
  )

  const [form, setForm] = useState({ name: '', message: '', website: '' })
  const [phoneNational, setPhoneNational] = useState('')
  const [phoneCountry, setPhoneCountry] = useState('by')
  const [detailsOpen, setDetailsOpen] = useState(Boolean(guessed))
  const [interest, setInterest] = useState(guessed)
  const [interestCustom, setInterestCustom] = useState(
    () => (guessed && !LEAD_INTERESTS.some((i) => i.value === guessed) ? guessed : ''),
  )
  const [city, setCity] = useState('')
  const [openingWidth, setOpeningWidth] = useState('')
  const [openingHeight, setOpeningHeight] = useState('')
  const [driveType, setDriveType] = useState('')
  const [captcha, setCaptcha] = useState(null)
  const [captchaAnswer, setCaptchaAnswer] = useState('')
  const [captchaOpen, setCaptchaOpen] = useState(false)
  const [captchaError, setCaptchaError] = useState(null)
  const [successOpen, setSuccessOpen] = useState(false)
  const [privacyConsent, setPrivacyConsent] = useState(false)
  const [consentError, setConsentError] = useState(false)
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(false)
  const pendingPayloadRef = useRef(null)
  const submittingRef = useRef(false)
  const succeededRef = useRef(false)

  const { settings } = useSiteData()
  const consentLabel = settings?.consent_checkbox_label
    || 'Я даю согласие на обработку персональных данных согласно Политике конфиденциальности'

  const phoneId = `phone-${source.replace(/\s+/g, '-')}`

  useEffect(() => {
    if (!guessed) return
    setInterest(LEAD_INTERESTS.some((i) => i.value === guessed) ? guessed : 'Другое')
    setInterestCustom(LEAD_INTERESTS.some((i) => i.value === guessed) ? '' : guessed)
    setDetailsOpen(true)
  }, [guessed])

  const resolvedInterest = interest === 'Другое'
    ? (interestCustom.trim() || 'Другое')
    : interest

  const showOpening = interestNeedsOpening(resolvedInterest)

  const loadCaptcha = async () => {
    if (succeededRef.current) return null
    const data = await api.getCaptcha()
    if (succeededRef.current) return null
    setCaptcha(data)
    setCaptchaAnswer('')
    setCaptchaError(null)
    setCaptchaOpen(true)
    return data
  }

  const resetExtras = () => {
    setInterest('')
    setInterestCustom('')
    setCity('')
    setOpeningWidth('')
    setOpeningHeight('')
    setDriveType('')
    setDetailsOpen(false)
  }

  const resetFormAfterSuccess = () => {
    setForm({ name: '', message: '', website: '' })
    setPhoneNational('')
    setPhoneCountry('by')
    setPrivacyConsent(false)
    setConsentError(false)
    resetExtras()
    setCaptchaAnswer('')
    setCaptchaOpen(false)
    setCaptcha(null)
    setCaptchaError(null)
    pendingPayloadRef.current = null
  }

  const buildPayload = (captchaFields = null) => {
    const payload = {
      name: form.name,
      phone: toE164(phoneNational, phoneCountry),
      message: form.message,
      source,
      website: form.website,
      privacy_consent: true,
    }
    if (detailsOpen) {
      if (resolvedInterest) payload.interest = resolvedInterest
      if (city.trim()) payload.city = city.trim()
      if (showOpening) {
        if (openingWidth.trim()) payload.opening_width = openingWidth.trim()
        if (openingHeight.trim()) payload.opening_height = openingHeight.trim()
        if (driveType) payload.drive_type = driveType
      }
    }
    if (captchaFields?.captcha_id && captchaFields?.captcha_answer) {
      payload.captcha_id = captchaFields.captcha_id
      payload.captcha_answer = captchaFields.captcha_answer
    }
    return payload
  }

  const sendLead = async (payload) => {
    if (submittingRef.current || succeededRef.current) return
    submittingRef.current = true
    setLoading(true)
    setStatus(null)
    try {
      await api.submitLead(payload)
      succeededRef.current = true
      resetFormAfterSuccess()
      if (onLeadSent) {
        onLeadSent()
      } else {
        setSuccessOpen(true)
      }
      onSuccess?.()
    } catch (err) {
      if (succeededRef.current) return
      if (isCaptchaRequiredError(err)) {
        pendingPayloadRef.current = {
          ...payload,
          captcha_id: undefined,
          captcha_answer: undefined,
        }
        try {
          await loadCaptcha()
          if (succeededRef.current) {
            setCaptchaOpen(false)
            return
          }
          const wrongAnswer = err.data && Object.prototype.hasOwnProperty.call(err.data, 'captcha_answer')
          setCaptchaError(wrongAnswer ? 'Неверный ответ — попробуйте ещё раз' : null)
        } catch {
          if (!succeededRef.current) {
            setStatus({ type: 'error', text: 'Не удалось загрузить проверку' })
          }
        }
      } else {
        setStatus({ type: 'error', text: err.message || 'Ошибка отправки' })
        if (captchaOpen && !succeededRef.current) {
          loadCaptcha().catch(() => {})
        }
      }
    } finally {
      submittingRef.current = false
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    succeededRef.current = false
    if (!isNationalComplete(phoneNational, phoneCountry)) {
      setStatus({ type: 'error', text: 'Введите полный номер телефона' })
      return
    }
    if (!privacyConsent) {
      setConsentError(true)
      return
    }
    setConsentError(false)
    await sendLead(buildPayload())
  }

  const handleCaptchaSubmit = async () => {
    if (submittingRef.current || succeededRef.current) return
    if (!captcha || !String(captchaAnswer).trim()) return
    const base = pendingPayloadRef.current
    if (!base?.name || !base?.phone) {
      setCaptchaOpen(false)
      setCaptchaError(null)
      setStatus({ type: 'error', text: 'Данные формы устарели — заполните заявку ещё раз' })
      return
    }
    const { captcha_id: _ignoreId, captcha_answer: _ignoreAnswer, ...rest } = base
    await sendLead({
      ...rest,
      captcha_id: captcha.captcha_id,
      captcha_answer: String(captchaAnswer).trim(),
      privacy_consent: true,
    })
  }

  return (
    <>
    <form onSubmit={handleSubmit} className="lead-form">
      {status && <div className={`alert alert-${status.type}`}>{status.text}</div>}

      <div className="hp-field" aria-hidden="true">
        <label htmlFor={`website-${phoneId}`}>Website</label>
        <input
          id={`website-${phoneId}`}
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={form.website}
          onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))}
        />
      </div>

      <div className="form-group">
        <label htmlFor={`name-${phoneId}`}>Ваше имя</label>
        <input
          id={`name-${phoneId}`}
          required
          minLength={2}
          maxLength={100}
          value={form.name}
          onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          placeholder="Иван"
        />
      </div>

      <div className="form-group">
        <label htmlFor={phoneId}>Телефон</label>
        <PhoneInput
          id={phoneId}
          nationalDigits={phoneNational}
          country={phoneCountry}
          onChange={(national, country) => {
            setPhoneNational(national)
            setPhoneCountry(country)
          }}
        />
      </div>

      {!compact && (
        <div className="form-group">
          <label htmlFor={`message-${phoneId}`}>Комментарий</label>
          <textarea
            id={`message-${phoneId}`}
            value={form.message}
            onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
            placeholder="Опишите задачу..."
          />
        </div>
      )}

      <div className={`lead-details ${detailsOpen ? 'is-open' : ''}`}>
        <button
          type="button"
          className="lead-details-toggle"
          aria-expanded={detailsOpen}
          onClick={() => setDetailsOpen((v) => !v)}
        >
          <span>{detailsOpen ? 'Скрыть параметры' : 'Уточнить параметры заявки'}</span>
          <span className="lead-details-hint">необязательно</span>
        </button>

        {detailsOpen && (
          <div className="lead-details-body">
            <div className="form-group">
              <label htmlFor={`interest-${phoneId}`}>Чем интересуетесь?</label>
              <select
                id={`interest-${phoneId}`}
                value={LEAD_INTERESTS.some((i) => i.value === interest) ? interest : (interest ? 'Другое' : '')}
                onChange={(e) => {
                  const v = e.target.value
                  setInterest(v)
                  if (v !== 'Другое') setInterestCustom('')
                }}
              >
                <option value="">Не выбрано</option>
                {LEAD_INTERESTS.map((i) => (
                  <option key={i.value} value={i.value}>{i.value}</option>
                ))}
              </select>
            </div>

            {(interest === 'Другое' || (interest && !LEAD_INTERESTS.some((i) => i.value === interest))) && (
              <div className="form-group">
                <label htmlFor={`interest-custom-${phoneId}`}>Уточните</label>
                <input
                  id={`interest-custom-${phoneId}`}
                  value={interestCustom || (LEAD_INTERESTS.some((i) => i.value === interest) ? '' : interest)}
                  onChange={(e) => {
                    setInterest('Другое')
                    setInterestCustom(e.target.value)
                  }}
                  placeholder="Например: рольставни на окна"
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor={`city-${phoneId}`}>Город</label>
              <input
                id={`city-${phoneId}`}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Минск"
                maxLength={100}
              />
            </div>

            {showOpening && (
              <>
                <div className="lead-details-row">
                  <div className="form-group">
                    <label htmlFor={`width-${phoneId}`}>Ширина проёма</label>
                    <input
                      id={`width-${phoneId}`}
                      value={openingWidth}
                      onChange={(e) => setOpeningWidth(e.target.value)}
                      placeholder="напр. 3000 мм"
                      maxLength={40}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor={`height-${phoneId}`}>Высота проёма</label>
                    <input
                      id={`height-${phoneId}`}
                      value={openingHeight}
                      onChange={(e) => setOpeningHeight(e.target.value)}
                      placeholder="напр. 2200 мм"
                      maxLength={40}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label htmlFor={`drive-${phoneId}`}>Привод</label>
                  <select
                    id={`drive-${phoneId}`}
                    value={driveType}
                    onChange={(e) => setDriveType(e.target.value)}
                  >
                    {DRIVE_OPTIONS.map((o) => (
                      <option key={o.value || 'empty'} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <label
        className={`lead-consent${privacyConsent ? ' is-checked' : ''}${consentError ? ' is-error' : ''}`}
        htmlFor={`consent-${phoneId}`}
      >
        <input
          id={`consent-${phoneId}`}
          className="lead-consent-input"
          type="checkbox"
          checked={privacyConsent}
          onChange={(e) => {
            setPrivacyConsent(e.target.checked)
            if (e.target.checked) setConsentError(false)
          }}
        />
        <span className="lead-consent-box" aria-hidden="true" />
        <span className="lead-consent-body">
          <span className="lead-consent-text">
            {consentLabel}
            {' '}
            <Link
              to="/legal/privacy"
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
            >
              Политика конфиденциальности
            </Link>
          </span>
          {consentError && (
            <span className="lead-consent-hint" role="alert">
              Отметьте согласие, чтобы отправить заявку
            </span>
          )}
        </span>
      </label>

      <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
        {loading ? 'Отправка...' : 'Отправить заявку'}
      </button>
    </form>

      <CaptchaLightbox
        open={captchaOpen && Boolean(captcha)}
        question={captcha?.question}
        answer={captchaAnswer}
        onAnswerChange={setCaptchaAnswer}
        onSubmit={handleCaptchaSubmit}
        onClose={() => {
          setCaptchaOpen(false)
          setCaptchaError(null)
        }}
        onRefresh={() => loadCaptcha().catch(() => setCaptchaError('Не удалось обновить пример'))}
        loading={loading}
        error={captchaError}
      />

      <SuccessLightbox
        open={successOpen}
        onDone={() => setSuccessOpen(false)}
      />
    </>
  )
}
