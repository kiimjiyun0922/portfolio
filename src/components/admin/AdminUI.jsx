import { useCallback, useEffect, useId, useRef, useState } from 'react'

export function AutoTextarea({ id, value, onChange, minRows = 2, className = '' }) {
  const ref = useRef(null)
  const resize = useCallback(() => {
    const el = ref.current
    if (!el) return
    const scrollY = window.scrollY
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
    window.scrollTo(0, scrollY)
  }, [])
  useEffect(() => { resize() }, [value, resize])
  return <textarea id={id} ref={ref} value={value} onChange={(event) => { onChange(event.target.value); resize() }} rows={minRows} className={className} style={{ overflow: 'hidden' }} />
}

export function Field({ label, value, onChange, type = 'text', className = '', rows }) {
  const id = useId()
  const controlClass = 'w-full bg-gray-800/60 border border-gray-700/70 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 hover:border-gray-600 focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all'
  return (
    <div className={className}>
      {label && <label htmlFor={id} className="block text-[11px] font-medium text-gray-400 mb-1.5">{label}</label>}
      {rows
        ? <AutoTextarea id={id} value={value} onChange={onChange} minRows={rows} className={`${controlClass} resize-y`} />
        : <input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} step={type === 'number' ? 'any' : undefined} className={controlClass} />}
    </div>
  )
}

export function SectionHeader({ title, description }) {
  return <div className="mb-6 pb-5 border-b border-gray-800/80"><h2 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h2>{description && <p className="text-sm text-gray-500 mt-1.5">{description}</p>}</div>
}

export function ActionBar({ children }) {
  return <div className="sticky top-[60px] md:top-3 z-20 mb-6"><div className="flex flex-wrap items-center gap-2 bg-gray-900/95 backdrop-blur-md border border-gray-800 rounded-xl px-3 py-2.5 shadow-lg shadow-black/30">{children}</div></div>
}

export function SaveButton({ onClick, label = '저장' }) {
  return <button onClick={(event) => { event.preventDefault(); onClick() }} data-save-btn title="⌘S / Ctrl+S" className="px-4 py-2 bg-accent hover:bg-accent-light text-white text-sm font-semibold rounded-lg transition-all cursor-pointer shadow-md shadow-accent/20 hover:shadow-accent/35 active:scale-[0.98] flex items-center gap-1.5"><svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>{label}</button>
}

export function ResetButton({ onClick, label = '초기화' }) {
  return <button onClick={onClick} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700/60 text-gray-300 hover:text-white text-sm rounded-lg transition-colors cursor-pointer">{label}</button>
}

export function Toast({ message }) {
  if (!message) return null
  return <div role="status" aria-live="polite" className="fixed bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-6 bg-gray-900 border border-accent/40 text-white pl-3 pr-4 py-2.5 rounded-xl shadow-xl shadow-black/40 text-sm z-50 animate-fade-in flex items-center gap-2 whitespace-nowrap"><span aria-hidden="true" className="w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg></span>{message}</div>
}

export function FloatingJumpNav({ items = [] }) {
  const [open, setOpen] = useState(false)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const onScroll = () => { const next = window.scrollY > 300; setVisible(next); if (!next) setOpen(false) }
    window.addEventListener('scroll', onScroll, { passive: true }); onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
  if (!visible) return null
  return (
    <nav aria-label="페이지 바로가기" className="fixed bottom-6 right-5 md:right-8 z-40 flex flex-col items-end gap-2">
      {open && items.length > 0 && <div className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl shadow-black/50 py-1.5 max-h-72 overflow-y-auto min-w-44">{items.map((item, index) => <button key={index} onClick={() => { item.onClick(); setOpen(false) }} className="w-full text-left px-4 py-2 text-xs text-gray-300 hover:bg-gray-800 hover:text-white cursor-pointer truncate">{item.label}</button>)}</div>}
      <div className="flex gap-2">
        {items.length > 0 && <button aria-expanded={open} aria-label="페이지 바로가기 열기" onClick={() => setOpen(!open)} className={`w-10 h-10 rounded-full border shadow-lg shadow-black/40 flex items-center justify-center cursor-pointer transition-colors ${open ? 'bg-accent border-accent text-white' : 'bg-gray-900 border-gray-700 text-gray-400 hover:text-white hover:border-gray-500'}`}><svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg></button>}
        <button aria-label="맨 위로 이동" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setOpen(false) }} className="w-10 h-10 rounded-full bg-accent text-white shadow-lg shadow-accent/30 flex items-center justify-center cursor-pointer hover:bg-accent-light transition-colors"><svg aria-hidden="true" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" /></svg></button>
      </div>
    </nav>
  )
}
