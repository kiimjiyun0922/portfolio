import { useEffect, useRef } from 'react'

const CURSOR_MARKS = ['clover', 'spark', 'ring', 'cross']
const RANDOM_CURSOR_MARK = CURSOR_MARKS[Math.floor(Math.random() * CURSOR_MARKS.length)]

export default function NotebookCursor() {
  const cursorRef = useRef(null)
  const labelRef = useRef(null)

  useEffect(() => {
    const cursor = cursorRef.current
    if (!cursor || !window.matchMedia('(pointer: fine)').matches) return undefined

    let frame = 0
    const move = (event) => {
      const target = event.target.closest?.('[data-note-cursor]')
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        cursor.style.transform = `translate3d(${event.clientX + 14}px, ${event.clientY + 14}px, 0)`
        labelRef.current.textContent = target?.dataset.noteCursor || ''
        cursor.classList.add('is-visible')
        cursor.classList.toggle('has-label', Boolean(target))
      })
    }
    const hide = () => {
      cursor.classList.remove('is-visible', 'has-label')
    }

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

  return (
    <div ref={cursorRef} className="notebook-cursor" aria-hidden="true">
      <span className={`notebook-cursor__mark notebook-cursor__mark--${RANDOM_CURSOR_MARK}`} />
      <span ref={labelRef} className="notebook-cursor__label" />
    </div>
  )
}
