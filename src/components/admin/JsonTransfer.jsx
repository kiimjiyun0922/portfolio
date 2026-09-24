import { useRef } from 'react'

export function ImportExportBar({ onImport, onExport, onSample, importLabel = 'JSON 가져오기', sampleLabel = '샘플 다운로드' }) {
  const fileRef = useRef(null)
  return (
    <div className="flex flex-wrap gap-2">
      <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={async (event) => {
        const file = event.target.files?.[0]
        if (file) {
          try { await onImport(file) } catch (error) { alert(error.message) }
        }
        event.target.value = ''
      }} />
      <button onClick={() => fileRef.current?.click()} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700/60 text-gray-300 hover:text-white text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" /></svg>
        {importLabel}
      </button>
      <button onClick={onExport} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 border border-gray-700/60 text-gray-300 hover:text-white text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5">
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" /></svg>
        JSON 내보내기
      </button>
      {onSample && <button onClick={onSample} className="px-3 py-1.5 border border-gray-700/60 hover:border-gray-600 text-gray-500 hover:text-gray-300 text-xs rounded-lg transition-colors cursor-pointer">{sampleLabel}</button>}
    </div>
  )
}
