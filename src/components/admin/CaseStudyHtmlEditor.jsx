import { useRef, useState } from 'react'
import { Field, MediaField } from './AdminUI'
import { CASE_STUDY_HTML_LIMIT, isVideoPath, syncCaseStudyAssets } from '../../utils/caseStudyEmbed'

const IMAGE_GUIDE = 'WebP/JPEG/PNG/AVIF · 최대 8MB'

export default function CaseStudyHtmlEditor({ project, onChange, upload, confirmDelete }) {
  const inputRef = useRef(null)
  const [error, setError] = useState('')
  const html = project.caseStudyHtml || ''
  const assets = syncCaseStudyAssets(html, project.caseStudyAssets)
  const filled = assets.filter((asset) => asset.url).length

  const selectFile = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError('')
    if (!/\.html?$/i.test(file.name)) {
      setError('HTML 파일(.html)만 올릴 수 있습니다.')
      return
    }
    if (file.size > CASE_STUDY_HTML_LIMIT) {
      setError('HTML 파일은 400KB 이하여야 합니다. 이미지는 파일 안에 넣지 말고 아래 목록에서 따로 올립니다.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result || '')
      onChange({ caseStudyHtml: text, caseStudyAssets: syncCaseStudyAssets(text, project.caseStudyAssets) })
    }
    reader.onerror = () => setError('파일을 읽지 못했습니다.')
    reader.readAsText(file)
  }

  const clear = async () => {
    if (!(await confirmDelete('전용 페이지 비우기', `${project.title || '프로젝트'} 전용 페이지`))) return
    onChange({ caseStudyHtml: '', caseStudyAssets: [] })
  }

  const setAssetUrl = (path, url) => {
    onChange({ caseStudyAssets: assets.map((asset) => (asset.path === path ? { ...asset, url } : asset)) })
  }

  return (
    <div>
      <div className="admin-case-blocks__add">
        <p>직접 디자인한 케이스스터디 HTML을 올리면 상세 페이지가 그 디자인 그대로 표시됩니다. 연결된 동안에는 케이스 스터디·케이스 블록·갤러리 대신 이 페이지가 보입니다. 파일 안의 스크립트는 실행되지 않습니다.</p>
        <div>
          <input ref={inputRef} type="file" accept=".html,text/html" className="hidden" onChange={selectFile} />
          <button type="button" className="admin-secondary-button" onClick={() => inputRef.current?.click()}>{html ? 'HTML 교체' : 'HTML 올리기'}</button>
          {html && <button type="button" className="admin-row-delete" onClick={clear}>비우기</button>}
        </div>
      </div>
      {error && <p role="alert" className="admin-case-page__error">{error}</p>}

      {html ? (
        <article className="admin-gallery-row">
          <header>
            <span>{String(assets.length).padStart(2, '0')}</span>
            <b>페이지 에셋 · {filled}/{assets.length} 연결 · HTML {Math.ceil(html.length / 1024)}KB</b>
            <div />
          </header>
          <div className="admin-case-block__fields">
            {assets.map((asset) => isVideoPath(asset.path) ? (
              <Field
                key={asset.path}
                label={asset.path}
                value={asset.url}
                onChange={(v) => setAssetUrl(asset.path, v)}
                hint="영상은 Firebase 콘솔 Storage에 올린 뒤 다운로드 URL을 붙여 넣습니다."
                className="is-wide"
              />
            ) : (
              <MediaField
                key={asset.path}
                label={asset.path}
                value={asset.url}
                onChange={(v) => setAssetUrl(asset.path, v)}
                onUpload={(file) => upload(file, 'page')}
                guide={IMAGE_GUIDE}
                className="is-wide"
              />
            ))}
            {assets.length === 0 && <p className="admin-empty-row is-wide">HTML에서 참조하는 이미지가 없습니다.</p>}
          </div>
        </article>
      ) : (
        <div className="admin-empty-state">
          <span>00</span>
          <b>전용 페이지가 없습니다</b>
          <p>연결하지 않으면 기본 케이스 스터디 형식으로 표시됩니다.</p>
        </div>
      )}
    </div>
  )
}
