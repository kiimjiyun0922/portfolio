import { useState, useCallback, useEffect } from 'react'
import { loadProjects, saveProjects, resetProjects, defaultProjects } from '../data/projects'
import { watchOwnerAuth, hasConfig as cloudConfigured, uploadPortfolioImage } from '../utils/firebase'
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
import { ActionBar, AutoTextarea, DurationField, Field, FloatingJumpNav, JsonBulkEditor, MediaField, MonthRangeField, ResetButton, SaveButton, SectionHeader, SelectField, Toast, YearField, YearRangeField } from './admin/AdminUI'
import { AdminDialogHost } from './admin/AdminDialogs'
import { adminAlert, adminConfirm, adminPrompt } from './admin/adminDialogService'

/* ─── Navigation ─── */

const NAV_ITEMS = [
  { group: '대시보드', items: [
    { id: 'home', label: '홈', icon: '01' },
  ]},
  { group: '콘텐츠', items: [
    { id: 'projects', label: '프로젝트', icon: '02' },
    { id: 'resume', label: '경력·학력', icon: '03' },
    { id: 'about', label: '소개', icon: '04' },
    { id: 'achievements', label: '핵심 성과', icon: '05' },
    { id: 'journey', label: '커리어 저니', icon: '06' },
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
    { id: 'taxonomy', label: '배지·스킬 분류', icon: '13' },
    { id: 'history', label: '변경 이력', icon: '14' },
    { id: 'account', label: '관리자 계정', icon: '15' },
    { id: 'design-system', label: '디자인 시스템', icon: '16' },
  ]},
]

function confirmDraftDelete(title, target) {
  const namedTarget = String(target || '').trim() ? `‘${String(target).trim()}’ 항목` : '선택한 항목'
  return adminConfirm(`${namedTarget}을 편집 목록에서 삭제합니다. 저장 버튼을 눌러야 실제 데이터에 반영됩니다.`, {
    title,
    confirmLabel: '삭제',
  })
}

/* ─── Sub-editors ─── */


/* ─── Resume Sub-editors (defined outside to avoid remount on state change) ─── */

function EducationEditor({ item, index, onChange, onRemove }) {
  return (
    <div className="admin-education-row">
      <span className="admin-collection-index">{String(index + 1).padStart(2, '0')}</span>
      <Field label="학교" value={item.school} onChange={(v) => onChange({ ...item, school: v })} />
      <Field label="학위" value={item.degree} onChange={(v) => onChange({ ...item, degree: v })} />
      <div className="admin-related-action-group">
        <YearRangeField value={item.period} onChange={(v) => onChange({ ...item, period: v })} />
        <button type="button" onClick={onRemove} aria-label={`${item.school || '학력'} 삭제`} className="admin-row-delete">삭제</button>
      </div>
    </div>
  )
}

function WorkEditor({ item, onChange, onRemove, collapsed, onToggle }) {
  const [panel, setPanel] = useState('overview')
  const [projectIndex, setProjectIndex] = useState(0)
  const projects = item.projects || []

  if (collapsed) {
    return (
      <button type="button" aria-expanded="false" onClick={onToggle} className="admin-work-summary">
        <span className="admin-work-summary__chevron" aria-hidden="true">›</span>
        <strong>{item.company || '새 경력'}</strong>
        <span>{item.title || '직함 없음'}</span>
        <small>{projects.length ? `프로젝트 ${projects.length}` : '프로젝트 없음'}</small>
        <time>{item.period || '기간 없음'}</time>
      </button>
    )
  }
  const swap = (arr, i, j) => { const a = [...arr]; [a[i], a[j]] = [a[j], a[i]]; return a }
  const updateProject = (idx, p) => { const ps = [...projects]; ps[idx] = p; onChange({ ...item, projects: ps }) }
  const removeProject = async (idx) => {
    if (!(await confirmDraftDelete('경력 프로젝트 삭제', projects[idx]?.title || `프로젝트 ${idx + 1}`))) return
    onChange({ ...item, projects: projects.filter((_, i) => i !== idx) })
    setProjectIndex(Math.max(0, idx - 1))
  }
  const moveProject = (idx, dir) => { const j = idx + dir; if (j < 0 || j >= projects.length) return; onChange({ ...item, projects: swap(projects, idx, j) }) }
  const addProject = () => { onChange({ ...item, projects: [...projects, { title: '', period: '', role: '', team: '', summary: '', result: '' }] }); setProjectIndex(projects.length); setPanel('projects') }
  const activeProject = projects[Math.min(projectIndex, Math.max(0, projects.length - 1))]

  return (
    <article className="admin-record-editor">
      <header>
        <div><strong>{item.company || '새 경력'}</strong><span>{item.title || '직함 없음'} · {item.period || '기간 없음'}</span></div>
        <div>
          {onToggle && <button onClick={onToggle} className="admin-toolbar-button">접기</button>}
          <button onClick={onRemove} className="admin-danger-button">경력 삭제</button>
        </div>
      </header>
      <nav className="admin-record-tabs" aria-label={`${item.company || '경력'} 편집 영역`}>
        <button type="button" aria-pressed={panel === 'overview'} onClick={() => setPanel('overview')}>기본 정보</button>
        <button type="button" aria-pressed={panel === 'projects'} onClick={() => setPanel('projects')}>프로젝트 {projects.length}</button>
        <button type="button" aria-pressed={panel === 'other'} onClick={() => setPanel('other')}>기타 업무</button>
      </nav>
      <div className="admin-record-editor__body">
        {panel === 'overview' && <div className="space-y-3">
          <div className="admin-work-overview-grid">
            <Field label="회사" value={item.company} onChange={(v) => onChange({ ...item, company: v })} />
            <Field label="직함" value={item.title} onChange={(v) => onChange({ ...item, title: v })} />
            <MonthRangeField value={item.period} onChange={(v) => onChange({ ...item, period: v })} />
          </div>
          <Field label="설명 (마크다운)" value={item.description} onChange={(v) => onChange({ ...item, description: v })} rows={2} />
          {item.leaveNote !== undefined && <Field label="휴직 메모" value={item.leaveNote || ''} onChange={(v) => onChange({ ...item, leaveNote: v })} />}
        </div>}
        {panel === 'projects' && <div className="admin-project-master-detail">
          <aside>
            <header><b>프로젝트</b><button type="button" onClick={addProject}>+ 추가</button></header>
            {projects.map((project, index) => <button key={index} type="button" aria-pressed={projectIndex === index} onClick={() => setProjectIndex(index)}><span>{String(index + 1).padStart(2, '0')}</span><b>{project.title || '새 프로젝트'}</b><small>{project.period || '기간 없음'}</small></button>)}
          </aside>
          <section>
            {activeProject ? <>
              <header><div><b>{activeProject.title || '새 프로젝트'}</b><span>선택한 프로젝트만 편집합니다.</span></div><div><button type="button" disabled={projectIndex === 0} onClick={() => moveProject(projectIndex, -1)}>↑</button><button type="button" disabled={projectIndex === projects.length - 1} onClick={() => moveProject(projectIndex, 1)}>↓</button><button type="button" className="admin-row-delete" onClick={() => removeProject(projectIndex)}>삭제</button></div></header>
              <div className="admin-project-detail-grid">
                <Field label="제목" value={activeProject.title || ''} onChange={(v) => updateProject(projectIndex, { ...activeProject, title: v })} />
                <MonthRangeField value={activeProject.period || ''} onChange={(v) => updateProject(projectIndex, { ...activeProject, period: v })} allowCurrent={false} />
                <Field label="역할" value={activeProject.role || ''} onChange={(v) => updateProject(projectIndex, { ...activeProject, role: v })} />
                <Field label="인원" value={activeProject.team || ''} onChange={(v) => updateProject(projectIndex, { ...activeProject, team: v })} />
              </div>
              <Field label="주요 내용 (마크다운)" value={activeProject.summary || ''} onChange={(v) => updateProject(projectIndex, { ...activeProject, summary: v })} rows={3} className="mt-3" />
              <Field label="성과 (마크다운)" value={activeProject.result || ''} onChange={(v) => updateProject(projectIndex, { ...activeProject, result: v })} rows={2} className="mt-3" />
            </> : <div className="admin-empty-state"><span>00</span><b>프로젝트가 없습니다</b><p>이 경력에 연결할 프로젝트를 추가하세요.</p><button type="button" className="admin-primary-button" onClick={addProject}>프로젝트 추가</button></div>}
          </section>
        </div>}
        {panel === 'other' && <Field label="기타 업무 (마크다운, - 항목은 프로젝트 수에 포함)" value={item.otherProjects || ''} onChange={(v) => onChange({ ...item, otherProjects: v })} rows={4} />}
      </div>
    </article>
  )
}

function ActivityEditor({ item, index, onChange, onRemove }) {
  return (
    <div className="admin-activity-row">
      <span className="admin-collection-index">{String(index + 1).padStart(2, '0')}</span>
      <YearField value={item.year} onChange={(v) => onChange({ ...item, year: v })} />
      <Field label="카테고리" value={item.category} onChange={(v) => onChange({ ...item, category: v })} />
      <Field label="내용" value={item.summary} onChange={(v) => onChange({ ...item, summary: v })} />
      <div className="admin-related-action-group">
        <Field label="링크 URL" value={item.link || ''} onChange={(v) => onChange({ ...item, link: v })} />
        <button type="button" onClick={onRemove} aria-label={`${item.summary || '활동'} 삭제`} className="admin-row-delete">삭제</button>
      </div>
    </div>
  )
}

function taxonomyOptions(config = loadTaxonomyConfig(), currentValue = '') {
  const options = (config.categories || []).map((item) => ({ value: item.key, label: item.label }))
  return currentValue && !options.some((item) => item.value === currentValue)
    ? [{ value: currentValue, label: `${currentValue} (기존 값)` }, ...options]
    : options
}

function normalizeSlug(value) {
  return String(value || '')
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
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
  const handleReset = async () => { if (await adminConfirm('경력·학력 편집 내용을 기본값으로 되돌립니다.', { title: '경력·학력 초기화', confirmLabel: '초기화' })) { resetResumeConfig(); setConfig(loadResumeConfig()); flash('초기화 완료') } }

  const updateItem = (key, index, updated) => { const arr = [...config[key]]; arr[index] = updated; setConfig({ ...config, [key]: arr }) }
  const removeItem = async (key, index) => {
    const item = config[key][index]
    const type = key === 'work' ? '경력' : key === 'education' ? '학력' : '활동'
    const name = key === 'work' ? item?.company : key === 'education' ? item?.school : item?.summary
    if (!(await confirmDraftDelete(`${type} 삭제`, name || `${type} ${index + 1}`))) return
    setConfig({ ...config, [key]: config[key].filter((_, i) => i !== index) })
  }

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

      <section className="admin-collection">
        <header className="admin-collection__header">
          <div><h3>경력</h3><p>회사를 먼저 고른 뒤, 기본 정보와 프로젝트를 한 항목씩 편집합니다.</p></div>
          <div>
            <button type="button" className="admin-toolbar-button" onClick={() => setWorkOpen(Object.fromEntries(config.work.map((_, i) => [i, true])))}>모두 펼치기</button>
            <button type="button" className="admin-toolbar-button" onClick={() => setWorkOpen({})}>모두 접기</button>
            <button type="button" className="admin-primary-button" onClick={addWork}>경력 추가</button>
          </div>
        </header>
        {config.work.length > 1 && (
          <nav className="admin-collection__jump" aria-label="경력 바로가기">
            {config.work.map((w, i) => (
              <button type="button" key={i} onClick={() => jumpToWork(i)}>
                {w.company || `경력 ${i + 1}`}
              </button>
            ))}
          </nav>
        )}
        <div className="admin-collection__body">
          {config.work.map((item, i) => (
            <div key={i} id={`work-card-${i}`} className="scroll-mt-24">
              <WorkEditor item={item} collapsed={!workOpen[i]} onToggle={() => toggleWork(i)} onChange={(u) => updateItem('work', i, u)} onRemove={() => removeItem('work', i)} />
            </div>
          ))}
          {config.work.length === 0 && <div className="admin-empty-state"><span>00</span><b>등록된 경력이 없습니다</b><p>회사와 역할, 연결 프로젝트를 추가하세요.</p><button type="button" className="admin-primary-button" onClick={addWork}>경력 추가</button></div>}
        </div>
      </section>

      <section className="admin-collection">
        <header className="admin-collection__header">
          <div><h3>학력</h3><p>학교, 학위와 재학 기간을 한 행에서 관리합니다.</p></div>
          <button type="button" className="admin-primary-button" onClick={addEducation}>학력 추가</button>
        </header>
        <div className="admin-collection__body admin-collection__body--table">
          {config.education.length > 0 && <div className="admin-education-head" aria-hidden="true"><span>순서</span><span>학교</span><span>학위</span><span>기간 및 관리</span></div>}
          {config.education.map((item, i) => (
            <EducationEditor key={i} index={i} item={item} onChange={(u) => updateItem('education', i, u)} onRemove={() => removeItem('education', i)} />
          ))}
          {config.education.length === 0 && <div className="admin-empty-state"><span>00</span><b>등록된 학력이 없습니다</b><p>공개할 학력만 추가하세요.</p><button type="button" className="admin-primary-button" onClick={addEducation}>학력 추가</button></div>}
        </div>
      </section>

      <section className="admin-collection">
        <header className="admin-collection__header">
          <div><h3>활동</h3><p>발표, 기고 등 경력 외 활동을 연도별로 관리합니다.</p></div>
          <button type="button" className="admin-primary-button" onClick={addActivity}>활동 추가</button>
        </header>
        <div className="admin-collection__body admin-collection__body--table">
          {config.activities.length > 0 && <div className="admin-activity-head" aria-hidden="true"><span>순서</span><span>연도</span><span>카테고리</span><span>내용</span><span>링크 및 관리</span></div>}
          {config.activities.map((item, i) => (
            <ActivityEditor key={i} index={i} item={item} onChange={(u) => updateItem('activities', i, u)} onRemove={() => removeItem('activities', i)} />
          ))}
          {config.activities.length === 0 && <div className="admin-empty-state"><span>00</span><b>등록된 활동이 없습니다</b><p>발표, 기고 또는 외부 활동을 추가하세요.</p><button type="button" className="admin-primary-button" onClick={addActivity}>활동 추가</button></div>}
        </div>
      </section>

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
  const handleReset = async () => { if (await adminConfirm('히어로 편집 내용을 기본값으로 되돌립니다.', { title: '히어로 초기화', confirmLabel: '초기화' })) { resetHeroConfig(); setConfig(loadHeroConfig()); flash('초기화 완료') } }

  return (
    <div>
      <SectionHeader title="히어로" description="메인 화면 상단 영역을 설정합니다" />
      <ActionBar>
        <SaveButton onClick={handleSave} />
        <ResetButton onClick={handleReset} />
        <JsonBulkEditor value={config} onApply={(value) => { setConfig(value); flash('JSON 적용 완료 — 저장 버튼을 눌러주세요') }} />
        <div className="flex-1" /><ImportExportBar onImport={async (file) => { setConfig(await importJson(file)); flash('가져오기 완료 — 저장 버튼을 눌러주세요') }} onExport={() => downloadJson(config, 'hero.json')} />
      </ActionBar>
      <div className="admin-document-editor">
        <section className="admin-form-section">
          <header><h3>식별 정보</h3><p>브라우저 제목과 히어로 상단에 쓰이는 짧은 문구입니다.</p></header>
          <div className="admin-field-grid admin-field-grid--2">
            <Field label="사이트 타이틀" value={config.siteTitle || ''} onChange={(v) => update('siteTitle', v)} />
            <Field label="태그라인" value={config.tagline} onChange={(v) => update('tagline', v)} />
          </div>
        </section>
        <section className="admin-form-section">
          <header><h3>메인 메시지</h3><p>방문자가 가장 먼저 읽는 제목과 설명입니다. 줄바꿈은 입력한 그대로 유지됩니다.</p></header>
          <div className="admin-field-grid admin-field-grid--2 admin-field-grid--copy">
            <Field label="헤드라인" value={config.headline} onChange={(v) => update('headline', v)} rows={3} />
            <Field label="서브타이틀" value={config.subtitle} onChange={(v) => update('subtitle', v)} rows={3} />
          </div>
        </section>
        <section className="admin-form-section admin-form-section--compact">
          <header><h3>주요 행동</h3><p>히어로에서 포트폴리오로 이동하는 버튼의 문구입니다.</p></header>
          <div className="admin-field-grid admin-field-grid--compact">
            <Field label="버튼 텍스트" value={config.ctaText} onChange={(v) => update('ctaText', v)} />
          </div>
        </section>
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
  const handleReset = async () => { if (await adminConfirm('접속 화면 편집 내용을 기본값으로 되돌립니다.', { title: '접속 화면 초기화', confirmLabel: '초기화' })) { resetAuthGateConfig(); setConfig(loadAuthGateConfig()); flash('초기화 완료') } }

  return (
    <div>
      <SectionHeader title="접속 화면" description="방문자 인증 화면의 텍스트를 설정합니다" />
      <ActionBar>
        <SaveButton onClick={handleSave} />
        <ResetButton onClick={handleReset} />
        <JsonBulkEditor value={config} onApply={(value) => { setConfig(value); flash('JSON 적용 완료 — 저장 버튼을 눌러주세요') }} />
        <div className="flex-1" /><ImportExportBar onImport={async (file) => { setConfig(await importJson(file)); flash('가져오기 완료 — 저장 버튼을 눌러주세요') }} onExport={() => downloadJson(config, 'auth-gate.json')} />
      </ActionBar>
      <div className="admin-document-editor">
        <section className="admin-form-section">
          <header><h3>인증 안내</h3><p>토큰 입력 전 방문자에게 보여줄 메시지와 실행 버튼을 설정합니다.</p></header>
          <div className="admin-field-grid admin-field-grid--2">
            <Field label="태그라인" value={config.tagline} onChange={(v) => update('tagline', v)} />
            <Field label="버튼 텍스트" value={config.buttonText} onChange={(v) => update('buttonText', v)} />
            <Field label="헤드라인" value={config.headline} onChange={(v) => update('headline', v)} rows={3} />
            <Field label="서브타이틀" value={config.subtitle} onChange={(v) => update('subtitle', v)} rows={3} />
          </div>
        </section>
        <section className="admin-form-section">
          <header><h3>접속 문의</h3><p>토큰이 없는 방문자에게 표시되는 연락 안내입니다.</p></header>
          <div className="admin-field-grid admin-field-grid--2">
            <Field label="안내 메시지" value={config.contactMessage} onChange={(v) => update('contactMessage', v)} />
            <Field label="연락 이메일" type="email" value={config.contactEmail} onChange={(v) => update('contactEmail', v)} />
            <Field className="admin-field-span-2" label="추가 안내" value={config.contactHint} onChange={(v) => update('contactHint', v)} />
          </div>
        </section>
      </div>
      <Toast message={toast} />
    </div>
  )
}

/* ─── Theme Section ─── */

function ThemePicker({ value, onChange, previewView, onPreview }) {
  const systemPage = (themeId) => themeId === 'mist' ? '/front-system.html' : `/front-system-${themeId}.html`
  return (
    <div className="admin-theme-grid">
      {THEMES.map((th) => (
        <article key={th.id} className="admin-theme-card" data-selected={value === th.id ? 'true' : 'false'}>
          <button type="button" onClick={() => onChange(th.id)} aria-pressed={value === th.id} className="admin-theme-card__select">
            <span className="admin-theme-card__heading">
              <span className="admin-theme-swatch" aria-hidden="true">
                {th.swatch.map((c) => <i key={c} style={{ background: c }} />)}
              </span>
              <span>{th.name}</span>
              {value === th.id && <small>선택됨</small>}
            </span>
            <span className="admin-theme-card__desc">{th.desc}</span>
          </button>
          <div className="admin-theme-card__actions">
            {onPreview && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onPreview(previewView, th.id) }}
                title="이 테마로 실제 화면 미리보기"
                className="admin-theme-card__preview"
              >실제 화면 미리보기</button>
            )}
            <a
              href={systemPage(th.id)}
              target="_blank"
              rel="noopener noreferrer"
              data-theme-design-system={th.id}
              aria-label={`${th.name} 테마 디자인 시스템 보기`}
              title={`${th.name} 디자인 시스템을 새 탭에서 보기`}
              className="admin-theme-card__system"
            >디자인 시스템 보기</a>
          </div>
        </article>
      ))}
    </div>
  )
}

function ThemeSection({ onPreviewTheme, onOpenDesignSystem }) {
  const [settings, setSettings] = useState(loadThemeSettings)
  const [target, setTarget] = useState('entry')
  const [toast, setToast] = useState('')

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2000) }
  const handleSave = () => { saveThemeSettings(settings); flash('테마 설정 저장 완료') }
  const handleReset = async () => {
    if (await adminConfirm('진입 화면과 기본 방문자 테마를 기본값으로 되돌립니다.', { title: '테마 설정 초기화', confirmLabel: '초기화' })) {
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
        <div className="flex-1" />
        <ImportExportBar onImport={async (file) => { setSettings(await importJson(file)); flash('가져오기 완료 — 저장 버튼을 눌러주세요') }} onExport={() => downloadJson(settings, 'theme-settings.json')} />
      </ActionBar>
      <div className="admin-theme-workspace">
        <section className="admin-panel admin-panel--accent">
          <div className="admin-panel-heading mb-0">
            <div className="admin-system-reference__copy"><p className="text-[10px] font-mono tracking-wider text-accent">SYSTEM REFERENCE</p><h3>디자인 시스템 · UX 규칙 · IA</h3><p className="admin-system-reference__description">라이트·다크 토큰, 운영 컴포넌트, 통계 그래프, 상태·안전 규칙과 모바일·태블릿·데스크톱 계약을 확인합니다.</p></div>
            <button type="button" onClick={onOpenDesignSystem} className="admin-secondary-button shrink-0">시스템 열기</button>
          </div>
          <p className="admin-system-reference__footnote"><code>docs/DESIGN_SYSTEM.md</code>가 문서의 단일 기준이며, 이 페이지는 같은 규칙을 시각화합니다.</p>
        </section>
        <section className="admin-theme-assignment">
          <header>
            <div><span>적용 대상</span><h3>화면을 고른 뒤 방문자 테마를 선택합니다</h3></div>
          </header>
          <div className="admin-theme-targets" role="tablist" aria-label="테마 적용 대상">
            <button type="button" role="tab" aria-selected={target === 'entry'} onClick={() => setTarget('entry')}><b>진입 화면</b><span>인증 전 토큰 입력 화면</span></button>
            <button type="button" role="tab" aria-selected={target === 'visitor'} onClick={() => setTarget('visitor')}><b>기본 방문자</b><span>별도 지정이 없는 토큰</span></button>
          </div>
          <p className="admin-theme-token-note">토큰별 테마는 토큰 발급·재발급 화면에서 선택합니다.</p>
          <div className="admin-theme-picker-panel" role="tabpanel">
            <p className="admin-theme-picker-panel__context">{target === 'entry' ? '토큰 입력 전 화면에만 적용됩니다.' : '테마가 지정되지 않은 토큰에 적용됩니다.'}</p>
            {target === 'entry'
              ? <ThemePicker value={settings.entryTheme} onChange={(v) => setSettings({ ...settings, entryTheme: v })} previewView="gate" onPreview={onPreviewTheme} />
              : <ThemePicker value={settings.defaultVisitorTheme} onChange={(v) => setSettings({ ...settings, defaultVisitorTheme: v })} previewView="site" onPreview={onPreviewTheme} />}
          </div>
        </section>
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
  const handleReset = async () => { if (await adminConfirm('연락처 편집 내용을 기본값으로 되돌립니다.', { title: '연락처 초기화', confirmLabel: '초기화' })) { resetContactConfig(); setConfig(loadContactConfig()); flash('초기화 완료') } }

  return (
    <div>
      <SectionHeader title="연락처" description="하단 연락처 영역의 내용을 설정합니다" />
      <ActionBar>
        <SaveButton onClick={handleSave} />
        <ResetButton onClick={handleReset} />
        <JsonBulkEditor value={config} onApply={(value) => { setConfig(value); flash('JSON 적용 완료 — 저장 버튼을 눌러주세요') }} />
        <div className="flex-1" /><ImportExportBar onImport={async (file) => { setConfig(await importJson(file)); flash('가져오기 완료 — 저장 버튼을 눌러주세요') }} onExport={() => downloadJson(config, 'contact.json')} />
      </ActionBar>
      <div className="admin-document-editor">
        <section className="admin-form-section">
          <header><h3>연락 메시지</h3><p>페이지 하단에서 방문자에게 보이는 제목과 설명입니다.</p></header>
          <div className="admin-field-grid admin-field-grid--2 admin-field-grid--copy">
            <Field label="제목" value={config.heading} onChange={(v) => update('heading', v)} />
            <Field label="메시지" value={config.message} onChange={(v) => update('message', v)} rows={3} />
          </div>
        </section>
        <section className="admin-form-section">
          <header><h3>연락 경로</h3><p>이메일과 외부 프로필 링크, 하단 저작권 문구를 관리합니다.</p></header>
          <div className="admin-field-grid admin-field-grid--2">
            <Field label="이메일" type="email" value={config.email} onChange={(v) => update('email', v)} />
            <Field label="LinkedIn 라벨" value={config.linkedinLabel} onChange={(v) => update('linkedinLabel', v)} />
            <Field className="admin-field-span-2" label="LinkedIn URL" type="url" value={config.linkedinUrl} onChange={(v) => update('linkedinUrl', v)} />
            <Field className="admin-field-span-2" label="저작권 문구" value={config.copyright} onChange={(v) => update('copyright', v)} />
          </div>
        </section>
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
  const [chartRange, setChartRange] = useState(14)
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

  const handleRevoke = async (id) => { if (await adminConfirm('비밀값은 즉시 삭제되고 구분 정보만 폐기 탭에 보관됩니다.', { title: '토큰 폐기', confirmLabel: '폐기' })) { revokeAccessToken(id); refresh() } }
  const handleDelete = async (id) => { if (await adminConfirm('폐기 기록을 완전히 삭제합니다. 이 작업은 되돌릴 수 없습니다.', { title: '폐기 기록 삭제', confirmLabel: '영구 삭제' })) { deleteAccessToken(id); refresh() } }
  const handleExpire = async (id) => { if (await adminConfirm('선택한 토큰을 지금 즉시 만료합니다.', { title: '토큰 즉시 만료', confirmLabel: '만료' })) { forceExpireToken(id); refresh() } }
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
    if (!(await adminConfirm(`‘${t.label}’의 기존 토큰은 즉시 사용할 수 없게 되며 새 토큰을 다시 전달해야 합니다.`, { title: '토큰 재발급', confirmLabel: '재발급' }))) return
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

  const visibleTokens = filterTokens(tokens, tokenTab, tokenNow)
  const tokenCounts = {
    active: filterTokens(tokens, 'active', tokenNow).length,
    expired: filterTokens(tokens, 'expired', tokenNow).length,
    revoked: tokens.filter((token) => token.revoked).length,
  }

  return (
    <div>
      <SectionHeader title="접속 토큰" description="방문자에게 발급할 접속 토큰을 관리합니다" />

      {/* Access Stats Chart */}
      {(() => {
        const allLogs = getAccessLog()
        const colors = [
          'var(--admin-accent)',
          'color-mix(in srgb, var(--admin-accent) 76%, var(--admin-ink))',
          'color-mix(in srgb, var(--admin-accent) 58%, var(--admin-muted))',
          'color-mix(in srgb, var(--admin-accent) 42%, var(--admin-line-strong))',
        ]
        const DAY = 24 * 60 * 60 * 1000
        const bucketDays = chartRange > 30 ? 7 : 1
        const bucketCount = Math.ceil(chartRange / bucketDays)
        const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0)
        const rangeStart = todayStart.getTime() - (chartRange - 1) * DAY
        const rangeLogs = allLogs.filter((log) => log.accessedAt >= rangeStart)

        // Token labels sorted by total count → stable color mapping
        const byToken = {}
        rangeLogs.forEach(log => {
          const lbl = log.tokenLabel || 'unknown'
          byToken[lbl] = (byToken[lbl] || 0) + 1
        })
        const tokenEntries = Object.entries(byToken).sort((a, b) => b[1] - a[1])
        const colorOf = {}
        tokenEntries.forEach(([lbl], i) => { colorOf[lbl] = colors[i % colors.length] })

        // Daily buckets up to 30 days; 90 days is grouped by week.
        const days = Array.from({ length: bucketCount }, (_, i) => {
          const start = rangeStart + i * bucketDays * DAY
          return { start, end: Math.min(start + bucketDays * DAY, todayStart.getTime() + DAY), perToken: {}, total: 0 }
        })
        rangeLogs.forEach(log => {
          const day = days.find(d => log.accessedAt >= d.start && log.accessedAt < d.end)
          if (!day) return
          const lbl = log.tokenLabel || 'unknown'
          day.perToken[lbl] = (day.perToken[lbl] || 0) + 1
          day.total += 1
        })
        const maxCount = Math.max(...days.map(d => d.total), 1)

        const todayCount = allLogs.filter((log) => log.accessedAt >= todayStart.getTime()).length
        const week = allLogs.filter((log) => log.accessedAt >= todayStart.getTime() - 6 * DAY).length
        const prevWeek = allLogs.filter((log) => log.accessedAt >= todayStart.getTime() - 13 * DAY && log.accessedAt < todayStart.getTime() - 6 * DAY).length
        const lastAccess = allLogs.length > 0 ? Math.max(...allLogs.map(l => l.accessedAt)) : null

        return (
          <div className="admin-token-analytics">
            <div className="admin-token-analytics__header">
              <div>
                <h3>접속 추이</h3>
                <span>{bucketDays === 1 ? '일 단위' : '주 단위'} · 마지막 접속 {lastAccess ? formatDate(lastAccess) : '기록 없음'}</span>
              </div>
              <label>
                <span className="sr-only">통계 조회 기간</span>
                <select value={chartRange} onChange={(event) => { setChartRange(Number(event.target.value)); setHoverStat(null) }}>
                  <option value={7}>최근 7일</option>
                  <option value={14}>최근 14일</option>
                  <option value={30}>최근 30일</option>
                  <option value={90}>최근 90일</option>
                </select>
              </label>
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
                <p className="text-[10px] text-gray-500">선택 기간</p>
                <p className="text-lg font-bold text-white">{rangeLogs.length}<span className="text-[10px] text-gray-500 font-normal ml-1">회</span></p>
              </div>
            </div>

            {rangeLogs.length === 0 ? (
              <div className="admin-token-chart-empty">
                <span className="admin-token-chart-empty__mark" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 19V9m6 10V5m6 14v-7m4 7H2" />
                  </svg>
                </span>
                <div>
                  <b>아직 접속 기록이 없습니다</b>
                  <span>접속이 기록되면 이곳에 날짜별 추이와 토큰별 구성이 표시됩니다.</span>
                </div>
              </div>
            ) : (
              <>
                {/* Stacked daily bars */}
                <div className="relative">
                  <div className="flex items-end gap-1 h-24 mb-1" onMouseLeave={() => setHoverStat(null)}>
                    {days.map((d, i) => (
                      <div key={i} onMouseEnter={() => setHoverStat(i)} className={`flex-1 flex flex-col items-center justify-end gap-1 h-full rounded ${hoverStat === i ? 'bg-gray-800/50' : ''}`}>
                        <span className={`text-[9px] ${d.total > 0 ? 'text-gray-400' : 'text-gray-700'}`}>{d.total > 0 ? d.total : ''}</span>
                        <div className="w-full flex flex-col-reverse rounded-t overflow-hidden" style={{ height: `${(d.total / maxCount) * 100}%`, minHeight: d.total > 0 ? '3px' : '1px', backgroundColor: d.total === 0 ? 'var(--admin-line)' : undefined }}>
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
                        {Object.entries(d.perToken).map(([lbl, cnt]) => (
                          <p key={lbl} className="text-[11px] text-gray-300 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full inline-block shrink-0" style={{ backgroundColor: colorOf[lbl] }} />
                            {lbl} <b className="text-white ml-auto pl-2">{cnt}</b>
                          </p>
                        ))}
                      </div>
                    )
                  })()}
                </div>
                <div className="flex gap-1 mb-4">
                  {days.map((d, i) => {
                    const dt = new Date(d.start)
                    const isToday = i === days.length - 1
                    const showLabel = days.length <= 14 || i % 5 === 0 || isToday
                    return (
                      <div key={i} className={`flex-1 text-center text-[8px] truncate ${isToday ? 'text-accent font-bold' : 'text-gray-600'}`}>
                        {isToday ? '오늘' : showLabel ? `${dt.getMonth() + 1}/${dt.getDate()}` : ''}
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
              </>
            )}
          </div>
        )
      })()}

      <div className="admin-token-toolbar">
        <div className="admin-token-filters" aria-label="토큰 상태 필터">
          {[
            { key: 'active', label: '활성', count: tokenCounts.active },
            { key: 'expired', label: '만료', count: tokenCounts.expired },
            { key: 'revoked', label: '폐기', count: tokenCounts.revoked },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setTokenTab(tab.key)}
              aria-pressed={tokenTab === tab.key}
            >
              <span>{tab.label}</span><b>{tab.count}</b>
            </button>
          ))}
        </div>
        <button onClick={() => setCreateOpen(true)} className="admin-primary-button">
          + 새 토큰 생성
        </button>
      </div>

      {/* Create Token Modal */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div aria-hidden="true" className="admin-dialog-backdrop" onClick={closeCreate} />
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

      <section className="admin-token-register" aria-label={`${tokenTab === 'active' ? '활성' : tokenTab === 'expired' ? '만료' : '폐기'} 토큰 목록`}>
        <div className="admin-token-register__head" aria-hidden="true">
          <span>뷰어 / 토큰</span>
          <span>접속 범위</span>
          <span>방문자 테마</span>
          <span>작업</span>
        </div>
        {visibleTokens.length === 0 && (
          <div className="admin-empty-state admin-token-empty">
            <b>{tokenTab === 'active' ? '활성 토큰이 없습니다' : tokenTab === 'expired' ? '만료된 토큰이 없습니다' : '폐기 기록이 없습니다'}</b>
            <p>{tokenTab === 'active' ? '새 토큰을 만들면 이 목록에서 접속 기한과 사용 상태를 관리할 수 있습니다.' : '해당 상태의 토큰이 생기면 여기에 표시됩니다.'}</p>
          </div>
        )}
        {visibleTokens.map((t) => {
          const status = getTokenStatus(t, tokenNow)
          const isActive = isActiveToken(t, tokenNow)
          const logs = getAccessLogForToken(t.id)
          const isExpanded = expandedToken === t.id
          const lastAccess = logs.length > 0 ? logs[logs.length - 1].accessedAt : null

          return (
            <article key={t.id} className="admin-token-record">
              <div className="admin-token-record__summary">
                <div className="admin-token-identity">
                  <span className="admin-token-cell-label">뷰어 / 토큰</span>
                  <div className="admin-token-title-row">
                    {editingLabel === t.id ? (
                      <input
                        value={editLabelValue}
                        onChange={(e) => setEditLabelValue(e.target.value)}
                        onBlur={saveRename}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveRename(); if (e.key === 'Escape') setEditingLabel(null) }}
                        autoFocus
                        aria-label="토큰 라벨"
                        className="admin-token-rename"
                      />
                    ) : (
                      <button className="admin-token-name" onClick={() => startRename(t)} title="클릭하여 이름 변경">{t.label}</button>
                    )}
                    <span className="admin-token-status" data-status={t.revoked ? 'revoked' : isActive ? 'active' : 'expired'}>
                      <i aria-hidden="true" />{status.text}
                    </span>
                  </div>
                  <p className="admin-token-hint">
                    <code>{t.token || t.tokenHint}</code>
                    {!t.token && t.tokenHint && <span>{t.revoked ? '비밀값 삭제됨' : '전체 값은 생성 시 한 번만 표시'}</span>}
                  </p>
                </div>

                <dl className="admin-token-access">
                  <div><dt>생성</dt><dd>{formatDate(t.createdAt)}</dd></div>
                  <div><dt>만료</dt><dd>{formatDate(t.expiresAt)}</dd></div>
                  <div><dt>최근 접속</dt><dd>{lastAccess ? formatDate(lastAccess) : '기록 없음'}</dd></div>
                </dl>

                <div className="admin-token-theme">
                  <span className="admin-token-cell-label">방문자 테마</span>
                  {!t.revoked ? (
                    <select
                      value={t.theme || 'default'}
                      onChange={(e) => { setAccessTokenTheme(t.id, e.target.value); refresh(); flash('테마 변경 완료') }}
                      aria-label={`${t.label} 방문자 테마`}
                      title="이 토큰으로 접속한 방문자에게 적용되는 테마"
                    >
                      {THEMES.map((th) => <option key={th.id} value={th.id}>{th.name}</option>)}
                    </select>
                  ) : (
                    <span className="admin-token-theme__value">{getTheme(t.theme || 'default').name}</span>
                  )}
                </div>

                <div className="admin-token-actions">
                  <span className="admin-token-cell-label">작업</span>
                  {t.token && <button onClick={() => copyToken(t.token)} className="admin-token-action">복사</button>}
                  {t.token && <button onClick={() => downloadTokenQR(t.label, t.token)} className="admin-token-action" title="접속 QR 코드 PNG 다운로드">QR</button>}
                  {(logs.length > 0 || t.extensions?.length > 0) && (
                    <button onClick={() => setExpandedToken(isExpanded ? null : t.id)} className="admin-token-action" aria-expanded={isExpanded}>
                      이력 {logs.length + (t.extensions?.length || 0)}
                    </button>
                  )}
                  <details className="admin-token-more">
                    <summary aria-label={`${t.label} 관리 메뉴`}>관리</summary>
                    <div className="admin-token-more__menu">
                      {!t.revoked && <button onClick={() => handleReissue(t)}>새 값으로 재발급</button>}
                      {!t.revoked && <button onClick={() => { setExtendingToken(extendingToken === t.id ? null : t.id); setExtendDays(7) }}>유효기간 연장</button>}
                      {isActive && <button onClick={() => handleExpire(t.id)}>지금 만료</button>}
                      {!t.revoked && <button onClick={() => handleRevoke(t.id)} className="is-danger">토큰 폐기</button>}
                      {t.revoked && <button onClick={() => handleDelete(t.id)} className="is-danger">기록 영구 삭제</button>}
                    </div>
                  </details>
                </div>
              </div>

              {extendingToken === t.id && (
                <div className="admin-token-extension">
                  <b>유효기간 연장</b>
                  <div>
                    {[7, 14, 30].map((d) => <button key={d} onClick={() => handleExtend(t.id, d)}>+{d}일</button>)}
                    <label>
                      <span className="sr-only">직접 입력할 연장 일수</span>
                      <input type="number" min="1" value={extendDays} onChange={(e) => setExtendDays(e.target.value)} />
                      <i>일</i>
                    </label>
                    <button onClick={() => handleExtend(t.id, extendDays)} className="admin-primary-button">적용</button>
                  </div>
                  <small>만료 전에는 기존 만료일, 만료 후에는 오늘을 기준으로 연장합니다.</small>
                </div>
              )}

              {isExpanded && (
                <div className="admin-token-history">
                  {t.extensions?.length > 0 && (
                    <section>
                      <h4>연장 이력</h4>
                      {t.extensions.map((ext, i) => (
                        <p key={i}><b>+{ext.addDays}일</b><span>{formatDate(ext.at)}</span><span>{formatDate(ext.from)} → {formatDate(ext.to)}</span></p>
                      ))}
                    </section>
                  )}
                  {logs.length > 0 && (
                    <section>
                      <h4>접속 로그</h4>
                      {logs.map((log, i) => {
                        const live = log.lastSeenAt && Date.now() - log.lastSeenAt < 6 * 60 * 1000
                        const dur = log.lastSeenAt ? Math.round((log.lastSeenAt - log.accessedAt) / 60000) : null
                        return (
                          <p key={i}>
                            <span>{formatDate(log.accessedAt)}</span>
                            <span>{parseBrowser(log.userAgent)} · {parseOS(log.userAgent)}</span>
                            {live ? <b className="is-live">열람 중</b> : dur >= 1 ? <span>체류 {dur}분</span> : <span>단일 접속</span>}
                          </p>
                        )
                      })}
                    </section>
                  )}
                </div>
              )}
            </article>
          )
        })}
      </section>
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

function ProjectsSection({ initialMode = 'standard' }) {
  const [data, setData] = useState(loadProjects)
  const [mode, setMode] = useState(() => localStorage.getItem('portfolio_admin_project_presentation') === 'design' ? 'design' : initialMode)
  const taxonomy = loadTaxonomyConfig()
  const resume = loadResumeConfig()
  const [toast, setToast] = useState('')
  const [expanded, setExpanded] = useState({})
  const [designTabs, setDesignTabs] = useState({})
  const [standardSelection, setStandardSelection] = useState({})
  const [standardTabs, setStandardTabs] = useState({})

  useEffect(() => { localStorage.setItem('portfolio_admin_project_presentation', mode) }, [mode])

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2000) }

  const swap = (arr, i, j) => { const a = [...arr]; [a[i], a[j]] = [a[j], a[i]]; return a }
  const jumpToGroup = (gi) => document.getElementById(`proj-group-${gi}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const moveGroup = (gi, dir) => { const j = gi + dir; if (j < 0 || j >= data.groups.length) return; setData({ ...data, groups: swap(data.groups, gi, j) }) }
  const moveProject = (gi, pi, dir) => { const group = data.groups[gi]; const j = pi + dir; if (j < 0 || j >= group.projects.length) return; const g = [...data.groups]; g[gi] = { ...group, projects: swap(group.projects, pi, j) }; setData({ ...data, groups: g }) }
  const updateStandardProject = (gi, pi, patch) => {
    const groups = [...(data.groups || [])]
    const group = groups[gi]
    const projects = [...(group.projects || [])]
    projects[pi] = { ...projects[pi], ...patch }
    groups[gi] = { ...group, projects }
    setData({ ...data, groups })
  }
  const removeStandardProject = async (gi, pi) => {
    const target = data.groups?.[gi]?.projects?.[pi]
    if (!(await confirmDraftDelete('프로젝트 삭제', target?.title || `프로젝트 ${pi + 1}`))) return
    const groups = [...(data.groups || [])]
    const group = groups[gi]
    groups[gi] = { ...group, projects: (group.projects || []).filter((_, index) => index !== pi) }
    setData({ ...data, groups })
    setStandardSelection((current) => ({ ...current, [gi]: Math.max(0, pi - 1) }))
  }
  const removeGroup = async (gi) => {
    const group = data.groups?.[gi]
    if (!(await confirmDraftDelete('프로젝트 그룹 삭제', group?.title || `그룹 ${gi + 1}`))) return
    setData({ ...data, groups: data.groups.filter((_, index) => index !== gi) })
  }
  const addStandardProject = (gi) => {
    const groups = [...(data.groups || [])]
    const group = groups[gi]
    const projects = [...(group.projects || []), { id: `p-${Date.now()}`, badge: '', badgeType: 'ai', title: '', subtitle: '', problem: '', solution: '', collaboration: '', result: '', insight: '', metrics: [], highlights: [], fullWidth: false }]
    groups[gi] = { ...group, projects }
    setData({ ...data, groups })
    setStandardSelection((current) => ({ ...current, [gi]: projects.length - 1 }))
    setStandardTabs((current) => ({ ...current, [gi]: 'overview' }))
  }
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
  const removeDesignProject = async (index) => {
    if (!(await confirmDraftDelete('아카이브형 프로젝트 삭제', designProjects[index]?.title || `프로젝트 ${index + 1}`))) return
    setData({ ...data, designProjects: designProjects.filter((_, i) => i !== index) })
  }
  const removeGalleryItem = async (projectIndex, galleryIndex) => {
    const project = designProjects[projectIndex]
    const item = project?.gallery?.[galleryIndex]
    if (!(await confirmDraftDelete('갤러리 이미지 삭제', item?.caption || item?.alt || `이미지 ${galleryIndex + 1}`))) return
    updateDesignProject(projectIndex, { ...project, gallery: (project.gallery || []).filter((_, i) => i !== galleryIndex) })
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
      flash('아카이브형 프로젝트의 페이지 주소는 중복될 수 없습니다')
      return
    }
    if (publishedDesign.some((project) => project.coverImage && !project.coverAlt?.trim())) {
      flash('대표 이미지가 있는 공개 프로젝트에는 대체 텍스트가 필요합니다')
      return
    }
    saveProjects(data)
    flash('프로젝트 저장 완료')
  }
  const handleReset = async () => { if (await adminConfirm('프로젝트 편집 내용을 기본값으로 되돌립니다.', { title: '프로젝트 초기화', confirmLabel: '초기화' })) { resetProjects(); setData(loadProjects()); flash('초기화 완료') } }

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
      <SectionHeader title="프로젝트" description="프로젝트를 표현 방식별로 관리합니다. 새 방식도 같은 영역에 확장됩니다." />
      <div className="admin-project-scope">
        <nav className="admin-project-presentation" aria-label="프로젝트 표현 방식">
          <span>표현 방식</span>
          <button type="button" aria-pressed={mode === 'standard'} aria-controls="structured-project-admin" onClick={() => setMode('standard')}><span><b>구조형</b>{mode === 'standard' && <em>현재 편집 중</em>}</span><small>그룹 · 스토리 · 성과</small></button>
          <button type="button" aria-pressed={mode === 'design'} aria-controls="design-project-admin" onClick={() => setMode('design')}><span><b>아카이브형</b>{mode === 'design' && <em>현재 편집 중</em>}</span><small>대표 이미지 · 상세 페이지 · 갤러리</small></button>
        </nav>
        <ActionBar>
          <SaveButton onClick={handleSave} />
          <ResetButton onClick={handleReset} />
          <JsonBulkEditor value={bulkData} onApply={applyBulkData} />
          <div className="flex-1" />
          <ImportExportBar
            onImport={handleImport}
            onExport={() => downloadJson(bulkData, mode === 'design' ? 'archive-projects.json' : 'structured-projects.json')}
            onSample={() => downloadJson(mode === 'design' ? { designArchive: defaultProjects.designArchive || {}, designProjects: defaultProjects.designProjects || [] } : { groups: defaultProjects.groups || [] }, mode === 'design' ? 'archive-projects-sample.json' : 'structured-projects-sample.json')}
          />
        </ActionBar>
      </div>
      {mode === 'standard' && data.groups?.length > 1 && (
        <nav className="admin-context-bar mb-4" aria-label="프로젝트 그룹 바로가기">
          {data.groups.map((g, gi) => (
            <button key={gi} onClick={() => jumpToGroup(gi)}>
              {g.title || `그룹 ${gi + 1}`}
            </button>
          ))}
        </nav>
      )}
      {mode === 'standard' && <div id="structured-project-admin" className="space-y-6">
        {data.groups?.map((group, gi) => {
          const projects = group.projects || []
          const selectedIndex = Math.min(standardSelection[gi] || 0, Math.max(0, projects.length - 1))
          const project = projects[selectedIndex]
          const activeTab = standardTabs[gi] || 'overview'
          const updateHighlight = (index, patch) => {
            const highlights = [...(project.highlights || [])]
            highlights[index] = { ...highlights[index], ...patch }
            updateStandardProject(gi, selectedIndex, { highlights })
          }
          return <article key={gi} id={`proj-group-${gi}`} className="admin-record-editor scroll-mt-24">
            <header>
              <div><strong>{group.title || `그룹 ${gi + 1}`}</strong><span>프로젝트 {projects.length}개 · {group.subtitle || '부제 없음'}</span></div>
              <div><button type="button" disabled={gi === 0} onClick={() => moveGroup(gi, -1)} className="admin-toolbar-button" aria-label={`${group.title || `그룹 ${gi + 1}`} 위로 이동`}>↑</button><button type="button" disabled={gi === data.groups.length - 1} onClick={() => moveGroup(gi, 1)} className="admin-toolbar-button" aria-label={`${group.title || `그룹 ${gi + 1}`} 아래로 이동`}>↓</button><button type="button" onClick={() => removeGroup(gi)} className="admin-danger-button">그룹 삭제</button></div>
            </header>
            <div className="admin-record-editor__body">
              <div className="admin-group-fields">
                <Field label="그룹 제목" value={group.title} onChange={(v) => { const groups = [...data.groups]; groups[gi] = { ...group, title: v }; setData({ ...data, groups }) }} />
                <Field label="그룹 부제" value={group.subtitle} onChange={(v) => { const groups = [...data.groups]; groups[gi] = { ...group, subtitle: v }; setData({ ...data, groups }) }} />
                <SelectField label="연결할 업무 경험" value={typeof group.linkToExperience === 'string' ? group.linkToExperience : group.linkToExperience === true ? `exp-${gi}` : ''} options={[{ value: '', label: '연결 안 함' }, ...(resume.work || []).filter((item) => item.company).map((item, index) => ({ value: `exp-${index}`, label: item.company }))]} onChange={(v) => { const groups = [...data.groups]; groups[gi] = { ...group, linkToExperience: v }; setData({ ...data, groups }) }} />
              </div>
              <div className="admin-project-master-detail admin-project-master-detail--standard">
                <aside>
                  <header><b>프로젝트</b><button type="button" onClick={() => addStandardProject(gi)}>+ 추가</button></header>
                  {projects.map((item, pi) => <button key={item.id || pi} type="button" aria-pressed={selectedIndex === pi} onClick={() => setStandardSelection((current) => ({ ...current, [gi]: pi }))}><span>{String(pi + 1).padStart(2, '0')}</span><b>{item.title || '새 프로젝트'}</b><small>{item.badge || '배지 없음'}</small></button>)}
                </aside>
                <section>
                  {project ? <>
                    <header><div><b>{project.title || '새 프로젝트'}</b><span>선택한 프로젝트만 편집합니다.</span></div><div><button type="button" disabled={selectedIndex === 0} onClick={() => moveProject(gi, selectedIndex, -1)}>↑</button><button type="button" disabled={selectedIndex === projects.length - 1} onClick={() => moveProject(gi, selectedIndex, 1)}>↓</button><button type="button" className="admin-row-delete" onClick={() => removeStandardProject(gi, selectedIndex)}>삭제</button></div></header>
                    <nav className="admin-record-tabs" aria-label={`${project.title || '프로젝트'} 편집 영역`}>
                      <button type="button" aria-pressed={activeTab === 'overview'} onClick={() => setStandardTabs((current) => ({ ...current, [gi]: 'overview' }))}>기본 정보</button>
                      <button type="button" aria-pressed={activeTab === 'story'} onClick={() => setStandardTabs((current) => ({ ...current, [gi]: 'story' }))}>스토리</button>
                      <button type="button" aria-pressed={activeTab === 'results'} onClick={() => setStandardTabs((current) => ({ ...current, [gi]: 'results' }))}>성과·인사이트</button>
                    </nav>
                    <div className="admin-standard-project-panel">
                      {activeTab === 'overview' && <div className="space-y-3"><Field label="제목" value={project.title || ''} onChange={(v) => updateStandardProject(gi, selectedIndex, { title: v })} /><Field label="부제" value={project.subtitle || ''} onChange={(v) => updateStandardProject(gi, selectedIndex, { subtitle: v })} /><div className="grid grid-cols-1 gap-3 lg:grid-cols-2"><Field label="배지" value={project.badge || ''} onChange={(v) => updateStandardProject(gi, selectedIndex, { badge: v })} /><SelectField label="배지 유형" value={project.badgeType || 'default'} options={taxonomyOptions(taxonomy, project.badgeType)} onChange={(v) => updateStandardProject(gi, selectedIndex, { badgeType: v })} /></div></div>}
                      {activeTab === 'story' && <div className="space-y-3"><Field label="Problem — 문제 정의" value={project.problem || ''} onChange={(v) => updateStandardProject(gi, selectedIndex, { problem: v })} rows={3} /><Field label="Solution — 해결 방안" value={project.solution || ''} onChange={(v) => updateStandardProject(gi, selectedIndex, { solution: v })} rows={3} /><Field label="Collab — 이해관계자 협업" value={project.collaboration || ''} onChange={(v) => updateStandardProject(gi, selectedIndex, { collaboration: v })} rows={3} /><Field label="Result — 최종 결과" value={project.result || ''} onChange={(v) => updateStandardProject(gi, selectedIndex, { result: v })} rows={3} /></div>}
                      {activeTab === 'results' && <div className="space-y-4"><div><div className="admin-inline-heading"><div><b>성과 강조</b><span>방문자 화면의 Result 상단에 표시됩니다.</span></div><button type="button" onClick={() => updateStandardProject(gi, selectedIndex, { highlights: [...(project.highlights || []), { value: '', label: '' }] })}>+ 성과 추가</button></div><div className="admin-highlight-table">{(project.highlights || []).map((highlight, hi) => <div key={hi}><span>{String(hi + 1).padStart(2, '0')}</span><Field label="수치" value={highlight.value || ''} onChange={(value) => updateHighlight(hi, { value })} /><div className="admin-related-action-group"><Field label="설명" value={highlight.label || ''} onChange={(label) => updateHighlight(hi, { label })} /><button type="button" className="admin-row-delete" onClick={async () => { if (await confirmDraftDelete('성과 강조 삭제', highlight.label || highlight.value || `성과 ${hi + 1}`)) updateStandardProject(gi, selectedIndex, { highlights: (project.highlights || []).filter((_, index) => index !== hi) }) }}>삭제</button></div></div>)}</div></div><Field label="인사이트" value={project.insight || ''} onChange={(v) => updateStandardProject(gi, selectedIndex, { insight: v })} rows={3} /></div>}
                    </div>
                  </> : <div className="admin-empty-state"><span>00</span><b>프로젝트가 없습니다</b><p>이 그룹에 첫 프로젝트를 추가하세요.</p><button type="button" className="admin-primary-button" onClick={() => addStandardProject(gi)}>프로젝트 추가</button></div>}
                </section>
              </div>
            </div>
          </article>
        })}
        <button onClick={() => setData({ ...data, groups: [...(data.groups || []), { title: '', subtitle: '', projects: [] }] })} className="px-4 py-2 border border-accent text-accent hover:bg-accent/10 text-sm rounded-lg transition-colors cursor-pointer">+ 그룹 추가</button>
      </div>}

      {mode === 'design' && <section id="design-project-admin" className="scroll-mt-24">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <div>
            <h3 className="text-lg font-semibold text-white">아카이브형 프로젝트</h3>
            <p className="text-xs text-gray-500 mt-1">메인에는 추천 작업이 표시되고, 공개 프로젝트 수가 기준 이상이면 전체 아카이브 링크가 나타납니다.</p>
          </div>
          <button onClick={addDesignProject} className="min-h-11 px-4 border border-accent text-accent hover:bg-accent/10 text-sm rounded-lg transition-colors cursor-pointer">+ 프로젝트 추가</button>
        </div>

        <section className="admin-form-section admin-archive-settings mb-5">
          <header><h3>아카이브 설정</h3><p>섹션 이름과 소개, 전체 보기 링크가 나타나는 공개 프로젝트 수를 설정합니다.</p></header>
          <div>
            <Field label="섹션 제목" value={data.designArchive?.title || ''} onChange={(v) => setData({ ...data, designArchive: { ...(data.designArchive || {}), title: v } })} />
            <Field label="섹션 소개" value={data.designArchive?.intro || ''} onChange={(v) => setData({ ...data, designArchive: { ...(data.designArchive || {}), intro: v } })} rows={2} />
            <SelectField label="전체 아카이브 노출 기준" value={String(data.designArchive?.archiveThreshold ?? 4)} options={Array.from({ length: 12 }, (_, i) => ({ value: String(i + 1), label: `공개 프로젝트 ${i + 1}개 이상` }))} onChange={(v) => setData({ ...data, designArchive: { ...(data.designArchive || {}), archiveThreshold: Number(v) } })} />
          </div>
        </section>

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
                  <span className="flex-1 min-w-0"><strong className="block text-sm text-white truncate">{project.title || '새 프로젝트'}</strong><small className="text-[11px] text-gray-500">{project.category || '분류 없음'} · {project.year || '연도 없음'}</small></span>
                  <span className={`admin-publish-state ${project.published ? 'is-live' : ''}`}>{project.published ? '공개' : '비공개'}</span>
                  {project.featured && <span className="text-[10px] text-accent">추천</span>}
                  <span className={`text-gray-500 transition-transform ${isOpen ? 'rotate-90' : ''}`}>›</span>
                </button>

                {isOpen && (
                  <div className="admin-design-editor__body border-t border-gray-800">
                    <div className="admin-design-editor__toolbar">
                      <div className="admin-design-tabs" role="tablist" aria-label="아카이브형 프로젝트 편집 영역">
                        {tabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={activeTab === tab.id} onClick={() => setDesignTabs((prev) => ({ ...prev, [key]: tab.id }))}>{tab.label}</button>)}
                      </div>
                      <div className="admin-design-visibility">
                        <label><input type="checkbox" checked={!!project.published} onChange={(e) => updateDesignProject(index, { ...project, published: e.target.checked })} /> 공개</label>
                        <label><input type="checkbox" checked={!!project.featured} onChange={(e) => updateDesignProject(index, { ...project, featured: e.target.checked })} /> 메인 추천</label>
                      </div>
                    </div>

                    <div className="admin-design-editor__panel">
                    {activeTab === 'overview' && <div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <Field label="제목" value={project.title || ''} onChange={(v) => updateDesignProject(index, { ...project, title: v })} />
                        <div className="admin-slug-field">
                          <Field label="페이지 주소" value={project.slug || ''} onChange={(v) => updateDesignProject(index, { ...project, slug: normalizeSlug(v) })} hint={`방문자 주소: /projects/${project.slug || '프로젝트-주소'}`} />
                          <button type="button" className="admin-toolbar-button" disabled={!project.title?.trim()} onClick={() => updateDesignProject(index, { ...project, slug: normalizeSlug(project.title) })}>제목에서 만들기</button>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
                        <Field label="분류" value={project.category || ''} onChange={(v) => updateDesignProject(index, { ...project, category: v })} />
                        <YearField value={project.year || ''} onChange={(v) => updateDesignProject(index, { ...project, year: v })} />
                      </div>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-3">
                        <Field label="클라이언트" value={project.client || ''} onChange={(v) => updateDesignProject(index, { ...project, client: v })} />
                        <Field label="역할" value={project.role || ''} onChange={(v) => updateDesignProject(index, { ...project, role: v })} />
                        <DurationField value={project.duration || ''} onChange={(v) => updateDesignProject(index, { ...project, duration: v })} />
                      </div>
                      <Field label="목록 요약" value={project.summary || ''} onChange={(v) => updateDesignProject(index, { ...project, summary: v })} rows={2} className="mt-3" />
                    </div>}

                    {activeTab === 'media' && <div>
                      <MediaField label="대표 이미지" value={project.coverImage || ''} onChange={(v) => updateDesignProject(index, { ...project, coverImage: v })} onUpload={(file) => uploadPortfolioImage(file, `design-projects/${project.id || project.slug || index}/cover`)} guide="권장 2400×1600px · 3:2 · WebP/JPEG/PNG/AVIF · 최대 8MB" />
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mt-3">
                        <SelectField label="이미지 표시 방식" value={project.coverMode || 'cover'} options={[{ value: 'cover', label: '영역 채우기' }, { value: 'sheet', label: '전체 시트 보기' }]} onChange={(v) => updateDesignProject(index, { ...project, coverMode: v })} />
                        <SelectField label="크롭 위치" value={project.coverPosition || '50% 50%'} options={[
                          { value: '50% 50%', label: '가운데' }, { value: '50% 0%', label: '위쪽' }, { value: '50% 100%', label: '아래쪽' },
                          { value: '0% 50%', label: '왼쪽' }, { value: '100% 50%', label: '오른쪽' },
                        ]} onChange={(v) => updateDesignProject(index, { ...project, coverPosition: v })} />
                      </div>
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
                          <article key={galleryIndex} className="admin-gallery-row">
                            <header>
                              <span>{String(galleryIndex + 1).padStart(2, '0')}</span>
                              <b>갤러리 이미지</b>
                              <div>
                                <button type="button" aria-label={`이미지 ${galleryIndex + 1} 위로 이동`} disabled={galleryIndex === 0} onClick={() => updateDesignProject(index, { ...project, gallery: swap(project.gallery || [], galleryIndex, galleryIndex - 1) })}>↑</button>
                                <button type="button" aria-label={`이미지 ${galleryIndex + 1} 아래로 이동`} disabled={galleryIndex === (project.gallery || []).length - 1} onClick={() => updateDesignProject(index, { ...project, gallery: swap(project.gallery || [], galleryIndex, galleryIndex + 1) })}>↓</button>
                                <button type="button" onClick={() => removeGalleryItem(index, galleryIndex)} className="admin-row-delete">삭제</button>
                              </div>
                            </header>
                            <MediaField label="이미지" value={item.url || ''} onChange={(v) => { const gallery = [...(project.gallery || [])]; gallery[galleryIndex] = { ...item, url: v }; updateDesignProject(index, { ...project, gallery }) }} onUpload={(file) => uploadPortfolioImage(file, `design-projects/${project.id || project.slug || index}/gallery`)} guide="권장 2000px 이상 · WebP/JPEG/PNG/AVIF · 최대 8MB" />
                            <div className="admin-gallery-row__copy">
                              <Field label="대체 텍스트" value={item.alt || ''} onChange={(v) => { const gallery = [...(project.gallery || [])]; gallery[galleryIndex] = { ...item, alt: v }; updateDesignProject(index, { ...project, gallery }) }} />
                              <Field label="캡션" value={item.caption || ''} onChange={(v) => { const gallery = [...(project.gallery || [])]; gallery[galleryIndex] = { ...item, caption: v }; updateDesignProject(index, { ...project, gallery }) }} />
                            </div>
                          </article>
                        ))}
                        {(project.gallery || []).length === 0 && <p className="py-10 text-center text-xs text-gray-500">등록된 이미지가 없습니다.</p>}
                      </div>
                    </div>}
                    </div>

                    <div className="admin-design-editor__footer flex flex-wrap justify-between gap-3 border-t border-gray-800">
                      <div className="flex gap-2"><button type="button" disabled={index === 0} onClick={() => moveDesignProject(index, -1)} className="min-h-11 px-3 text-xs text-gray-400 disabled:text-gray-700">위로</button><button type="button" disabled={index === designProjects.length - 1} onClick={() => moveDesignProject(index, 1)} className="min-h-11 px-3 text-xs text-gray-400 disabled:text-gray-700">아래로</button></div>
                      <button type="button" onClick={() => removeDesignProject(index)} className="min-h-11 px-3 text-xs text-red-400">프로젝트 삭제</button>
                    </div>
                  </div>
                )}
              </article>
            )
          })}
          {designProjects.length === 0 && <div className="admin-empty-state"><span>00</span><b>아카이브형 프로젝트가 없습니다</b><p>대표 이미지와 상세 페이지가 필요한 프로젝트를 추가하세요.</p><button type="button" className="admin-primary-button" onClick={addDesignProject}>프로젝트 추가</button></div>}
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
  const handleReset = async () => { if (await adminConfirm('소개 편집 내용을 기본값으로 되돌립니다.', { title: '소개 초기화', confirmLabel: '초기화' })) { resetAboutConfig(); setConfig(loadAboutConfig()); flash('초기화 완료') } }

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

  const removeSkill = async (i) => {
    const skill = config.skills?.[i]
    const label = typeof skill === 'string' ? skill : skill?.label
    if (!(await confirmDraftDelete('스킬 삭제', label || `스킬 ${i + 1}`))) return
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
          <div className="admin-form-section__body">
            <div className="admin-skill-table" role="list">
              <div className="admin-skill-table__head" aria-hidden="true"><span>이름</span><span>분류 및 관리</span></div>
              {(config.skills || []).map((s, i) => {
                const sk = typeof s === 'string' ? { label: s, category: 'default' } : s
                return (
                  <div className="admin-skill-row" role="listitem" key={i}>
                    <div className="admin-related-field">
                      <label className="admin-mobile-field-label">이름</label>
                      <input aria-label={`${sk.label || `스킬 ${i + 1}`} 이름`} value={sk.label || ''} onChange={(e) => updateSkill(i, { label: e.target.value })} className="admin-control bg-gray-800 border border-gray-700 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-accent" />
                    </div>
                    <div className="admin-related-action-group">
                      <div className="admin-related-field">
                        <label className="admin-mobile-field-label">분류</label>
                        <select aria-label={`${sk.label || `스킬 ${i + 1}`} 분류`} value={sk.category || 'default'} onChange={(e) => updateSkill(i, { category: e.target.value })} className="admin-control bg-gray-800 border border-gray-700 rounded-lg px-3 text-sm text-white focus:outline-none focus:border-accent">
                          {taxonomyOptions(taxonomy, sk.category).map((cat) => <option key={cat.value} value={cat.value}>{cat.label}</option>)}
                        </select>
                      </div>
                      <button type="button" onClick={() => removeSkill(i)} className="admin-row-delete">삭제</button>
                    </div>
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
  const handleReset = async () => { if (await adminConfirm('핵심 성과 편집 내용을 기본값으로 되돌립니다.', { title: '핵심 성과 초기화', confirmLabel: '초기화' })) { resetAchievementsConfig(); setConfig(loadAchievementsConfig()); flash('초기화 완료') } }

  const items = config.items || []

  const updateItem = (i, updated) => {
    const arr = [...items]; arr[i] = updated
    setConfig({ ...config, items: arr })
  }

  const removeItem = async (i) => {
    if (!(await confirmDraftDelete('핵심 성과 삭제', items[i]?.title || `성과 ${i + 1}`))) return
    setConfig({ ...config, items: items.filter((_, idx) => idx !== i) })
  }

  const addItem = () => setConfig({ ...config, items: [...items, { title: '', description: '', linkTo: '' }] })

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
      <div className="admin-achievements-table">
        <div className="admin-achievements-table__head" aria-hidden="true"><span>순서</span><span>제목</span><span>성과 내용</span><span>연결 및 관리</span></div>
        {items.map((item, i) => (
          <div key={i} className="admin-achievement-row">
            <span className="admin-achievement-row__index">{String(i + 1).padStart(2, '0')}</span>
            <Field label="제목" value={item.title} onChange={(v) => updateItem(i, { ...item, title: v })} />
            <Field label="성과 내용" value={item.description} onChange={(v) => updateItem(i, { ...item, description: v })} rows={2} />
            <div className="admin-achievement-row__destination">
              <SelectField label="연결 위치" value={item.linkTo || ''} placeholder="연결 없음" options={linkTargets} onChange={(v) => updateItem(i, { ...item, linkTo: v })} />
              <button type="button" onClick={() => removeItem(i)} aria-label={`${item.title || `성과 ${i + 1}`} 삭제`} className="admin-row-delete">삭제</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="admin-empty-state"><span>00</span><b>등록된 핵심 성과가 없습니다</b><p>방문자에게 강조할 결과를 추가하세요.</p><button type="button" onClick={addItem} className="admin-primary-button">성과 추가</button></div>}
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
  const handleReset = async () => { if (await adminConfirm('커리어 저니 편집 내용을 기본값으로 되돌립니다.', { title: '커리어 저니 초기화', confirmLabel: '초기화' })) { resetJourneyConfig(); setConfig(loadJourneyConfig()); flash('초기화 완료') } }

  const items = config.items || []

  const updateItem = (i, updated) => {
    const arr = [...items]; arr[i] = updated
    setConfig({ ...config, items: arr })
  }

  const removeItem = async (i) => {
    if (!(await confirmDraftDelete('커리어 저니 항목 삭제', items[i]?.org || `항목 ${i + 1}`))) return
    setConfig({ ...config, items: items.filter((_, idx) => idx !== i) })
  }

  const addItem = () => setConfig({ ...config, items: [...items, { year: '', org: '', field: '', emoji: '', companyId: '' }] })

  const move = (i, dir) => {
    const j = i + dir
    if (j < 0 || j >= items.length) return
    const arr = [...items]; [arr[i], arr[j]] = [arr[j], arr[i]]
    setConfig({ ...config, items: arr })
  }

  return (
    <div>
      <SectionHeader title="커리어 저니" description="Career Journey 타임라인을 관리합니다" />
      <ActionBar>
        <SaveButton onClick={handleSave} />
        <ResetButton onClick={handleReset} />
        <JsonBulkEditor value={config} onApply={(value) => { setConfig(value); flash('JSON 적용 완료 — 저장 버튼을 눌러주세요') }} />
        <button type="button" onClick={addItem} className="admin-primary-button">항목 추가</button>
        <div className="flex-1" /><ImportExportBar onImport={async (file) => { setConfig(await importJson(file)); flash('가져오기 완료 — 저장 버튼을 눌러주세요') }} onExport={() => downloadJson(config, 'journey.json')} />
      </ActionBar>
      <div className="admin-editor-note">
        <b>정렬 기준</b><span>맨 위가 현재입니다. 항목 순서만 관리하면 공개 화면의 타임라인 배치는 화면 폭에 맞춰 자동으로 바뀝니다.</span>
      </div>
      <div className="admin-journey-editor">
        {items.length > 0 && <div className="admin-journey-editor__head" aria-hidden="true"><span>순서</span><span>연도</span><span>회사</span><span>분야</span><span>연결 경력</span><span>현재</span><span>관리</span></div>}
        {items.map((item, i) => (
          <div key={i} className="admin-journey-editor__row">
            <span className="admin-collection-index">{String(i + 1).padStart(2, '0')}</span>
            <YearField value={item.year || ''} onChange={(v) => updateItem(i, { ...item, year: v })} />
            <Field label="회사" value={item.org || ''} onChange={(v) => updateItem(i, { ...item, org: v })} />
            <Field label="분야" value={item.field || ''} onChange={(v) => updateItem(i, { ...item, field: v })} />
            <SelectField label="연결 경력" value={item.companyId || ''} placeholder="연결 없음" options={workList.map((work, index) => ({ value: `exp-${index}`, label: work.company || `경력 ${index + 1}` }))} onChange={(v) => updateItem(i, { ...item, companyId: v })} />
            <label className="admin-current-toggle">
              <input type="checkbox" checked={!!item.current} onChange={(e) => updateItem(i, { ...item, current: e.target.checked })} />
              <span className="admin-journey-editor-marker" data-current={item.current ? 'true' : 'false'} aria-hidden="true" />
              <span>{item.current ? '현재' : '과거'}</span>
            </label>
            <div className="admin-row-actions">
              <button type="button" aria-label={`${item.org || '항목'} 위로 이동`} onClick={() => move(i, -1)} disabled={i === 0}>↑</button>
              <button type="button" aria-label={`${item.org || '항목'} 아래로 이동`} onClick={() => move(i, 1)} disabled={i === items.length - 1}>↓</button>
              <button type="button" onClick={() => removeItem(i)} className="admin-row-delete">삭제</button>
            </div>
          </div>
        ))}
        {items.length === 0 && <div className="admin-empty-state"><span>00</span><b>등록된 커리어 저니가 없습니다</b><p>연도와 회사를 기준으로 첫 항목을 추가하세요.</p><button type="button" className="admin-primary-button" onClick={addItem}>항목 추가</button></div>}
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
          <h2 className="admin-page-title">관리 현황</h2>
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
            <button onClick={() => onNavigate('history')} className="admin-panel-link">복원 지점 보기 <span aria-hidden="true">→</span></button>
          </div>
          <div className="grid lg:grid-cols-3 gap-px bg-gray-800/70 border border-gray-800 rounded-xl overflow-hidden">
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
  const [page, setPage] = useState(1)
  const [openRow, setOpenRow] = useState(null)
  const [ver, setVer] = useState(0) // bump to re-read logs after deletion
  const [toast, setToast] = useState('')
  const [now] = useState(Date.now)
  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2000) }

  const removeRow = async (r) => {
    if (!(await adminConfirm('선택한 접속 기록 한 건을 삭제합니다.', { title: '접속 기록 삭제', confirmLabel: '삭제' }))) return
    if (r.kind === 'access') removeAccessLogEntry(r.at)
    else if (r.kind === 'gate') removeGateLogEntry(r.at)
    else removeAlertLogEntry(r.at)
    setOpenRow(null)
    setVer(ver + 1)
    flash('기록 삭제 완료')
  }

  const clearFiltered = async () => {
    const label = LOG_FILTERS.find((f) => f.key === filter)?.label
    if (!(await adminConfirm(`${label} 기록을 전부 삭제합니다. 이 작업은 되돌릴 수 없습니다.`, { title: '필터 결과 전체 삭제', confirmLabel: '전체 삭제' }))) return
    if (filter === 'access') clearAccessLog()
    else if (filter === 'gate') clearGateLog()
    else if (filter === 'alert') clearAlertLog()
    setOpenRow(null)
    setVer(ver + 1)
    flash(`${label} 기록 전체 삭제 완료`)
  }

  const rows = buildLogRows({ accessLogs: getAccessLog(), gateLogs: getGateLog(), alertLogs: getAlertLog(), now })

  const filtered = filter === 'all' ? rows : rows.filter((r) => r.kind === filter)
  const PAGE_SIZE = 25
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
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
            onClick={() => { setFilter(f.key); setPage(1); setOpenRow(null) }}
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
        <div className="admin-empty-state">
          <span aria-hidden="true">0</span>
          <b>{filter === 'all' ? '아직 수집된 접속 기록이 없습니다.' : '선택한 조건의 기록이 없습니다.'}</b>
          <p>{filter === 'all' ? '방문자가 토큰으로 접속하면 인증·방문·보안 기록이 시간순으로 표시됩니다.' : '다른 기록 유형을 선택하거나 전체 로그로 돌아가 확인하세요.'}</p>
          {filter !== 'all' && <button type="button" className="admin-secondary-button" onClick={() => { setFilter('all'); setPage(1) }}>전체 로그 보기</button>}
        </div>
      ) : (
        <div className="space-y-1.5">
          {pageRows.map((r) => {
            const hasActions = r.actions?.length > 0
            const rowKey = `${r.kind}-${r.at}`
            const isOpen = openRow === rowKey
            return (
              <article key={rowKey} className="admin-log-row">
                <div
                  className={`px-4 py-2.5 flex items-center gap-3 ${hasActions ? 'cursor-pointer hover:bg-gray-800/60 transition-colors' : ''}`}
                  onClick={() => hasActions && setOpenRow(isOpen ? null : rowKey)}
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
                  <div className="admin-log-detail">
                    <div className="admin-journey" aria-label="세션 행동 단계">
                    {r.actions.map((a, ai) => {
                      const offMin = Math.max(0, Math.round((a.t - r.at) / 60000))
                      const target = a.kind === 'section' ? (SECTION_LABELS[a.target] || a.target) : a.target
                      return (
                        <div key={ai} className="admin-journey__step">
                          <span className="admin-journey__index">{String(ai + 1).padStart(2, '0')}</span>
                          <b>{ACTION_LABELS[a.kind] || a.kind}</b>
                          <span>{target}</span>
                          <time>+{offMin}분</time>
                        </div>
                      )
                    })}
                    </div>
                    <aside className="admin-log-analysis">
                      <span>분석 코멘트 · 신뢰도 {r.actions.length >= 4 ? '중간' : '낮음'}</span>
                      <b>{r.actions.length >= 4 ? '여러 콘텐츠를 비교해 본 세션입니다.' : '탐색 근거가 아직 충분하지 않습니다.'}</b>
                      <p>관찰: {r.actions.length}개 행동이 기록되었습니다. 해석은 행동 순서에 근거한 추정이며 방문자의 의도를 확정하지 않습니다.</p>
                      <small>권장 확인: 마지막 단계 이후 체류 시간과 같은 경로의 반복 세션을 함께 비교하세요.</small>
                    </aside>
                  </div>
                )}
              </article>
            )
          })}
          {pageCount > 1 && <nav className="admin-pagination" aria-label="접속 로그 페이지"><button type="button" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>이전</button><span>{page} / {pageCount}</span><button type="button" disabled={page === pageCount} onClick={() => setPage((value) => value + 1)}>다음</button></nav>}
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

function HistorySection({ onNavigate }) {
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
    if (!(await adminConfirm(`${docLabel}을(를) ${formatDate(snap.at)} 버전으로 복원합니다. 현재 상태는 새 복원 이력으로 보존됩니다.`, { title: '버전 복원', confirmLabel: '복원' }))) return
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

      <div className="admin-history-list" aria-live="polite">
        {snapshots === null && (
          <div className="admin-history-state admin-history-state--loading" role="status">
            <div aria-hidden="true"><i /><i /><i /></div>
            <span>변경 이력을 불러오는 중</span>
          </div>
        )}
        {snapshots !== null && loadError && (
          <div className="admin-history-state admin-history-state--error" role="alert">
            <span className="admin-history-state__mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 8v5m0 3.5v.5M5.6 20h12.8a2 2 0 0 0 1.73-3L13.73 5.9a2 2 0 0 0-3.46 0L3.87 17a2 2 0 0 0 1.73 3Z" /></svg>
            </span>
            <div><b>변경 이력을 불러오지 못했습니다</b><p>관리자 로그인 상태와 이력 저장 권한을 확인한 뒤 다시 시도하세요.</p></div>
            <button type="button" className="admin-secondary-button" onClick={() => load(activeDoc)}>다시 불러오기</button>
          </div>
        )}
        {snapshots !== null && !loadError && snapshots.length === 0 && (
          <div className="admin-history-state admin-history-state--empty">
            <span className="admin-history-state__mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 7h11a5 5 0 0 1 0 10H9m-5-10 3-3M4 7l3 3" /><path d="M9 14v6" /></svg>
            </span>
            <div>
              <b>{HISTORY_DOCS.find((doc) => doc.id === activeDoc)?.label}의 저장 이력이 없습니다</b>
              <p>이 섹션을 처음 저장하면 복원 가능한 버전이 자동으로 기록됩니다.</p>
            </div>
            <button type="button" className="admin-primary-button" onClick={() => onNavigate?.(activeDoc)}>
              {HISTORY_DOCS.find((doc) => doc.id === activeDoc)?.label} 편집으로 이동
            </button>
          </div>
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
  const removeCategory = async (index) => {
    if (!(await confirmDraftDelete('배지·스킬 분류 삭제', categories[index]?.label || categories[index]?.key || `분류 ${index + 1}`))) return
    setConfig({ ...config, categories: categories.filter((_, i) => i !== index) })
  }
  const addCategory = () => {
    let number = categories.length + 1
    let key = `category-${number}`
    while (categories.some((item) => item.key === key)) { number += 1; key = `category-${number}` }
    setConfig({ ...config, categories: [...categories, { key, label: '새 분류' }] })
  }
  const save = () => {
    const keys = categories.map((item) => item.key.trim())
    if (keys.some((key) => !key)) return flash('식별자는 비워둘 수 없습니다')
    if (new Set(keys).size !== keys.length) return flash('분류 식별자는 중복될 수 없습니다')
    saveTaxonomyConfig({ ...config, categories: categories.map((item) => ({ ...item, key: item.key.trim() })) })
    flash('배지·스킬 분류 저장 완료')
  }
  const reset = async () => {
    if (!(await adminConfirm('배지·스킬 분류만 기본값으로 되돌립니다. 기존 콘텐츠에 저장된 분류 값은 변경하지 않습니다.', { title: '배지·스킬 분류 초기화', confirmLabel: '초기화' }))) return
    setConfig(resetTaxonomyConfig())
    flash('기본 분류로 초기화했습니다')
  }
  return (
    <div>
      <SectionHeader title="배지·스킬 분류" description="프로젝트 배지 유형과 소개 스킬 태그에서 선택할 공통 분류를 관리합니다" />
      <ActionBar>
        <SaveButton onClick={save} />
        <ResetButton onClick={reset} />
        <JsonBulkEditor value={config} onApply={(value) => { setConfig(value); flash('JSON 적용 완료 — 저장 버튼을 눌러주세요') }} />
        <div className="flex-1" />
        <ImportExportBar onImport={async (file) => { setConfig(await importJson(file)); flash('가져오기 완료 — 저장 버튼을 눌러주세요') }} onExport={() => downloadJson(config, 'taxonomy.json')} />
      </ActionBar>
      <section className="admin-form-section" aria-label="배지·스킬 분류 편집">
        <div>
          <dl className="admin-taxonomy-usage">
            <div><dt>프로젝트</dt><dd>배지 유형 선택</dd></div>
            <div><dt>소개</dt><dd>스킬 분류 선택</dd></div>
            <div><dt>색상</dt><dd>선택한 방문자 테마가 적용</dd></div>
          </dl>
          <div className="admin-taxonomy-head" aria-hidden="true"><span>방문자에게 보이는 이름</span><span>내부 저장 키 및 관리</span></div>
          {categories.map((item, index) => (
            <div className="admin-taxonomy-row" key={`${item.key}-${index}`}>
              <Field label="표시 이름" value={item.label || ''} onChange={(value) => updateCategory(index, { label: value })} />
              <div className="admin-related-action-group">
                <Field label="내부 저장 키" value={item.key || ''} onChange={(value) => updateCategory(index, { key: value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })} />
                <button type="button" className="admin-row-delete" onClick={() => removeCategory(index)}>삭제</button>
              </div>
            </div>
          ))}
          <button type="button" onClick={addCategory} className="admin-secondary-button mt-4">분류 추가</button>
          <p className="admin-taxonomy-footnote">내부 저장 키는 영문 소문자·숫자·하이픈만 사용합니다. 분류를 삭제해도 기존 콘텐츠 값은 지워지지 않고 해당 편집 화면에서 ‘기존 값’으로 유지됩니다.</p>
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
    if (saved === 'design-projects') {
      localStorage.setItem('portfolio_admin_project_presentation', 'design')
      return 'projects'
    }
    return SECTION_MAP[saved] ? saved : 'home'
  })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [adminTheme, setAdminTheme] = useState(() => localStorage.getItem(ADMIN_THEME_KEY) || 'light')
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

  useEffect(() => {
    if (!mobileMenuOpen) return undefined
    const previousOverflow = document.body.style.overflow
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMobileMenuOpen(false)
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [mobileMenuOpen])

  const selectSection = (id) => {
    if (id === 'design-system') {
      onOpenDesignSystem?.()
      setMobileMenuOpen(false)
      return
    }
    setActiveSection(id)
    setMobileMenuOpen(false)
    localStorage.setItem(LAST_SECTION_KEY, id)
    window.scrollTo({ top: 0 })
  }

  const ActiveComponent = SECTION_MAP[activeSection]
  const current = ALL_NAV.find((i) => i.id === activeSection)

  const handleExportPDF = async () => {
    const recipient = await adminPrompt('수신자 이름은 토큰 라벨로 남아 문서별 열람을 구분하는 데 사용됩니다.', { title: 'PDF 수신자 입력', placeholder: '회사명 또는 수신자 이름', confirmLabel: 'PDF 만들기' })
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
      await adminAlert(`PDF를 저장했습니다.\n발급 토큰: ${tokenVal}`, { title: 'PDF 저장 완료' })
    } catch (e) { await adminAlert(`PDF를 만들지 못했습니다.\n${e.message}`, { title: 'PDF 생성 실패', danger: true }) }
  }

  const sectionProps =
    activeSection === 'account' ? { onLogout: handleLogout }
    : activeSection === 'home' ? { onNavigate: selectSection, onExportPDF: handleExportPDF, onViewPortfolio }
    : activeSection === 'history' ? { onNavigate: selectSection }
    : activeSection === 'theme' ? { onPreviewTheme: (view, theme) => onPreviewTheme?.(view, theme, 'desktop'), onOpenDesignSystem }
    : activeSection === 'tokens' ? { onPreviewTheme } : {}

  return (
    <div className="admin-shell min-h-screen flex" data-admin-theme={adminTheme}>
      {/* Desktop Sidebar */}
      <aside className="admin-sidebar hidden md:flex">
        <div className="admin-sidebar__brand">
          <h1>Private Archive</h1>
          <p><span className="admin-status-dot" />{cloudConfigured && ownerUser ? '소유자 인증 · 저장 연결' : `${SITE_HOST} 관리 콘솔`}</p>
        </div>
        <nav className="admin-sidebar__nav">
          {NAV_ITEMS.map((group) => (
            <div key={group.group}>
              <p className="admin-sidebar__group">{group.group}</p>
              <div>
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => selectSection(item.id)}
                    data-active={activeSection === item.id ? 'true' : 'false'}
                    className="admin-nav-item"
                  >
                    <span className="admin-nav-index">{item.icon}</span><span>{item.label}</span>
                    {activeSection === item.id && <span className="admin-nav-current" />}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="admin-sidebar__footer">
          <div className="admin-theme-switch" aria-label="관리자 화면 색상 모드">
            <button type="button" aria-pressed={adminTheme === 'light'} onClick={() => changeAdminTheme('light')}>라이트</button>
            <button type="button" aria-pressed={adminTheme === 'dark'} onClick={() => changeAdminTheme('dark')}>다크</button>
          </div>
          <button
            onClick={handleExportPDF}
            className="admin-sidebar-action admin-sidebar-action--primary"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            PDF 출력
          </button>
          {onViewPortfolio && (
            <button onClick={onViewPortfolio} className="admin-sidebar-action">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
              포트폴리오 보기
            </button>
          )}
          <button onClick={handleLogout} className="admin-sidebar-action admin-sidebar-action--quiet">
            로그아웃
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="admin-mobile-nav md:hidden">
        <div className="admin-mobile-nav__bar">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="admin-mobile-menu-trigger"
            aria-expanded={mobileMenuOpen}
            aria-controls="admin-mobile-menu"
            aria-label={`${current?.label || '관리자'} 메뉴 ${mobileMenuOpen ? '닫기' : '열기'}`}
          >
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              {mobileMenuOpen
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              }
            </svg>
            <span className="text-sm font-bold truncate">{current ? `${current.icon} ${current.label}` : '관리자'}</span>
            <svg className={`w-3.5 h-3.5 shrink-0 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
            </svg>
          </button>
          <div className="admin-mobile-actions">
            <button type="button" onClick={() => changeAdminTheme(adminTheme === 'dark' ? 'light' : 'dark')} className="admin-mobile-action" aria-label={`${adminTheme === 'dark' ? '라이트' : '다크'} 모드로 전환`}>
              {adminTheme === 'dark'
                ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><circle cx="12" cy="12" r="3.5" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" /></svg>
                : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M20.2 15.2A8.2 8.2 0 0 1 8.8 3.8 8.5 8.5 0 1 0 20.2 15.2Z" /></svg>}
              <span>{adminTheme === 'dark' ? '라이트' : '다크'}</span>
            </button>
            {onViewPortfolio && <button onClick={onViewPortfolio} className="admin-mobile-action admin-mobile-action--primary" aria-label="포트폴리오 보기">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M2.7 12s3.4-5.5 9.3-5.5 9.3 5.5 9.3 5.5-3.4 5.5-9.3 5.5S2.7 12 2.7 12Z" /><circle cx="12" cy="12" r="2.7" /></svg>
              <span>보기</span>
            </button>}
          </div>
        </div>

        {mobileMenuOpen && (
          <div id="admin-mobile-menu" className="admin-mobile-menu">
            <nav className="admin-mobile-menu__nav" aria-label="관리자 전체 메뉴">
              {NAV_ITEMS.map((group) => (
                <section className="admin-mobile-menu__group" key={group.group}>
                  <h2>{group.group}</h2>
                  <div>
                    {group.items.map((item) => {
                      const isActive = activeSection === item.id
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => selectSection(item.id)}
                          data-active={isActive ? 'true' : 'false'}
                          aria-current={isActive ? 'page' : undefined}
                          className="admin-mobile-menu__item"
                        >
                          <span className="admin-mobile-menu__index">{item.icon}</span>
                          <span className="admin-mobile-menu__label">{item.label}</span>
                          {isActive && <span className="admin-mobile-menu__current">현재</span>}
                        </button>
                      )
                    })}
                  </div>
                </section>
              ))}
            </nav>
            <footer className="admin-mobile-menu__footer">
              <button type="button" onClick={handleExportPDF} className="admin-mobile-menu__action admin-mobile-menu__action--primary">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                PDF 출력
              </button>
              <button type="button" onClick={handleLogout} className="admin-mobile-menu__action admin-mobile-menu__action--quiet">로그아웃</button>
            </footer>
          </div>
        )}
      </div>

      {/* Main Content */}
      <main className="admin-main">
        <div className="admin-content">
          {/* Breadcrumb (desktop) */}
          {current && (
            <p className="admin-breadcrumb hidden md:flex">
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
      <AdminDialogHost />
    </div>
  )
}
