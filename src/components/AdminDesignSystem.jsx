import { useState } from 'react'

const swatches = [
  ['Canvas', '배경', 'var(--ds-canvas)'],
  ['Surface', '작업 면', 'var(--ds-surface)'],
  ['Line', '구분선', 'var(--ds-line)'],
  ['Ink', '본문', 'var(--ds-ink)'],
  ['Muted', '보조 정보', 'var(--ds-muted)'],
  ['Accent', '주요 행동', 'var(--ds-accent)'],
  ['Danger', '삭제·차단', 'var(--ds-danger)'],
]

const uxRules = [
  ['정렬', '모든 섹션은 공통 콘텐츠 시작선과 번호 열을 사용합니다.', '컴포넌트마다 임의의 좌우 여백을 추가하지 않습니다.'],
  ['줄바꿈', '어드민의 명시적 줄바꿈을 우선하고 좁은 화면에서만 자연 줄바꿈을 허용합니다.', '넓은 화면에서 고정 폭으로 제목을 강제 개행하지 않습니다.'],
  ['간격', '8px 배수의 토큰만 사용하고 상·하 경계선과 내용의 패딩을 동일하게 둡니다.', '빈 공간을 맞추기 위한 임의의 margin 값을 추가하지 않습니다.'],
  ['색상', '색은 배경·본문·보조·행동·상태의 역할로 사용합니다.', '장식이나 섹션마다 새로운 색을 만들지 않습니다.'],
  ['상태', 'Hover·Focus·Pressed는 색과 선으로 표현하며 위치와 크기를 유지합니다.', '터치 후 글자나 열이 이동하는 변형을 사용하지 않습니다.'],
  ['콘텐츠', '원본 데이터와 의도한 순서를 보존하고 값이 없을 때만 항목을 숨깁니다.', '스타일 수정을 이유로 내용을 삭제하거나 축약하지 않습니다.'],
]

const iaGroups = [
  ['PUBLIC', ['Access gate', 'Hero', 'About', 'Featured projects', 'Work experience', 'Career journey', 'Achievements', 'Background', 'Contact / Footer']],
  ['PROJECTS', ['Selected design work', 'All projects archive', 'Project detail', 'Image gallery', 'Previous / All / Next']],
  ['ADMIN', ['Dashboard', 'Portfolio content', 'Project archive', 'Access & logs', 'Settings', 'Design system']],
]

const previewModes = {
  mobile: { label: 'Mobile', width: 390, note: '1열 · 좌우 20px · 본문 15px 이상' },
  tablet: { label: 'Tablet', width: 768, note: '6열 · 좌우 32px · 두 열은 내용이 허용할 때만' },
  desktop: { label: 'Desktop', width: 1280, note: '12열 · 최대 1440px · 의도하지 않은 제목 개행 금지' },
}

function Section({ index, title, description, children }) {
  return <section className="ds-section"><header className="ds-section__header"><span>{index}</span><div><h2>{title}</h2><p>{description}</p></div></header>{children}</section>
}

function FieldDemo({ label, children }) {
  return <label className="ds-field"><span>{label}</span>{children}</label>
}

export default function AdminDesignSystem({ onBack }) {
  const [mode, setMode] = useState('light')
  const [previewMode, setPreviewMode] = useState('mobile')
  return (
    <main className="ds-page" data-mode={mode}>
      <header className="ds-topbar">
        <div><span className="ds-eyebrow">PORTFOLIO GOVERNANCE / v1.0</span><strong>디자인 시스템 · UX 규칙 · IA</strong></div>
        <div className="ds-topbar__actions">
          <div className="ds-mode" aria-label="색상 모드"><button aria-pressed={mode === 'light'} onClick={() => setMode('light')}>Light</button><button aria-pressed={mode === 'dark'} onClick={() => setMode('dark')}>Dark</button></div>
          <button className="ds-button ds-button--quiet" onClick={onBack}>관리자로 돌아가기</button>
        </div>
      </header>

      <div className="ds-wrap">
        <section className="ds-intro">
          <div><span className="ds-kicker">SINGLE SOURCE OF TRUTH · v1.0</span><h1>디자인, UX, 구조를<br />하나의 기준으로 관리합니다.</h1></div>
          <div className="ds-intro__note"><b>핵심 원칙</b><p>같은 정보 구조는 항상 같은 레이아웃을 사용합니다. 넓은 화면을 억지로 비우거나, 좁은 열에 내용을 잘라 넣지 않습니다.</p></div>
        </section>

        <Section index="01" title="레이아웃" description="페이지마다 달라지지 않는 뼈대">
          <div className="ds-rule-grid">
            <article><b>콘텐츠 폭</b><strong>최대 1440px</strong><p>편집 화면은 가용 폭을 사용하고, 읽기 문서만 960px로 제한합니다.</p></article>
            <article><b>그리드</b><strong>12 columns</strong><p>입력은 내용 길이에 따라 3·4·6·8·12칸을 사용합니다.</p></article>
            <article><b>간격</b><strong>8px base</strong><p>필드 16, 그룹 24, 섹션 40, 페이지 64의 네 단계만 사용합니다.</p></article>
            <article><b>밀도</b><strong>44px row</strong><p>목록은 한 줄 요약을 기본으로 하고 선택한 행만 상세 편집합니다.</p></article>
          </div>
          <div className="ds-anatomy">
            <div className="ds-anatomy__rail">NAV<br /><small>240</small></div>
            <div className="ds-anatomy__main"><div>PAGE HEADER <small>제목 · 설명 · 보조 상태</small></div><div>ACTION BAR <small>저장 | 추가 ··· 가져오기 | 내보내기</small></div><div>CONTENT GRID <small>가용 폭 전체, 의미에 따른 열 배치</small></div></div>
          </div>
        </Section>

        <Section index="02" title="색상과 표면" description="라이트·다크는 동일한 위계, 다른 값">
          <div className="ds-swatches">{swatches.map(([name, use, color]) => <div key={name}><i style={{ background: color }} /><b>{name}</b><span>{use}</span></div>)}</div>
          <div className="ds-elevation"><div><b>Level 0</b><span>페이지 배경</span></div><div><b>Level 1</b><span>패널 · 테이블</span></div><div><b>Level 2</b><span>모달 · 드로어</span></div><p>그림자는 오버레이에만 사용합니다. 일반 카드와 툴바는 1px 경계선으로 구분합니다.</p></div>
        </Section>

        <Section index="03" title="타입과 컨트롤" description="잘리지 않고, 한눈에 상태를 구분하는 크기">
          <div className="ds-type-controls">
            <div className="ds-type-scale"><span>Display / 32</span><h3>페이지 제목</h3><span>Heading / 18</span><h4>섹션 제목</h4><span>Body / 14</span><p>입력값과 설명은 최소 14px을 유지합니다.</p><span>Meta / 12</span><small>상태와 보조 정보에만 사용</small></div>
            <div className="ds-control-grid">
              <FieldDemo label="텍스트"><input defaultValue="내용이 잘리지 않는 입력" /></FieldDemo>
              <FieldDemo label="선택"><select defaultValue="data"><option value="data">데이터</option><option>AI</option></select></FieldDemo>
              <FieldDemo label="설명"><textarea defaultValue="긴 값은 높이가 늘어나며 한 줄 입력에 억지로 넣지 않습니다." /></FieldDemo>
              <div className="ds-button-row"><button className="ds-button ds-button--primary">저장</button><button className="ds-button">추가</button><button className="ds-button ds-button--quiet">취소</button><button className="ds-button ds-button--danger">삭제</button></div>
            </div>
          </div>
          <div className="ds-pattern-grid">
            <article><header><b>드롭다운 셰브론</b><span>네이티브 화살표 금지</span></header><div className="ds-select-measure"><select defaultValue="one"><option value="one">항상 수직 중앙</option></select><i>12px</i></div><p>화살표는 컨트롤 오른쪽 12px, 수직 50%에 고정합니다. 텍스트 영역과 겹치지 않도록 오른쪽 패딩은 36px을 확보합니다.</p></article>
            <article><header><b>중첩 입력</b><span>한 레벨에 경계선 하나</span></header><div className="ds-compound"><span>https://</span><input defaultValue="portfolio.example" /><button>복사</button></div><p>그룹에 외곽선이 있으면 내부 입력의 테두리와 라운드는 제거하고 구분선만 둡니다. 각각 독립된 필드라면 부모는 테두리를 갖지 않습니다.</p></article>
          </div>
        </Section>

        <Section index="04" title="페이지 헤더와 액션" description="모든 관리 페이지에서 같은 위치와 순서">
          <div className="ds-page-demo">
            <header><div><span>접속 관리</span><h3>접속 토큰</h3><p>방문자에게 발급한 접근 권한을 관리합니다.</p></div><div className="ds-identity"><i />관리자 1명</div></header>
            <nav><button className="ds-button ds-button--primary">저장</button><button className="ds-button">새 토큰</button><span /><button className="ds-button ds-button--quiet">JSON 가져오기</button><button className="ds-button ds-button--quiet">내보내기</button></nav>
          </div>
          <ul className="ds-checks"><li>사용자 이메일은 사이드바에 반복 노출하지 않고 계정 메뉴 안에서만 표시</li><li>페이지 제목·설명·상태는 한 헤더 안에서 끝냄</li><li>주요 행동은 왼쪽, 데이터 이동과 보조 행동은 오른쪽</li><li>모바일에서는 중요도 순으로 줄바꿈하되 버튼 글자를 세로로 쌓지 않음</li></ul>
          <div className="ds-overlay-demo"><div className="ds-overlay-demo__context"><b>뒤쪽 작업 화면</b><span>회색 막과 과한 블러를 씌우지 않습니다.</span></div><aside><span>OVERLAY / LEVEL 2</span><h3>JSON 벌크 편집</h3><p>오버레이 표면은 가장 선명한 Surface를 사용하고, 배경에는 옅은 브랜드 색조만 더합니다.</p><button className="ds-button ds-button--primary">확인</button></aside></div>
        </Section>

        <Section index="05" title="데이터 화면" description="토큰과 로그는 카드가 아니라 스캔 가능한 표">
          <div className="ds-data-grid">
            <article><header><div><h3>접속 토큰</h3><p>활성 8 · 만료 임박 2</p></div><button className="ds-button ds-button--primary">새 토큰</button></header><div className="ds-table"><div className="is-head"><span>이름</span><span>상태</span><span>만료</span><span>최근 접속</span><span /></div><div><b>채용 검토</b><span className="ds-status is-live">활성</span><span>3일 후</span><span>오늘 14:32</span><button>•••</button></div><div><b>파트너 공유</b><span className="ds-status is-warn">임박</span><span>8시간 후</span><span>어제</span><button>•••</button></div></div></article>
            <article><header><div><h3>접속 로그</h3><p>행동 흐름을 시간순으로 확인</p></div><button className="ds-button">필터</button></header><div className="ds-log"><div><time>14:32:08</time><b>프로젝트 열람</b><span>채용 검토 · NOMA Product Launch</span></div><div><time>14:31:42</time><b>섹션 도달</b><span>채용 검토 · 프로젝트</span></div><div><time>14:30:11</time><b>접속 성공</b><span>채용 검토 · Desktop</span></div></div></article>
          </div>
        </Section>

        <Section index="06" title="통계 시각화" description="비교·추세·구성을 목적에 맞는 그래프로 표현">
          <div className="ds-chart-grid">
            <article><header><div><span>COMPARISON</span><h3>섹션별 열람</h3></div><b>1,284</b></header><div className="ds-bars" aria-label="프로젝트 82, 소개 57, 경력 41, 연락처 24"><button style={{ '--value': '82%' }} data-tip="프로젝트 · 82회 · 전체 40%"><span>프로젝트</span></button><button style={{ '--value': '57%' }} data-tip="소개 · 57회 · 전체 28%"><span>소개</span></button><button style={{ '--value': '41%' }} data-tip="경력 · 41회 · 전체 20%"><span>경력</span></button><button style={{ '--value': '24%' }} data-tip="연락처 · 24회 · 전체 12%"><span>연락처</span></button></div></article>
            <article><header><div><span>TREND</span><h3>최근 7일 접속</h3></div><b>+18%</b></header><div className="ds-line-wrap"><svg className="ds-line-chart" viewBox="0 0 420 150" role="img" aria-label="최근 7일 접속 증가 추세"><path className="grid" d="M0 25H420M0 75H420M0 125H420" /><path className="area" d="M0 116L70 98L140 106L210 72L280 80L350 42L420 28V150H0Z" /><path className="line" d="M0 116L70 98L140 106L210 72L280 80L350 42L420 28" /></svg><button className="ds-chart-hit" style={{ '--x': '50%', '--y': '48%' }} data-tip="목요일 · 접속 46회 · 전일 대비 +31%" aria-label="목요일 접속 46회" /></div><div className="ds-axis"><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span><span>일</span></div></article>
            <article className="ds-chart-rules"><header><div><span>RULES</span><h3>그래프 선택 기준</h3></div></header><dl><div><dt>막대</dt><dd>항목 간 크기 비교</dd></div><div><dt>선</dt><dd>시간에 따른 추세</dd></div><div><dt>100% 누적</dt><dd>전체 안의 구성비</dd></div><div><dt>숫자</dt><dd>단일 핵심 지표</dd></div></dl></article>
          </div>
          <div className="ds-chart-guidance"><div><b>색상</b><span>기본 계열 1색 + 강조 1색. 의미 없는 무지개색 금지</span></div><div><b>축·격자</b><span>0 기준 유지, 격자는 최대 4개, 소수점 자릿수 통일</span></div><div><b>범례·툴팁</b><span>Hover·키보드 focus·모바일 tap에서 항목·값·단위·기간 표시</span></div><div><b>상태</b><span>로딩은 골격, 빈 값은 원인과 기간, 오류는 재시도 제공</span></div><div><b>접근성</b><span>색상 외 라벨·패턴 병행, 그래프마다 텍스트 요약 제공</span></div><div><b>모바일</b><span>Tap으로 열고 바깥 탭 또는 Esc로 닫기. 화면 밖으로 넘치지 않게 정렬</span></div></div>
        </Section>

        <Section index="07" title="반응형 규칙" description="화면 폭이 아니라 작업의 우선순위에 따라 재배치">
          <div className="ds-breakpoints">
            <article><header><span>MOBILE</span><b>360–767px</b></header><div className="ds-device is-mobile"><i /><i /><i /></div><ul><li>1열, 좌우 여백 16px</li><li>사이드바는 상단 메뉴로 전환</li><li>주요 행동 2개만 노출, 나머지는 더보기</li><li>테이블은 카드 변환 없이 가로 스크롤</li><li>오버레이는 전체 화면</li></ul></article>
            <article><header><span>TABLET</span><b>768–1199px</b></header><div className="ds-device is-tablet"><i /><i /><i /><i /></div><ul><li>6열, 좌우 여백 24px</li><li>사이드바 216px 유지</li><li>필드는 3·6열 조합</li><li>액션 바는 최대 두 줄</li><li>드로어 폭은 화면의 72%</li></ul></article>
            <article><header><span>DESKTOP</span><b>1200px+</b></header><div className="ds-device is-desktop"><i /><i /><i /><i /><i /></div><ul><li>12열, 좌우 여백 32px</li><li>사이드바 240px 고정</li><li>편집 영역 최대 1440px</li><li>필드는 3·4·6·8·12열</li><li>드로어 최대 720px</li></ul></article>
          </div>
          <div className="ds-responsive-rules"><div><b>터치</b><span>버튼·행·입력 최소 높이 44px</span></div><div><b>텍스트</b><span>버튼 라벨 줄바꿈 금지, 값은 말줄임 대신 확장</span></div><div><b>순서</b><span>제목 → 상태 → 주요 행동 → 콘텐츠 → 보조 행동</span></div><div><b>중첩</b><span>모바일에서도 한 레벨에 경계선 하나</span></div></div>
        </Section>

        <Section index="08" title="UX 규칙" description="반복해서 설명하지 않아도 되는 전역 판단 기준">
          <div className="ds-ux-rules">{uxRules.map(([title, doText, dontText], index) => <article key={title}><span>{String(index + 1).padStart(2, '0')}</span><h3>{title}</h3><div><b>DO</b><p>{doText}</p></div><div><b>DON'T</b><p>{dontText}</p></div></article>)}</div>
        </Section>

        <Section index="09" title="정보 구조" description="공개 사이트와 운영 화면의 위치·이동 관계">
          <div className="ds-ia-map">{iaGroups.map(([group, items]) => <article key={group}><header><span>{group}</span><b>{items.length} nodes</b></header><ol>{items.map((item, index) => <li key={item}><i>{String(index + 1).padStart(2, '0')}</i><span>{item}</span></li>)}</ol></article>)}</div>
          <div className="ds-ia-contract"><b>이동 계약</b><span>모든 상세 페이지는 메인으로 나가는 Close를 제공합니다.</span><span>아카이브와 상세 페이지는 같은 공통 푸터를 사용합니다.</span><span>표시된 화살표와 링크는 반드시 실제 목적지를 가집니다.</span></div>
        </Section>

        <Section index="10" title="반응형 계약 미리보기" description="같은 콘텐츠를 세 화면 규칙으로 즉시 비교">
          <div className="ds-preview-toolbar" role="group" aria-label="미리보기 화면 크기">{Object.entries(previewModes).map(([key, item]) => <button key={key} type="button" aria-pressed={previewMode === key} onClick={() => setPreviewMode(key)}>{item.label}<span>{item.width}px</span></button>)}</div>
          <div className="ds-viewport-stage"><div className={`ds-viewport is-${previewMode}`} style={{ '--preview-width': `${previewModes[previewMode].width}px` }}><header><span>PORTFOLIO SYSTEM</span><b>{previewModes[previewMode].label}</b></header><main><p>PROJECTS / 03</p><h3>Selected Design Work</h3><div className="ds-preview-grid"><aside>01<br />NOMA<br /><small>Campaign · 2026</small></aside><section><div className="ds-preview-image" /><b>Clear hierarchy, stable rhythm.</b><p>제목, 본문, 메타, 행동은 화면 크기가 바뀌어도 역할과 순서를 유지합니다.</p></section></div></main><footer>{previewModes[previewMode].note}</footer></div></div>
        </Section>

        <Section index="11" title="적용과 검수" description="모든 변경이 통과해야 하는 고정 절차">
          <ol className="ds-phases"><li><span>1</span><div><b>Foundation</b><p>토큰, 컨테이너, 헤더, 필드, 버튼</p></div></li><li><span>2</span><div><b>Content editors</b><p>프로젝트·소개·성과·저니의 목록/상세 패턴</p></div></li><li><span>3</span><div><b>Access operations</b><p>토큰 발급과 로그를 고밀도 테이블로 재구성</p></div></li><li><span>4</span><div><b>QA</b><p>라이트·다크, 360/768/1280px, 데이터 보존 검증</p></div></li></ol>
        </Section>

        <footer className="ds-approval"><div><span>SYSTEM STATUS / ACTIVE</span><h2>새 화면과 수정은 이 페이지의 규칙을 통과해야 합니다.</h2><p>규칙을 바꿀 때는 구현과 문서를 같은 커밋에서 함께 갱신합니다.</p></div><button className="ds-button ds-button--primary" onClick={onBack}>관리자로 돌아가기</button></footer>
      </div>
    </main>
  )
}
