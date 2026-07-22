import { useState, createContext, useContext, useCallback } from 'react'
import LeadForm from './LeadForm'
import { SuccessLightbox } from './FormLightbox'
import './LeadModal.css'

const LeadModalContext = createContext()

export function useLeadModal() {
  return useContext(LeadModalContext)
}

export function LeadModalProvider({ children }) {
  const [open, setOpen] = useState(false)
  const [source, setSource] = useState('сайт')
  const [initialInterest, setInitialInterest] = useState('')
  const [successOpen, setSuccessOpen] = useState(false)

  const openModal = (src = 'сайт', options = {}) => {
    setSource(typeof src === 'string' ? src : 'сайт')
    setInitialInterest(options.interest || '')
    setOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeModal = () => {
    setOpen(false)
    setInitialInterest('')
    document.body.style.overflow = ''
  }

  const notifyLeadSuccess = useCallback(() => {
    setSuccessOpen(true)
  }, [])

  const handleFormSuccess = () => {
    closeModal()
  }

  return (
    <LeadModalContext.Provider value={{ openModal, notifyLeadSuccess }}>
      {children}
      {open && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="modal-close" onClick={closeModal} aria-label="Закрыть">×</button>
            <h2>Оставить заявку</h2>
            <p className="modal-subtitle">Перезвоним в течение 15 минут</p>
            <LeadForm
              key={`${source}-${initialInterest}`}
              source={source}
              initialInterest={initialInterest}
              onLeadSent={notifyLeadSuccess}
              onSuccess={handleFormSuccess}
            />
          </div>
        </div>
      )}
      <SuccessLightbox open={successOpen} onDone={() => setSuccessOpen(false)} />
    </LeadModalContext.Provider>
  )
}
