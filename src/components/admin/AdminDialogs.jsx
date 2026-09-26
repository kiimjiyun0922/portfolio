import { useEffect, useRef, useState } from 'react'
import { subscribeAdminDialogs } from './adminDialogService'

export function AdminDialogHost() {
  const [dialog, setDialog] = useState(null)
  const [input, setInput] = useState('')
  const panelRef = useRef(null)
  const cancelRef = useRef(null)
  const previousFocus = useRef(null)

  useEffect(() => {
    const listener = (next) => {
      previousFocus.current = document.activeElement
      setInput(next.initialValue || '')
      setDialog(next)
    }
    return subscribeAdminDialogs(listener)
  }, [])

  useEffect(() => {
    if (!dialog) return undefined
    const frame = requestAnimationFrame(() => {
      if (dialog.kind === 'prompt') panelRef.current?.querySelector('input')?.focus()
      else if (dialog.kind === 'confirm') cancelRef.current?.focus()
      else panelRef.current?.querySelector('[data-dialog-primary]')?.focus()
    })
    return () => cancelAnimationFrame(frame)
  }, [dialog])

  if (!dialog) return null

  const finish = (value) => {
    const resolve = dialog.resolve
    setDialog(null)
    resolve(value)
    requestAnimationFrame(() => previousFocus.current?.focus?.())
  }

  const cancelValue = dialog.kind === 'prompt' ? null : false
  const confirmValue = dialog.kind === 'prompt' ? input.trim() : true
  const onKeyDown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      finish(cancelValue)
      return
    }
    if (event.key !== 'Tab') return
    const focusable = [...panelRef.current.querySelectorAll('button:not([disabled]), input:not([disabled])')]
    if (!focusable.length) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }

  return (
    <div className="admin-dialog-layer" role="presentation">
      <div className="admin-dialog-backdrop" aria-hidden="true" />
      <section ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="admin-dialog-title" aria-describedby="admin-dialog-message" className="admin-system-dialog" onKeyDown={onKeyDown}>
        <header>
          <h2 id="admin-dialog-title">{dialog.title}</h2>
          <button type="button" aria-label="대화상자 닫기" className="admin-dialog-close" onClick={() => finish(cancelValue)}>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" /></svg>
          </button>
        </header>
        <div className="admin-system-dialog__body">
          <p id="admin-dialog-message">{dialog.message}</p>
          {dialog.kind === 'prompt' && <input value={input} onChange={(event) => setInput(event.target.value)} placeholder={dialog.placeholder} onKeyDown={(event) => { if (event.key === 'Enter' && input.trim()) finish(input.trim()) }} />}
        </div>
        <footer>
          {dialog.kind !== 'alert' && <button ref={cancelRef} type="button" className="admin-secondary-button" onClick={() => finish(cancelValue)}>취소</button>}
          <button type="button" data-dialog-primary className={dialog.danger ? 'admin-danger-button' : 'admin-primary-button'} disabled={dialog.kind === 'prompt' && !input.trim()} onClick={() => finish(confirmValue)}>{dialog.confirmLabel}</button>
        </footer>
      </section>
    </div>
  )
}
