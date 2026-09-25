import { useState, useCallback, useEffect } from 'react'
import { loadProjects, saveProjects, resetProjects, defaultProjects } from '../data/projects'
import { watchOwnerAuth, hasConfig as cloudConfigured } from '../utils/firebase'
import { cloudListSnapshots, cloudGetSnapshot, cloudSaveSnapshot, applyRestoredData } from '../utils/db'
import {
  getAccessTokens,
  createAccessToken,
  renameAccessToken,
  revokeAccessToken,
  deleteAccessToken,
  forceExpireToken,
  extendAccessToken,
  getAccessLog,
  getGateLog,
  getAlertLog,
  clearAccessLog,
  removeAccessLogEntry,
  clearGateLog,
  removeGateLogEntry,
  clearAlertLog,
  removeAlertLogEntry,
  getAccessLogForToken,
  loadHeroConfig,
  saveHeroConfig,
  resetHeroConfig,
  loadAuthGateConfig,
  saveAuthGateConfig,
  resetAuthGateConfig,
  loadResumeConfig,
  saveResumeConfig,
  resetResumeConfig,
  loadContactConfig,
  saveContactConfig,
  resetContactConfig,
  loadAboutConfig,
  saveAboutConfig,
  resetAboutConfig,
  loadAchievementsConfig,
  saveAchievementsConfig,
  resetAchievementsConfig,
  loadJourneyConfig,
  saveJourneyConfig,
  resetJourneyConfig,
  clearAdminSession,
  markOwnerBrowser,
  setAccessTokenTheme,
  loadThemeSettings,
  saveThemeSettings,
  resetThemeSettings,
  loadTaxonomyConfig,
  saveTaxonomyConfig,
  resetTaxonomyConfig,
} from '../utils/crypto'
import { THEMES, getTheme } from '../themes'
import { SITE, SITE_HOST } from '../site.config'
import { validateProjectsImport, validateResumeImport } from '../utils/importValidation'
import { ImportExportBar } from './admin/JsonTransfer'
import { downloadJson, importJson } from './admin/JsonTransferUtils'
import { ACTION_LABELS, LOG_FILTERS, SECTION_LABELS, buildLogRows, countLogRows } from './admin/logModel'
import { filterTokens, getTokenStatus, isActiveToken } from './admin/tokenModel'
import { ActionBar, AutoTextarea, ColorField, Field, FloatingJumpNav, JsonBulkEditor, ResetButton, SaveButton, SectionHeader, SelectField, Toast, YearField } from './admin/AdminUI'

/* ─── Navigation ─── */

const NAV_ITEMS = [
  { group: '대시보드', items: [
    { id: 'home', label: '홈', icon: '01' },
  ]},
  { group: '콘텐츠', items: [
    { id: 'projects', label: '프로젝트', icon: '02' },
    { id: 'design-projects', label: '디자인 아카이브', icon: '03' },
    { id: 'resume', label: '경력·학력', icon: '04' },
    { id: 'about', label: '소개', icon: '05' },
    { id: 'achievements', label: '핵심 성과', icon: '06' },
    { id: 'journey', label: '커리어 저니', icon: '07' },
  ]},
  { group: '페이지 설정', items: [
    { id: 'hero', label: '히어로', icon: '07' },
    { id: 'authgate', label: '접속 화면', icon: '08' },
    { id: 'theme', label: '테마', icon: '09' },
    { id: 'contact', label: '연락처', icon: '10' },
  ]},
  { group: '접속 관리', items: [
    { id: 'tokens', label: '토큰', icon: '11' },
    { id: 'logs', label: '접속 로그', icon: '12' },
  ]},
  { group: '설정', items: [
    { id: 'taxonomy', label: '분류·선택지', icon: '13' },
    { id: 'history', label: '변경 이력', icon: '13' },
    { id: 'account', label: '관리자 계정', icon: '14' },
  ]},
]

/* ─── Sub-editors ─── */


/* ─── Resume Sub-editors (defined outside to avoid remount on state change) ─── */

function EducationEditor({ item, onChange, onRemove }) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-3">
      <div className="flex justify-between items-start gap-2">
        <div className="grid grid-cols-2 gap-2 flex-1 sm:grid-cols-3">
          <Field label="학교" value={item.school} onChange={(v) => onChange({ ...item, school: v })} />
          <Field label="학위" value={item.degree} onChange={(v) => onChange({ ...item, degree: v })} />
          <Field label="기간" value={item.period} onChange={(v) => onChange({ ...item, period: v })} />
        </div>
        <button onClick={onRemove} className="shrink-0 mt-5 px-2 py-1 text-red-400 hover:text-red-300 cursor-pointer">✕</button>
      </div>
    </div>
  )
}

function WorkProjectEditor({ project, onChange, onRemove, onMoveUp, onMoveDown, isFirst, isLast }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-gray-900/50 rounded border border-gray-700/30 overflow-hidden">
      <div role="button" tabIndex={0} aria-expanded={open} className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-800/40" onClick={() => setOpen(!open)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setOpen(!open) } }}>
        <svg className={`w-3 h-3 text-gray-500 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
        <span className="text-xs text-gray-300 flex-1 truncate">{project.title || '새 프로젝트'}</span>
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button onClick={onMoveUp} disabled={isFirst} className="text-[10px] text-gray-400 hover:text-white disabled:text-gray-700 cursor-pointer disabled:cursor-default px-0.5">↑</button>
          <button onClick={onMoveDown} disabled={isLast} className="text-[10px] text-gray-400 hover:text-white disabled:text-gray-700 cursor-pointer disabled:cursor-default px-0.5">↓</button>
          <button onClick={onRemove} className="text-[10px] text-red-400 hover:text-red-300 cursor-pointer px-0.5 ml-1">✕</button>
        </div>
      </div>
      {open && (
        <div className="px-3 pb-3 pt-1 space-y-2">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Field label="제목" value={project.title || ''} onChange={(v) => onChange({ ...project, title: v })} />
            <Field label="기간" value={project.period || ''} onChange={(v) => onChange({ ...project, period: v })} />
            <Field label="역할" value={project.role || ''} onChange={(v) => onChange({ ...project, role: v })} />
            <Field label="인원" value={project.team || ''} onChange={(v) => onChange({ ...project, team: v })} />
          </div>
          <Field label="주요 내용 (마크다운)" value={project.summary || ''} onChange={(v) => onChange({ ...project, summary: v })} rows={3} />
          <Field label="성과 (마크다운)" value={project.result || ''} onChange={(v) => onChange({ ...project, result: v })} rows={2} />
        </div>
      )}
    </div>
  )
}

function WorkEditor({ item, onChange, onRemove, collapsed, onToggle }) {
  const [showProjects, setShowProjects] = useState(true)
  const projects = item.projects || []

  if (collapsed) {
    return (
      <button onClick={onToggle} className="w-full text-left bg-gray-800/50 hover:bg-gray-800 rounded-lg px-3 py-2.5 cursor-pointer transition-colors">
        {/* Desktop: single line / Mobile: company line + meta line */}
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-[10px] text-gray-500 shrink-0">▸</span>
          <span className="text-sm text-white font-medium truncate">{item.company || '새 경력'}</span>
          <span className="hidden sm:inline text-xs text-gray-500 truncate">{item.title}</span>
          {projects.length > 0 && <span className="hidden sm:inline text-[10px] text-gray-600 shrink-0">프로젝트 {projects.length}</span>}
          <span className="hidden sm:inline text-xs text-gray-600 ml-auto shrink-0 font-mono">{item.period}</span>
        </div>
        <div className="sm:hidden flex items-center gap-2 mt-1 pl-[18px] min-w-0">
          {item.title && <span className="text-xs text-gray-500 truncate">{item.title}</span>}
          {projects.length > 0 && <span className="text-[10px] text-gray-600 shrink-0">프로젝트 {projects.length}</span>}
          <span className="text-[11px] text-gray-600 ml-auto shrink-0 font-mono">{item.period}</span>
        </div>
      </button>
    )
  }
  const swap = (arr, i, j) => { const a = [...arr]; [a[i], a[j]] = [a[j], a[i]]; return a }
  const updateProject = (idx, p) => { const ps = [...projects]; ps[idx] = p; onChange({ ...item, projects: ps }) }
  const removeProject = (idx) => onChange({ ...item, projects: projects.filter((_, i) => i !== idx) })
  const moveProject = (idx, dir) => { const j = idx + dir; if (j < 0 || j >= projects.length) return; onChange({ ...item, projects: swap(projects, idx, j) }) }
  const addProject = () => onChange({ ...item, projects: [...projects, { title: '', period: '', role: '', team: '', summary: '', result: '' }] })

  return (
    <div className="bg-gray-800/50 rounded-lg p-3 space-y-2">
      <div className="flex justify-between items-start gap-2">
        <div className="grid grid-cols-2 gap-2 flex-1 sm:grid-cols-3">
          <Field label="회사" value={item.company} onChange={(v) => onChange({ ...item, company: v })} />
          <Field label="직함" value={item.title} onChange={(v) => onChange({ ...item, title: v })} />
          <Field label="기간" value={item.period} onChange={(v) => onChange({ ...item, period: v })} />
        </div>
        <div className="flex items-center gap-1 shrink-0 mt-5">
          {onToggle && <button onClick={onToggle} title="접기" className="px-2 py-1 text-xs text-gray-500 hover:text-white cursor-pointer">▾</button>}
          <button onClick={onRemove} className="px-2 py-1 text-red-400 hover:text-red-300 cursor-pointer">✕</button>
        </div>
      </div>
      <Field label="설명 (마크다운)" value={item.description} onChange={(v) => onChange({ ...item, description: v })} rows={2} />
      {item.leaveNote !== undefined && (
        <Field label="휴직 메모" value={item.leaveNote || ''} onChange={(v) => onChange({ ...item, leaveNote: v })} />
      )}

      {/* Projects sub-editor */}
      <div className="pt-1">
        <button onClick={() => setShowProjects(!showProjects)} className="text-xs text-gray-500 hover:text-accent cursor-pointer flex items-center gap-1">
          <span className="text-[10px]">{showProjects ? '▾' : '▸'}</span>
          <span>프로젝트 상세 {projects.length}건</span>
        </button>
        {showProjects && (
          <div className="mt-2 space-y-1.5">
            {projects.map((p, pi) => (
              <WorkProjectEditor
                key={pi}
                project={p}
                onChange={(u) => updateProject(pi, u)}
                onRemove={() => removeProject(pi)}
                onMoveUp={() => moveProject(pi, -1)}
                onMoveDown={() => moveProject(pi, 1)}
                isFirst={pi === 0}
                isLast={pi === projects.length - 1}
              />
            ))}
            <button onClick={addProject} className="text-[10px] text-accent hover:text-accent-light cursor-pointer">+ 프로젝트 추가</button>
          </div>
        )}
      </div>

      {/* Other projects markdown */}
      <div className="pt-1">
        <Field label="기타 업무 (마크다운, - 항목은 프로젝트 수에 포함)" value={item.otherProjects || ''} onChange={(v) => onChange({ ...item, otherProjects: v })} rows={3} />
      </div>
    </div>
  )
}

function ActivityEditor({ item, onChange, onRemove }) {
  return (
    <div className="admin-activity-row">
      <YearField value={item.year} onChange={(v) => onChange({ ...item, year: v })} />
      <Field label="카테고리" value={item.category} onChange={(v) => onChange({ ...item, category: v })} />
      <Field label="내용" value={item.summary} onChange={(v) => onChange({ ...item, summary: v })} />
      <Field label="링크 URL" value={item.link || ''} onChange={(v) => onChange({ ...item, link: v })} />
      <button type="button" onClick={onRemove} aria-label={`${item.summary || '활동'} 삭제`} className="admin-row-delete">삭제</button>
    </div>
  )
}

function taxonomyOptions(config = loadTaxonomyConfig(), currentValue = '') {
  const options = (config.categories || []).map((item) => ({ value: item.key, label: item.label }))
  return currentValue && !options.some((item) => item.value === currentValue)
    ? [{ value: currentValue, label: `${currentValue} (기존 값)` }, ...options]
    : options
}

/* ─── Resume Section ─── */

function ResumeSection() {
  const [config, setConfig] = useState(loadResumeConfig)
  const [toast, setToast] = useState('')
  const [workOpen, setWorkOpen] = useState({}) // collapsed by default → 전체 조망 우선

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2000) }
  const toggleWork = (i) => setWorkOpen((p) => ({ ...p, [i]: !p[i] }))
  const jumpToWork = (i) => {
    setWorkOpen((p) => ({ ...p, [i]: true }))
    setTimeout(() => document.getElementById(`work-card-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
  }

  const handleSave = () => { saveResumeConfig(config); flash('이력서 저장 완료') }
  const handleReset = () => { if (confirm('초기화하시겠습니까?')) { resetResumeConfig(); setConfig(loadResumeConfig()); flash('초기화 완료') } }

  const updateItem = (key, index, updated) => { const arr = [...config[key]]; arr[index] = updated; setConfig({ ...config, [key]: arr }) }
  const removeItem = (key, index) => setConfig({ ...config, [key]: config[key].filter((_, i) => i !== index) })

  const addEducation = () => setConfig({ ...config, education: [...config.education, { school: '', degree: '', period: '' }] })
  const addWork = () => {
    setWorkOpen((p) => ({ ...p, [config.work.length]: true }))
    setConfig({ ...config, work: [...config.work, { company: '', title: '', period: '', description: '' }] })
  }
  const addActivity = () => setConfig({ ...config, activities: [...config.activities, { year: '', category: '', summary: '' }] })

  const sampleResume = {
    education: [
      { school: '서울대학교 컴퓨터공학과', degree: '학사', period: '2014 - 2018' },
    ],
    work: [
      { company: '테크 기업 A', title: 'ML 엔지니어', period: '2020 - 현재', description: '추천 시스템 개발 및 운영' },
      { company: '스타트업 B', title: '데이터 사이언티스트', period: '2018 - 2020', description: '데이터 파이프라인 구축' },
    ],
    activities: [
      { year: '2023', category: '발표', summary: 'AI 컨퍼런스 - 대규모 언어 모델 활용 사례' },
    ],
    selfIntro: '## 소개\n\n안녕하세요, ML 엔지니어입니다.\n\n**핵심 역량:**\n- 머신러닝 모델 설계 및 배포\n- 데이터 파이프라인 구축\n- A/B 테스트 설계',
  }

  const handleImport = async (file) => {
    const data = validateResumeImport(await importJson(file))
    setConfig({ ...config, ...data })
    flash('가져오기 완료 — 저장 버튼을 눌러주세요')
  }

  return (
    <div>
      <SectionHeader title="이력서" description="학력, 경력, 활동 내역을 관리합니다" />
      <ActionBar>
        <SaveButton onClick={handleSave} />
        <ResetButton onClick={handleReset} />
        <JsonBulkEditor value={config} onApply={(value) => { setConfig(validateResumeImport(value)); flash('JSON 적용 완료 — 저장 버튼을 눌러주세요') }} />
        <div className="flex-1" />
        <ImportExportBar
          onImport={handleImport}
          onExport={() => downloadJson(config, 'resume.json')}
          onSample={() => downloadJson(sampleResume, 'resume-sample.json')}
        />
      </ActionBar>

      {/* Work */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-accent">경력</h3>
          <div className="flex items-center gap-3">
            <button onClick={() => setWorkOpen(Object.fromEntries(config.work.map((_, i) => [i, true])))} className="text-[11px] text-gray-500 hover:text-white cursor-pointer">모두 펼치기</button>
            <button onClick={() => setWorkOpen({})} className="text-[11px] text-gray-500 hover:text-white cursor-pointer">모두 접기</button>
            <button onClick={addWork} className="text-xs text-accent hover:text-accent-light cursor-pointer">+ 추가</button>
          </div>
        </div>
        {config.work.length > 1 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {config.work.map((w, i) => (
              <button key={i} onClick={() => jumpToWork(i)} className="px-2 py-1 text-[11px] bg-gray-800/60 hover:bg-gray-800 text-gray-400 hover:text-white rounded-md cursor-pointer transition-colors">
                {w.company || `경력 ${i + 1}`}
              </button>
            ))}
          </div>
        )}
        <div className="space-y-2">
          {config.work.map((item, i) => (
            <div key={i} id={`work-card-${i}`} className="scroll-mt-24">
              <WorkEditor item={item} collapsed={!workOpen[i]} onToggle={() => toggleWork(i)} onChange={(u) => updateItem('work', i, u)} onRemove={() => removeItem('work', i)} />
            </div>
          ))}
          {config.work.length === 0 && <p className="text-xs text-gray-600 py-2">항목이 없습니다</p>}
        </div>
      </div>

      {/* Education */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-accent">학력</h3>
          <button onClick={addEducation} className="text-xs text-accent hover:text-accent-light cursor-pointer">+ 추가</button>
        </div>
        <div className="space-y-2">
          {config.education.map((item, i) => (
            <EducationEditor key={i} item={item} onChange={(u) => updateItem('education', i, u)} onRemove={() => removeItem('education', i)} />
          ))}
          {config.education.length === 0 && <p className="text-xs text-gray-600 py-2">항목이 없습니다</p>}
        </div>
      </div>

      {/* Activities */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-sm font-semibold text-accent">활동</h3>
          <button onClick={addActivity} className="text-xs text-accent hover:text-accent-light cursor-pointer">+ 추가</button>
        </div>
        <div className="space-y-2">
          {config.activities.map((item, i) => (
            <ActivityEditor key={i} item={item} onChange={(u) => updateItem('activities', i, u)} onRemove={() => removeItem('activities', i)} />
          ))}
          {config.activities.length === 0 && <p className="text-xs text-gray-600 py-2">항목이 없습니다</p>}
        </div>
      </div>

      <FloatingJumpNav items={(config.work || []).map((w, i) => ({ label: w.company || `경력 ${i + 1}`, onClick: () => jumpToWork(i) }))} />
      <Toast message={toast} />
    </div>
  )
}

/* ─── Hero Section ─── */

function HeroSection() {
  const [config, setConfig] = useState(loadHeroConfig)
  const [toast, setToast] = useState('')

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2000) }
  const update = (key, value) => setConfig({ ...config, [key]: value })

  const handleSave = () => { saveHeroConfig(config); flash('히어로 저장 완료') }
  const handleReset = () => { if (confirm('초기화하시겠습니까?')) { resetHeroConfig(); setConfig(loadHeroConfig()); flash('초기화 완료') } }

  return (
    <div>
      <SectionHeader title="히어로" description="메인 화면 상단 영역을 설정합니다" />
      <ActionBar>
        <SaveButton onClick={handleSave} />
        <ResetButton onClick={handleReset} />
        <JsonBulkEditor value={config} onApply={(value) => { setConfig(value); flash('JSON 적용 완료 — 저장 버튼을 눌러주세요') }} />
        <div className="flex-1" /><ImportExportBar onImport={async (file) => { setConfig(await importJson(file)); flash('가져오기 완료 — 저장 버튼을 눌러주세요') }} onExport={() => downloadJson(config, 'hero.json')} />
      </ActionBar>
      <div className="space-y-4 max-w-4xl">
        <Field label="사이트 타이틀" value={config.siteTitle || ''} onChange={(v) => update('siteTitle', v)} />
        <Field label="태그라인" value={config.tagline} onChange={(v) => update('tagline', v)} />
        <Field label="헤드라인" value={config.headline} onChange={(v) => update('headline', v)} rows={2} />
        <Field label="서브타이틀" value={config.subtitle} onChange={(v) => update('subtitle', v)} rows={2} />
        <Field label="CTA 텍스트" value={config.ctaText} onChange={(v) => update('ctaText', v)} />
      </div>
      <Toast message={toast} />
    </div>
  )
}

/* ─── AuthGate Section ─── */

function AuthGateSection() {
  const [config, setConfig] = useState(loadAuthGateConfig)
  const [toast, setToast] = useState('')

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2000) }
  const update = (key, value) => setConfig({ ...config, [key]: value })

  const handleSave = () => { saveAuthGateConfig(config); flash('접속 화면 저장 완료') }
  const handleReset = () => { if (confirm('초기화하시겠습니까?')) { resetAuthGateConfig(); setConfig(loadAuthGateConfig()); flash('초기화 완료') } }

  return (
    <div>
      <SectionHeader title="접속 화면" description="방문자 인증 화면의 텍스트를 설정합니다" />
      <ActionBar>
        <SaveButton onClick={handleSave} />
        <ResetButton onClick={handleReset} />
        <JsonBulkEditor value={config} onApply={(value) => { setConfig(value); flash('JSON 적용 완료 — 저장 버튼을 눌러주세요') }} />
        <div className="flex-1" /><ImportExportBar onImport={async (file) => { setConfig(await importJson(file)); flash('가져오기 완료 — 저장 버튼을 눌러주세요') }} onExport={() => downloadJson(config, 'auth-gate.json')} />
      </ActionBar>
      <div className="space-y-4 max-w-4xl">
        <Field label="태그라인" value={config.tagline} onChange={(v) => update('tagline', v)} />
        <Field label="헤드라인" value={config.headline} onChange={(v) => update('headline', v)} rows={2} />
        <Field label="서브타이틀" value={config.subtitle} onChange={(v) => update('subtitle', v)} rows={2} />
        <Field label="버튼 텍스트" value={config.buttonText} onChange={(v) => update('buttonText', v)} />
        <Field label="연락 안내 메시지" value={config.contactMessage} onChange={(v) => update('contactMessage', v)} />
        <Field label="연락 이메일" value={config.contactEmail} onChange={(v) => update('contactEmail', v)} />
        <Field label="연락 힌트" value={config.contactHint} onChange={(v) => update('contactHint', v)} />
      </div>
      <Toast message={toast} />
    </div>
  )
}

/* ─── Theme Section ─── */

function ThemePicker({ value, onChange, previewView, onPreview }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
      {THEMES.map((th) => (
        <button
          key={th.id}
          onClick={() => onChange(th.id)}
          className={`text-left rounded-xl border p-3.5 transition-colors cursor-pointer ${
            value === th.id
              ? 'border-accent bg-accent/10'
              : 'border-gray-800 bg-gray-900 hover:border-gray-600'
          }`}
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex rounded-md overflow-hidden w-9 h-5 border border-gray-700/60 shrink-0">
              {th.swatch.map((c) => (
                <i key={c} className="flex-1" style={{ background: c }} />
              ))}
            </span>
            <span className={`text-sm font-semibold ${value === th.id ? 'text-accent' : 'text-white'}`}>{th.name}</span>
            {onPreview && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => { e.stopPropagation(); onPreview(previewView, th.id) }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.stopPropagation(); onPreview(previewView, th.id) } }}
                title="이 테마로 실제 화면 미리보기"
                className="ml-auto px-2 py-0.5 text-[11px] text-gray-400 hover:text-accent border border-gray-700 hover:border-accent/50 rounded-md transition-colors"
              >미리보기</span>
            )}
            {value === th.id && !onPreview && <span className="ml-auto text-accent text-xs">✓</span>}
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed">{th.desc}</p>
        </button>
      ))}
    </div>
  )
}

function ThemeSection({ onPreviewTheme }) {
  const [settings, setSettings] = useState(loadThemeSettings)
  const [toast, setToast] = useState('')

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2000) }
  const handleSave = () => { saveThemeSettings(settings); flash('테마 설정 저장 완료') }
  const handleReset = () => {
    if (confirm('테마 설정을 초기화하시겠습니까?')) {
      setSettings(resetThemeSettings())
      flash('초기화 완료')
    }
  }

  return (
    <div>
      <SectionHeader title="테마" description="방문자에게 보여줄 비주얼 테마를 관리합니다. 토큰별 테마는 토큰 발급 시 선택합니다." />
      <ActionBar>
        <SaveButton onClick={handleSave} />
        <ResetButton onClick={handleReset} />
        <JsonBulkEditor value={settings} onApply={(value) => { setSettings(value); flash('JSON 적용 완료 — 저장 버튼을 눌러주세요') }} />
        <ImportExportBar onImport={async (file) => { setSettings(await importJson(file)); flash('가져오기 완료 — 저장 버튼을 눌러주세요') }} onExport={() => downloadJson(settings, 'theme-settings.json')} />
        {onPreviewTheme && (
          <button
            onClick={() => onPreviewTheme('site', settings.defaultVisitorTheme)}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700/60 text-gray-300 hover:text-white text-sm rounded-lg transition-colors cursor-pointer"
          >실제 화면에서 미리보기</button>
        )}
      </ActionBar>
      <div className="space-y-8 max-w-4xl">
        <div>
          <h3 className="text-sm font-bold text-white mb-1">진입 화면 테마</h3>
          <p className="text-xs text-gray-500 mb-3">토큰 입력 화면(인증 전)에 적용되는 테마입니다.</p>
          <ThemePicker value={settings.entryTheme} onChange={(v) => setSettings({ ...settings, entryTheme: v })} previewView="gate" onPreview={onPreviewTheme} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-white mb-1">기본 방문자 테마</h3>
          <p className="text-xs text-gray-500 mb-3">테마를 지정하지 않은 토큰으로 접속한 방문자에게 적용됩니다.</p>
          <ThemePicker value={settings.defaultVisitorTheme} onChange={(v) => setSettings({ ...settings, defaultVisitorTheme: v })} previewView="site" onPreview={onPreviewTheme} />
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl px-4 py-3.5 text-xs text-gray-500 leading-relaxed">
          어드민 화면은 항상 기본 디자인으로 표시됩니다. 새 테마 추가는 <code className="text-gray-400">src/themes.js</code>와{' '}
          <code className="text-gray-400">src/index.css</code>의 테마 블록에 항목을 추가하면 됩니다 (절차: 저장소의 TEMPLATE.md 참고).
        </div>
      </div>
      <Toast message={toast} />
    </div>
  )
}

/* ─── Contact Section ─── */

function ContactSection() {
  const [config, setConfig] = useState(loadContactConfig)
  const [toast, setToast] = useState('')

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2000) }
  const update = (key, value) => setConfig({ ...config, [key]: value })

  const handleSave = () => { saveContactConfig(config); flash('연락처 저장 완료') }
  const handleReset = () => { if (confirm('초기화하시겠습니까?')) { resetContactConfig(); setConfig(loadContactConfig()); flash('초기화 완료') } }

  return (
    <div>
      <SectionHeader title="연락처" description="하단 연락처 영역의 내용을 설정합니다" />
      <ActionBar>
        <SaveButton onClick={handleSave} />
        <ResetButton onClick={handleReset} />
        <JsonBulkEditor value={config} onApply={(value) => { setConfig(value); flash('JSON 적용 완료 — 저장 버튼을 눌러주세요') }} />
        <div className="flex-1" /><ImportExportBar onImport={async (file) => { setConfig(await importJson(file)); flash('가져오기 완료 — 저장 버튼을 눌러주세요') }} onExport={() => downloadJson(config, 'contact.json')} />
      </ActionBar>
      <div className="space-y-4 max-w-4xl">
        <Field label="제목" value={config.heading} onChange={(v) => update('heading', v)} />
        <Field label="메시지" value={config.message} onChange={(v) => update('message', v)} rows={2} />
        <Field label="이메일" value={config.email} onChange={(v) => update('email', v)} />
        <Field label="LinkedIn URL" value={config.linkedinUrl} onChange={(v) => update('linkedinUrl', v)} />
        <Field label="LinkedIn 라벨" value={config.linkedinLabel} onChange={(v) => update('linkedinLabel', v)} />
        <Field label="저작권 문구" value={config.copyright} onChange={(v) => update('copyright', v)} />
      </div>
      <Toast message={toast} />
    </div>
  )
}

/* ─── Token Manager ─── */

function formatDate(ts) {
  return new Date(ts).toLocaleString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function parseBrowser(ua) {
  if (!ua) return '알 수 없음'
  if (ua.includes('Edg/')) return 'Edge'
  if (ua.includes('Chrome/')) return 'Chrome'
  if (ua.includes('Firefox/')) return 'Firefox'
  if (ua.includes('Safari/') && !ua.includes('Chrome')) return 'Safari'
  return '기타'
}

function parseOS(ua) {
  if (!ua) return ''
  if (ua.includes('Windows')) return 'Windows'
  if (ua.includes('Mac OS')) return 'macOS'
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS'
  if (ua.includes('Android')) return 'Android'
  if (ua.includes('Linux')) return 'Linux'
  return ''
}

function TokensSection({ onPreviewTheme }) {
  const [tokens, setTokens] = useState(getAccessTokens)
  const [tokenNow] = useState(Date.now)
  const [label, setLabel] = useState('')
  const [expMode, setExpMode] = useState('days') // 'days' or 'datetime'
  const [expDays, setExpDays] = useState(7)
  const [expDatetime, setExpDatetime] = useState('')
  const [expandedToken, setExpandedToken] = useState(null)
  const [editingLabel, setEditingLabel] = useState(null) // token id being renamed
  const [editLabelValue, setEditLabelValue] = useState('')
  const [extendingToken, setExtendingToken] = useState(null) // token id being extended
  const [extendDays, setExtendDays] = useState(7)
  const [createOpen, setCreateOpen] = useState(false)
  const [createdToken, setCreatedToken] = useState(null) // plaintext shown once after creation
  const [newTheme, setNewTheme] = useState('mist') // theme attached to the new token
  const [toast, setToast] = useState('')

  const [hoverStat, setHoverStat] = useState(null) // hovered day index on the stats chart
  const [tokenTab, setTokenTab] = useState('active') // 'active' | 'expired' | 'revoked'

  const closeCreate = useCallback(() => {
    setCreateOpen(false)
    setCreatedToken(null)
    setLabel('')
    setExpMode('days')
    setExpDays(7)
    setExpDatetime('')
    setNewTheme('mist')
  }, [])

  useEffect(() => {
    if (!createOpen) return undefined
    const closeOnEscape = (event) => { if (event.key === 'Escape') closeCreate() }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [createOpen, closeCreate])

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2000) }
  const refresh = () => setTokens(getAccessTokens())

  const startRename = (t) => { setEditingLabel(t.id); setEditLabelValue(t.label) }
  const saveRename = () => {
    if (editingLabel && editLabelValue.trim()) {
      renameAccessToken(editingLabel, editLabelValue.trim())
      refresh()
      flash('라벨 변경 완료')
    }
    setEditingLabel(null)
  }

  const copyToken = (token) => {
    navigator.clipboard.writeText(token).then(() => flash('토큰이 클립보드에 복사되었습니다'))
  }

  const handleCreate = async () => {
    if (!label.trim()) return
    let expiresAt
    if (expMode === 'datetime' && expDatetime) {
      // datetime-local gives local time string, parse as KST
      expiresAt = new Date(expDatetime).getTime()
      if (isNaN(expiresAt) || expiresAt <= Date.now()) {
        flash('만료 시점이 현재보다 미래여야 합니다')
        return
      }
    } else {
      expiresAt = Date.now() + expDays * 24 * 60 * 60 * 1000
    }
    const token = await createAccessToken(label.trim(), expiresAt, newTheme)
    refresh()
    setCreatedToken(token) // modal switches to the copy-once result step
  }

  const handleRevoke = (id) => { if (confirm('이 토큰을 폐기하시겠습니까?\n비밀값은 즉시 삭제되고, 구분 정보만 폐기 탭에 보관됩니다.')) { revokeAccessToken(id); refresh() } }
  const handleDelete = (id) => { if (confirm('폐기 기록을 완전히 삭제하시겠습니까? 되돌릴 수 없습니다.')) { deleteAccessToken(id); refresh() } }
  const handleExpire = (id) => { if (confirm('이 토큰을 즉시 만료하시겠습니까?')) { forceExpireToken(id); refresh() } }
  const downloadTokenQR = async (label, value) => {
    // QR encodes the one-click access link; needs the plaintext value,
    // so it's available at creation time or for legacy plaintext tokens only
    const QRCode = (await import('qrcode')).default
    const dataUrl = await QRCode.toDataURL(`${SITE.url}/#token=${value}`, { width: 512, margin: 2 })
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `qr-${(label || 'token').replace(/[^\w가-힣-]/g, '_')}.png`
    a.click()
    flash('QR 코드 다운로드 완료')
  }

  const handleReissue = async (t) => {
    if (!confirm(`'${t.label}' 토큰을 재발급하시겠습니까?\n기존 토큰은 즉시 사용할 수 없게 되고, 새 토큰을 다시 전달해야 합니다.`)) return
    // Keep the remaining validity; if already expired, give a fresh 7 days
    const expiresAt = t.expiresAt > Date.now() ? t.expiresAt : Date.now() + 7 * 24 * 60 * 60 * 1000
    const token = await createAccessToken(t.label, expiresAt, t.theme || 'default')
    revokeAccessToken(t.id)
    refresh()
    setLabel(t.label)
    setCreatedToken(token) // reuse the copy-once result popup
    setCreateOpen(true)
  }

  const handleExtend = (id, days) => {
    const d = parseInt(days)
    if (!d || d < 1) { flash('연장 일수를 확인하세요'); return }
    extendAccessToken(id, d)
    setExtendingToken(null)
    refresh()
    flash(`${d}일 연장 완료`)
  }

  return (
    <div>
      <SectionHeader title="접속 토큰" description="방문자에게 발급할 접속 토큰을 관리합니다" />

      {/* Access Stats Chart */}
      {(() => {
        const allLogs = getAccessLog()
        if (allLogs.length === 0) return null

        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']
        const DAY = 24 * 60 * 60 * 1000

        // Token labels sorted by total count → stable color mapping
        const byToken = {}
        allLogs.forEach(log => {
          const lbl = log.tokenLabel || 'unknown'
          byToken[lbl] = (byToken[lbl] || 0) + 1
        })
        const tokenEntries = Object.entries(byToken).sort((a, b) => b[1] - a[1])
        const colorOf = {}
        tokenEntries.forEach(([lbl], i) => { colorOf[lbl] = colors[i % colors.length] })

        // Last 14 consecutive days (missing days shown as 0)
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
        const days = Array.from({ length: 14 }, (_, i) => {
          const start = todayStart.getTime() - (13 - i) * DAY
          return { start, end: start + DAY, perToken: {}, total: 0 }
        })
        allLogs.forEach(log => {
          const day = days.find(d => log.accessedAt >= d.start && log.accessedAt < d.end)
          if (!day) return
          const lbl = log.tokenLabel || 'unknown'
          day.perToken[lbl] = (day.perToken[lbl] || 0) + 1
          day.total += 1
        })
        const maxCount = Math.max(...days.map(d => d.total), 1)

        const todayCount = days[13].total
        const week = days.slice(7).reduce((s, d) => s + d.total, 0)
        const prevWeek = days.slice(0, 7).reduce((s, d) => s + d.total, 0)
        const lastAccess = Math.max(...allLogs.map(l => l.accessedAt))

        return (
          <div className="bg-gray-900 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-accent">접속 통계 <span className="text-gray-600 font-normal">최근 14일</span></h3>
              <span className="text-[11px] text-gray-500">마지막 접속 {formatDate(lastAccess)}</span>
            </div>

            {/* Summary numbers */}
            <div className="grid grid-cols-3 gap-2 mb-5">
              <div className="bg-gray-800/60 rounded-lg px-3 py-2">
                <p className="text-[10px] text-gray-500">오늘</p>
                <p className="text-lg font-bold text-white">{todayCount}<span className="text-[10px] text-gray-500 font-normal ml-1">회</span></p>
              </div>
              <div className="bg-gray-800/60 rounded-lg px-3 py-2">
                <p className="text-[10px] text-gray-500">최근 7일</p>
                <p className="text-lg font-bold text-white">
                  {week}<span className="text-[10px] text-gray-500 font-normal ml-1">회</span>
                  {prevWeek > 0 && (
                    <span className={`text-[10px] ml-1.5 font-medium ${week >= prevWeek ? 'text-green-400' : 'text-red-400'}`}>
                      {week >= prevWeek ? '▲' : '▼'} {Math.abs(week - prevWeek)}
                    </span>
                  )}
                </p>
              </div>
              <div className="bg-gray-800/60 rounded-lg px-3 py-2">
                <p className="text-[10px] text-gray-500">전체</p>
                <p className="text-lg font-bold text-white">{allLogs.length}<span className="text-[10px] text-gray-500 font-normal ml-1">회</span></p>
              </div>
            </div>

            {/* Stacked daily bars */}
            <div className="relative">
              <div className="flex items-end gap-1 h-24 mb-1" onMouseLeave={() => setHoverStat(null)}>
                {days.map((d, i) => (
                  <div key={i} onMouseEnter={() => setHoverStat(i)} className={`flex-1 flex flex-col items-center justify-end gap-1 h-full rounded ${hoverStat === i ? 'bg-gray-800/50' : ''}`}>
                    <span className={`text-[9px] ${d.total > 0 ? 'text-gray-400' : 'text-gray-700'}`}>{d.total > 0 ? d.total : ''}</span>
                    <div className="w-full flex flex-col-reverse rounded-t overflow-hidden" style={{ height: `${(d.total / maxCount) * 100}%`, minHeight: d.total > 0 ? '3px' : '1px', backgroundColor: d.total === 0 ? '#1f2937' : undefined }}>
                      {Object.entries(d.perToken).map(([lbl, cnt]) => (
                        <div key={lbl} style={{ height: `${(cnt / d.total) * 100}%`, backgroundColor: colorOf[lbl] }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              {hoverStat !== null && (() => {
                const d = days[hoverStat]
                const dt = new Date(d.start)
                return (
                  <div
                    className="absolute bottom-full mb-1.5 -translate-x-1/2 z-20 pointer-events-none bg-gray-800 border border-gray-600/60 rounded-lg px-3 py-2 shadow-xl shadow-black/40 whitespace-nowrap"
                    style={{ left: `${Math.min(88, Math.max(12, ((hoverStat + 0.5) / days.length) * 100))}%` }}
                  >
                    <p className="text-[10px] text-gray-400 mb-1">{dt.getMonth() + 1}/{dt.getDate()} · 총 {d.total}회</p>
                    {d.total === 0 ? (
                      <p className="text-[11px] text-gray-500">접속 없음</p>
                    ) : (
                      Object.entries(d.perToken).map(([lbl, cnt]) => (
                        <p key={lbl} className="text-[11px] text-gray-300 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: colorOf[lbl] }} />
                          {lbl} <b className="text-white ml-auto pl-2">{cnt}</b>
                        </p>
                      ))
                    )}
                  </div>
                )
              })()}
            </div>
            <div className="flex gap-1 mb-4">
              {days.map((d, i) => {
                const dt = new Date(d.start)
                const isToday = i === 13
                return (
                  <div key={i} className={`flex-1 text-center text-[8px] truncate ${isToday ? 'text-accent font-bold' : 'text-gray-600'}`}>
                    {isToday ? '오늘' : `${dt.getMonth() + 1}/${dt.getDate()}`}
                  </div>
                )
              })}
            </div>

            {/* Token breakdown legend */}
            <div className="flex flex-wrap gap-3 pt-3 border-t border-gray-800">
              {tokenEntries.map(([label, count]) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colorOf[label] }} />
                  <span className="text-[11px] text-gray-400">{label}</span>
                  <span className="text-[11px] font-mono text-white">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          {[
            { key: 'active', label: '활성', count: filterTokens(tokens, 'active', tokenNow).length },
            { key: 'expired', label: '만료', count: filterTokens(tokens, 'expired', tokenNow).length },
            { key: 'revoked', label: '폐기', count: tokens.filter((t) => t.revoked).length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTokenTab(tab.key)}
              className={`px-3 py-1.5 text-xs rounded-lg cursor-pointer transition-colors ${tokenTab === tab.key ? 'bg-accent/15 text-accent font-medium' : 'bg-gray-800/60 text-gray-400 hover:text-white hover:bg-gray-800'}`}
            >
              {tab.label} <span className="opacity-60">{tab.count}</span>
            </button>
          ))}
        </div>
        <button onClick={() => setCreateOpen(true)} className="px-4 py-2 bg-accent hover:bg-accent-light text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer shadow-md shadow-accent/20">
          + 새 토큰 생성
        </button>
      </div>

      {/* Create Token Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div aria-hidden="true" className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeCreate} />
          <div role="dialog" aria-modal="true" aria-labelledby="create-token-title" className="relative bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl shadow-black/60">
            {!createdToken ? (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h3 id="create-token-title" className="text-base font-bold text-white">새 토큰 생성</h3>
                  <button aria-label="토큰 생성 창 닫기" onClick={closeCreate} className="admin-dialog-close">
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path strokeLinecap="round" d="M6 6l12 12M18 6 6 18" /></svg>
                  </button>
                </div>
                <div className="space-y-4">
                  <Field label="라벨 (예: 홍길동)" value={label} onChange={setLabel} />
                  <div>
                    <label className="block text-[11px] font-medium text-gray-400 mb-2">만료 설정</label>
                    <div className="flex gap-2 mb-2">
                      <button
                        onClick={() => setExpMode('days')}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${expMode === 'days' ? 'bg-accent text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                      >
                        일 수
                      </button>
                      <button
                        onClick={() => setExpMode('datetime')}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${expMode === 'datetime' ? 'bg-accent text-white' : 'bg-gray-800 text-gray-400 hover:text-white'}`}
                      >
                        날짜·시간 지정
                      </button>
                    </div>
                    {expMode === 'days' ? (
                      <div className="flex items-end gap-2">
                        <Field label="" value={expDays} type="number" onChange={(v) => setExpDays(parseInt(v) || 1)} className="w-24" />
                        <span className="text-xs text-gray-500 pb-2.5">일 후 만료</span>
                      </div>
                    ) : (
                      <input
                        type="datetime-local"
                        value={expDatetime}
                        onChange={(e) => setExpDatetime(e.target.value)}
                        className="w-full bg-gray-800/60 border border-gray-700/70 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-accent transition-colors"
                      />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-[11px] font-medium text-gray-400">테마 — 이 토큰으로 접속한 방문자에게 적용됩니다</label>
                      {onPreviewTheme && (
                        <button
                          onClick={() => onPreviewTheme('site', newTheme)}
                          className="text-[11px] text-gray-400 hover:text-accent border border-gray-700 hover:border-accent/50 rounded-md px-2 py-0.5 cursor-pointer transition-colors"
                        >미리보기</button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {THEMES.map((th) => (
                        <button
                          key={th.id}
                          onClick={() => setNewTheme(th.id)}
                          title={th.desc}
                          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg border transition-colors cursor-pointer ${
                            newTheme === th.id ? 'border-accent bg-accent/15 text-accent font-medium' : 'border-gray-700 bg-gray-800 text-gray-400 hover:text-white'
                          }`}
                        >
                          <span className="inline-flex rounded overflow-hidden w-6 h-3.5 border border-gray-700/60">
                            {th.swatch.map((c) => <i key={c} className="flex-1" style={{ background: c }} />)}
                          </span>
                          {th.name}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={handleCreate} disabled={!label.trim()} className="flex-1 px-4 py-2.5 bg-accent hover:bg-accent-light disabled:opacity-40 disabled:cursor-default text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer">생성</button>
                    <button onClick={closeCreate} className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors cursor-pointer">취소</button>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-6 h-6 rounded-full bg-green-500/15 text-green-400 flex items-center justify-center text-xs">✓</span>
                  <h3 className="text-base font-bold text-white">토큰 생성 완료</h3>
                </div>
                <p className="text-xs text-gray-500 mb-2">{label} 님에게 전달할 토큰:</p>
                <div className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 font-mono text-xs text-white break-all select-all mb-3">
                  {createdToken}
                </div>
                <div className="bg-amber-500/10 border border-amber-500/25 rounded-lg px-3 py-2.5 text-[11px] text-amber-200/90 leading-relaxed mb-4">
                  <b>주의.</b> 토큰은 해시로 저장되므로 <b>이 화면을 닫으면 다시 확인할 수 없습니다.</b> 지금 복사해서 전달하세요.
                </div>
                <div className="flex gap-2">
                  <button onClick={() => copyToken(createdToken)} className="flex-1 px-4 py-2.5 bg-accent hover:bg-accent-light text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer">토큰 복사</button>
                  <button
                    onClick={() => { navigator.clipboard.writeText(`${SITE.url}/#token=${createdToken}`).then(() => flash('접속 링크가 복사되었습니다')) }}
                    title="클릭 한 번으로 접속되는 링크"
                    className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-accent text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                  >링크 복사</button>
                  <button
                    onClick={() => downloadTokenQR(label, createdToken)}
                    title="접속 QR 코드 PNG 다운로드"
                    className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-semibold rounded-lg transition-colors cursor-pointer"
                  >QR</button>
                  <button onClick={closeCreate} className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors cursor-pointer">완료</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {filterTokens(tokens, tokenTab, tokenNow).length === 0 && (
          <p className="text-gray-600 text-sm py-4 text-center">
            {tokenTab === 'active' ? '활성 토큰이 없습니다' : tokenTab === 'expired' ? '만료된 토큰이 없습니다' : '폐기 기록이 없습니다'}
          </p>
        )}
        {filterTokens(tokens, tokenTab, tokenNow).map((t) => {
          const status = getTokenStatus(t, tokenNow)
          const isActive = isActiveToken(t, tokenNow)
          const logs = getAccessLogForToken(t.id)
          const isExpanded = expandedToken === t.id

          return (
            <div key={t.id} className="bg-gray-900 rounded-xl p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {editingLabel === t.id ? (
                      <input
                        value={editLabelValue}
                        onChange={(e) => setEditLabelValue(e.target.value)}
                        onBlur={saveRename}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') setEditingLabel(null) }}
                        autoFocus
                        className="font-medium text-sm bg-gray-800 border border-accent rounded px-1.5 py-0.5 text-white outline-none w-32"
                      />
                    ) : (
                      <button className="font-medium text-sm cursor-pointer hover:text-accent transition-colors text-left" onClick={() => startRename(t)} title="클릭하여 이름 변경">{t.label}</button>
                    )}
                    <span className={`text-xs ${status.cls}`}>{status.text}</span>
                  </div>
                  <p className="text-xs text-gray-500 font-mono mt-1 truncate">
                    {t.token || t.tokenHint}
                    {!t.token && t.tokenHint && (
                      <span className="text-gray-600 font-sans ml-1.5">
                        {t.revoked ? '비밀값 삭제됨' : '해시 보관 — 전체 값은 생성 시에만 복사 가능'}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    생성: {formatDate(t.createdAt)} · 만료: {formatDate(t.expiresAt)}
                    {t.theme && t.theme !== 'default' && <span className="text-accent/70 ml-1">· 테마 {getTheme(t.theme).name}</span>}
                    {t.revoked && t.revokedAt && <span className="text-gray-500 ml-1">· 폐기: {formatDate(t.revokedAt)}</span>}
                    {t.extensions?.length > 0 && <span className="text-accent/70 ml-1">· 연장 {t.extensions.length}회</span>}
                    {logs.length > 0 && <span className="ml-1">· 최근 접속 {formatDate(logs[logs.length - 1].accessedAt)}</span>}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  {!t.revoked && (
                    <select
                      value={t.theme || 'default'}
                      onChange={(e) => { setAccessTokenTheme(t.id, e.target.value); refresh(); flash('테마 변경 완료') }}
                      title="이 토큰의 방문자 테마 (다음 접속부터 적용)"
                      className="px-1.5 py-1 text-xs bg-gray-800 text-gray-300 border border-gray-700 rounded-lg cursor-pointer focus:outline-none focus:border-accent"
                    >
                      {THEMES.map((th) => <option key={th.id} value={th.id}>{th.name}</option>)}
                    </select>
                  )}
                  {t.token && (
                    <button onClick={() => copyToken(t.token)} className="px-2 py-1 text-xs text-accent hover:text-accent-light border border-gray-700 rounded-lg cursor-pointer">복사</button>
                  )}
                  {t.token && (
                    <button onClick={() => downloadTokenQR(t.label, t.token)} title="접속 QR 코드 PNG 다운로드" className="px-2 py-1 text-xs text-gray-400 hover:text-white border border-gray-700 rounded-lg cursor-pointer">QR</button>
                  )}
                  {(logs.length > 0 || t.extensions?.length > 0) && (
                    <button onClick={() => setExpandedToken(isExpanded ? null : t.id)} className="px-2 py-1 text-xs text-gray-400 hover:text-white border border-gray-700 rounded-lg cursor-pointer">
                      로그 {logs.length}
                    </button>
                  )}
                  {!t.revoked && (
                    <button onClick={() => handleReissue(t)} title="새 값으로 재발급 (기존 값 무효화)" className="px-2 py-1 text-xs text-accent hover:text-accent-light border border-gray-700 rounded-lg cursor-pointer">재발급</button>
                  )}
                  {!t.revoked && (
                    <button onClick={() => { setExtendingToken(extendingToken === t.id ? null : t.id); setExtendDays(7) }} className={`px-2 py-1 text-xs border rounded-lg cursor-pointer ${extendingToken === t.id ? 'text-white bg-accent border-accent' : 'text-green-400 hover:text-green-300 border-gray-700'}`}>연장</button>
                  )}
                  {isActive && (
                    <button onClick={() => handleExpire(t.id)} className="px-2 py-1 text-xs text-yellow-400 hover:text-yellow-300 border border-gray-700 rounded-lg cursor-pointer">만료</button>
                  )}
                  {!t.revoked && (
                    <button onClick={() => handleRevoke(t.id)} className="px-2 py-1 text-xs text-red-400 hover:text-red-300 border border-gray-700 rounded-lg cursor-pointer">폐기</button>
                  )}
                  {t.revoked && (
                    <button onClick={() => handleDelete(t.id)} title="폐기 기록 완전 삭제" className="px-2 py-1 text-xs text-red-400 hover:text-red-300 border border-gray-700 rounded-lg cursor-pointer">삭제</button>
                  )}
                </div>
              </div>

              {extendingToken === t.id && (
                <div className="mt-3 pt-3 border-t border-gray-800 flex flex-wrap items-center gap-2">
                  <span className="text-xs text-gray-500">연장:</span>
                  {[7, 14, 30].map((d) => (
                    <button key={d} onClick={() => handleExtend(t.id, d)} className="px-2.5 py-1 text-xs text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer">+{d}일</button>
                  ))}
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      value={extendDays}
                      onChange={(e) => setExtendDays(e.target.value)}
                      className="w-16 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-accent"
                    />
                    <span className="text-xs text-gray-500">일</span>
                    <button onClick={() => handleExtend(t.id, extendDays)} className="px-2.5 py-1 text-xs bg-accent hover:bg-accent-light text-white rounded-lg cursor-pointer">적용</button>
                  </div>
                  <span className="text-[10px] text-gray-600 ml-auto">만료 전이면 만료일 기준, 만료 후면 오늘 기준으로 연장됩니다</span>
                </div>
              )}

              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-gray-800 space-y-3">
                  {t.extensions?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">연장 이력</p>
                      <div className="space-y-1">
                        {t.extensions.map((ext, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="text-accent/70">+{ext.addDays}일</span>
                            <span>{formatDate(ext.at)} 실행</span>
                            <span className="text-gray-600">{formatDate(ext.from)} → {formatDate(ext.to)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {logs.length > 0 && (
                    <div>
                      <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1">접속 로그</p>
                      <div className="space-y-1">
                        {logs.map((log, i) => {
                          const live = log.lastSeenAt && Date.now() - log.lastSeenAt < 6 * 60 * 1000
                          const dur = log.lastSeenAt ? Math.round((log.lastSeenAt - log.accessedAt) / 60000) : null
                          return (
                            <div key={i} className="flex items-center gap-3 text-xs text-gray-500">
                              <span>{formatDate(log.accessedAt)}</span>
                              <span>{parseBrowser(log.userAgent)} · {parseOS(log.userAgent)}</span>
                              {live ? <span className="text-green-400 text-[10px]">● 열람 중</span> : dur >= 1 ? <span className="text-gray-600 text-[10px]">체류 {dur}분</span> : null}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
      <Toast message={toast} />
    </div>
  )
}

/* ─── Account Section ─── */

function AccountSection({ onLogout }) {
  const [ownerUser, setOwnerUser] = useState(null)
  useEffect(() => watchOwnerAuth(setOwnerUser), [])

  return (
    <div>
      <SectionHeader title="관리자 계정" description="관리자 인증은 구글 계정으로 이루어집니다" />

      <div className="max-w-md space-y-4">
        <div className="bg-gray-900 rounded-xl p-5 space-y-4">
          {ownerUser ? (
            <div className="flex items-center gap-3">
              {ownerUser.photoURL ? (
                <img src={ownerUser.photoURL} alt="" referrerPolicy="no-referrer" className="w-10 h-10 rounded-full" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-accent/20 text-accent flex items-center justify-center font-bold">
                  {(ownerUser.email || '?')[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm text-white truncate">{ownerUser.displayName || '관리자'}</p>
                <p className="text-xs text-gray-500 truncate">{ownerUser.email}</p>
              </div>
              <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-green-500/15 text-green-400 shrink-0">인증됨</span>
            </div>
          ) : (
            <p className="text-xs text-gray-500">로그인 정보를 불러오는 중...</p>
          )}
          <div className="border-t border-gray-800 pt-4 text-xs text-gray-500 leading-relaxed">
            어드민 접근과 콘텐츠 저장 권한은 이 구글 계정에만 부여됩니다. Firestore 보안 규칙이 서버에서 동일한 계정을 검증합니다.
          </div>
          <button
            onClick={onLogout}
            className="w-full px-4 py-2.5 bg-gray-800 hover:bg-red-500/10 text-gray-300 hover:text-red-400 text-sm rounded-lg transition-colors cursor-pointer"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  )
}

/* ─── Projects Section ─── */

function ProjectsSection({ mode = 'standard' }) {
  const [data, setData] = useState(loadProjects)
  const taxonomy = loadTaxonomyConfig()
  const resume = loadResumeConfig()
  const [toast, setToast] = useState('')
  const [expanded, setExpanded] = useState({})
  const [designTabs, setDesignTabs] = useState({})

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2000) }
  const toggleProject = (gi, pi) => {
    const key = `${gi}-${pi}`
    setExpanded(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const swap = (arr, i, j) => { const a = [...arr]; [a[i], a[j]] = [a[j], a[i]]; return a }
  const expandAll = () => {
    const all = {}
    data.groups?.forEach((g, gi) => g.projects?.forEach((_, pi) => { all[`${gi}-${pi}`] = true }))
    setExpanded(all)
  }
  const jumpToGroup = (gi) => document.getElementById(`proj-group-${gi}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const moveGroup = (gi, dir) => { const j = gi + dir; if (j < 0 || j >= data.groups.length) return; setData({ ...data, groups: swap(data.groups, gi, j) }) }
  const moveProject = (gi, pi, dir) => { const group = data.groups[gi]; const j = pi + dir; if (j < 0 || j >= group.projects.length) return; const g = [...data.groups]; g[gi] = { ...group, projects: swap(group.projects, pi, j) }; setData({ ...data, groups: g }) }
  const designProjects = data.designProjects || []
  const updateDesignProject = (index, project) => {
    const items = [...designProjects]
    items[index] = project
    setData({ ...data, designProjects: items })
  }
  const moveDesignProject = (index, dir) => {
    const next = index + dir
    if (next < 0 || next >= designProjects.length) return
    setData({ ...data, designProjects: swap(designProjects, index, next) })
  }
  const addDesignProject = () => {
    const id = `design-${Date.now()}`
    setData({
      ...data,
      designProjects: [...designProjects, {
        id,
        slug: id,
        title: '',
        category: '',
        year: '',
        summary: '',
        role: '',
        client: '',
        duration: '',
        featured: false,
        published: false,
        coverImage: '',
        coverPosition: '50% 50%',
        coverAlt: '',
        brief: '',
        problem: '',
        userFlow: '',
        solution: '',
        validation: '',
        designSystem: '',
        gallery: [],
      }],
    })
  }

  const handleSave = () => {
    const publishedDesign = (data.designProjects || []).filter((project) => project.published)
    const slugs = publishedDesign.map((project) => project.slug?.trim()).filter(Boolean)
    if (publishedDesign.some((project) => !project.title?.trim() || !project.slug?.trim())) {
      flash('공개 프로젝트에는 제목과 URL slug가 필요합니다')
      return
    }
    if (new Set(slugs).size !== slugs.length) {
      flash('디자인 프로젝트의 URL slug는 중복될 수 없습니다')
      return
    }
    if (publishedDesign.some((project) => project.coverImage && !project.coverAlt?.trim())) {
      flash('대표 이미지가 있는 공개 프로젝트에는 대체 텍스트가 필요합니다')
      return
    }
    saveProjects(data)
    flash('프로젝트 저장 완료')
  }
  const handleReset = () => { if (confirm('초기화하시겠습니까?')) { resetProjects(); setData(loadProjects()); flash('초기화 완료') } }

  const handleImport = async (file) => {
    const imported = await importJson(file)
    const merged = mode === 'design'
      ? { ...data, designArchive: imported.designArchive || {}, designProjects: imported.designProjects || [] }
      : { ...data, groups: imported.groups || [] }
    setData(validateProjectsImport(merged))
    flash('가져오기 완료 — 저장 버튼을 눌러주세요')
  }

  const bulkData = mode === 'design'
    ? { designArchive: data.designArchive || {}, designProjects: data.designProjects || [] }
    : { groups: data.groups || [] }

  const applyBulkData = (value) => {
    const merged = mode === 'design'
      ? { ...data, designArchive: value.designArchive || {}, designProjects: value.designProjects || [] }
      : { ...data, groups: value.groups || [] }
    setData(validateProjectsImport(merged))
    flash('JSON 적용 완료 — 저장 버튼을 눌러주세요')
  }

  return (
    <div>
      <SectionHeader title={mode === 'design' ? '디자인 아카이브' : '프로젝트'} description={mode === 'design' ? '이미지 중심 디자인 케이스 스터디와 공개 상태를 관리합니다' : 'PM 프로젝트의 그룹과 상세 내용을 관리합니다'} />
      <ActionBar>
        <SaveButton onClick={handleSave} />
        <ResetButton onClick={handleReset} />
        <JsonBulkEditor value={bulkData} onApply={applyBulkData} />
        <div className="flex-1" />
        <ImportExportBar
          onImport={handleImport}
          onExport={() => downloadJson(bulkData, mode === 'design' ? 'design-projects.json' : 'projects.json')}
          onSample={() => downloadJson(mode === 'design' ? { designArchive: defaultProjects.designArchive || {}, designProjects: defaultProjects.designProjects || [] } : { groups: defaultProjects.groups || [] }, mode === 'design' ? 'design-projects-sample.json' : 'projects-sample.json')}
        />
      </ActionBar>
      {mode === 'standard' && data.groups?.length > 1 && (
        <div className="flex flex-wrap items-center gap-1.5 mb-4">
          {data.groups.map((g, gi) => (
            <button key={gi} onClick={() => jumpToGroup(gi)} className="px-2 py-1 text-[11px] bg-gray-800/60 hover:bg-gray-800 text-gray-400 hover:text-white rounded-md cursor-pointer transition-colors">
              {g.title || `그룹 ${gi + 1}`}
            </button>
          ))}
          <span className="flex-1" />
          <button onClick={expandAll} className="text-[11px] text-gray-500 hover:text-white cursor-pointer">모두 펼치기</button>
          <button onClick={() => setExpanded({})} className="text-[11px] text-gray-500 hover:text-white cursor-pointer">모두 접기</button>
        </div>
      )}
      {mode === 'standard' && <div className="space-y-6">
        {data.groups?.map((group, gi) => (
          <div key={gi} id={`proj-group-${gi}`} className="admin-editor-sheet bg-gray-900 rounded-xl p-5 md:p-6 space-y-4 scroll-mt-24">
            <div className="flex items-center gap-2">
              <span className="text-accent font-mono text-xs">Group {gi + 1}</span>
              <span className="text-white font-semibold text-sm flex-1 truncate">{group.title}</span>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => moveGroup(gi, -1)} disabled={gi === 0} className="text-xs text-gray-400 hover:text-white disabled:text-gray-700 cursor-pointer disabled:cursor-default px-1">↑</button>
                <button onClick={() => moveGroup(gi, 1)} disabled={gi === data.groups.length - 1} className="text-xs text-gray-400 hover:text-white disabled:text-gray-700 cursor-pointer disabled:cursor-default px-1">↓</button>
              </div>
              <button onClick={() => setData({ ...data, groups: data.groups.filter((_, i) => i !== gi) })} className="text-xs text-red-400 hover:text-red-300 cursor-pointer">삭제</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="그룹 제목" value={group.title} onChange={(v) => { const g = [...data.groups]; g[gi] = { ...group, title: v }; setData({ ...data, groups: g }) }} />
              <Field label="그룹 부제" value={group.subtitle} onChange={(v) => { const g = [...data.groups]; g[gi] = { ...group, subtitle: v }; setData({ ...data, groups: g }) }} />
              <SelectField
                label="연결할 업무 경험"
                value={typeof group.linkToExperience === 'string' ? group.linkToExperience : group.linkToExperience === true ? `exp-${gi}` : ''}
                options={[{ value: '', label: '연결 안 함' }, ...(resume.work || []).filter((item) => item.company).map((item, index) => ({ value: `exp-${index}`, label: item.company }))]}
                onChange={(v) => { const g = [...data.groups]; g[gi] = { ...group, linkToExperience: v }; setData({ ...data, groups: g }) }}
              />
            </div>

            <div className="space-y-3">
              <p className="text-xs text-gray-500 font-medium">프로젝트 {group.projects?.length || 0}개</p>
              {group.projects?.map((p, pi) => {
                const isOpen = expanded[`${gi}-${pi}`]
                return (
                  <div key={pi} className="admin-project-row bg-gray-800/50 rounded-lg border border-gray-700/50 overflow-hidden">
                    {/* Header — always visible */}
                    <div
                      className="admin-project-row__header flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-800/80 transition-colors"
                      onClick={() => toggleProject(gi, pi)}
                    >
                      <svg className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${isOpen ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                      </svg>
                      {p.badge && <span className="text-[10px] font-mono text-accent bg-accent/10 px-1.5 py-0.5 rounded shrink-0">{p.badge}</span>}
                      <span className="text-sm font-medium text-white truncate flex-1">{p.title || '새 프로젝트'}</span>
                      {p.id && (
                        <button
                          onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(p.id); const btn = e.currentTarget; btn.textContent = '✓'; setTimeout(() => { btn.textContent = p.id }, 1000) }}
                          title="ID 복사"
                          className="text-[10px] font-mono text-gray-600 hover:text-accent bg-gray-800 px-1.5 py-0.5 rounded cursor-pointer shrink-0 transition-colors"
                        >{p.id}</button>
                      )}
                      <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => moveProject(gi, pi, -1)} disabled={pi === 0} className="text-xs text-gray-400 hover:text-white disabled:text-gray-700 cursor-pointer disabled:cursor-default px-1">↑</button>
                        <button onClick={() => moveProject(gi, pi, 1)} disabled={pi === group.projects.length - 1} className="text-xs text-gray-400 hover:text-white disabled:text-gray-700 cursor-pointer disabled:cursor-default px-1">↓</button>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); const g = [...data.groups]; g[gi] = { ...group, projects: group.projects.filter((_, i) => i !== pi) }; setData({ ...data, groups: g }) }} className="text-xs text-red-400 hover:text-red-300 cursor-pointer shrink-0">✕</button>
                    </div>

                    {/* Body — collapsible */}
                    {isOpen && (
                      <div className="admin-project-row__body px-4 pb-4 pt-3 space-y-5">
                        {/* 기본 정보 */}
                        <div>
                          <p className="text-xs text-gray-500 font-medium mb-2">기본 정보</p>
                          <Field label="제목" value={p.title || ''} onChange={(v) => { const g = [...data.groups]; g[gi].projects[pi] = { ...p, title: v }; setData({ ...data, groups: g }) }} className="mb-2" />
                          <Field label="부제" value={p.subtitle || ''} onChange={(v) => { const g = [...data.groups]; g[gi].projects[pi] = { ...p, subtitle: v }; setData({ ...data, groups: g }) }} className="mb-2" />
                          <div className="grid grid-cols-2 gap-3">
                            <Field label="배지" value={p.badge || ''} onChange={(v) => { const g = [...data.groups]; g[gi].projects[pi] = { ...p, badge: v }; setData({ ...data, groups: g }) }} />
                            <SelectField label="배지 유형" value={p.badgeType || 'default'} options={taxonomyOptions(taxonomy, p.badgeType)} onChange={(v) => { const g = [...data.groups]; g[gi].projects[pi] = { ...p, badgeType: v }; setData({ ...data, groups: g }) }} />
                          </div>
                        </div>

                        {/* 스토리 */}
                        <div>
                          <p className="text-xs text-gray-500 font-medium mb-2">스토리</p>
                          <div className="space-y-3">
                            <Field label="Problem — 문제 정의" value={p.problem || ''} onChange={(v) => { const g = [...data.groups]; g[gi].projects[pi] = { ...p, problem: v }; setData({ ...data, groups: g }) }} rows={3} />
                            <Field label="Solution — 해결 방안" value={p.solution || ''} onChange={(v) => { const g = [...data.groups]; g[gi].projects[pi] = { ...p, solution: v }; setData({ ...data, groups: g }) }} rows={3} />
                            <Field label="Collab — 이해관계자 협업" value={p.collaboration || ''} onChange={(v) => { const g = [...data.groups]; g[gi].projects[pi] = { ...p, collaboration: v }; setData({ ...data, groups: g }) }} rows={3} />
                            <Field label="Result — 최종 결과" value={p.result || ''} onChange={(v) => { const g = [...data.groups]; g[gi].projects[pi] = { ...p, result: v }; setData({ ...data, groups: g }) }} rows={3} />
                          </div>
                        </div>

                        {/* 성과 강조 (하이라이트) */}
                        <div>
                          <p className="text-xs text-gray-500 font-medium mb-2">성과 강조 <span className="text-gray-600">(Result 탭 상단에 파란색으로 표시)</span></p>
                          <div className="space-y-2">
                            {(p.highlights || []).map((h, hi) => (
                              <div key={hi} className="flex items-center gap-2">
                                <input value={h.value || ''} onChange={(e) => { const g = [...data.groups]; const hl = [...(p.highlights || [])]; hl[hi] = { ...h, value: e.target.value }; g[gi].projects[pi] = { ...p, highlights: hl }; setData({ ...data, groups: g }) }} placeholder="값 (예: +681%)" className="w-28 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-accent font-bold focus:outline-none focus:border-accent" />
                                <input value={h.label || ''} onChange={(e) => { const g = [...data.groups]; const hl = [...(p.highlights || [])]; hl[hi] = { ...h, label: e.target.value }; g[gi].projects[pi] = { ...p, highlights: hl }; setData({ ...data, groups: g }) }} placeholder="라벨 (예: App 주문건수)" className="flex-1 bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-accent" />
                                <button onClick={() => { const g = [...data.groups]; const hl = (p.highlights || []).filter((_, i) => i !== hi); g[gi].projects[pi] = { ...p, highlights: hl }; setData({ ...data, groups: g }) }} className="text-xs text-red-400 hover:text-red-300 cursor-pointer px-1">✕</button>
                              </div>
                            ))}
                            <button onClick={() => { const g = [...data.groups]; g[gi].projects[pi] = { ...p, highlights: [...(p.highlights || []), { value: '', label: '' }] }; setData({ ...data, groups: g }) }} className="text-[10px] text-accent hover:text-accent-light cursor-pointer">+ 성과 강조 추가</button>
                          </div>
                        </div>

                        {/* 부가 정보 */}
                        <div>
                          <p className="text-xs text-gray-500 font-medium mb-2">부가 정보</p>
                          <Field label="인사이트" value={p.insight || ''} onChange={(v) => { const g = [...data.groups]; g[gi].projects[pi] = { ...p, insight: v }; setData({ ...data, groups: g }) }} rows={3} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <button onClick={() => { const g = [...data.groups]; g[gi] = { ...group, projects: [...(group.projects || []), { id: `p-${Date.now()}`, badge: '', badgeType: 'ai', title: '', subtitle: '', problem: '', solution: '', collaboration: '', result: '', insight: '', metrics: [], highlights: [], fullWidth: false }] }; setData({ ...data, groups: g }); setExpanded(prev => ({ ...prev, [`${gi}-${(group.projects || []).length}`]: true })) }} className="text-xs text-accent hover:text-accent-light cursor-pointer">+ 프로젝트 추가</button>
          </div>
        ))}
        <button onClick={() => setData({ ...data, groups: [...(data.groups || []), { title: '', subtitle: '', projects: [] }] })} className="px-4 py-2 border border-accent text-accent hover:bg-accent/10 text-sm rounded-lg transition-colors cursor-pointer">+ 그룹 추가</button>
      </div>}

      {mode === 'design' && <section id="design-project-admin" className="scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div>
            <h3 className="text-lg font-semibold text-white">디자인 프로젝트 아카이브</h3>
            <p className="text-xs text-gray-500 mt-1">메인에는 추천 작업이 표시되고, 공개 프로젝트 수가 기준 이상이면 전체 아카이브 링크가 나타납니다.</p>
          </div>
          <button onClick={addDesignProject} className="min-h-11 px-4 border border-accent text-accent hover:bg-accent/10 text-sm rounded-lg transition-colors cursor-pointer">+ 디자인 프로젝트 추가</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_180px] gap-3 bg-gray-900 rounded-xl p-5 mb-5">
          <Field label="섹션 제목" value={data.designArchive?.title || ''} onChange={(v) => setData({ ...data, designArchive: { ...(data.designArchive || {}), title: v } })} />
          <Field label="섹션 소개" value={data.designArchive?.intro || ''} onChange={(v) => setData({ ...data, designArchive: { ...(data.designArchive || {}), intro: v } })} />
          <Field label="아카이브 노출 기준" value={String(data.designArchive?.archiveThreshold ?? 4)} onChange={(v) => setData({ ...data, designArchive: { ...(data.designArchive || {}), archiveThreshold: Math.max(1, Number(v) || 1) } })} />
        </div>

        <div className="space-y-3">
          {designProjects.map((project, index) => {
            const key = `design-${index}`
            const isOpen = expanded[key]
            const activeTab = designTabs[key] || 'overview'
            const tabs = [
              { id: 'overview', label: '기본 정보' },
              { id: 'media', label: '대표 이미지' },
              { id: 'case', label: '케이스 스터디' },
              { id: 'gallery', label: `갤러리 ${(project.gallery || []).length}` },
            ]
            return (
              <article key={project.id || index} className="admin-design-editor bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <button type="button" className="admin-design-editor__header w-full min-h-16 flex items-center gap-3 px-4 text-left hover:bg-gray-800/60" onClick={() => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))}>
                  <span className="font-mono text-[10px] text-gray-500">{String(index + 1).padStart(2, '0')}</span>
                  <span className="flex-1 min-w-0"><strong className="block text-sm text-white truncate">{project.title || '새 디자인 프로젝트'}</strong><small className="text-[11px] text-gray-500">{project.category || '분류 없음'} · {project.year || '연도 없음'}</small></span>
                  <span className={`admin-publish-state ${project.published ? 'is-live' : ''}`}>{project.published ? '공개' : '비공개'}</span>
                  {project.featured && <span className="text-[10px] text-accent">추천</span>}
                  <span className={`text-gray-500 transition-transform ${isOpen ? 'rotate-90' : ''}`}>›</span>
                </button>

                {isOpen && (
                  <div className="admin-design-editor__body border-t border-gray-800">
                    <div className="admin-design-editor__toolbar">
                      <div className="admin-design-tabs" role="tablist" aria-label="디자인 프로젝트 편집 영역">
                        {tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => setDesignTabs((prev) => ({ ...prev, [key]: tab.id }))}>{tab.label}</button>)}
                      </div>
                      <div className="admin-design-visibility">
                        <label><input type="checkbox" checked={!!project.published} onChange={(e) => updateDesignProject(index, { ...project, published: e.target.checked })} /> 공개</label>
                        <label><input type="checkbox" checked={!!project.featured} onChange={(e) => updateDesignProject(index, { ...project, featured: e.target.checked })} /> 메인 추천</label>
                      </div>
                    </div>

                    <div className="admin-design-editor__panel">
                    {activeTab === 'overview' && <div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <Field label="제목" value={project.title || ''} onChange={(v) => updateDesignProject(index, { ...project, title: v })} />
                        <Field label="URL slug" value={project.slug || ''} onChange={(v) => updateDesignProject(index, { ...project, slug: v.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} />
                        <Field label="분류" value={project.category || ''} onChange={(v) => updateDesignProject(index, { ...project, category: v })} />
                        <YearField value={project.year || ''} onChange={(v) => updateDesignProject(index, { ...project, year: v })} />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                        <Field label="클라이언트" value={project.client || ''} onChange={(v) => updateDesignProject(index, { ...project, client: v })} />
                        <Field label="역할" value={project.role || ''} onChange={(v) => updateDesignProject(index, { ...project, role: v })} />
                        <Field label="기간" value={project.duration || ''} onChange={(v) => updateDesignProject(index, { ...project, duration: v })} />
                      </div>
                      <Field label="목록 요약" value={project.summary || ''} onChange={(v) => updateDesignProject(index, { ...project, summary: v })} rows={2} className="mt-3" />
                    </div>}

                    {activeTab === 'media' && <div>
                      <div className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-3">
                        <Field label="이미지 URL" value={project.coverImage || ''} onChange={(v) => updateDesignProject(index, { ...project, coverImage: v })} />
                        <Field label="크롭 위치" value={project.coverPosition || '50% 50%'} onChange={(v) => updateDesignProject(index, { ...project, coverPosition: v })} />
                      </div>
                      <SelectField label="이미지 표시 방식" value={project.coverMode || 'cover'} options={[{ value: 'cover', label: '영역 채우기' }, { value: 'sheet', label: '전체 시트 보기' }]} onChange={(v) => updateDesignProject(index, { ...project, coverMode: v })} className="mt-3 max-w-xs" />
                      <Field label="대체 텍스트" value={project.coverAlt || ''} onChange={(v) => updateDesignProject(index, { ...project, coverAlt: v })} className="mt-3" />
                    </div>}

                    {activeTab === 'case' && <div>
                      <div className="space-y-3">
                        <Field label="Brief" value={project.brief || ''} onChange={(v) => updateDesignProject(index, { ...project, brief: v })} rows={3} />
                        <Field label="01 Problem — 문제 정의" value={project.problem || ''} onChange={(v) => updateDesignProject(index, { ...project, problem: v })} rows={3} />
                        <Field label="02 IA / User Flow" value={project.userFlow || ''} onChange={(v) => updateDesignProject(index, { ...project, userFlow: v })} rows={3} />
                        <Field label="03 Design Solution & Rationale" value={project.solution || ''} onChange={(v) => updateDesignProject(index, { ...project, solution: v })} rows={3} />
                        <Field label="04 Validation — 정량·정성 검증" value={project.validation || ''} onChange={(v) => updateDesignProject(index, { ...project, validation: v })} rows={3} />
                        <Field label="05 Design System" value={project.designSystem || ''} onChange={(v) => updateDesignProject(index, { ...project, designSystem: v })} rows={3} />
                      </div>
                    </div>}

                    {activeTab === 'gallery' && <div>
                      <div className="flex items-center justify-between gap-3 mb-3"><p className="text-xs font-medium text-gray-400">갤러리</p><button type="button" onClick={() => updateDesignProject(index, { ...project, gallery: [...(project.gallery || []), { url: '', alt: '', caption: '' }] })} className="min-h-11 px-3 text-xs text-accent">+ 이미지 추가</button></div>
                      <div className="space-y-3">
                        {(project.gallery || []).map((item, galleryIndex) => (
                          <div key={galleryIndex} className="grid grid-cols-1 md:grid-cols-[44px_1fr_1fr_1fr_auto] gap-2 p-3 bg-gray-800/60 rounded-lg">
                            <div className="flex md:flex-col items-center justify-center gap-1">
                              <span className="font-mono text-[10px] text-gray-500">{String(galleryIndex + 1).padStart(2, '0')}</span>
                              <button type="button" aria-label={`이미지 ${galleryIndex + 1} 위로 이동`} disabled={galleryIndex === 0} onClick={() => updateDesignProject(index, { ...project, gallery: swap(project.gallery || [], galleryIndex, galleryIndex - 1) })} className="min-w-11 min-h-11 text-xs text-gray-400 disabled:text-gray-700">↑</button>
                              <button type="button" aria-label={`이미지 ${galleryIndex + 1} 아래로 이동`} disabled={galleryIndex === (project.gallery || []).length - 1} onClick={() => updateDesignProject(index, { ...project, gallery: swap(project.gallery || [], galleryIndex, galleryIndex + 1) })} className="min-w-11 min-h-11 text-xs text-gray-400 disabled:text-gray-700">↓</button>
                            </div>
                            <Field label="이미지 URL" value={item.url || ''} onChange={(v) => { const gallery = [...(project.gallery || [])]; gallery[galleryIndex] = { ...item, url: v }; updateDesignProject(index, { ...project, gallery }) }} />
                            <Field label="대체 텍스트" value={item.alt || ''} onChange={(v) => { const gallery = [...(project.gallery || [])]; gallery[galleryIndex] = { ...item, alt: v }; updateDesignProject(index, { ...project, gallery }) }} />
                            <Field label="캡션" value={item.caption || ''} onChange={(v) => { const gallery = [...(project.gallery || [])]; gallery[galleryIndex] = { ...item, caption: v }; updateDesignProject(index, { ...project, gallery }) }} />
                            <button type="button" onClick={() => updateDesignProject(index, { ...project, gallery: (project.gallery || []).filter((_, i) => i !== galleryIndex) })} className="min-h-11 self-end px-3 text-xs text-red-400">삭제</button>
                          </div>
                        ))}
                        {(project.gallery || []).length === 0 && <p className="py-10 text-center text-xs text-gray-500">등록된 이미지가 없습니다.</p>}
                      </div>
                    </div>}
                    </div>

                    <div className="admin-design-editor__footer flex flex-wrap justify-between gap-3 border-t border-gray-800">
                      <div className="flex gap-2"><button type="button" disabled={index === 0} onClick={() => moveDesignProject(index, -1)} className="min-h-11 px-3 text-xs text-gray-400 disabled:text-gray-700">위로</button><button type="button" disabled={index === designProjects.length - 1} onClick={() => moveDesignProject(index, 1)} className="min-h-11 px-3 text-xs text-gray-400 disabled:text-gray-700">아래로</button></div>
                      <button type="button" onClick={() => setData({ ...data, designProjects: designProjects.filter((_, i) => i !== index) })} className="min-h-11 px-3 text-xs text-red-400">프로젝트 삭제</button>
                    </div>
                  </div>
                )}
              </article>
            )
          })}
          {designProjects.length === 0 && <div className="py-16 text-center border border-dashed border-gray-800 rounded-xl text-sm text-gray-600">디자인 프로젝트가 없습니다. 새 프로젝트를 추가해 주세요.</div>}
        </div>
      </section>}
      {mode === 'standard' && <FloatingJumpNav items={(data.groups || []).map((g, gi) => ({ label: g.title || `그룹 ${gi + 1}`, onClick: () => jumpToGroup(gi) }))} />}
      <Toast message={toast} />
    </div>
  )
}

/* ─── About Section ─── */

function AboutSection() {
  const [config, setConfig] = useState(loadAboutConfig)
  const taxonomy = loadTaxonomyConfig()
  const [toast, setToast] = useState('')
  const [skillInput, setSkillInput] = useState('')
  const [newCat, setNewCat] = useState('default')

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2000) }
  const update = (key, value) => setConfig({ ...config, [key]: value })

  const handleSave = () => { saveAboutConfig(config); flash('소개 저장 완료') }
  const handleReset = () => { if (confirm('초기화하시겠습니까?')) { resetAboutConfig(); setConfig(loadAboutConfig()); flash('초기화 완료') } }

  const addSkill = () => {
    if (!skillInput.trim()) return
    const skills = [...(config.skills || []), { label: skillInput.trim(), category: newCat }]
    setConfig({ ...config, skills })
    setSkillInput('')
  }

  const updateSkill = (i, patch) => {
    const skills = (config.skills || []).map((s, idx) => {
      if (idx !== i) return s
      const cur = typeof s === 'string' ? { label: s, category: 'default' } : s
      return { ...cur, ...patch }
    })
    setConfig({ ...config, skills })
  }

  const removeSkill = (i) => {
    setConfig({ ...config, skills: config.skills.filter((_, idx) => idx !== i) })
  }

  return (
    <div>
      <SectionHeader title="소개" description="About 섹션의 내용을 설정합니다" />
      <ActionBar>
        <SaveButton onClick={handleSave} />
        <ResetButton onClick={handleReset} />
        <JsonBulkEditor value={config} onApply={(value) => { setConfig(value); flash('JSON 적용 완료 — 저장 버튼을 눌러주세요') }} />
        <div className="flex-1" /><ImportExportBar onImport={async (file) => { setConfig(await importJson(file)); flash('가져오기 완료 — 저장 버튼을 눌러주세요') }} onExport={() => downloadJson(config, 'about.json')} />
      </ActionBar>
      <div className="admin-about-editor">
        <section className="admin-form-section">
          <header><h3>소개 문구</h3><p>방문자에게 보이는 헤딩과 본문입니다.</p></header>
          <div className="space-y-4">
            <Field label="섹션 헤딩" value={config.heading || ''} onChange={(v) => update('heading', v)} rows={2} />
            <div>
              <label className="block text-xs text-gray-500 mb-1">바이오 (마크다운)</label>
              <AutoTextarea
                value={config.bio || ''}
                onChange={(v) => update('bio', v)}
                minRows={4}
                className="admin-control w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-white font-mono resize-y focus:outline-none focus:border-accent transition-colors"
              />
            </div>
          </div>
        </section>

        <section className="admin-form-section">
          <header><h3>스킬</h3><p>표시 이름과 분류를 개별적으로 관리합니다.</p></header>
          <div className="admin-skill-table" role="list">
            <div className="admin-skill-table__head" aria-hidden="true"><span>이름</span><span>분류</span><span>관리</span></div>
            {(config.skills || []).map((s, i) => {
              const sk = typeof s === 'string' ? { label: s, category: 'default' } : s
              return (
                <div className="admin-skill-row" role="listitem" key={i}>
                  <input aria-label={`${sk.label || `스킬 ${i + 1}`} 이름`} value={sk.label || ''} onChange={(e) => updateSkill(i, { label: e.target.value })} className="admin-control bg-gray-800 border border-gray-700 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-accent" />
                  <select aria-label={`${sk.label || `스킬 ${i + 1}`} 분류`} value={sk.category || 'default'} onChange={(e) => updateSkill(i, { category: e.target.value })} className="admin-control bg-gray-800 border border-gray-700 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-accent">
                    {taxonomyOptions(taxonomy, sk.category).map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                  </select>
                  <button type="button" onClick={() => removeSkill(i)} className="admin-row-delete">삭제</button>
                </div>
              )
            })}
            {(config.skills || []).length === 0 && <p className="admin-empty-row">등록된 스킬이 없습니다.</p>}
          </div>
          <div className="admin-skill-add">
            <div>
              <label className="block text-xs text-gray-500 mb-1">새 스킬</label>
              <input value={skillInput} onChange={(e) => setSkillInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())} placeholder="예: Product Strategy" className="admin-control w-full bg-gray-800 border border-gray-700 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-accent" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">분류</label>
              <select value={newCat} onChange={(e) => setNewCat(e.target.value)} className="admin-control w-full bg-gray-800 border border-gray-700 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-accent">
                {taxonomyOptions(taxonomy).map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
              </select>
            </div>
            <button type="button" onClick={addSkill} className="admin-primary-button">스킬 추가</button>
          </div>
        </section>
      </div>
      <Toast message={toast} />
    </div>
  )
}

/* ─── Achievements Section ─── */

function AchievementsSection() {
  const [config, setConfig] = useState(loadAchievementsConfig)
  const [toast, setToast] = useState('')
  const projectData = loadProjects()
  const linkTargets = [
    { value: 'projects', label: '프로젝트 영역' },
    { value: 'experience', label: '경력 영역' },
    ...(projectData.groups || []).flatMap((group) => (group.projects || [])
      .filter((project) => project.id)
      .map((project) => ({ value: project.id, label: `프로젝트 · ${project.title || project.id}` }))),
  ]

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2000) }

  const handleSave = () => { saveAchievementsConfig(config); flash('핵심 성과 저장 완료') }
  const handleReset = () => { if (confirm('초기화하시겠습니까?')) { resetAchievementsConfig(); setConfig(loadAchievementsConfig()); flash('초기화 완료') } }

  const items = config.items || []

  const updateItem = (i, updated) => {
    const arr = [...items]; arr[i] = updated
    setConfig({ ...config, items: arr })
  }

  const removeItem = (i) => setConfig({ ...config, items: items.filter((_, idx) => idx !== i) })

  const addItem = () => setConfig({ ...config, items: [...items, { icon: '', iconBg: '#1f2937', title: '', description: '' }] })

  return (
    <div>
      <SectionHeader title="핵심 성과" description="Achievements 섹션에 표시될 성과 카드를 관리합니다" />
      <ActionBar>
        <SaveButton onClick={handleSave} />
        <ResetButton onClick={handleReset} />
        <JsonBulkEditor value={config} onApply={(value) => { setConfig(value); flash('JSON 적용 완료 — 저장 버튼을 눌러주세요') }} />
        <button onClick={addItem} className="px-4 py-2 border border-accent text-accent hover:bg-accent/10 text-sm rounded-lg transition-colors cursor-pointer">+ 성과 추가</button>
        <div className="flex-1" /><ImportExportBar onImport={async (file) => { setConfig(await importJson(file)); flash('가져오기 완료 — 저장 버튼을 눌러주세요') }} onExport={() => downloadJson(config, 'achievements.json')} />
      </ActionBar>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="bg-gray-900 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-gray-500">{String(i + 1).padStart(2, '0')}</span>
              <button onClick={() => removeItem(i)} className="text-xs text-red-400 hover:text-red-300 cursor-pointer">삭제</button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Field label="제목" value={item.title} onChange={(v) => updateItem(i, { ...item, title: v })} />
            </div>
            <Field label="설명" value={item.description} onChange={(v) => updateItem(i, { ...item, description: v })} rows={2} />
            <SelectField label="클릭 시 이동할 위치" value={item.linkTo || ''} placeholder="연결 없음" options={linkTargets} onChange={(v) => updateItem(i, { ...item, linkTo: v })} />
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-gray-600 py-4 text-center">항목이 없습니다</p>}
      </div>
      <Toast message={toast} />
    </div>
  )
}

/* ─── Journey Section ─── */

function JourneySection() {
  const [config, setConfig] = useState(loadJourneyConfig)
  const [toast, setToast] = useState('')
  const workList = (loadResumeConfig().work || [])

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2000) }

  const handleSave = () => { saveJourneyConfig(config); flash('커리어 저니 저장 완료') }
  const handleReset = () => { if (confirm('초기화하시겠습니까?')) { resetJourneyConfig(); setConfig(loadJourneyConfig()); flash('초기화 완료') } }

  const items = config.items || []

  const updateItem = (i, updated) => {
    const arr = [...items]; arr[i] = updated
    setConfig({ ...config, items: arr })
  }

  const removeItem = (i) => setConfig({ ...config, items: items.filter((_, idx) => idx !== i) })

  const addItem = () => setConfig({ ...config, items: [...items, { year: '', org: '', field: '', color: '#75684d', emoji: '', companyId: '' }] })

  const move = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= items.length) return
    const arr = [...items]; [arr[i], arr[j]] = [arr[j], arr[i]]
    setConfig({ ...config, items: arr })
  }

  return (
    <div>
      <SectionHeader title="커리어 저니" description="Career Journey 타임라인을 관리합니다" />
      <div className="bg-accent/5 border border-accent/15 rounded-lg px-4 py-3 mb-5 text-xs text-gray-400 leading-relaxed">
        항목은 <b className="text-gray-300">최신순(맨 위 = 현재)</b>으로 정렬하세요. 데스크탑 화면에서는 오래된 항목부터 5개씩 줄바꿈되며 <b className="text-gray-300">S자 흐름이 자동으로</b> 만들어집니다 — 개수가 늘어도 별도 설정이 필요 없습니다. 모바일은 위에서 아래로 최신순 세로 타임라인으로 표시됩니다.
      </div>
      <ActionBar>
        <SaveButton onClick={handleSave} />
        <ResetButton onClick={handleReset} />
        <JsonBulkEditor value={config} onApply={(value) => { setConfig(value); flash('JSON 적용 완료 — 저장 버튼을 눌러주세요') }} />
        <button onClick={addItem} className="px-4 py-2 border border-accent text-accent hover:bg-accent/10 text-sm rounded-lg transition-colors cursor-pointer">+ 항목 추가</button>
        <div className="flex-1" /><ImportExportBar onImport={async (file) => { setConfig(await importJson(file)); flash('가져오기 완료 — 저장 버튼을 눌러주세요') }} onExport={() => downloadJson(config, 'journey.json')} />
      </ActionBar>
      <div className="space-y-3">
        {items.map((item, i) => (
          <div key={i} className="bg-gray-900 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-3 h-3 rounded-full border-2 shrink-0" style={{ borderColor: item.color, backgroundColor: item.current ? item.color : 'transparent' }} />
                <span className="text-sm text-white truncate">{item.org || '새 항목'}</span>
                {item.current && <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/20 text-accent shrink-0">NOW</span>}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => move(i, -1)} disabled={i === 0} className="text-xs text-gray-400 hover:text-white disabled:text-gray-700 cursor-pointer disabled:cursor-default px-1">↑</button>
                <button onClick={() => move(i, 1)} disabled={i === items.length - 1} className="text-xs text-gray-400 hover:text-white disabled:text-gray-700 cursor-pointer disabled:cursor-default px-1">↓</button>
                <button onClick={() => removeItem(i)} className="text-xs text-red-400 hover:text-red-300 cursor-pointer ml-1">삭제</button>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <YearField value={item.year || ''} onChange={(v) => updateItem(i, { ...item, year: v })} />
              <Field label="회사명" value={item.org || ''} onChange={(v) => updateItem(i, { ...item, org: v })} />
              <Field label="분야" value={item.field || ''} onChange={(v) => updateItem(i, { ...item, field: v })} />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <ColorField label="색상" value={item.color || ''} onChange={(v) => updateItem(i, { ...item, color: v })} />
              <SelectField label="연결 경력" value={item.companyId || ''} placeholder="연결 없음" options={workList.map((work, index) => ({ value: `exp-${index}`, label: work.company || `경력 ${index + 1}` }))} onChange={(v) => updateItem(i, { ...item, companyId: v })} />
              <label className="flex items-center gap-2 text-xs text-gray-400 mt-5 cursor-pointer">
                <input type="checkbox" checked={!!item.current} onChange={(e) => updateItem(i, { ...item, current: e.target.checked })} className="accent-accent cursor-pointer" />
                현재 재직 중 (NOW)
              </label>
            </div>
          </div>
        ))}
        {items.length === 0 && <p className="text-xs text-gray-600 py-4 text-center">항목이 없습니다</p>}
      </div>
      <Toast message={toast} />
    </div>
  )
}

/* ─── Home Dashboard ─── */

function HomeSection({ onNavigate, onExportPDF, onViewPortfolio: _onViewPortfolio }) {
  const [hoverDay, setHoverDay] = useState(null) // hovered day index on the trend chart
  const [now] = useState(Date.now)
  const tokens = getAccessTokens()
  const accessLogs = getAccessLog()
  const gateLogs = getGateLog()
  const projectData = loadProjects()
  const resume = loadResumeConfig()

  const DAY = 24 * 60 * 60 * 1000
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
  const t0 = todayStart.getTime()

  const activeTokens = tokens.filter((t) => !t.revoked && !t.forceExpired && t.expiresAt > now)
  const projectCount = (projectData.groups || []).reduce((s, g) => s + (g.projects?.length || 0), 0)
  const companyCount = (resume.work || []).length
  const activityCount = (resume.activities || []).length

  const todayGate = gateLogs.filter((l) => l.visitedAt >= t0).length
  const todayAccess = accessLogs.filter((l) => l.accessedAt >= t0).length

  const since14 = t0 - 13 * DAY
  const gate14 = gateLogs.filter((l) => l.visitedAt >= since14).length
  // Conversion compares only the period where gate tracking exists —
  // accesses that predate the first gate record would inflate the rate past 100%.
  const gateStart = gateLogs.length > 0 ? Math.min(...gateLogs.map((l) => l.visitedAt)) : null
  const auth14 = accessLogs.filter((l) => l.accessedAt >= since14 && (gateStart === null || l.accessedAt >= gateStart)).length
  const conv = gate14 > 0 ? Math.min(100, Math.round((auth14 / gate14) * 100)) : null

  const days = Array.from({ length: 14 }, (_, i) => ({ start: t0 - (13 - i) * DAY, gate: 0, auth: 0 }))
  gateLogs.forEach((l) => { const d = days.find((d) => l.visitedAt >= d.start && l.visitedAt < d.start + DAY); if (d) d.gate++ })
  accessLogs.forEach((l) => { const d = days.find((d) => l.accessedAt >= d.start && l.accessedAt < d.start + DAY); if (d) d.auth++ })
  const maxV = Math.max(...days.map((d) => Math.max(d.gate, d.auth)), 1)

  const recent = [...accessLogs].sort((a, b) => b.accessedAt - a.accessedAt).slice(0, 5)
  const lastGate = gateLogs.length > 0 ? Math.max(...gateLogs.map((l) => l.visitedAt)) : null

  // Live sessions: heartbeat within the last 6 minutes (heartbeat interval is 5 min)
  const LIVE_WINDOW = 6 * 60 * 1000
  const liveCount = accessLogs.filter((l) => l.lastSeenAt && now - l.lastSeenAt < LIVE_WINDOW).length
  const stayMin = (l) => (l.lastSeenAt ? Math.round((l.lastSeenAt - l.accessedAt) / 60000) : null)

  const alerts = getAlertLog()
  const alerts7d = alerts.filter((a) => a.at >= t0 - 6 * DAY).length
  const alerts24h = alerts.filter((a) => a.at >= now - DAY).length
  const recentAlerts = [...alerts].sort((a, b) => b.at - a.at).slice(0, 5)
  const ALERT_LABEL = { token_fail: '잘못된 토큰 시도', admin_fail: '어드민 로그인 실패' }

  const stats = [
    { label: '오늘 게이트 방문', value: todayGate, sub: '미인증 포함', accent: false },
    { label: '오늘 인증 접속', value: todayAccess, sub: '토큰 입력 성공', accent: true },
    { label: '14일 인증 전환율', value: conv === null ? '—' : `${conv}%`, sub: `방문 ${gate14} → 접속 ${auth14}`, accent: false },
    { label: '활성 토큰', value: activeTokens.length, sub: `전체 ${tokens.length}개`, accent: false },
  ]

  const shortcuts = [
    { icon: '01', label: '프로젝트 편집', desc: `${projectCount}개 항목을 개별 수정`, action: () => onNavigate('projects') },
    { icon: '02', label: '뷰어 초대', desc: '만료일이 있는 링크 발급', action: () => onNavigate('tokens') },
    { icon: '03', label: '전체 백업', desc: '변경 이력과 복원 지점 관리', action: () => onNavigate('history') },
    { icon: '04', label: 'PDF 출력', desc: '수신자별 문서 생성', action: onExportPDF },
  ]

  return (
    <div className="admin-home">
      <div className="flex flex-col gap-5 mb-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-semibold tracking-[-0.03em] text-white">관리 현황</h2>
          <p className="text-sm text-gray-500 mt-2 max-w-xl leading-6">{new Date(now).toLocaleDateString('ko-KR')} · 콘텐츠, 백업, 뷰어 권한과 열람 행동을 확인합니다.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => onNavigate('history')} className="admin-secondary-button">백업 · 복원</button>
          <button onClick={() => onNavigate('tokens')} className="admin-primary-button">+ 뷰어 초대</button>
        </div>
      </div>

      <section className="admin-status-strip" aria-label="시스템 상태">
        <div><span className="admin-status-dot" /><p><b>데이터 정상</b><small>로컬 및 클라우드 저장소 연결</small></p></div>
        <div><span className="admin-status-dot" /><p><b>접근 보호 중</b><small>소유자 인증 · 만료 토큰 적용</small></p></div>
        <button onClick={() => onNavigate('logs')}>감사 로그 열기 <span>↗</span></button>
      </section>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-px mb-6 bg-gray-800/80 border border-gray-800 rounded-2xl overflow-hidden">
        {stats.map((s, i) => (
          <div key={i} className="bg-gray-900 p-4 md:p-5 min-h-28">
            <p className="text-[11px] text-gray-500">{s.label}</p>
            <p className={`text-3xl font-semibold tracking-[-0.04em] mt-3 tabular-nums ${s.accent ? 'text-accent' : 'text-white'}`}>{s.value}</p>
            <p className="text-[10px] text-gray-600 mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.35fr_.65fr] gap-4 mb-6">
        <section className="admin-panel">
          <div className="admin-panel-heading">
            <div><h3>데이터 안전 상태</h3></div>
            <button onClick={() => onNavigate('history')}>복원 지점 보기 →</button>
          </div>
          <div className="grid sm:grid-cols-3 gap-px bg-gray-800/70 border border-gray-800 rounded-xl overflow-hidden">
            <div className="admin-vault-cell"><span>최근 자동 저장</span><b>변경 즉시</b><small>브라우저 로컬 원본 유지</small></div>
            <div className="admin-vault-cell"><span>클라우드 스냅샷</span><b>{cloudConfigured ? '연결됨' : '설정 필요'}</b><small>{cloudConfigured ? '버전별 복원 가능' : 'Firebase 연결 확인'}</small></div>
            <div className="admin-vault-cell"><span>전체 덤프</span><b>JSON</b><small>항목별 업로드 · 다운로드</small></div>
          </div>
        </section>
        <section className="admin-panel admin-panel--accent">
          <div className="admin-panel-heading"><div><h3>지금 열람 중</h3></div><b className="text-2xl text-white tabular-nums">{liveCount}</b></div>
          <p className="text-xs text-gray-500 leading-5 mt-5">활성 세션은 5분 간격의 신호로 확인합니다. 의심스러운 접근은 토큰 관리에서 즉시 만료할 수 있습니다.</p>
          <button onClick={() => onNavigate('tokens')} className="mt-5 text-xs text-accent hover:text-accent-light">활성 뷰어 관리 →</button>
        </section>
      </div>

      {/* 14-day visit chart */}
      <div className="admin-panel mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-accent">방문 추이 <span className="text-gray-600 font-normal">최근 14일</span></h3>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[11px] text-gray-400"><span className="w-2 h-2 rounded-sm bg-gray-600 inline-block" />게이트 방문</span>
            <span className="flex items-center gap-1.5 text-[11px] text-gray-400"><span className="w-2 h-2 rounded-sm bg-accent inline-block" />인증 접속</span>
          </div>
        </div>
        {gateLogs.length === 0 && accessLogs.length === 0 ? (
          <p className="text-xs text-gray-600 text-center py-8">아직 기록된 방문이 없습니다</p>
        ) : (
          <>
            <div className="relative">
              <div className="flex items-end gap-1 h-24 mb-1" onMouseLeave={() => setHoverDay(null)}>
                {days.map((d, i) => (
                  <div key={i} onMouseEnter={() => setHoverDay(i)} className={`flex-1 flex items-end justify-center gap-[2px] h-full rounded ${hoverDay === i ? 'bg-gray-800/50' : ''}`}>
                    <div className="w-[40%] rounded-t bg-gray-600" style={{ height: `${(d.gate / maxV) * 100}%`, minHeight: d.gate > 0 ? '3px' : '1px', opacity: d.gate > 0 ? 1 : 0.25 }} />
                    <div className="w-[40%] rounded-t bg-accent" style={{ height: `${(d.auth / maxV) * 100}%`, minHeight: d.auth > 0 ? '3px' : '1px', opacity: d.auth > 0 ? 1 : 0.25 }} />
                  </div>
                ))}
              </div>
              {hoverDay !== null && (() => {
                const d = days[hoverDay]
                const dt = new Date(d.start)
                return (
                  <div
                    className="absolute bottom-full mb-1.5 -translate-x-1/2 z-20 pointer-events-none bg-gray-800 border border-gray-600/60 rounded-lg px-3 py-2 shadow-xl shadow-black/40 whitespace-nowrap"
                    style={{ left: `${Math.min(88, Math.max(12, ((hoverDay + 0.5) / days.length) * 100))}%` }}
                  >
                    <p className="text-[10px] text-gray-400 mb-1">{dt.getMonth() + 1}/{dt.getDate()}</p>
                    <p className="text-[11px] text-gray-300 flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-gray-600 inline-block" />게이트 방문 <b className="text-white">{d.gate}</b></p>
                    <p className="text-[11px] text-gray-300 flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-accent inline-block" />인증 접속 <b className="text-white">{d.auth}</b></p>
                  </div>
                )
              })()}
            </div>
            <div className="flex gap-1">
              {days.map((d, i) => {
                const dt = new Date(d.start)
                const isToday = i === 13
                return (
                  <div key={i} className={`flex-1 text-center text-[8px] truncate ${isToday ? 'text-accent font-bold' : 'text-gray-600'}`}>
                    {isToday ? '오늘' : `${dt.getMonth() + 1}/${dt.getDate()}`}
                  </div>
                )
              })}
            </div>
            {lastGate && <p className="text-[10px] text-gray-600 mt-3">마지막 게이트 방문 {formatDate(lastGate)}</p>}
          </>
        )}
      </div>

      {/* Security alerts */}
      <div className={`rounded-2xl p-5 mb-6 ${alerts7d > 0 ? 'bg-red-500/5 border border-red-500/25' : 'bg-gray-900 border border-gray-800'}`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className={`text-sm font-semibold ${alerts7d > 0 ? 'text-red-400' : 'text-accent'}`}>
            보안 알림
            {alerts7d > 0 && <span className="ml-2 text-[11px] font-normal text-red-400/80">최근 7일 {alerts7d}건 · 24시간 {alerts24h}건</span>}
          </h3>
          {alerts.length > 0 && <span className="text-[10px] text-gray-600">누적 {alerts.length}건</span>}
        </div>
        {recentAlerts.length === 0 ? (
          <p className="text-xs text-gray-500 flex items-center gap-2">
            <span className="w-4 h-4 rounded-full bg-green-500/15 text-green-400 flex items-center justify-center text-[9px]">✓</span>
            최근 이상 접근 시도가 없습니다
          </p>
        ) : (
          <div className="space-y-2">
            {recentAlerts.map((a, i) => (
              <div key={i} className="flex items-center gap-3 text-xs">
                <span className={`px-1.5 py-0.5 rounded text-[10px] shrink-0 ${a.type === 'admin_fail' ? 'bg-red-500/15 text-red-400' : 'bg-amber-500/15 text-amber-400'}`}>
                  {ALERT_LABEL[a.type] || a.type}
                </span>
                <span className="text-gray-500 truncate">{a.detail}</span>
                <span className="text-gray-600 shrink-0">{parseBrowser(a.userAgent)} · {parseOS(a.userAgent)}</span>
                <span className="text-gray-500 ml-auto shrink-0">{formatDate(a.at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Recent authenticated visits */}
        <div className="admin-panel">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-accent">
              최근 인증 접속
              {liveCount > 0 && <span className="ml-2 text-[11px] font-normal text-green-400">● 지금 열람 중 {liveCount}명</span>}
            </h3>
            <button onClick={() => onNavigate('tokens')} className="text-[11px] text-gray-500 hover:text-accent cursor-pointer">전체 보기 →</button>
          </div>
          {recent.length === 0 ? (
            <p className="text-xs text-gray-600 text-center py-6">접속 기록이 없습니다</p>
          ) : (
            <div className="space-y-2.5">
              {recent.map((log, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-accent/10 text-accent text-[11px] font-bold flex items-center justify-center shrink-0">
                    {(log.tokenLabel || '?').slice(0, 1)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">
                      {log.tokenLabel || 'unknown'}
                      {log.lastSeenAt && now - log.lastSeenAt < LIVE_WINDOW ? (
                        <span className="ml-1.5 text-[10px] text-green-400">● 열람 중</span>
                      ) : stayMin(log) >= 1 ? (
                        <span className="ml-1.5 text-[10px] text-gray-500">체류 {stayMin(log)}분</span>
                      ) : null}
                    </p>
                    <p className="text-[10px] text-gray-600">{parseBrowser(log.userAgent)} · {parseOS(log.userAgent)}</p>
                  </div>
                  <span className="text-[10px] text-gray-500 shrink-0">{formatDate(log.accessedAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Shortcuts */}
        <div className="admin-panel">
          <h3 className="text-sm font-semibold text-white mb-3">빠른 작업</h3>
          <div className="grid grid-cols-2 gap-2">
            {shortcuts.map((s, i) => (
              <button
                key={i}
                onClick={s.action}
                className="text-left bg-gray-800/40 hover:bg-gray-800 border border-gray-800 hover:border-accent/40 rounded-xl p-3 transition-all cursor-pointer group"
              >
                <p className="text-xs font-medium text-white mt-1.5">{s.label}</p>
                <p className="text-[10px] text-gray-600 mt-0.5">{s.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content summary */}
      <div className="admin-panel">
        <h3 className="text-sm font-semibold text-accent mb-3">콘텐츠 현황</h3>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => onNavigate('projects')} className="px-3 py-1.5 bg-gray-800/60 hover:bg-gray-800 rounded-lg text-xs text-gray-300 cursor-pointer transition-colors">프로젝트 <b className="text-white">{projectCount}</b></button>
          <button onClick={() => onNavigate('resume')} className="px-3 py-1.5 bg-gray-800/60 hover:bg-gray-800 rounded-lg text-xs text-gray-300 cursor-pointer transition-colors">경력 <b className="text-white">{companyCount}</b>개사</button>
          <button onClick={() => onNavigate('resume')} className="px-3 py-1.5 bg-gray-800/60 hover:bg-gray-800 rounded-lg text-xs text-gray-300 cursor-pointer transition-colors">활동 <b className="text-white">{activityCount}</b></button>
          <button onClick={() => onNavigate('journey')} className="px-3 py-1.5 bg-gray-800/60 hover:bg-gray-800 rounded-lg text-xs text-gray-300 cursor-pointer transition-colors">저니 <b className="text-white">{(loadJourneyConfig().items || []).length}</b></button>
        </div>
      </div>
    </div>
  )
}

/* ─── Access Logs Section ─── */

function LogsSection() {
  const [filter, setFilter] = useState('all')
  const [openRow, setOpenRow] = useState(null)
  const [ver, setVer] = useState(0) // bump to re-read logs after deletion
  const [toast, setToast] = useState('')
  const [now] = useState(Date.now)
  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2000) }

  const removeRow = (r) => {
    if (!confirm('이 기록을 삭제하시겠습니까?')) return
    if (r.kind === 'access') removeAccessLogEntry(r.at)
    else if (r.kind === 'gate') removeGateLogEntry(r.at)
    else removeAlertLogEntry(r.at)
    setOpenRow(null)
    setVer(ver + 1)
    flash('기록 삭제 완료')
  }

  const clearFiltered = () => {
    const label = LOG_FILTERS.find((f) => f.key === filter)?.label
    if (!confirm(`${label} 기록을 전부 삭제하시겠습니까? 되돌릴 수 없습니다.`)) return
    if (filter === 'access') clearAccessLog()
    else if (filter === 'gate') clearGateLog()
    else if (filter === 'alert') clearAlertLog()
    setOpenRow(null)
    setVer(ver + 1)
    flash(`${label} 기록 전체 삭제 완료`)
  }

  const rows = buildLogRows({ accessLogs: getAccessLog(), gateLogs: getGateLog(), alertLogs: getAlertLog(), now })

  const filtered = filter === 'all' ? rows : rows.filter((r) => r.kind === filter)
  const KIND_STYLE = {
    access: 'bg-accent/15 text-accent',
    gate: 'bg-gray-700/60 text-gray-300',
    alert: 'bg-red-500/15 text-red-400',
  }
  const KIND_LABEL = { access: '인증', gate: '방문', alert: '알림' }
  const counts = countLogRows(rows)

  return (
    <div>
      <SectionHeader title="접속 로그" description="인증 접속·게이트 방문·보안 알림 전체 기록을 시간순으로 확인합니다 (소유자 브라우저 제외)" />

      <div className="flex flex-wrap items-center gap-1.5 mb-5">
        {LOG_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 text-xs rounded-lg cursor-pointer transition-colors ${
              filter === f.key ? 'bg-accent/15 text-accent font-medium' : 'bg-gray-800/60 text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {f.label} <span className="opacity-60">{counts[f.key]}</span>
          </button>
        ))}
        {filter !== 'all' && filtered.length > 0 && (
          <button onClick={clearFiltered} className="ml-auto px-3 py-1.5 text-xs text-red-400 hover:text-red-300 border border-red-500/25 hover:border-red-500/50 rounded-lg cursor-pointer transition-colors">
            {LOG_FILTERS.find((f) => f.key === filter)?.label} 전체 삭제
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-xs text-gray-600 py-8 text-center">기록이 없습니다</p>
      ) : (
        <div className="space-y-1.5">
          {filtered.slice(0, 150).map((r, i) => {
            const hasActions = r.actions?.length > 0
            const isOpen = openRow === i
            return (
              <div key={i} className="bg-gray-900 rounded-lg overflow-hidden">
                <div
                  className={`px-4 py-2.5 flex items-center gap-3 ${hasActions ? 'cursor-pointer hover:bg-gray-800/60 transition-colors' : ''}`}
                  onClick={() => hasActions && setOpenRow(isOpen ? null : i)}
                >
                  <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${KIND_STYLE[r.kind]}`}>{KIND_LABEL[r.kind]}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white truncate">
                      {r.title}
                      {r.live && <span className="ml-1.5 text-[10px] text-green-400">●</span>}
                      {r.detail && <span className="text-gray-500 ml-2">{r.detail}</span>}
                    </p>
                    <p className="text-[10px] text-gray-600">{parseBrowser(r.ua)} · {parseOS(r.ua)} · {r.lang}</p>
                  </div>
                  {hasActions && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 shrink-0">
                      행동 {r.actions.length} {isOpen ? '▾' : '▸'}
                    </span>
                  )}
                  <span className="text-[10px] text-gray-500 shrink-0">{formatDate(r.at)}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); removeRow(r) }}
                    title="기록 삭제"
                    className="text-gray-600 hover:text-red-400 cursor-pointer shrink-0 px-1"
                  >✕</button>
                </div>
                {isOpen && hasActions && (
                  <div className="px-4 pb-3 pt-1 border-t border-gray-800/70 space-y-1">
                    {r.actions.map((a, ai) => {
                      const offMin = Math.max(0, Math.round((a.t - r.at) / 60000))
                      const target = a.kind === 'section' ? (SECTION_LABELS[a.target] || a.target) : a.target
                      return (
                        <div key={ai} className="flex items-center gap-2 text-[11px] text-gray-500">
                          <span className="font-mono text-gray-600 w-12 shrink-0">+{offMin}분</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] shrink-0 ${a.kind === 'tab' ? 'bg-purple-500/10 text-purple-400' : a.kind === 'journey' ? 'bg-teal-500/10 text-teal-400' : a.kind === 'detail' ? 'bg-amber-500/10 text-amber-400' : 'bg-gray-800 text-gray-400'}`}>
                            {ACTION_LABELS[a.kind] || a.kind}
                          </span>
                          <span className="truncate text-gray-400">{target}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
          {filtered.length > 150 && <p className="text-[10px] text-gray-600 text-center py-2">최근 150건까지 표시</p>}
        </div>
      )}
      <Toast message={toast} />
    </div>
  )
}

/* ─── History Section ─── */

const HISTORY_DOCS = [
  { id: 'projects', label: '프로젝트', icon: '01' },
  { id: 'resume', label: '경력·학력', icon: '02' },
  { id: 'about', label: '소개', icon: '03' },
  { id: 'achievements', label: '핵심 성과', icon: '04' },
  { id: 'journey', label: '커리어 저니', icon: '05' },
  { id: 'hero', label: '히어로', icon: '06' },
  { id: 'authgate', label: '접속 화면', icon: '07' },
  { id: 'contact', label: '연락처', icon: '08' },
]

function HistorySection() {
  const [activeDoc, setActiveDoc] = useState('projects')
  const [snapshots, setSnapshots] = useState(null) // null = loading
  const [loadError, setLoadError] = useState(false)
  const [toast, setToast] = useState('')
  const [ownerUser, setOwnerUser] = useState(null)

  useEffect(() => watchOwnerAuth(setOwnerUser), [])

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const load = async (docId) => {
    setSnapshots(null)
    setLoadError(false)
    try {
      setSnapshots(await cloudListSnapshots(docId))
    } catch {
      setLoadError(true)
      setSnapshots([])
    }
  }

  useEffect(() => {
    let cancelled = false
    cloudListSnapshots(activeDoc).then((items) => {
      if (!cancelled) setSnapshots(items)
    }).catch(() => {
      if (!cancelled) { setLoadError(true); setSnapshots([]) }
    })
    return () => { cancelled = true }
  }, [activeDoc])

  const handleRestore = async (snap) => {
    const docLabel = HISTORY_DOCS.find((d) => d.id === activeDoc)?.label || activeDoc
    if (!confirm(`${docLabel}을(를) ${formatDate(snap.at)} 버전으로 복원하시겠습니까?\n현재 상태를 덮어씁니다.`)) return
    try {
      const data = await cloudGetSnapshot(activeDoc, snap.id)
      if (!data) { flash('스냅샷을 불러오지 못했습니다'); return }
      applyRestoredData(activeDoc, data)
      cloudSaveSnapshot(activeDoc, data) // the restore itself becomes a new version
      flash('복원 완료 — 해당 섹션을 열면 반영되어 있습니다')
      load(activeDoc)
    } catch (e) {
      flash('복원 실패: ' + e.message)
    }
  }

  return (
    <div>
      <SectionHeader title="변경 이력" description="저장할 때마다 자동 기록된 버전을 확인하고 복원합니다 (문서당 최근 10개 보관)" />

      {cloudConfigured && !ownerUser && (
        <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-3 mb-5 text-xs text-amber-200/90">
          이력 조회·복원에는 소유자 구글 로그인이 필요합니다 — 상단 배너에서 로그인해 주세요
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 mb-5">
        {HISTORY_DOCS.map((d) => (
          <button
            key={d.id}
            onClick={() => { setSnapshots(null); setLoadError(false); setActiveDoc(d.id) }}
            className={`px-3 py-1.5 text-xs rounded-lg cursor-pointer transition-colors ${
              activeDoc === d.id ? 'bg-accent/15 text-accent font-medium' : 'bg-gray-800/60 text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            {d.icon} {d.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {snapshots === null && <p className="text-xs text-gray-600 py-6 text-center">불러오는 중...</p>}
        {snapshots !== null && loadError && (
          <p className="text-xs text-gray-500 py-6 text-center">이력을 불러올 수 없습니다 — 구글 로그인 상태와 보안 규칙(history)을 확인해 주세요</p>
        )}
        {snapshots !== null && !loadError && snapshots.length === 0 && (
          <p className="text-xs text-gray-600 py-6 text-center">아직 기록된 버전이 없습니다 — 해당 섹션에서 저장하면 자동으로 쌓입니다</p>
        )}
        {(snapshots || []).map((snap, i) => (
          <div key={snap.id} className="bg-gray-900 rounded-xl px-4 py-3 flex items-center gap-3">
            <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${i === 0 ? 'bg-accent/15 text-accent' : 'bg-gray-800 text-gray-500'}`}>
              {i === 0 ? '최신' : `v${snapshots.length - i}`}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white">{formatDate(snap.at)}</p>
              <p className="text-[10px] text-gray-600">{(snap.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              onClick={() => handleRestore(snap)}
              className="px-3 py-1.5 text-xs text-accent hover:text-white hover:bg-accent border border-accent/40 rounded-lg cursor-pointer transition-colors shrink-0"
            >
              이 버전으로 복원
            </button>
          </div>
        ))}
      </div>
      <Toast message={toast} />
    </div>
  )
}

function TaxonomySection() {
  const [config, setConfig] = useState(loadTaxonomyConfig)
  const [toast, setToast] = useState('')
  const categories = config.categories || []
  const flash = (message) => { setToast(message); setTimeout(() => setToast(''), 2000) }
  const updateCategory = (index, patch) => setConfig({ ...config, categories: categories.map((item, i) => i === index ? { ...item, ...patch } : item) })
  const removeCategory = (index) => setConfig({ ...config, categories: categories.filter((_, i) => i !== index) })
  const addCategory = () => {
    let number = categories.length + 1
    let key = `category-${number}`
    while (categories.some((item) => item.key === key)) { number += 1; key = `category-${number}` }
    setConfig({ ...config, categories: [...categories, { key, label: '새 분류', color: '#6b7280' }] })
  }
  const save = () => {
    const keys = categories.map((item) => item.key.trim())
    if (keys.some((key) => !key)) return flash('식별자는 비워둘 수 없습니다')
    if (new Set(keys).size !== keys.length) return flash('분류 식별자는 중복될 수 없습니다')
    saveTaxonomyConfig({ ...config, categories: categories.map((item) => ({ ...item, key: item.key.trim() })) })
    flash('분류·선택지 저장 완료')
  }
  const reset = () => {
    if (!confirm('기본 분류로 초기화하시겠습니까? 기존 콘텐츠의 분류 값은 변경되지 않습니다.')) return
    setConfig(resetTaxonomyConfig())
    flash('기본 분류로 초기화했습니다')
  }
  return (
    <div>
      <SectionHeader title="분류·선택지" description="프로젝트 배지와 소개 스킬에서 공통으로 사용하는 선택지를 관리합니다" />
      <ActionBar>
        <SaveButton onClick={save} />
        <ResetButton onClick={reset} />
        <JsonBulkEditor value={config} onApply={(value) => { setConfig(value); flash('JSON 적용 완료 — 저장 버튼을 눌러주세요') }} />
        <div className="flex-1" />
        <ImportExportBar onImport={async (file) => { setConfig(await importJson(file)); flash('가져오기 완료 — 저장 버튼을 눌러주세요') }} onExport={() => downloadJson(config, 'taxonomy.json')} />
      </ActionBar>
      <section className="admin-form-section max-w-5xl">
        <header><h3>콘텐츠 분류</h3><p>식별자는 저장 데이터에 사용됩니다. 이름과 색상은 언제든 바꿀 수 있습니다.</p></header>
        <div>
          <div className="admin-taxonomy-head" aria-hidden="true"><span>표시 이름</span><span>식별자</span><span>색상</span><span>관리</span></div>
          {categories.map((item, index) => (
            <div className="admin-taxonomy-row" key={`${item.key}-${index}`}>
              <Field label="표시 이름" value={item.label || ''} onChange={(value) => updateCategory(index, { label: value })} />
              <Field label="식별자" value={item.key || ''} onChange={(value) => updateCategory(index, { key: value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} />
              <ColorField label="색상" value={item.color || ''} onChange={(value) => updateCategory(index, { color: value })} />
              <button type="button" className="admin-row-delete" onClick={() => removeCategory(index)}>삭제</button>
            </div>
          ))}
          <button type="button" onClick={addCategory} className="admin-secondary-button mt-4">분류 추가</button>
          <p className="mt-3 text-[11px] leading-relaxed text-gray-500">분류를 삭제해도 기존 콘텐츠 값은 지워지지 않으며, 해당 편집 화면에서 ‘기존 값’으로 계속 표시됩니다.</p>
        </div>
      </section>
      <Toast message={toast} />
    </div>
  )
}

/* ─── Main Admin ─── */

const SECTION_MAP = {
  home: HomeSection,
  logs: LogsSection,
  history: HistorySection,
  projects: ProjectsSection,
  'design-projects': ProjectsSection,
  resume: ResumeSection,
  about: AboutSection,
  achievements: AchievementsSection,
  journey: JourneySection,
  hero: HeroSection,
  authgate: AuthGateSection,
  theme: ThemeSection,
  contact: ContactSection,
  tokens: TokensSection,
  account: AccountSection,
  taxonomy: TaxonomySection,
}

const LAST_SECTION_KEY = 'portfolio_admin_last_section'
const ADMIN_THEME_KEY = 'portfolio_admin_color_mode'

const ALL_NAV = NAV_ITEMS.flatMap((g) => g.items.map((item) => ({ ...item, group: g.group })))

export default function Admin({ onLogout, onViewPortfolio, onPreviewTheme, onOpenDesignSystem }) {
  const [activeSection, setActiveSection] = useState(() => {
    const saved = localStorage.getItem(LAST_SECTION_KEY)
    return SECTION_MAP[saved] ? saved : 'home'
  })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [adminTheme, setAdminTheme] = useState(() => localStorage.getItem(ADMIN_THEME_KEY) || 'dark')
  const changeAdminTheme = (theme) => {
    setAdminTheme(theme)
    localStorage.setItem(ADMIN_THEME_KEY, theme)
  }

  const handleLogout = () => { clearAdminSession(); onLogout() }

  // Admin login marks this browser as the owner — excluded from visit stats
  useEffect(() => { markOwnerBrowser() }, [])

  // Signed-in owner (login guarantees it) — shown in the sidebar header
  const [ownerUser, setOwnerUser] = useState(null)
  useEffect(() => watchOwnerAuth(setOwnerUser), [])

  // Cmd/Ctrl+S saves the current section
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        const btn = document.querySelector('[data-save-btn]')
        if (btn) { e.preventDefault(); btn.click() }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const selectSection = (id) => {
    setActiveSection(id)
    setMobileMenuOpen(false)
    localStorage.setItem(LAST_SECTION_KEY, id)
    window.scrollTo({ top: 0 })
  }

  const ActiveComponent = SECTION_MAP[activeSection]
  const current = ALL_NAV.find((i) => i.id === activeSection)

  const handleExportPDF = async () => {
    const recipient = prompt('이 PDF의 수신자(회사명)를 입력하세요.\n토큰 라벨로 남아 접속 로그에서 문서별 열람을 추적할 수 있습니다.', '')
    if (recipient === null) return // cancelled
    try {
      const { exportPortfolioPDF } = await import('../utils/pdfExport')
      const tokenVal = await exportPortfolioPDF({
        resume: loadResumeConfig(),
        projects: loadProjects(),
        achievements: loadAchievementsConfig(),
        hero: loadHeroConfig(),
        about: loadAboutConfig(),
        contact: loadContactConfig(),
        recipient: recipient.trim(),
      })
      alert(`PDF 저장 완료!\nToken: ${tokenVal}`)
    } catch (e) { alert('PDF 생성 실패: ' + e.message) }
  }

  const sectionProps =
    activeSection === 'account' ? { onLogout: handleLogout }
    : activeSection === 'home' ? { onNavigate: selectSection, onExportPDF: handleExportPDF, onViewPortfolio }
    : activeSection === 'theme' || activeSection === 'tokens' ? { onPreviewTheme }
    : activeSection === 'design-projects' ? { mode: 'design' } : {}

  return (
    <div className="admin-shell min-h-screen bg-gray-950 text-gray-100 flex" data-admin-theme={adminTheme}>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-gray-900/70 border-r border-gray-800/80 sticky top-0 h-screen backdrop-blur-xl">
        <div className="px-5 py-5 border-b border-gray-800/80">
          <h1 className="text-base font-semibold tracking-[-0.02em]">Private Archive</h1>
          {cloudConfigured && ownerUser ? (
            <p className="text-[11px] text-gray-600 mt-0.5 truncate" title={ownerUser.email}>
              <span className="text-gray-500">{ownerUser.email}</span> 로 인증됨
            </p>
          ) : (
            <p className="text-[11px] text-gray-600 mt-0.5">{SITE_HOST} 관리 콘솔</p>
          )}
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
          {NAV_ITEMS.map((group) => (
            <div key={group.group}>
              <p className="px-2 pb-1.5 text-[10px] text-gray-600 font-semibold uppercase tracking-widest">{group.group}</p>
              <div className="space-y-0.5">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => selectSection(item.id)}
                    data-active={activeSection === item.id ? 'true' : 'false'}
                    className="admin-nav-item w-full text-left px-3 py-2 text-sm flex items-center gap-2.5 rounded-lg transition-colors cursor-pointer"
                  >
                    {item.label}
                    {activeSection === item.id && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-accent" />}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-800/80 space-y-1">
          <div className="admin-theme-switch" aria-label="관리자 화면 색상 모드">
            <button type="button" aria-pressed={adminTheme === 'light'} onClick={() => changeAdminTheme('light')}>라이트</button>
            <button type="button" aria-pressed={adminTheme === 'dark'} onClick={() => changeAdminTheme('dark')}>다크</button>
          </div>
          <button onClick={onOpenDesignSystem} className="w-full mb-2 px-3 py-2 text-xs text-gray-400 hover:text-white border border-gray-800 hover:border-gray-700 rounded-lg transition-colors cursor-pointer">디자인 시스템 시안</button>
          <button
            onClick={handleExportPDF}
            className="w-full px-3 py-2.5 text-sm font-medium text-white bg-accent/15 hover:bg-accent/25 border border-accent/20 rounded-lg transition-colors cursor-pointer flex items-center gap-2 justify-center"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            PDF 출력
          </button>
          {onViewPortfolio && (
            <button onClick={onViewPortfolio} className="w-full px-3 py-2 text-sm text-accent hover:bg-accent/10 rounded-lg transition-colors cursor-pointer flex items-center gap-2 justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              포트폴리오 보기
            </button>
          )}
          <button onClick={handleLogout} className="w-full px-3 py-2 text-sm text-gray-500 hover:text-red-400 hover:bg-gray-800/50 rounded-lg transition-colors cursor-pointer">
            로그아웃
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-900/95 backdrop-blur border-b border-gray-800">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex items-center gap-2 text-white p-1 cursor-pointer min-w-0"
          >
            <svg className="w-5 h-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              {mobileMenuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              }
            </svg>
            <span className="text-sm font-bold truncate">{current ? `${current.icon} ${current.label}` : '관리자'}</span>
            <svg className={`w-3.5 h-3.5 text-gray-500 shrink-0 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          <div className="flex items-center gap-3 shrink-0">
            <button type="button" onClick={() => changeAdminTheme(adminTheme === 'dark' ? 'light' : 'dark')} className="text-xs text-gray-400 hover:text-accent cursor-pointer">{adminTheme === 'dark' ? '라이트' : '다크'}</button>
            {onViewPortfolio && <button onClick={onViewPortfolio} className="text-xs text-accent cursor-pointer">보기</button>}
            <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-red-400 cursor-pointer">로그아웃</button>
          </div>
        </div>

        {mobileMenuOpen && (
          <>
            <div className="fixed inset-0 top-[49px] bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
            <div className="relative bg-gray-900 border-b border-gray-800 shadow-2xl shadow-black/50 max-h-[70vh] overflow-y-auto">
              <div className="p-3 space-y-4">
                {NAV_ITEMS.map((group) => (
                  <div key={group.group}>
                    <p className="px-2 pb-1.5 text-[10px] text-gray-600 font-semibold uppercase tracking-widest">{group.group}</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {group.items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => selectSection(item.id)}
                          data-active={activeSection === item.id ? 'true' : 'false'}
                          className="admin-nav-item text-left px-3 py-2.5 text-sm flex items-center gap-2 rounded-lg cursor-pointer transition-colors"
                        >
                          <span className="truncate">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <button
                  onClick={handleExportPDF}
                  className="w-full px-3 py-2.5 text-sm font-medium text-white bg-accent/15 hover:bg-accent/25 border border-accent/20 rounded-lg transition-colors cursor-pointer flex items-center gap-2 justify-center"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                  </svg>
                  PDF 출력
                </button>
                {cloudConfigured && ownerUser && (
                  <p className="text-[10px] text-gray-600 text-center truncate"><span className="text-gray-500">{ownerUser.email}</span> 로 인증됨</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 min-w-0 px-4 pb-24 pt-[72px] md:px-8 md:py-8 lg:px-12">
        <div className="max-w-6xl mx-auto">
          {/* Breadcrumb (desktop) */}
          {current && (
            <p className="hidden md:flex items-center gap-1.5 text-xs text-gray-600 mb-4">
              {current.group}
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
              <span className="text-gray-400">{current.label}</span>
            </p>
          )}
          <ActiveComponent {...sectionProps} />
        </div>
      </main>
    </div>
  )
}
