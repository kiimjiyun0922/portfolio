import { useEffect, useState } from 'react'
import { CORE_RELEASE, CORE_RULES, VIEWPORTS } from '../theme-system-data'
import ThemeSystemHeader from './ThemeSystemHeader'

const SCENES = [
  ['home', 'Home'], ['product', 'Product Case'], ['career', 'Career'], ['background', 'Background'],
  ['archive', 'Design Archive'], ['detail', 'Project Detail'], ['gate', 'Access Gate'],
]
const ANALYSIS_LABELS = {
  metaphor: 'CORE METAPHOR', hierarchy: 'INFORMATION HIERARCHY', surface: 'SURFACE / LINE',
  typography: 'TYPOGRAPHY', interaction: 'INTERACTION', exclude: 'EXCLUDE',
}

function Section({ number, title, note, children }) {
  return <section className="ts-section"><header className="ts-section__title"><span>{number}</span><div><h2>{title}</h2><p>{note}</p></div></header>{children}</section>
}

function StatusPanel({ type }) {
  const error = type === 'error'
  return <div className="ts-message"><small>{error ? 'CONTENT UNAVAILABLE' : 'NO PROJECTS YET'}</small><b>{error ? '프로젝트를 불러오지 못했습니다' : '표시할 프로젝트가 없습니다'}</b><p>{error ? '연결 상태를 확인한 뒤 다시 시도하거나 안전한 이전 화면으로 돌아가세요.' : '프로젝트가 등록되면 이 위치에 최신 작업부터 표시됩니다.'}</p><button>{error ? 'RETURN TO ARCHIVE' : 'VIEW ALL SECTIONS'} <i aria-hidden="true">→</i></button></div>
}

function PreviewScene({ scene, theme }) {
  if (scene === 'home') return <><small>PORTFOLIO / HOME</small><h3>Data-driven decisions,<br/>User-centric design</h3><div className="ts-preview-stats"><span>01</span><b>YEARS EXPERIENCE</b><i/><strong>8+</strong><span>02</span><b>PROJECTS</b><i/><strong>9+</strong><span>03</span><b>COMPANIES</b><i/><strong>3</strong></div><div className="ts-preview-copy"><small>ABOUT</small><b>Designing the balance between users and business</b><p>데이터로 문제를 정의하고 실험으로 검증하는 프로덕트 매니저입니다.</p></div></>
  if (scene === 'product') return <><small>FEATURED PROJECT / AI PRODUCT</small><h3>LLM 고객 상담<br/>어시스턴트</h3><div className="ts-preview-metrics"><div><b>-42%</b><span>처리 시간</span></div><div><b>4.6</b><span>CSAT</span></div><div><b>9주</b><span>MVP 출시</span></div></div><p className="ts-preview-body">문제, 선택, 협업, 결과를 실제 지표와 함께 하나의 흐름으로 읽습니다.</p><button>VIEW CASE <i aria-hidden="true">↗</i></button></>
  if (scene === 'career') return <><small>EXPERIENCE / JOURNEY</small><h3>Work Experience</h3><div className="ts-preview-rows"><div><small>01</small><time>2023.03 ~</time><span><b>Lumen Labs</b><em>Senior Product Manager</em></span></div><div><small>02</small><time>2020.06 ~ 2023.02</time><span><b>Novabridge</b><em>Product Manager</em></span></div><div><small>03</small><time>2018.01 ~ 2020.05</time><span><b>Brightline Edu</b><em>Associate PM</em></span></div></div></>
  if (scene === 'background') return <><small>BACKGROUND</small><h3>Education &amp; Activity</h3><div className="ts-preview-rows"><div><small>01</small><time>2012 ~ 2016</time><span><b>한빛대학교</b><em>경영학·컴퓨터과학 복수전공</em></span></div><div><small>02</small><time>2025</time><span><b>발표</b><em>AI 프로덕트의 품질 지표 설계</em></span></div><div><small>03</small><time>2024</time><span><b>기고</b><em>실험 문화와 조직의 신호</em></span></div></div></>
  if (scene === 'detail') return <><div className="ts-preview-detail-head"><small>DESIGN ARCHIVE / PROJECT DETAIL</small><button>CLOSE <i aria-hidden="true">×</i></button></div><h3>NOMA Product<br/>Launch</h3><div className="ts-preview-brief"><b>Brief</b><p>제품의 차분한 효능을 유지하며 출시 첫 주의 명확한 신호를 만드는 캠페인입니다.</p></div><div className="ts-preview-image">IMAGE 01 / 03</div></>
  if (scene === 'gate') return <><small>ACCESS GATE</small><div className="ts-preview-gate"><section><h3>{theme.name}<br/>Portfolio</h3><p>Data-driven decisions,<br/>User-centric design</p></section><form><label htmlFor={`gate-${theme.id}`}>ACCESS TOKEN</label><input id={`gate-${theme.id}`} placeholder="Enter access token" readOnly/><button type="button">VIEW PORTFOLIO</button><p>접근 코드가 없다면 이메일로 요청하세요.</p></form></div></>
  return <><small>PROJECT ARCHIVE / 03</small><h3>Selected Work</h3><div className="ts-preview-grid"><aside><b>01</b><p>NOMA Product Launch</p><small>Campaign · 2026</small></aside><section><div className="ts-preview-image"/><b>Clear hierarchy,<br/>stable rhythm.</b><p>화면이 달라져도 시작선, 정보 순서, 최소 글자 크기와 터치 영역을 유지합니다.</p><button>VIEW PROJECT <i aria-hidden="true">↗</i></button></section></div></>
}

export default function ThemeDesignSystem({ theme }) {
  const [viewport, setViewport] = useState('mobile')
  const [scene, setScene] = useState('home')
  const frame = VIEWPORTS[viewport]
  const vars = Object.fromEntries(Object.entries(theme.css).map(([key, value]) => [`--ts-${key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}`, value]))

  useEffect(() => {
    const page = document.querySelector('.ts-page')
    const sections = [...document.querySelectorAll('.ts-section')]
    if (!page || !sections.length || !('IntersectionObserver' in window)) return undefined
    page.dataset.motionReady = 'true'
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-seen')
          observer.unobserve(entry.target)
        }
      })
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })
    sections.forEach((section) => observer.observe(section))
    return () => observer.disconnect()
  }, [theme.id])

  return <main className="ts-page" data-mode={theme.mode} data-system-theme={theme.id} style={vars}>
    <ThemeSystemHeader themeId={theme.id} eyebrow={`${theme.name.toUpperCase()} / FRONT SYSTEM v${theme.version}`} title="Portfolio Theme Contract"/>
    <div className="ts-wrap">
      <section className="ts-intro"><div><span>CORE RULES + THEME PROFILE</span><h1>{theme.name}<br/>Design System</h1></div><div className="ts-intro__note"><b>{theme.description}</b><p>공통 UX 계약은 모든 테마에서 동일합니다. 색, 서체, 선, 모서리, 장식과 모션만 이 문서의 테마 프로필로 교체합니다.</p></div></section>

      <Section number="01" title="Core contract" note="모든 테마에 예외 없이 적용되는 정렬·여백·경계 규칙">
        <div className="ts-rule-list">{CORE_RULES.map(([name, use, avoid], index) => <article key={name}><header><span>{String(index + 1).padStart(2, '0')}</span><h3>{name}</h3></header><div><b>DO</b><p>{use}</p></div><div><b>DON'T</b><p>{avoid}</p></div></article>)}</div>
        <div className="ts-core-samples">
          <article><header>ROW / OPTICAL ALIGNMENT</header><div className="ts-index-row"><small>01</small><time>2023.03 ~</time><div><b>Lumen Labs</b><p>Senior Product Manager</p></div></div><p>번호·날짜·제목은 고정 열을 사용합니다. 날짜는 메타이며 회사명이 주제목입니다.</p></article>
          <article><header>BOUNDARY / VERTICAL RHYTHM</header><div className="ts-boundary-row"><small>01</small><div><b>프로젝트 제목</b><p>상하 20px 대칭 padding</p></div></div><div className="ts-boundary-row"><small>02</small><div><b>두 번째 항목</b><p>행 사이 선은 한 번만 표시</p></div></div><p>제목선과 목록 첫 상단선은 서로 다른 역할입니다.</p></article>
          <article><header>DATE HIERARCHY</header><dl className="ts-date-table"><div><dt>Experience</dt><dd>2023.03 ~</dd></div><div><dt>Journey</dt><dd>2023 <em>NOW</em></dd></div><div><dt>Activity</dt><dd>2025</dd></div></dl><p>날짜는 모든 문맥에서 같은 메타 크기와 line-box를 사용합니다.</p></article>
        </div>
      </Section>

      <Section number="02" title="Theme analysis & identity" note="분석으로 필요성이 확인된 색·서체·표면·상호작용만 사용">
        <div className="ts-analysis"><header><span>ANALYSIS BEFORE EXPRESSION</span><b>새 표현은 아래 여섯 기준에서 이유가 확인된 경우에만 추가합니다.</b></header>{Object.entries(theme.analysis).map(([key, value], index) => <article key={key}><small>{String(index + 1).padStart(2, '0')}</small><div><b>{ANALYSIS_LABELS[key]}</b><p>{value}</p></div></article>)}</div>
        <div className="ts-swatches">{theme.colors.map(([name, color, use]) => <article key={name}><i style={{ background: color }}/><b>{name}</b><code>{color}</code><p>{use}</p></article>)}</div>
        <div className="ts-identity-grid">
          <article><header>TYPOGRAPHY</header><small>DISPLAY</small><h3>Selected Work</h3><small>KOREAN TITLE</small><h3 className="is-korean">사용자와 비즈니스의 균형</h3><p>{theme.type.titleRule}. 본문 15px 이상, 메타 12px 이상을 유지합니다.</p></article>
          <article><header>SURFACE GRAMMAR</header><div className="ts-signatures">{theme.signature.map(item => <span key={item}>{item}</span>)}</div><div className="ts-surface-card"><small>PROJECT CASE</small><b>Clear hierarchy,<br/>stable rhythm.</b><button>VIEW CASE <i aria-hidden="true">↗</i></button></div></article>
          <article><header>ORNAMENT / MOTION / CURSOR</header><dl className="ts-motion"><div><dt>ORNAMENT</dt><dd>{theme.ornaments}</dd></div><div><dt>MOTION</dt><dd>{theme.motion}</dd></div><div><dt>CURSOR</dt><dd>{theme.cursor}</dd></div></dl>{theme.geometry.length > 0 ? <div className="ts-symbols" aria-label={`${theme.name} permitted structural marks`}>{theme.geometry.map(mark => <i key={mark} className={`is-${mark}`}/>)}</div> : <div className="ts-no-ornament"><b>NO DECORATIVE ORNAMENT</b><span>구조와 콘텐츠만으로 위계를 만듭니다.</span></div>}</article>
        </div>
        <div className="ts-effects"><header><span>PAGE / SCROLL EFFECT</span><b>효과가 이해를 강화할 때만 허용</b></header><div><small>PAGE CHANGE</small><strong>{theme.effects.page}</strong></div><div><small>SCROLL</small><strong>{theme.effects.scroll}</strong></div><p>{theme.effects.reason}. 모든 효과는 prefers-reduced-motion에서 즉시 전환으로 대체합니다.</p></div>
        <div className="ts-specific"><b>THEME-SPECIFIC GATE</b>{theme.specific.map((item, index) => <span key={item}><i>{String(index + 1).padStart(2, '0')}</i>{item}</span>)}</div>
      </Section>

      <Section number="03" title="Front components" note="실제 프론트에서 반복되는 정보 구조와 상태">
        <div className="ts-library">
          <article className="is-heading"><header>SECTION HEADING</header><div className="ts-heading"><small>PROJECTS</small><h3>Featured Projects</h3><p>분류 → 제목 → 설명의 순서를 고정합니다.</p></div></article>
          <article className="is-stats"><header>STATS</header><div className="ts-stat"><small>01</small><b>YEARS EXPERIENCE</b><i/><strong>8+</strong></div><div className="ts-stat"><small>02</small><b>PROJECTS</b><i/><strong>9+</strong></div><div className="ts-stat"><small>03</small><b>COMPANIES</b><i/><strong>3</strong></div></article>
          <article className="is-experience"><header>EXPERIENCE</header><div className="ts-index-row"><small>01</small><time>2023.03 ~</time><div><b>Lumen Labs</b><p>Senior Product Manager</p></div></div></article>
          <article className="is-journey"><header>JOURNEY</header><div className="ts-index-row"><small>03</small><time>2023 <em>NOW</em></time><div><b>Lumen Labs</b><p>AI Product</p></div></div></article>
          <article className="is-wide is-project"><header>PROJECT / GALLERY</header><div className="ts-project"><aside><small>AI PRODUCT · 2026</small><h3>LLM 고객 상담 어시스턴트</h3><p>문제, 선택, 협업, 결과를 하나의 읽기 흐름으로 구성합니다.</p><button>VIEW PROJECT <i aria-hidden="true">↗</i></button></aside><section><div className="ts-image">IMAGE 01</div><nav><b>01 / 03</b><button>PREVIOUS</button><button>NEXT</button></nav><div className="ts-thumbs"><button aria-current="true">01</button><button>02</button><button>03</button></div></section></div></article>
          <article className="is-states"><header>INTERACTION STATES</header><div className="ts-states"><button>DEFAULT</button><button className="is-hover">HOVER</button><button className="is-focus">FOCUS / SINGLE</button><button className="is-pressed">PRESSED</button></div><p>네 상태는 같은 44px 상자와 같은 위치를 유지하며, 포커스 표시는 한 겹만 사용합니다.</p></article>
          <article className="is-empty"><header>EMPTY STATE</header><StatusPanel type="empty" /></article>
          <article className="is-error"><header>ERROR STATE</header><StatusPanel type="error" /></article>
          <article className="is-wide is-session"><header>SESSION / ACCESS BANNER</header><div className="ts-session-banner" role="alert"><div><small>ACCESS EXPIRED</small><b>접속 시간이 만료되었습니다</b><p>포트폴리오를 계속 보려면 접근 코드를 다시 확인해주세요.</p></div><button>RE-AUTHENTICATE <i aria-hidden="true">→</i></button></div><dl className="ts-access-variants"><div><dt>EXPIRING</dt><dd>남은 시간과 연장 행동</dd></div><div><dt>EXPIRED</dt><dd>원인과 재인증 행동</dd></div><div><dt>RESTORED</dt><dd>복구 완료를 알리고 자동 종료</dd></div></dl><p>배너는 헤더 바로 아래의 문서 흐름에 놓고 콘텐츠를 덮지 않습니다. 상태명·원인·행동 순서는 모든 테마에서 동일합니다.</p></article>
          <article className="is-utility"><header>PROJECT UTILITY</header><div className="ts-utilities"><button>CLOSE <i aria-hidden="true">×</i></button><button>BACK TO TOP <i aria-hidden="true">↑</i></button></div><p>Close는 상세 우측 상단에서 홈으로, Back to top은 푸터 우측에서 페이지 상단으로 이동합니다.</p></article>
          <article className="is-wide is-footer"><header>COMMON FOOTER</header><footer className="ts-footer"><div><b>HELLO@EXAMPLE.COM</b></div><div><p>INTERESTED IN WORKING TOGETHER?</p><b>LINKEDIN <i aria-hidden="true">↗</i></b></div><div><button>BACK TO TOP <i aria-hidden="true">↑</i></button><small>© 2026. ALL RIGHTS RESERVED.</small></div></footer></article>
        </div>
      </Section>

      <Section number="04" title="Responsive contract" note="같은 정보 구조를 모바일·태블릿·데스크톱에서 검토">
        <div className="ts-toolbar">{Object.entries(VIEWPORTS).map(([id, data]) => <button key={id} aria-pressed={viewport === id} onClick={() => setViewport(id)}>{data.label}<span>{data.width}px</span></button>)}</div>
        <div className="ts-scene-toolbar" aria-label="Preview content">{SCENES.map(([id, label]) => <button key={id} aria-pressed={scene === id} onClick={() => setScene(id)}>{label}</button>)}</div>
        <div className="ts-stage"><div className={`ts-preview is-${viewport} is-${scene}`} style={{ '--preview-width': `${frame.width}px` }}><header><span>{theme.name.toUpperCase()} PORTFOLIO</span><b>{frame.note}</b></header><main><PreviewScene scene={scene} theme={theme}/></main><footer><span>HELLO@EXAMPLE.COM</span><b>BACK TO TOP ↑</b></footer></div></div>
      </Section>

      <Section number="05" title="Release gate" note="공통 항목과 테마 전용 항목을 모두 통과해야 실제 테마에 적용">
        <div className="ts-release">{CORE_RELEASE.map(([group, items], groupIndex) => <article key={group}><header><span>{String(groupIndex + 1).padStart(2, '0')}</span><h3>{group}</h3></header><ol>{items.map((item, itemIndex) => <li key={item}><span>{String(itemIndex + 1).padStart(2, '0')}</span><p>{item}</p><b>REQUIRED</b></li>)}</ol></article>)}</div>
        <div className="ts-approval"><span>STATUS / REVIEW ONLY</span><h3>이 문서는 실제 테마 적용 전 검토본입니다.</h3><p>공통 규칙과 {theme.name} 전용 규칙을 확인한 뒤에만 실제 프론트 스타일로 옮깁니다. 어드민 스타일에는 연결하지 않습니다.</p></div>
      </Section>
    </div>
  </main>
}
