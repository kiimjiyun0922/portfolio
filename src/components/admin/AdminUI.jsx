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
  const controlClass = 'admin-control w-full bg-gray-800/60 border border-gray-700/70 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 hover:border-gray-600 focus:outline-none focus:border-accent transition-colors'
  return (
    <div className={className}>
      {label && <label htmlFor={id} className="block text-[11px] font-medium text-gray-400 mb-1.5">{label}</label>}
      {rows
        ? <AutoTextarea id={id} value={value} onChange={onChange} minRows={rows} className={`${controlClass} resize-y`} />
        : <input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} step={type === 'number' ? 'any' : undefined} className={controlClass} />}
    </div>
  )
}

export function SelectField({ label, value, onChange, options, className = '', placeholder }) {
  const id = useId()
  return (
    <div className={className}>
      {label && <label htmlFor={id} className="block text-[11px] font-medium text-gray-400 mb-1.5">{label}</label>}
      <select id={id} value={value} onChange={(event) => onChange(event.target.value)} className="admin-control w-full bg-gray-800/60 border border-gray-700/70 rounded-lg px-3 py-2 text-sm text-white hover:border-gray-600 focus:outline-none focus:border-accent transition-colors cursor-pointer">
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => {
          const item = typeof option === 'string' ? { value: option, label: option } : option
          return <option key={item.value} value={item.value}>{item.label}</option>
        })}
      </select>
    </div>
  )
}

export function YearField({ label = '연도', value, onChange, className = '', start = 1980, end = new Date().getFullYear() + 5 }) {
  const years = Array.from({ length: end - start + 1 }, (_, index) => String(end - index))
  const normalized = String(value || '')
  const options = normalized && !years.includes(normalized) ? [normalized, ...years] : years
  return <SelectField label={label} value={normalized} onChange={onChange} options={options} className={className} placeholder="연도 선택" />
}

export function ColorField({ label = '색상', value, onChange, className = '' }) {
  const id = useId()
  const normalized = /^#[0-9a-f]{6}$/i.test(value || '') ? value : '#000000'
  return (
    <div className={className}>
      <label htmlFor={`${id}-text`} className="block text-[11px] font-medium text-gray-400 mb-1.5">{label}</label>
      <div className="admin-color-field">
        <input id={`${id}-picker`} aria-label={`${label} 선택`} type="color" value={normalized} onChange={(event) => onChange(event.target.value)} />
        <input id={`${id}-text`} aria-label={`${label} 코드`} value={value || ''} onChange={(event) => onChange(event.target.value)} placeholder="#34d399" spellCheck="false" className="admin-control w-full bg-gray-800/60 border border-gray-700/70 rounded-lg px-3 py-2 text-sm text-white font-mono placeholder-gray-600 hover:border-gray-600 focus:outline-none focus:border-accent transition-colors" />
      </div>
    </div>
  )
}

export function SectionHeader({ title, description }) {
  return <div className="mb-6 pb-5 border-b border-gray-800/80"><h2 className="text-xl md:text-2xl font-bold tracking-tight">{title}</h2>{description && <p className="text-sm text-gray-500 mt-1.5">{description}</p>}</div>
}

export function ActionBar({ children }) {
  return <div className="sticky top-[60px] md:top-3 z-20 mb-6"><div className="admin-action-bar flex flex-wrap items-center gap-2 bg-gray-900 border border-gray-800 rounded-xl px-3 py-2.5">{children}</div></div>
}

export function SaveButton({ onClick, label = '저장' }) {
  return <button onClick={(event) => { event.preventDefault(); onClick() }} data-save-btn title="⌘S / Ctrl+S" className="admin-save-button px-4 py-2 bg-accent hover:bg-accent-light text-sm font-semibold rounded-lg transition-colors cursor-pointer active:translate-y-px flex items-center gap-1.5"><svg aria-hidden="true" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg>{label}</button>
}

export function ResetButton({ onClick, label = '초기화' }) {
  return <button onClick={onClick} className="admin-toolbar-button px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700/60 text-gray-300 hover:text-white text-sm rounded-lg transition-colors cursor-pointer">{label}</button>
}

export function Toast({ message }) {
  if (!message) return null
  return <div role="status" aria-live="polite" className="fixed bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-6 bg-gray-900 border border-accent/40 text-white pl-3 pr-4 py-2.5 rounded-xl shadow-xl shadow-black/40 text-sm z-50 animate-fade-in flex items-center gap-2 whitespace-nowrap"><span aria-hidden="true" className="w-5 h-5 rounded-full bg-accent/20 text-accent flex items-center justify-center shrink-0"><svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" /></svg></span>{message}</div>
}

export function JsonBulkEditor({ value, onApply, label = 'JSON 편집' }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState('')

  const show = () => {
    setDraft(JSON.stringify(value, null, 2))
    setError('')
    setOpen(true)
  }
  const apply = () => {
    try {
      const parsed = JSON.parse(draft)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('최상위 값은 객체여야 합니다')
      onApply(parsed)
      setOpen(false)
    } catch (err) {
      setError(err.message || 'JSON 형식을 확인해 주세요')
    }
  }

  return (
    <>
      <button type="button" onClick={show} className="admin-toolbar-button px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700/60 text-gray-300 hover:text-white text-xs rounded-lg transition-colors cursor-pointer">{'{ }'} {label}</button>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/65 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false) }}>
          <section role="dialog" aria-modal="true" aria-labelledby="bulk-json-title" className="h-full w-full max-w-2xl bg-gray-950 border-l border-gray-800 shadow-2xl flex flex-col">
            <header className="flex items-start justify-between gap-4 px-5 py-4 border-b border-gray-800">
              <div><h2 id="bulk-json-title" className="text-base font-semibold text-white">JSON 벌크 편집</h2><p className="text-xs text-gray-500 mt-1">전체 내용을 붙여넣어 교체합니다. 적용 후 저장 버튼을 눌러야 확정됩니다.</p></div>
              <button type="button" onClick={() => setOpen(false)} aria-label="JSON 벌크 편집 닫기" className="admin-dialog-close">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </header>
            <div className="flex-1 min-h-0 p-5 flex flex-col">
              <textarea value={draft} onChange={(event) => { setDraft(event.target.value); setError('') }} spellCheck="false" className="flex-1 min-h-[320px] w-full resize-none rounded-xl border border-gray-800 bg-gray-900 p-4 font-mono text-xs leading-5 text-gray-200 focus:border-accent focus:outline-none" />
              {error && <p role="alert" className="mt-3 text-xs text-red-400">{error}</p>}
            </div>
            <footer className="flex justify-between items-center gap-3 px-5 py-4 border-t border-gray-800">
              <span className="text-[10px] text-gray-600">현재 데이터는 적용 전까지 변경되지 않습니다.</span>
              <div className="flex gap-2"><button type="button" onClick={() => setOpen(false)} className="admin-secondary-button">취소</button><button type="button" onClick={apply} className="admin-primary-button">편집 상태에 적용</button></div>
            </footer>
          </section>
        </div>
      )}
    </>
  )
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
