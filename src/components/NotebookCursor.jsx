import { useEffect, useRef } from 'react'

export default function NotebookCursor() {
  const cursorRef = useRef(null)

  useEffect(() => {
    const cursor = cursorRef.current
    if (!cursor || !window.matchMedia('(pointer: fine)').matches) return undefined

    let frame = 0
    const move = (event) => {
      const target = event.target.closest?.('[data-note-cursor]')
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        cursor.style.transform = `translate3d(${event.clientX + 14}px, ${event.clientY + 14}px, 0)`
        cursor.textContent = target?.dataset.noteCursor || ''
        cursor.classList.toggle('is-visible', Boolean(target))
      })
    }
    const hide = () => cursor.classList.remove('is-visible')

    window.addEventListener('pointermove', move, { passive: true })
    window.addEventListener('blur', hide)
    document.addEventListener('mouseleave', hide)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('blur', hide)
      document.removeEventListener('mouseleave', hide)
    }
  }, [])

  return <div ref={cursorRef} className="notebook-cursor" aria-hidden="true" />
}
