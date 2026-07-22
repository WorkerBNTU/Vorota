import { useState, useRef, useCallback } from 'react'
import './BeforeAfterSlider.css'

export default function BeforeAfterSlider({ beforeSrc, afterSrc, beforeAlt = 'До', afterAlt = 'После' }) {
  const [position, setPosition] = useState(50)
  const containerRef = useRef(null)
  const dragging = useRef(false)

  const updatePosition = useCallback((clientX) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = ((clientX - rect.left) / rect.width) * 100
    setPosition(Math.min(98, Math.max(2, x)))
  }, [])

  const onPointerDown = (e) => {
    dragging.current = true
    containerRef.current?.setPointerCapture(e.pointerId)
    updatePosition(e.clientX)
  }

  const onPointerMove = (e) => {
    if (!dragging.current) return
    updatePosition(e.clientX)
  }

  const onPointerUp = (e) => {
    dragging.current = false
    containerRef.current?.releasePointerCapture(e.pointerId)
  }

  return (
    <div
      className="before-after-slider"
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <img src={beforeSrc} alt={beforeAlt} />
      <div className="ba-after-wrap" style={{ width: `${position}%` }}>
        <img src={afterSrc} alt={afterAlt} style={{ width: `${100 / (position / 100)}%`, maxWidth: 'none' }} />
      </div>
      <div className="ba-handle" style={{ left: `${position}%` }} />
      <span className="ba-label before">До</span>
      <span className="ba-label after">После</span>
    </div>
  )
}
