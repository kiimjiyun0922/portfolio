import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { adminConfirm } from './adminDialogService'

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

export function Field({ label, value, onChange, type = 'text', className = '', rows, hint }) {
  const id = useId()
  const controlClass = 'admin-control w-full bg-gray-800/60 border border-gray-700/70 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 hover:border-gray-600 focus:outline-none focus:border-accent transition-colors'
  return (
    <div className={className}>
      {label && <label htmlFor={id} className="block text-[11px] font-medium text-gray-400 mb-1.5">{label}</label>}
      {rows
        ? <AutoTextarea id={id} value={value} onChange={onChange} minRows={rows} className={`${controlClass} resize-y`} />
        : <input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} step={type === 'number' ? 'any' : undefined} className={controlClass} />}
      {hint && <small className="admin-field-hint">{hint}</small>}
    </div>
  )
}

export function DurationField({ value, onChange, className = '' }) {
  const match = String(value || '').trim().match(/^(\d+)\s*(weeks?|months?|years?|주|개월|년)$/i)
  const amount = match?.[1] || ''
  const rawUnit = match?.[2]?.toLowerCase() || 'weeks'
  const unit = rawUnit.startsWith('month') || rawUnit === '개월' ? 'months' : rawUnit.startsWith('year') || rawUnit === '년' ? 'years' : 'weeks'
  const setPart = (nextAmount, nextUnit) => {
    if (!nextAmount) return onChange('')
    onChange(`${nextAmount} ${nextUnit}`)
  }
  return (
    <fieldset className={`admin-duration-field ${className}`}>
      <legend>기간</legend>
      <div>
        <select aria-label="기간 숫자" value={amount} onChange={(event) => setPart(event.target.value, unit)}>
          <option value="">선택</option>
          {Array.from({ length: 52 }, (_, index) => String(index + 1)).map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select aria-label="기간 단위" value={unit} onChange={(event) => setPart(amount || '1', event.target.value)}>
          <option value="weeks">주</option>
          <option value="months">개월</option>
          <option value="years">년</option>
        </select>
      </div>
      <small>숫자와 단위를 선택합니다.</small>
    </fieldset>
  )
}

export function MonthRangeField({ label = '기간', value, onChange, className = '', allowCurrent = true }) {
  const parts = String(value || '').split(/\s*[~–—]\s*/)
  const toMonth = (part = '') => {
    const match = part.trim().match(/(\d{4})[.\-/](\d{1,2})/)
    return match ? `${match[1]}-${String(match[2]).padStart(2, '0')}` : ''
  }
  const start = toMonth(parts[0])
  const end = toMonth(parts[1])
  const current = allowCurrent && !!start && (!parts[1]?.trim() || /현재|now|present/i.test(parts[1]))
  const format = (nextStart, nextEnd, nextCurrent) => {
    const human = (month) => month ? month.replace('-', '.') : ''
    if (!nextStart) return ''
    return `${human(nextStart)} ~ ${nextCurrent ? '현재' : human(nextEnd)}`.trim()
  }
  return (
    <fieldset className={`admin-month-range ${className}`}>
      <legend>{label}</legend>
      <div>
        <input aria-label={`${label} 시작월`} type="month" value={start} onChange={(event) => onChange(format(event.target.value, end, current))} />
        <span aria-hidden="true">–</span>
        <input aria-label={`${label} 종료월`} type="month" value={end} disabled={current} onChange={(event) => onChange(format(start, event.target.value, false))} />
        {allowCurrent && <label><input type="checkbox" checked={current} onChange={(event) => onChange(format(start, end, event.target.checked))} /> 현재</label>}
      </div>
    </fieldset>
  )
}

export function YearRangeField({ label = '기간', value, onChange, className = '', start = 1980, end = new Date().getFullYear() + 5 }) {
  const years = Array.from({ length: end - start + 1 }, (_, index) => String(end - index))
  const matches = String(value || '').match(/(\d{4}).*?(\d{4})/)
  const from = matches?.[1] || ''
  const to = matches?.[2] || ''
  const values = [...new Set([from, to, ...years].filter(Boolean))]
  return (
    <fieldset className={`admin-year-range ${className}`}>
      <legend>{label}</legend>
      <div>
        <select aria-label={`${label} 시작 연도`} value={from} onChange={(event) => onChange(event.target.value && to ? `${event.target.value} - ${to}` : event.target.value)}><option value="">시작</option>{values.map((year) => <option key={year} value={year}>{year}</option>)}</select>
        <span aria-hidden="true">–</span>
        <select aria-label={`${label} 종료 연도`} value={to} onChange={(event) => onChange(from && event.target.value ? `${from} - ${event.target.value}` : from)}><option value="">종료</option>{values.map((year) => <option key={year} value={year}>{year}</option>)}</select>
      </div>
    </fieldset>
  )
}

export function MediaField({ label = '이미지', value, onChange, onUpload, guide, className = '' }) {
  const id = useId()
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const selectFile = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError('')
    setUploading(true)
    try {
      const url = await onUpload(file)
      onChange(url)
    } catch (uploadError) {
      setError(uploadError?.message || '이미지를 업로드하지 못했습니다.')
    } finally {
      setUploading(false)
    }
  }
  return (
    <div className={`admin-media-field ${className}`}>
      <div className="admin-media-field__head"><label htmlFor={`${id}-url`}>{label}</label>{guide && <span>{guide}</span>}</div>
      <div className="admin-media-field__body">
        <div className="admin-media-field__preview" aria-label={value ? '선택한 이미지 미리보기' : '이미지 없음'}>
          {value ? <img src={value} alt="" /> : <span>IMAGE</span>}
        </div>
        <div className="admin-media-field__controls">
          <input id={`${id}-url`} value={value || ''} onChange={(event) => onChange(event.target.value)} placeholder="https://… 또는 /assets/…" />
          <div>
            <input ref={inputRef} type="file" accept="image/webp,image/jpeg,image/png,image/avif" className="hidden" onChange={selectFile} />
            <button type="button" className="admin-secondary-button" disabled={uploading} onClick={() => inputRef.current?.click()}>{uploading ? '업로드 중…' : '파일 업로드'}</button>
            {value && <button type="button" className="admin-toolbar-button" onClick={async () => { if (await adminConfirm('선택한 이미지 연결을 편집 화면에서 제거합니다. 저장 버튼을 눌러야 실제 데이터에 반영됩니다.', { title: `${label} 비우기`, confirmLabel: '비우기' })) onChange('') }}>이미지 비우기</button>}
          </div>
          {error && <p role="alert">{error}</p>}
        </div>
      </div>
    </div>
  )
}

export function SelectField({ label, value, onChange, options, className = '', placeholder, ariaLabel }) {
  const id = useId()
  return (
    <div className={className}>
      {label && <label htmlFor={id} className="block text-[11px] font-medium text-gray-400 mb-1.5">{label}</label>}
      <select id={id} aria-label={ariaLabel} value={value} onChange={(event) => onChange(event.target.value)} className="admin-control w-full bg-gray-800/60 border border-gray-700/70 rounded-lg px-3 py-2 text-sm text-white hover:border-gray-600 focus:outline-none focus:border-accent transition-colors cursor-pointer">
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

export function SectionHeader({ title, description, status }) {
  return <header className="admin-page-header"><div><h2>{title}</h2>{description && <p>{description}</p>}</div>{status && <span className="admin-page-header__state">{status}</span>}</header>
}

export function ActionBar({ children }) {
  return <div className="admin-action-bar-wrap"><div className="admin-action-bar">{children}</div></div>
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
  const [preview, setPreview] = useState(null)

  const show = () => {
    setDraft(JSON.stringify(value, null, 2))
    setError('')
    setPreview(null)
    setOpen(true)
  }
  const inspect = () => {
    try {
      const parsed = JSON.parse(draft)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('최상위 값은 객체여야 합니다')
      const beforeKeys = Object.keys(value || {})
      const afterKeys = Object.keys(parsed)
      const added = afterKeys.filter((key) => !beforeKeys.includes(key))
      const removed = beforeKeys.filter((key) => !afterKeys.includes(key))
      const changed = afterKeys.filter((key) => beforeKeys.includes(key) && JSON.stringify(value[key]) !== JSON.stringify(parsed[key]))
      setPreview({ parsed, added, removed, changed })
      setError('')
    } catch (err) {
      setPreview(null)
      setError(err.message || 'JSON 형식을 확인해 주세요')
    }
  }
  const apply = () => {
    if (!preview) return
    onApply(preview.parsed)
    setOpen(false)
  }

  return (
    <>
      <button type="button" onClick={show} className="admin-toolbar-button px-3 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700/60 text-gray-300 hover:text-white text-xs rounded-lg transition-colors cursor-pointer">{'{ }'} {label}</button>
      {open && createPortal(
        <div className="admin-shell admin-json-overlay" data-admin-theme={document.querySelector('.admin-shell')?.dataset.adminTheme || 'light'} onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false) }}>
          <section role="dialog" aria-modal="true" aria-labelledby="bulk-json-title" className="admin-json-dialog">
            <header>
              <div><h2 id="bulk-json-title" className="text-base font-semibold text-white">JSON 벌크 편집</h2><p className="text-xs text-gray-500 mt-1">전체 내용을 붙여넣어 교체합니다. 적용 후 저장 버튼을 눌러야 확정됩니다.</p></div>
              <button type="button" onClick={() => setOpen(false)} aria-label="JSON 벌크 편집 닫기" className="admin-dialog-close">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </header>
            <div className="admin-json-dialog__body">
              <textarea value={draft} onChange={(event) => { setDraft(event.target.value); setError(''); setPreview(null) }} spellCheck="false" />
              {error && <p role="alert" className="mt-3 text-xs text-red-400">{error}</p>}
              {preview && <div className="admin-json-diff" role="status"><b>적용 전 차이</b><span>추가 {preview.added.length}</span><span>수정 {preview.changed.length}</span><span>삭제 {preview.removed.length}</span>{preview.removed.length > 0 && <p>삭제 예정: {preview.removed.join(', ')}</p>}</div>}
            </div>
            <footer>
              <span className="text-[10px] text-gray-600">현재 데이터는 적용 전까지 변경되지 않습니다.</span>
              <div className="flex gap-2"><button type="button" onClick={() => setOpen(false)} className="admin-secondary-button">취소</button>{preview ? <button type="button" onClick={apply} className="admin-primary-button">편집 상태에 적용</button> : <button type="button" onClick={inspect} className="admin-primary-button">차이 확인</button>}</div>
            </footer>
          </section>
        </div>,
        document.body,
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
    <nav aria-label="페이지 바로가기" className="admin-floating-nav">
      {open && items.length > 0 && <div className="admin-floating-nav__menu">{items.map((item, index) => <button key={index} onClick={() => { item.onClick(); setOpen(false) }}>{item.label}</button>)}</div>}
      <div className="admin-floating-nav__actions">
        {items.length > 0 && <button aria-expanded={open} aria-label={`페이지 바로가기 ${open ? '닫기' : '열기'}`} onClick={() => setOpen(!open)} className="admin-floating-nav__button admin-floating-nav__button--menu"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0ZM3.75 12h.007v.008H3.75V12Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm-.375 5.25h.007v.008H3.75v-.008Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" /></svg></button>}
        <button aria-label="맨 위로 이동" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); setOpen(false) }} className="admin-floating-nav__button admin-floating-nav__button--top"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" /></svg></button>
      </div>
    </nav>
  )
}
