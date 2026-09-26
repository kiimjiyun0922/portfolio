import { useState } from 'react'
import { THEMES } from '../themes'

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
  ['정보 위계', '페이지 제목과 첫 패널 제목이 같은 대상을 가리키면 패널 제목을 반복하지 않고, 바로 하위 편집 그룹이나 데이터 목록을 시작합니다. 한 페이지에 병렬 패널이 둘 이상이면 각 패널의 서로 다른 작업 범위를 서브 제목으로 표시합니다.', '단일 패널에 페이지 제목을 바꾸어 쓰거나, 여러 패널에 같은 서브 제목을 반복하지 않습니다.'],
  ['범위 선택', '상위 선택이 아래 작업 범위를 바꾸면 활성 항목에 ‘현재 편집 중’을 표시하고, 선택기와 공통 액션 바를 하나의 연결된 작업 묶음으로 표현합니다.', '색상 차이만으로 활성 범위와 아래 편집기의 관계를 추측하게 하지 않습니다.'],
  ['모바일 내비게이션', '열린 메뉴는 헤더 아래 남은 화면을 채우고 번호·전체 메뉴명·현재 상태를 한 열로 표시합니다.', '메뉴를 두 열로 압축하거나 메뉴명을 줄임표로 자르지 않습니다.'],
  ['광학 정렬', '글자 기준선과 아이콘의 시각 중심을 맞추고, 아이콘은 필요할 때만 1px 이내로 보정합니다.', '박스의 수학적 중앙만 믿거나 컴포넌트마다 서로 다른 보정값을 사용하지 않습니다.'],
  ['줄바꿈', '넓은 화면의 안내 문장은 사용 가능한 폭을 쓰며 임의 max-width 때문에 한두 글자만 다음 줄로 보내지 않습니다. 화면이 좁을 때만 단어 단위로 자연스럽게 줄바꿈합니다.', '안내 문장에 임의의 읽기 폭을 적용하거나 마지막 한두 글자만 고립시키지 않습니다.'],
  ['간격', '8px 배수의 토큰만 사용하고 상·하 경계선과 내용의 패딩을 동일하게 둡니다.', '빈 공간을 맞추기 위한 임의의 margin 값을 추가하지 않습니다.'],
  ['색상', '색은 배경·본문·보조·행동·상태의 역할로 사용합니다.', '장식이나 섹션마다 새로운 색을 만들지 않습니다.'],
  ['상태', 'Hover·Focus·Pressed는 색과 선으로 표현하며 위치와 크기를 유지합니다.', '터치 후 글자나 열이 이동하는 변형을 사용하지 않습니다.'],
  ['버튼 대비', '버튼 variant마다 배경·글자·테두리 상태를 한 세트로 정의하고 Light·Dark에서 같은 의미와 대비를 유지합니다.', 'hover에서 글자색만 연하게 바꾸거나 primary 배경을 지워 라벨을 흐리게 만들지 않습니다.'],
  ['플로팅 행동', '44px 정사각형 버튼을 대비가 분명한 하나의 표면에 묶고 safe area와 본문을 피해 고정합니다.', '원형 버튼을 배경 위에 흩어 놓거나 인접 고정 요소와 겹치게 하지 않습니다.'],
  ['삭제 확인', '항목 삭제·연결 해제·기록 제거는 대상을 밝힌 시스템 확인창을 거친 뒤 편집 상태를 바꿉니다.', '작은 삭제 링크를 누르는 즉시 데이터나 편집 값을 제거하지 않습니다.'],
  ['콘텐츠', '원본 데이터와 의도한 순서를 보존하고 값이 없을 때만 항목을 숨깁니다.', '스타일 수정을 이유로 내용을 삭제하거나 축약하지 않습니다.'],
]

const adminSiteMap = [
  ['대시보드', [['홈', '운영 요약 · 빠른 작업']]],
  ['콘텐츠', [
    ['프로젝트', '구조형 · 아카이브형 · 이후 표현 방식 확장'],
    ['경력·학력', '경력 · 교육 · 활동'],
    ['소개', '바이오 · 스킬'],
    ['핵심 성과', '정량 성과 항목'],
    ['커리어 저니', '경력 흐름 항목'],
  ]],
  ['페이지 설정', [
    ['히어로', '사이트 제목 · 첫 화면'],
    ['접속 화면', '인증 전 화면'],
    ['테마', '기본 · 토큰별 테마 · 미리보기'],
    ['연락처', '공개 연락 정보'],
  ]],
  ['접속 관리', [
    ['토큰', '발급 · 만료 · 폐기 · 테마 지정'],
    ['접속 로그', '세션 · 행동 · 분석'],
  ]],
  ['설정', [
    ['배지·스킬 분류', '프로젝트 배지 유형 · 소개 스킬 분류'],
    ['변경 이력', '스냅샷 · 복원'],
    ['관리자 계정', '인증 · 로그아웃'],
    ['디자인 시스템', '어드민 UI 규칙 · IA'],
  ]],
]

const publicSiteMap = [
  ['진입', [
    ['접속 화면', '토큰 인증 · 만료 · 오류'],
  ]],
  ['홈  /', [
    ['히어로', '대표 메시지'],
    ['소개', '바이오 · 스킬'],
    ['커리어 저니', '경력 흐름'],
    ['핵심 성과', '정량 성과'],
    ['프로젝트', '구조형 프로젝트'],
    ['경력·학력', '경력 · 교육 · 활동'],
    ['연락처', '연락 정보'],
  ]],
  ['프로젝트 아카이브  /projects', [
    ['아카이브 헤더', '제목 · 소개 · 공개 수'],
    ['프로젝트 목록', '공개된 아카이브형 프로젝트'],
    ['연락처', '공통 하단 연락 정보'],
  ]],
  ['프로젝트 상세  /projects/:slug', [
    ['대표 정보', '분류 · 연도 · 제목 · 요약 · 이미지'],
    ['프로젝트 메타', '클라이언트 · 역할 · 기간'],
    ['케이스 스터디', 'Problem → IA / User Flow → Design Solution → Validation → Design System'],
    ['갤러리', '이미지 · 설명 · 순서'],
    ['이동', '이전 · 전체 · 다음'],
  ]],
  ['공통 셸', [
    ['접속 만료 배너', '인증 후 남은 시간'],
    ['포트폴리오 레일', '홈 섹션 이동'],
    ['맨 위로', '페이지 상단 이동'],
  ]],
]

const contentMap = [
  ['히어로 · 소개 · 저니 · 성과', '홈 /', '관리 순서대로 각 홈 섹션에 표시'],
  ['프로젝트 · 구조형', '홈 /', '그룹과 스토리·성과 상세를 표시'],
  ['프로젝트 · 아카이브형', '/projects · /projects/:slug', '공개 항목만 목록과 상세에 표시'],
  ['경력·학력 · 연락처', '홈 / · 공통 하단', '원본 순서와 공개 여부를 보존'],
  ['접속 화면 · 토큰', '인증 전 · 공통 셸', '접근, 만료, 토큰별 테마를 제어'],
  ['테마', '모든 공개 화면', '색·서체·표현만 변경하고 정보 구조는 유지'],
  ['배지·스킬 분류', '프로젝트 · 소개', '배지 유형과 스킬 분류의 공통 허용값을 공급'],
]

const previewModes = {
  mobile: { label: 'Mobile', width: 390, note: '상단 메뉴 · 전체 화면 단일 열 · 전체 메뉴명 · 하단 행동' },
  tablet: { label: 'Tablet', width: 768, note: '144px compact sidebar · 6열 작업 영역 · 액션 최대 두 줄' },
  desktop: { label: 'Desktop', width: 1280, note: '240px sidebar · 12열 · 편집 영역 최대 1440px' },
}

const componentGroups = [
  ['NAVIGATION', [
    ['Admin shell', '전체 화면 골격', 'Desktop sidebar · Tablet compact sidebar · Mobile full-screen menu', 'default · closed · open'],
    ['Nav item', '현재 위치와 이동', 'default · active · disabled', 'hover · focus · pressed'],
    ['Section header', '페이지 제목·설명·상태', 'title only · with status', 'default'],
    ['Jump navigation', '긴 편집 화면 내 이동', 'floating list · 44px top button · safe-area group', 'closed · open · hover · focus · hidden'],
  ]],
  ['ACTIONS', [
    ['Action bar', '저장과 데이터 이동', 'sticky · wrapped', 'default · scrolled'],
    ['Button', '실행과 취소', 'primary · secondary · quiet · danger · icon', 'default · hover · focus · pressed · disabled · loading'],
    ['Import / Export', 'JSON 파일 이동', 'import · export · sample', 'idle · validating · complete · error'],
    ['Row actions', '개별 항목 관리', 'move · duplicate · delete · more', 'default · disabled · confirm'],
  ]],
  ['FORM CONTROLS', [
    ['Text / Number', '자유 입력과 수치', 'text · URL · number', 'default · focus · invalid · disabled'],
    ['Textarea', '긴 내용 편집', 'fixed · auto grow', 'default · focus · invalid'],
    ['Select / Year', '정해진 값 선택', 'select · searchable · year', 'closed · open · selected · invalid'],
    ['Date / Time', '시점과 기간 입력', 'date · datetime · month range · year range', 'empty · selected · current · unavailable'],
    ['Color field', '테마 색상 편집', 'picker + HEX', 'valid · invalid · contrast warning'],
    ['Choice controls', '참·거짓과 단일 선택', 'checkbox · radio · switch', 'unchecked · checked · mixed · disabled'],
  ]],
  ['EDITING', [
    ['Document field group', '단일 섹션의 의미별 필드 묶음', 'short fields 2-column · copy fields paired · compact action', 'clean · changed · invalid'],
    ['Collection panel', '경력·학력·활동 같은 반복 데이터 묶음', 'compact rows · mobile labeled rows', 'populated · empty · reordered'],
    ['Summary row', '접힌 경력의 회사·직함·프로젝트·기간 요약', 'fixed column tracks · tablet stacked · mobile stacked', 'default · hover · focus · expanded'],
    ['Editor sheet', '한 데이터 묶음 편집', 'expanded · collapsed', 'clean · changed · saving · error'],
    ['Repeatable row', '성과·태그 같은 짧은 반복 항목', 'compact table · mobile stacked row', 'default · reordered · removed'],
    ['Master / Detail', '중첩된 프로젝트 모음 편집', 'list + selected editor', 'selected · empty · reordered · removed'],
    ['Taxonomy / Tag', '분류와 라벨 관리', 'badge · editable row', 'default · duplicate · invalid'],
    ['Media field', '이미지와 파일 연결', 'URL · upload · preview', 'empty · loading · ready · failed'],
    ['JSON bulk editor', '전체 구조 대량 교체', 'drawer', 'editing · parse error · diff · ready'],
    ['Theme editor', '적용 대상과 테마 선택', 'entry · visitor · token override', 'selected · changed · saved'],
    ['Theme preview toolbar', '실제 화면 위 테마·화면·폭 전환', 'desktop floating · mobile docked', 'previewing · changed · closing'],
  ]],
  ['DATA DISPLAY', [
    ['Status strip', '핵심 운영 상태', 'neutral · success · warning · danger', 'live · stale'],
    ['Table / List', '토큰·로그·이력 탐색', 'dense · comfortable', 'loading · empty · error · selected'],
    ['Filter / Search', '결과 범위 축소', 'search · select · date range', 'idle · active · no result'],
    ['Pagination', '전체 데이터 탐색', 'pages · cursor', 'first · middle · last · disabled'],
    ['Chart', '비교·추세·구성', 'bar · line · stacked · metric', 'loading · hover · empty · error'],
    ['Session journey', '접속 행동 단계', 'horizontal · vertical', 'complete · key · drop-off'],
  ]],
  ['FEEDBACK / OVERLAY', [
    ['Inline validation', '필드 오류 복구', 'error · warning · help', 'hidden · visible'],
    ['Toast', '비차단 결과 알림', 'success · error', 'enter · persistent · dismiss'],
    ['Dialog', '확인과 짧은 생성', 'standard · destructive', 'open · busy · error'],
    ['Drawer', '긴 편집과 원본 확인', 'right · full screen', 'open · changed · blocked'],
    ['Empty state', '결과가 없는 이유와 다음 행동', 'initial · filtered · permission', 'empty · actionable · read only'],
    ['Loading / Error', '대기와 실패 복구', 'skeleton · inline error · retry', 'loading · delayed · failed'],
    ['Tooltip / Popover', '보조 설명과 세부값', 'tooltip · menu · chart detail', 'hover · focus · tap'],
  ]],
]

function Section({ index, title, description, children }) {
  return <section className="ds-section"><header className="ds-section__header"><span>{index}</span><div><h2>{title}</h2><p>{description}</p></div></header>{children}</section>
}

function FieldDemo({ label, children }) {
  return <label className="ds-field"><span>{label}</span>{children}</label>
}

function SiteMap({ eyebrow, title, description, root, groups }) {
  return (
    <article className="ds-sitemap">
      <header className="ds-sitemap__header">
        <div><span>{eyebrow}</span><h3>{title}</h3></div>
        <p>{description}</p>
      </header>
      <div className="ds-sitemap__root"><span>ROOT</span><b>{root}</b></div>
      <div className="ds-sitemap__groups">
        {groups.map(([group, items], groupIndex) => (
          <section key={group}>
            <header><span>{String(groupIndex + 1).padStart(2, '0')}</span><b>{group}</b></header>
            <ol>{items.map(([label, detail], itemIndex) => <li key={label}><i>{String(itemIndex + 1).padStart(2, '0')}</i><div><b>{label}</b><span>{detail}</span></div></li>)}</ol>
          </section>
        ))}
      </div>
    </article>
  )
}

function AdminResponsivePreview({ mode, mobileMenuOpen, onMobileMenuToggle }) {
  if (mode === 'mobile') {
    return (
      <div className="ds-admin-mobile-demo">
        <header>
          <button type="button" aria-label={mobileMenuOpen ? '메뉴 닫기' : '전체 메뉴 열기'} aria-expanded={mobileMenuOpen} aria-controls="ds-admin-mobile-menu" onClick={onMobileMenuToggle}>
            <i className={mobileMenuOpen ? 'is-close' : ''} aria-hidden="true" />
          </button>
          <b><span>12</span> 접속 로그</b>
          <div><button type="button">다크</button><button type="button" className="is-primary">보기</button></div>
        </header>
        {mobileMenuOpen ? (
          <>
            <nav id="ds-admin-mobile-menu" aria-label="모바일 관리자 전체 메뉴">
              {adminSiteMap.map(([group, items], groupIndex) => (
                <section key={group}>
                  <h4>{group}</h4>
                  <div>
                    {items.map(([label], itemIndex) => {
                      const absoluteIndex = adminSiteMap.slice(0, groupIndex).reduce((total, [, previousItems]) => total + previousItems.length, 0) + itemIndex + 1
                      const isActive = label === '접속 로그'
                      return <button key={label} type="button" className={isActive ? 'is-active' : ''}><span>{String(absoluteIndex).padStart(2, '0')}</span><b>{label}</b>{isActive && <i>현재</i>}</button>
                    })}
                  </div>
                </section>
              ))}
            </nav>
            <footer><button type="button" className="is-primary">PDF 출력</button><button type="button">로그아웃</button></footer>
          </>
        ) : (
          <main className="ds-admin-mobile-demo__page">
            <header><small>접속 관리 · 접속 로그</small><h3>접속 로그</h3><p>방문 세션과 행동 단계를 확인합니다.</p></header>
            <div className="ds-admin-mobile-demo__actions"><button type="button">필터</button><button type="button">최근 30일</button></div>
            <section className="ds-admin-mobile-demo__metrics" aria-label="접속 요약"><div><span>오늘 인증 접속</span><b>8</b></div><div><span>활성 토큰</span><b>3</b></div></section>
            <section className="ds-admin-mobile-demo__list" aria-label="최근 접속 기록"><header><b>최근 접속</b><span>전체 보기</span></header><div><time>14:32</time><strong>프로젝트 열람</strong><span>완료</span></div><div><time>14:31</time><strong>섹션 도달</strong><span>활성</span></div></section>
          </main>
        )}
      </div>
    )
  }

  return (
    <div className="ds-admin-preview">
      <nav><strong>ADMIN</strong><span className="is-active">접속 로그</span><span>토큰</span><span>콘텐츠</span><span>설정</span></nav>
      <main><header><div><small>접속 관리 / 로그</small><h3>접속 로그</h3><p>방문 세션과 행동 단계를 확인합니다.</p></div><i>활성 8</i></header><div className="ds-admin-preview__actions"><button>필터</button><button>기간: 30일</button><span /><button>내보내기</button></div><section><div className="ds-admin-preview__head"><span>시간</span><span>행동</span><span>세션</span><span>상태</span></div><div><span>14:32</span><b>프로젝트 열람</b><span>채용 검토</span><i>완료</i></div><div><span>14:31</span><b>섹션 도달</b><span>채용 검토</span><i>활성</i></div></section></main>
    </div>
  )
}

function ComponentSpecimen({ name }) {
  const wrap = (content, className = '') => <div className={`ds-live-specimen ${className}`}>{content}</div>
  switch (name) {
    case 'Admin shell': return wrap(<><nav><b>A</b><button className="is-active">로그</button><button>콘텐츠</button></nav><main><small>접속 관리</small><strong>접속 로그</strong><i /></main></>, 'is-shell')
    case 'Nav item': return wrap(<nav className="is-nav-list"><button className="is-active">접속 로그</button><button>토큰</button><button disabled>권한 없음</button></nav>)
    case 'Section header': return wrap(<header className="is-section-head"><div><small>접속 관리</small><strong>접속 로그</strong><p>방문 행동을 확인합니다.</p></div><i>활성 8</i></header>)
    case 'Jump navigation': return wrap(<div className="is-jump"><menu><button>기본 정보</button><button>접속 범위</button></menu><button aria-label="페이지 바로가기">☷</button><button aria-label="맨 위로">↑</button></div>, 'is-compact')
    case 'Action bar': return wrap(<div className="is-action"><button className="is-primary">저장</button><button>추가</button><span /><button>내보내기</button></div>)
    case 'Button': return wrap(<div className="is-buttons"><button className="is-primary">저장</button><button>취소</button><button className="is-danger">삭제</button><button aria-label="더보기">•••</button></div>, 'is-compact')
    case 'Import / Export': return wrap(<div className="is-buttons"><button>↑ JSON 가져오기</button><button>↓ 내보내기</button><button className="is-quiet">샘플</button></div>, 'is-compact')
    case 'Row actions': return wrap(<div className="is-buttons"><button aria-label="위로">↑</button><button aria-label="아래로">↓</button><button>복제</button><button className="is-danger">삭제</button></div>, 'is-compact')
    case 'Text / Number': return wrap(<div className="is-fields"><label>이름<input defaultValue="채용 검토" /></label><label>허용 횟수<input type="number" defaultValue="3" /></label></div>)
    case 'Textarea': return wrap(<label className="is-field">설명<textarea defaultValue="긴 내용은 입력값에 맞춰 높이가 늘어납니다." /></label>)
    case 'Select / Year': return wrap(<div className="is-fields"><label>분류<select defaultValue="log"><option value="log">접속 로그</option><option>토큰</option></select></label><label>연도<select defaultValue="2026"><option>2026</option><option>2025</option></select></label></div>)
    case 'Date / Time': return wrap(<div className="is-date-range"><label>시작 월<input type="month" defaultValue="2023-05" /></label><span>—</span><label>종료 월<input type="month" defaultValue="2024-01" /></label><label className="is-current"><input type="checkbox" /> 현재</label></div>, 'is-wide-pattern')
    case 'Color field': return wrap(<label className="is-field">강조색<div className="is-color"><input type="color" defaultValue="#126b48" aria-label="강조색 선택 예시" /><input defaultValue="#126b48" aria-label="강조색 코드 예시" /></div></label>)
    case 'Choice controls': return wrap(<div className="is-choices"><label><input type="checkbox" defaultChecked /> 공개</label><label><input type="radio" name="specimen-choice" defaultChecked /> 기본</label><label className="is-switch"><input type="checkbox" defaultChecked /> <i />알림</label></div>, 'is-compact')
    case 'Document field group': return wrap(<section className="is-document-group"><header><b>식별 정보</b><small>짧은 값은 같은 행에서 편집합니다.</small></header><div className="is-fields"><label>사이트 타이틀<input defaultValue="김지윤 | Portfolio" /></label><label>태그라인<input defaultValue="Selected Work" /></label></div></section>, 'is-wide-pattern')
    case 'Collection panel': return wrap(<section className="is-collection-panel"><header><div><b>학력</b><small>학교, 학위와 기간을 관리합니다.</small></div><button className="is-primary">학력 추가</button></header><div className="is-collection-row"><span>01</span><input aria-label="학교" defaultValue="한빛대학교" /><input aria-label="학위" defaultValue="경영학 복수전공" /><button className="is-danger">삭제</button></div></section>, 'is-wide-pattern')
    case 'Summary row': return wrap(<button type="button" className="is-summary-row"><span aria-hidden="true">›</span><strong>Lumen Labs</strong><span>Senior Product Manager</span><small>프로젝트 2</small><time>2023.03 ~</time></button>, 'is-wide-pattern')
    case 'Editor sheet': return wrap(<article className="is-editor"><header><b>01 · 채용 검토</b><button>접기</button></header><label>제목<input defaultValue="접속 토큰" /></label><footer><button className="is-primary">저장</button></footer></article>)
    case 'Repeatable row': return wrap(<div className="is-repeat-editor"><span>01</span><label>제목<input defaultValue="AI 상담 어시스턴트 출시" /></label><label>성과 내용<textarea rows="2" defaultValue="상담 처리 시간 42% 단축" /></label><div><label>연결 위치<select defaultValue="project"><option value="project">프로젝트 영역</option><option value="career">경력 영역</option></select></label><button className="is-danger">삭제</button></div></div>, 'is-wide-pattern')
    case 'Master / Detail': return wrap(<div className="is-master-detail"><aside><header><b>프로젝트</b><button>+ 추가</button></header><button className="is-active"><span>01</span><b>LLM 상담 어시스턴트</b><small>2023.05–2024.01</small></button><button><span>02</span><b>AI 품질 평가</b><small>2024.02–2024.08</small></button></aside><section><header><div><b>LLM 상담 어시스턴트</b><small>선택한 항목만 편집</small></div><div><button>↑</button><button>↓</button><button className="is-danger">삭제</button></div></header><div className="is-fields"><label>역할<input defaultValue="프로젝트 리드" /></label><label>인원<input defaultValue="ML 2 · FE 2" /></label></div></section></div>, 'is-wide-pattern')
    case 'Taxonomy / Tag': return wrap(<div className="is-tags"><span>데이터 ×</span><span>AI ×</span><label>새 태그<input placeholder="태그 이름" /></label><button>추가</button></div>)
    case 'Media field': return wrap(<div className="is-media"><div aria-label="이미지 미리보기">PREVIEW</div><label>이미지 URL<input defaultValue="/assets/project.webp" /><small>권장 2400×1600 · 최대 8MB</small></label><button>파일 업로드</button></div>, 'is-wide-pattern')
    case 'JSON bulk editor': return wrap(<aside className="is-drawer"><header><b>JSON 벌크 편집</b><button>×</button></header><textarea defaultValue={'{\n  "title": "접속 로그"\n}'} /><footer><button>취소</button><button className="is-primary">차이 확인</button></footer></aside>)
    case 'Theme editor': return wrap(<div className="is-theme-picker-mini"><button className="is-active"><span><i style={{ background: '#f2f2f0' }} /><i style={{ background: '#222321' }} /><i style={{ background: '#c84f45' }} /></span><b>Mist</b><small>선택됨</small></button><button><span><i style={{ background: '#030712' }} /><i style={{ background: '#111827' }} /><i style={{ background: '#0064ff' }} /></span><b>기본</b><small>다크 네이비</small></button></div>)
    case 'Theme preview toolbar': return wrap(<div className="is-theme-preview-toolbar"><b>미리보기</b><select defaultValue="mist"><option value="mist">Mist</option><option value="default">기본</option></select><div className="is-segment"><button className="is-active">포트폴리오</button><button>진입 화면</button></div><button>어드민으로</button></div>)
    case 'Status strip': return wrap(<div className="is-statuses"><span>활성 <b>8</b></span><span>임박 <b>2</b></span><span>차단 <b>1</b></span></div>)
    case 'Table / List': return wrap(<div className="is-mini-table"><header><span>시간</span><span>행동</span><span>상태</span></header><div><span>14:32</span><b>프로젝트 열람</b><i>완료</i></div><div><span>14:31</span><b>섹션 도달</b><i>활성</i></div></div>)
    case 'Filter / Search': return wrap(<div className="is-filter"><input type="search" placeholder="로그 검색" /><select defaultValue="all"><option value="all">전체 행동</option><option>열람</option></select><button>필터 적용</button></div>)
    case 'Pagination': return wrap(<nav className="is-pagination"><button disabled>이전</button><button className="is-active">1</button><button>2</button><button>3</button><button>다음</button></nav>, 'is-compact')
    case 'Chart': return wrap(<div className="is-chart"><header><div className="is-segment"><button>7일</button><button className="is-active">30일</button><button>90일</button></div><select defaultValue="day"><option value="day">일 단위</option><option>주 단위</option></select></header><div><i style={{ height: '34%' }} /><i style={{ height: '66%' }} /><i style={{ height: '48%' }} /><i style={{ height: '82%' }} /><i style={{ height: '58%' }} /></div></div>)
    case 'Session journey': return wrap(<div className="is-session"><span><i />접속</span><b>→</b><span><i />프로젝트</span><b>→</b><span><i />종료</span></div>)
    case 'Inline validation': return wrap(<label className="is-field is-invalid">토큰 이름<input defaultValue="" aria-invalid="true" /><small>이름을 입력해 주세요.</small></label>)
    case 'Toast': return wrap(<div className="is-toast" role="status"><i>✓</i><span><b>저장했습니다.</b><small>방금</small></span><button aria-label="닫기">×</button></div>)
    case 'Dialog': return wrap(<div className="is-overlay"><section><header><b>토큰 삭제</b><button>×</button></header><p>이 작업은 되돌릴 수 없습니다.</p><footer><button>취소</button><button className="is-danger">삭제</button></footer></section></div>)
    case 'Drawer': return wrap(<div className="is-overlay is-side"><aside><header><b>원본 로그</b><button>×</button></header><div>14:32 · 프로젝트 열람</div><footer><button>닫기</button></footer></aside></div>)
    case 'Empty state': return wrap(<div className="is-empty"><i className="is-empty__mark" aria-hidden="true">0</i><b>조건에 맞는 로그가 없습니다.</b><p>기간이나 행동 필터를 바꿔 다시 확인해 주세요.</p><button>필터 해제</button></div>)
    case 'Loading / Error': return wrap(<div className="is-load-error"><div aria-label="불러오는 중"><i /><i /><i /></div><p><b>로그를 불러오지 못했습니다.</b><span>입력값은 유지됩니다.</span></p><button>다시 시도</button></div>)
    case 'Tooltip / Popover': return wrap(<div className="is-popover"><button>값 보기</button><aside><b>2026.09.25</b><span>접속 46회 · +31%</span></aside></div>)
    default: return null
  }
}

export default function AdminDesignSystem({ onBack }) {
  const [mode, setMode] = useState('light')
  const [previewMode, setPreviewMode] = useState('mobile')
  const [mobilePreviewMenuOpen, setMobilePreviewMenuOpen] = useState(false)
  const [themeTarget, setThemeTarget] = useState('entry')
  const [selectedTheme, setSelectedTheme] = useState('mist')
  const [themePreviewView, setThemePreviewView] = useState('site')
  const [themePreviewViewport, setThemePreviewViewport] = useState('desktop')
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
          <div className="ds-anatomy-label"><div><span>ADMIN PAGE ANATOMY</span><b>데스크톱 어드민 페이지의 공통 골격</b></div><p>각 박스는 실제 콘텐츠가 아니라 모든 관리 페이지가 공유하는 고정 영역과 역할을 나타냅니다.</p></div>
          <div className="ds-anatomy" role="img" aria-label="왼쪽 내비게이션, 오른쪽 페이지 헤더, 액션 바, 콘텐츠 그리드로 구성된 데스크톱 어드민 페이지 골격">
            <div className="ds-anatomy__rail"><b>NAVIGATION</b><small>240px · 메뉴와 현재 위치</small></div>
            <div className="ds-anatomy__main"><div><b>PAGE HEADER</b><small>페이지 식별 · 설명 · 저장 상태</small></div><div><b>ACTION BAR</b><small>주요 행동 | 보조 행동 ··· 데이터 가져오기 | 내보내기</small></div><div><b>CONTENT GRID</b><small>폼·표·그래프가 놓이는 작업 영역 · 가용 폭 전체 사용</small></div></div>
          </div>
          <div className="ds-anatomy-legend"><span><i>01</i> 구조를 설명하는 도식</span><span><i>02</i> 실제 페이지는 아래 컴포넌트 규칙을 조합</span><span><i>03</i> Tablet·Mobile 전환은 14번 미리보기에서 확인</span></div>
        </Section>

        <Section index="02" title="색상과 표면" description="라이트·다크는 동일한 위계, 다른 값">
          <div className="ds-swatches">{swatches.map(([name, use, color]) => <div key={name}><i style={{ background: color }} /><b>{name}</b><span>{use}</span></div>)}</div>
          <div className="ds-elevation"><div><b>Level 0</b><span>페이지 배경</span></div><div><b>Level 1</b><span>패널 · 테이블</span></div><div><b>Level 2</b><span>모달 · 드로어</span></div><p>그림자는 오버레이에만 사용합니다. 일반 카드와 툴바는 1px 경계선으로 구분합니다.</p></div>
        </Section>

        <Section index="03" title="타입과 컨트롤" description="잘리지 않고, 한눈에 상태를 구분하는 크기">
          <div className="ds-type-controls">
            <div className="ds-type-scale"><span>PAGE / 32·40</span><h3>페이지 제목</h3><span>SECTION / 18·28</span><h4>섹션 제목</h4><span>BODY / 16·26</span><p>본문은 읽기 흐름을 유지합니다.</p><span>SUPPORT / 14·22</span><small>라벨과 보조 설명</small><span>MICRO / 13·20</span><small className="is-micro">번호·코드·축에만 사용</small></div>
            <div className="ds-control-grid">
              <FieldDemo label="텍스트"><input defaultValue="내용이 잘리지 않는 입력" /></FieldDemo>
              <FieldDemo label="선택"><select defaultValue="data"><option value="data">데이터</option><option>AI</option></select></FieldDemo>
              <FieldDemo label="설명"><textarea defaultValue="긴 값은 높이가 늘어나며 한 줄 입력에 억지로 넣지 않습니다." /></FieldDemo>
              <div className="ds-button-row"><button className="ds-button ds-button--primary">저장</button><button className="ds-button">추가</button><button className="ds-button ds-button--quiet">취소</button><button className="ds-button ds-button--danger">삭제</button></div>
            </div>
          </div>
          <div className="ds-type-token-table" aria-label="어드민 글자 크기 규칙">
            <div><span>PAGE TITLE</span><b>32px / 40px</b><p>관리 페이지의 한 번뿐인 제목</p></div>
            <div><span>SECTION</span><b>18px / 28px</b><p>섹션 패널 헤더</p></div>
            <div><span>BODY</span><b>16px / 26px</b><p>본문과 표의 주요 값</p></div>
            <div><span>CONTROL</span><b>15px / 22px</b><p>입력값과 기본 버튼</p></div>
            <div><span>SUPPORT</span><b>14px / 22px</b><p>필드 라벨과 보조 설명</p></div>
            <div><span>MICRO</span><b>13px / 20px</b><p>번호·코드·축·기술 주석 전용</p></div>
          </div>
          <div className="ds-pattern-grid">
            <article><header><b>드롭다운 셰브론</b><span>네이티브 화살표 금지</span></header><div className="ds-select-measure"><select defaultValue="one"><option value="one">항상 수직 중앙</option></select><i>12px</i></div><p>화살표는 컨트롤 오른쪽 12px, 수직 50%에 고정합니다. 텍스트 영역과 겹치지 않도록 오른쪽 패딩은 36px을 확보합니다.</p></article>
            <article><header><b>중첩 입력</b><span>한 레벨에 경계선 하나</span></header><div className="ds-compound"><span>https://</span><input defaultValue="portfolio.example" /><button>복사</button></div><p>그룹에 외곽선이 있으면 내부 입력의 테두리와 라운드는 제거하고 구분선만 둡니다. 각각 독립된 필드라면 부모는 테두리를 갖지 않습니다.</p></article>
          </div>
        </Section>

        <Section index="04" title="컴포넌트 카탈로그" description="어드민 화면에 그려지는 모든 요소의 용도·변형·상태·반응형 계약">
          <div className="ds-component-groups">{componentGroups.map(([group, items]) => <article key={group}><header><span>{group}</span><b>{items.length} components</b></header><div>{items.map(([name, purpose, variants, states]) => <section key={name}><div><h3>{name}</h3><p>{purpose}</p></div><ComponentSpecimen name={name} /><dl><div><dt>VARIANTS</dt><dd>{variants}</dd></div><div><dt>STATES</dt><dd>{states}</dd></div></dl></section>)}</div></article>)}</div>
          <div className="ds-component-contract"><div><b>공통 상태</b><span>Default · Hover · Focus · Active · Disabled · Loading · Error를 필요한 컴포넌트마다 정의합니다.</span></div><div><b>필드 정렬</b><span>반복 편집 행의 모든 필드는 행의 위쪽 기준선에 맞추고 단일 입력·선택은 42px 높이를 공유합니다. 여러 줄 입력만 내용에 따라 아래로 확장하며, 이 때문에 다른 필드를 행의 수직 중앙으로 내리지 않습니다.</span></div><div><b>관리 그룹</b><span>삭제·복제·이동 같은 행 관리는 독립된 끝 열로 멀리 떼어 놓지 않습니다. 마지막 관련 필드와 하나의 관리 그룹으로 묶어 8px 간격으로 배치하고, 텍스트 삭제 버튼은 Desktop 42px·Mobile 44px 이상의 조작 높이를 사용합니다.</span></div><div><b>반응형</b><span>반복 편집 행이 한 열로 전환되면 각 필드 라벨을 복원하고 ‘마지막 필드 | 관리 행동’의 인접 관계를 유지합니다. 삭제 버튼만 번호 옆이나 행 반대쪽 모서리로 이동시키지 않습니다.</span></div></div>
          <div className="ds-summary-contract"><b>요약 행 정렬</b><span>접힌 요약 행은 회사명·직함·프로젝트 수·기간에 공통 열 토큰을 사용하고, 내용 길이가 달라도 각 열의 시작선이 행마다 움직이지 않습니다.</span></div>
          <div className="ds-special-editor">
            <header><div><span>SPECIAL PATTERN / THEME ASSIGNMENT</span><h3>방문자에게 적용할 화면을 고르고, 실제 테마 카드를 선택합니다.</h3></div><p>이 화면은 진입 화면과 기본 방문자 테마만 설정합니다.</p></header>
            <div className="ds-theme-target" role="group" aria-label="테마 적용 대상">
              {[['entry', '진입 화면', '인증 전 토큰 입력 화면'], ['visitor', '기본 방문자', '별도 지정이 없는 토큰']].map(([value, label, help]) => <button key={value} type="button" aria-pressed={themeTarget === value} onClick={() => setThemeTarget(value)}><b>{label}</b><span>{help}</span></button>)}
            </div>
            <p className="ds-theme-token-note">토큰별 테마는 토큰 발급·재발급 화면에서 선택합니다.</p>
            <div className="ds-special-editor__demo">
              <aside>
                <p className="ds-theme-card-context">테마 적용 대상 버튼을 목록의 유일한 타이틀로 사용하고, 선택 패널 안에서 같은 대상명을 다시 제목으로 반복하지 않습니다. 미리보기 진입은 각 테마 카드 하단에만 두며 카드 목록 위에 전체 미리보기 버튼을 중복하지 않습니다.</p>
                <div className="ds-theme-card-grid">
                  {THEMES.map((theme) => <article key={theme.id} className={selectedTheme === theme.id ? 'is-selected' : ''}>
                    <button type="button" className="ds-theme-card-select" aria-pressed={selectedTheme === theme.id} onClick={() => setSelectedTheme(theme.id)}><span className="ds-theme-swatch">{theme.swatch.map((color) => <i key={color} style={{ background: color }} />)}</span><span><b>{theme.name}</b><small>{theme.desc}</small></span><em>{selectedTheme === theme.id ? '선택됨' : '선택'}</em></button>
                    <button type="button" className="ds-theme-card-preview" onClick={() => { setSelectedTheme(theme.id); setThemePreviewView(themeTarget === 'entry' ? 'gate' : 'site') }}>실제 화면 미리보기</button>
                  </article>)}
                </div>
              </aside>
              <section className="ds-theme-preview-pattern"><header><span>SPECIAL PATTERN / PREVIEW TOOLBAR</span><b>실제 방문자 화면 위에 고정되는 제어 막대</b></header><div className="ds-theme-preview-stage"><p>테마 콘텐츠를 다시 그리지 않습니다. 선택한 테마의 실제 포트폴리오 또는 진입 화면을 그대로 열고, 아래 툴바만 어드민 UI로 겹칩니다.</p><div className="ds-theme-preview-toolbar"><strong>테마 미리보기</strong><label><span>테마</span><select value={selectedTheme} onChange={(event) => setSelectedTheme(event.target.value)}>{THEMES.map((theme) => <option key={theme.id} value={theme.id}>{theme.name}</option>)}</select></label><div><span>화면</span><div className="ds-theme-toolbar-segment"><button type="button" aria-pressed={themePreviewView === 'site'} onClick={() => setThemePreviewView('site')}>포트폴리오</button><button type="button" aria-pressed={themePreviewView === 'gate'} onClick={() => setThemePreviewView('gate')}>진입 화면</button></div></div><div><span>폭</span><div className="ds-theme-toolbar-segment"><button type="button" aria-pressed={themePreviewViewport === 'mobile'} onClick={() => setThemePreviewViewport('mobile')}>M</button><button type="button" aria-pressed={themePreviewViewport === 'tablet'} onClick={() => setThemePreviewViewport('tablet')}>T</button><button type="button" aria-pressed={themePreviewViewport === 'desktop'} onClick={() => setThemePreviewViewport('desktop')}>D</button></div></div><button type="button" className="ds-theme-preview-exit">어드민으로</button></div></div><dl><div><dt>진입</dt><dd>각 테마 카드 하단의 ‘실제 화면 미리보기’로 시작</dd></div><div><dt>변경</dt><dd>테마·화면·폭을 바꾸되 저장값은 변경하지 않음</dd></div><div><dt>종료</dt><dd>어드민으로 돌아오면 기존 스크롤과 편집 상태 복원</dd></div></dl></section>
            </div>
            <div className="ds-theme-priority"><div><b>1 · 토큰별 지정</b><span>토큰에 지정된 테마가 있으면 최우선</span></div><div><b>2 · 기본 방문자</b><span>토큰에 테마가 없을 때 적용</span></div><div><b>별도 · 진입 화면</b><span>인증 전 화면에만 적용</span></div></div>
            <div className="ds-special-rules"><span><b>Desktop</b>선택 화면은 2열, 툴바는 실제 화면 하단 중앙 고정</span><span><b>Tablet</b>선택 화면은 상하 배치, 툴바는 최대 두 줄</span><span><b>Mobile</b>카드는 한 열, 툴바는 하단 전체 폭과 safe area 사용</span><span><b>색상 모드</b>미리보기 툴바는 저장된 어드민 Light·Dark 토큰 사용</span></div>
          </div>
        </Section>

        <Section index="05" title="페이지 헤더와 액션" description="모든 관리 페이지에서 같은 위치와 순서">
          <div className="ds-page-demo">
            <header><div><span>접속 관리</span><h3>접속 토큰</h3><p>방문자에게 발급한 접근 권한을 관리합니다.</p></div><div className="ds-identity"><i />관리자 1명</div></header>
            <nav><button className="ds-button ds-button--primary">저장</button><button className="ds-button">새 토큰</button><span /><button className="ds-button ds-button--quiet">JSON 가져오기</button><button className="ds-button ds-button--quiet">내보내기</button></nav>
          </div>
          <ul className="ds-checks"><li>사용자 이메일은 사이드바에 반복 노출하지 않고 계정 메뉴 안에서만 표시</li><li>페이지 제목·설명·상태는 한 헤더 안에서 끝냄</li><li>주요 행동은 왼쪽, 데이터 이동과 보조 행동은 오른쪽</li><li>모바일에서는 중요도 순으로 줄바꿈하되 버튼 글자를 세로로 쌓지 않음</li></ul>
          <div className="ds-overlay-demo"><div className="ds-overlay-demo__context"><b>뒤쪽 작업 화면</b><span>회색 막과 과한 블러를 씌우지 않습니다.</span></div><aside><span>OVERLAY / LEVEL 2</span><h3>JSON 벌크 편집</h3><p>오버레이 표면은 가장 선명한 Surface를 사용하고, 배경에는 옅은 브랜드 색조만 더합니다.</p><button className="ds-button ds-button--primary">확인</button></aside></div>
        </Section>

        <Section index="06" title="데이터 화면" description="토큰과 로그는 카드가 아니라 스캔 가능한 표">
          <div className="ds-data-grid">
            <article><header><div><h3>접속 토큰</h3><p>활성 8 · 만료 임박 2</p></div><button className="ds-button ds-button--primary">새 토큰</button></header><div className="ds-table"><div className="is-head"><span>이름</span><span>상태</span><span>만료</span><span>최근 접속</span><span /></div><div><b>채용 검토</b><span className="ds-status is-live">활성</span><span>3일 후</span><span>오늘 14:32</span><button>•••</button></div><div><b>파트너 공유</b><span className="ds-status is-warn">임박</span><span>8시간 후</span><span>어제</span><button>•••</button></div></div></article>
            <article><header><div><h3>접속 로그</h3><p>행동 흐름을 시간순으로 확인</p></div><button className="ds-button">필터</button></header><div className="ds-log"><div><time>14:32:08</time><b>프로젝트 열람</b><span>채용 검토 · NOMA Product Launch</span></div><div><time>14:31:42</time><b>섹션 도달</b><span>채용 검토 · 프로젝트</span></div><div><time>14:30:11</time><b>접속 성공</b><span>채용 검토 · Desktop</span></div></div></article>
          </div>
          <div className="ds-journey-panel">
            <header><div><span>SESSION JOURNEY</span><h3>채용 검토 · 오늘 14:30</h3><p>총 체류 6분 21초 · Desktop · 프로젝트 상세 2건</p></div><button className="ds-button">원본 로그 보기</button></header>
            <div className="ds-journey-flow" role="img" aria-label="접속 성공에서 프로젝트, 상세 사례, 경력 확인 후 종료한 세션 흐름">
              <div className="is-complete"><i>01</i><b>접속 성공</b><span>14:30:11</span><small>토큰 인증</small></div><em>18초</em>
              <div className="is-complete"><i>02</i><b>프로젝트</b><span>14:30:29</span><small>섹션 도달</small></div><em>1분 13초</em>
              <div className="is-key"><i>03</i><b>NOMA 상세</b><span>14:31:42</span><small>4분 12초 체류</small></div><em>4분 12초</em>
              <div className="is-complete"><i>04</i><b>경력</b><span>14:35:54</span><small>38초 체류</small></div><em>38초</em>
              <div><i>05</i><b>세션 종료</b><span>14:36:32</span><small>연락처 미도달</small></div>
            </div>
            <aside className="ds-insight"><div className="ds-insight__label"><span>ANALYSIS</span><b>중간 신뢰도</b></div><div><strong>프로젝트 증거를 우선 확인한 세션으로 보입니다.</strong><p>접속 직후 프로젝트로 이동했고 전체 시간의 66%를 상세 사례에서 보냈습니다. 다만 단일 세션이므로 방문자의 의도를 확정할 수는 없습니다.</p><dl><div><dt>근거</dt><dd>프로젝트 첫 이동 · 상세 2건 · 상세 체류 4분 12초</dd></div><div><dt>관찰되지 않음</dt><dd>연락처·PDF 다운로드·외부 링크 클릭</dd></div><div><dt>권장 확인</dt><dd>같은 토큰의 재방문 여부와 다른 상세 사례 열람을 함께 비교</dd></div></dl></div></aside>
          </div>
          <div className="ds-analysis-rules"><div><b>관찰과 추론 분리</b><span>기록된 행동은 사실로, 의도 해석은 추론으로 명시</span></div><div><b>신뢰도 표시</b><span>표본 수·반복 행동·체류 시간을 기준으로 낮음·중간·높음 표시</span></div><div><b>과잉 해석 금지</b><span>개인 성향·채용 의사·감정을 로그만으로 단정하지 않음</span></div><div><b>행동 가능성</b><span>모든 코멘트에는 추가 확인할 데이터나 개선 행동을 연결</span></div></div>
        </Section>

        <Section index="07" title="통계 시각화" description="비교·추세·구성을 목적에 맞는 그래프로 표현">
          <div className="ds-chart-filter" aria-label="그래프 조회 조건 예시">
            <div className="ds-chart-filter__presets" role="group" aria-label="빠른 기간 선택">
              <button>7일</button><button className="is-active">30일</button><button>90일</button><button>1년</button><button>전체</button>
            </div>
            <label><span>시작일</span><input type="date" defaultValue="2026-08-27" /></label>
            <i aria-hidden="true">–</i>
            <label><span>종료일</span><input type="date" defaultValue="2026-09-25" /></label>
            <label><span>집계</span><select defaultValue="day"><option value="day">일 단위</option><option value="week">주 단위</option><option value="month">월 단위</option><option value="quarter">분기 단위</option></select></label>
            <label className="ds-chart-filter__compare"><input type="checkbox" /> 이전 기간 비교</label>
            <button className="ds-button ds-button--primary">적용</button>
          </div>
          <div className="ds-chart-filter__contract">
            <div><b>빠른 선택</b><span>프리셋을 누르면 시작·종료일과 권장 집계가 함께 갱신됩니다.</span></div>
            <div><b>직접 선택</b><span>날짜 필드를 누르면 달력이 열리고 시작일 다음 종료일을 선택합니다.</span></div>
            <div><b>검증</b><span>종료일이 시작일보다 빠르면 필드 아래 오류를 표시하고 적용을 막습니다.</span></div>
            <div><b>적용 시점</b><span>조건을 바꾼 뒤 적용해야 그래프가 갱신되며, 변경 전 값은 유지됩니다.</span></div>
          </div>
          <div className="ds-chart-grid">
            <article><header><div><span>COMPARISON</span><h3>섹션별 열람</h3></div><b>1,284</b></header><div className="ds-bars" aria-label="프로젝트 82, 소개 57, 경력 41, 연락처 24"><button style={{ '--value': '82%' }} data-tip="프로젝트 · 82회 · 전체 40%"><span>프로젝트</span></button><button style={{ '--value': '57%' }} data-tip="소개 · 57회 · 전체 28%"><span>소개</span></button><button style={{ '--value': '41%' }} data-tip="경력 · 41회 · 전체 20%"><span>경력</span></button><button style={{ '--value': '24%' }} data-tip="연락처 · 24회 · 전체 12%"><span>연락처</span></button></div></article>
            <article><header><div><span>TREND</span><h3>최근 7일 접속</h3></div><b>+18%</b></header><div className="ds-line-wrap"><svg className="ds-line-chart" viewBox="0 0 420 150" role="img" aria-label="최근 7일 접속 증가 추세"><path className="grid" d="M0 25H420M0 75H420M0 125H420" /><path className="area" d="M0 116L70 98L140 106L210 72L280 80L350 42L420 28V150H0Z" /><path className="line" d="M0 116L70 98L140 106L210 72L280 80L350 42L420 28" /></svg><button className="ds-chart-hit" style={{ '--x': '50%', '--y': '48%' }} data-tip="목요일 · 접속 46회 · 전일 대비 +31%" aria-label="목요일 접속 46회" /></div><div className="ds-axis"><span>월</span><span>화</span><span>수</span><span>목</span><span>금</span><span>토</span><span>일</span></div></article>
            <article className="ds-chart-rules"><header><div><span>RULES</span><h3>그래프 선택 기준</h3></div></header><dl><div><dt>막대</dt><dd>항목 간 크기 비교</dd></div><div><dt>선</dt><dd>시간에 따른 추세</dd></div><div><dt>100% 누적</dt><dd>전체 안의 구성비</dd></div><div><dt>숫자</dt><dd>단일 핵심 지표</dd></div></dl></article>
          </div>
          <div className="ds-chart-guidance"><div><b>색상</b><span>기본 계열 1색 + 강조 1색. 의미 없는 무지개색 금지</span></div><div><b>축·격자</b><span>0 기준 유지, 격자는 최대 4개, 소수점 자릿수 통일</span></div><div><b>범례·툴팁</b><span>Hover·키보드 focus·모바일 tap에서 항목·값·단위·기간 표시</span></div><div><b>상태</b><span>로딩은 골격, 빈 값은 원인과 기간, 오류는 재시도 제공</span></div><div><b>접근성</b><span>색상 외 라벨·패턴 병행, 그래프마다 텍스트 요약 제공</span></div><div><b>모바일</b><span>Tap으로 열고 바깥 탭 또는 Esc로 닫기. 화면 밖으로 넘치지 않게 정렬</span></div></div>
          <div className="ds-time-scale">
            <header><div><span>TIME RANGE CONTRACT</span><h3>기간이 길어지면 데이터를 버리지 않고 집계 단위를 올립니다.</h3></div><p>기본 조회는 최근 30일이며 7일·30일·90일·1년·전체 범위를 직접 선택합니다.</p></header>
            <div className="ds-time-scale__table">
              <div className="is-head"><span>조회 범위</span><span>표현 단위</span><span>축 라벨</span><span>최대 포인트</span></div>
              <div><b>1–31일</b><span>일</span><span>최대 8개</span><span>31</span></div>
              <div><b>32–180일</b><span>주 · 월요일 시작</span><span>월 경계 중심</span><span>26</span></div>
              <div><b>181일–2년</b><span>월</span><span>분기 경계 중심</span><span>24</span></div>
              <div><b>2년 초과</b><span>분기</span><span>연도 경계 중심</span><span>최대 40</span></div>
            </div>
            <div className="ds-time-scale__rules"><div><b>화면별 라벨</b><span>Desktop 8 · Tablet 6 · Mobile 4개 이하. 시작과 종료 날짜는 항상 표시.</span></div><div><b>집계 표시</b><span>툴팁에 집계 기간·값·단위를 표시하고 부분 주·월은 ‘부분 기간’으로 표기.</span></div><div><b>누락 데이터</b><span>기록이 없는 날짜는 0으로 만들지 않고 선을 끊어 ‘데이터 없음’으로 표시.</span></div><div><b>시간 기준</b><span>KST 기준, 주는 월요일 시작. 이전 기간 비교는 동일한 일수로 맞춤.</span></div></div>
          </div>
        </Section>

        <Section index="08" title="반응형 규칙" description="어드민 셸과 작업 컴포넌트를 우선순위에 따라 재배치">
          <div className="ds-breakpoints">
            <article><header><span>MOBILE</span><b>360–767px</b></header><div className="ds-device is-mobile"><i /><i /><i /></div><ul><li>1열, 좌우 여백 16px</li><li>사이드바는 상단 메뉴로 전환</li><li>주요 행동 2개만 노출, 나머지는 더보기</li><li>테이블은 카드 변환 없이 가로 스크롤</li><li>오버레이는 전체 화면</li></ul></article>
            <article><header><span>TABLET</span><b>768–1199px</b></header><div className="ds-device is-tablet"><i /><i /><i /><i /></div><ul><li>6열, 좌우 여백 24px</li><li>내비게이션은 144px compact sidebar</li><li>아이콘만 두지 않고 메뉴명을 항상 표시</li><li>필드는 3·6열, 액션은 최대 두 줄</li><li>데이터 표만 필요할 때 가로 스크롤</li></ul></article>
            <article><header><span>DESKTOP</span><b>1200px+</b></header><div className="ds-device is-desktop"><i /><i /><i /><i /><i /></div><ul><li>12열, 좌우 여백 32px</li><li>사이드바 240px 고정</li><li>편집 영역 최대 1440px</li><li>필드는 3·4·6·8·12열</li><li>드로어 최대 720px</li></ul></article>
          </div>
          <div className="ds-responsive-rules"><div><b>터치</b><span>버튼·행·입력 최소 높이 44px</span></div><div><b>텍스트</b><span>버튼 라벨 줄바꿈 금지, 값은 말줄임 대신 확장</span></div><div><b>순서</b><span>제목 → 상태 → 주요 행동 → 콘텐츠 → 보조 행동</span></div><div><b>중첩</b><span>모바일에서도 한 레벨에 경계선 하나</span></div></div>
        </Section>

        <Section index="09" title="상태와 피드백" description="모든 작업은 현재 상태와 다음 행동을 분명히 표시">
          <div className="ds-state-flow"><div><span>01</span><b>변경됨</b><p>입력이 바뀌면 헤더에 ‘저장되지 않음’을 표시합니다.</p></div><div><span>02</span><b>저장 중</b><p>버튼을 잠그고 진행 상태를 같은 위치에 표시합니다.</p></div><div><span>03</span><b>저장됨</b><p>성공 시각을 표시하고 보조 메시지는 4초 뒤 닫습니다.</p></div><div><span>04</span><b>실패</b><p>입력값을 보존하고 원인과 재시도 행동을 유지합니다.</p></div></div>
          <div className="ds-state-matrix"><div><b>검증 오류</b><span>필드 아래 원인 표시, 첫 오류로 이동, 입력값 보존</span></div><div><b>로딩</b><span>실제 레이아웃과 같은 골격, 버튼 내부 진행 표시</span></div><div><b>빈 상태</b><span>비어 있는 원인과 생성·필터 해제 행동 제공</span></div><div><b>오프라인</b><span>저장 차단, 로컬 변경 유지, 연결 후 재시도</span></div><div><b>이탈 경고</b><span>저장되지 않은 변경이 있을 때만 확인</span></div><div><b>토스트</b><span>성공은 자동 종료, 오류는 직접 닫을 때까지 유지</span></div></div>
          <div className="ds-empty-contract">
            <article><span>INITIAL</span><b>아직 항목이 없습니다.</b><p>처음 생성할 수 있는 권한이 있을 때만 ‘새 항목 추가’를 제공합니다.</p><button className="ds-button ds-button--primary">새 항목 추가</button></article>
            <article><span>FILTERED</span><b>조건에 맞는 결과가 없습니다.</b><p>현재 필터를 요약하고 원본 데이터는 유지한 채 ‘필터 해제’를 제공합니다.</p><button className="ds-button">필터 해제</button></article>
            <article><span>PERMISSION</span><b>표시할 수 있는 항목이 없습니다.</b><p>권한이 원인이면 생성 버튼을 숨기고 필요한 권한과 요청 경로를 안내합니다.</p><small>관리자에게 보기 권한 요청</small></article>
          </div>
        </Section>

        <Section index="10" title="데이터 작업과 안전" description="가져오기·삭제·복원은 결과를 보기 전에 실행하지 않음">
          <div className="ds-operation-grid"><article><span>IMPORT</span><h3>검증 → 차이 → 적용</h3><ol><li>파일 형식과 스키마 검사</li><li>추가·수정·삭제 건수 미리보기</li><li>적용 전 자동 복원 지점 생성</li><li>저장 전까지 확정하지 않음</li></ol></article><article><span>DESTRUCTIVE</span><h3>대상 → 영향 → 확인</h3><ol><li>삭제·연결 해제·기록 제거 모두 확인</li><li>대상 이름과 복구 가능 여부 명시</li><li>편집값 삭제는 저장 전임을 안내</li><li>전체 삭제는 대상명 재입력</li></ol></article><article><span>TABLE</span><h3>검색 → 필터 → 정렬</h3><ol><li>결과 수와 활성 필터 표시</li><li>열 정렬 방향을 헤더에 표시</li><li>일괄 행동은 선택 후에만 노출</li><li>임의 자르기 대신 페이지네이션</li></ol></article></div>
          <div className="ds-security-rules"><div><b>민감정보</b><span>토큰은 생성 직후 한 번만 전체 표시하고 이후 마스킹</span></div><div><b>복사</b><span>성공·실패를 버튼 자리와 라이브 영역에 표시</span></div><div><b>시간</b><span>저장은 ISO/UTC, 화면은 KST와 상대 시간을 함께 표시</span></div><div><b>감사 기록</b><span>누가·언제·무엇을 변경했는지 복원 이력에 기록</span></div></div>
        </Section>

        <Section index="11" title="접근성과 콘텐츠" description="마우스 없이도, 긴 실제 데이터에서도 무너지지 않음">
          <div className="ds-a11y-grid"><article><b>Keyboard</b><p>논리적 Tab 순서, Enter 실행, Esc 닫기, 종료 후 원래 트리거로 포커스 복귀.</p></article><article><b>Dialog</b><p>포커스 트랩, 제목 연결, 배경 비활성화. 위험 작업의 초기 포커스는 취소.</p></article><article><b>Contrast</b><p>일반 텍스트 4.5:1, 큰 텍스트와 UI 경계 3:1 이상을 양 모드에서 충족.</p></article><article><b>Content</b><p>사용자 데이터는 임의로 자르지 않음. 긴 URL·토큰은 줄바꿈과 복사 제공.</p></article><article><b>Locale</b><p>천 단위, 백분율 정밀도, 날짜·시간 형식을 페이지 전체에서 통일.</p></article><article><b>Motion</b><p>상태 120ms, 오버레이 180ms, 페이지 240ms. reduced-motion에서는 이동 제거.</p></article></div>
          <div className="ds-layer-scale"><span>0 · Canvas</span><span>10 · Sticky</span><span>20 · Dropdown</span><span>30 · Overlay</span><span>40 · Dialog</span><span>50 · Toast</span></div>
        </Section>

        <Section index="12" title="UX 규칙" description="반복해서 설명하지 않아도 되는 전역 판단 기준">
          <div className="ds-ux-rules">{uxRules.map(([title, doText, dontText], index) => <article key={title}><span>{String(index + 1).padStart(2, '0')}</span><h3>{title}</h3><div><b>DO</b><p>{doText}</p></div><div><b>DON'T</b><p>{dontText}</p></div></article>)}</div>
        </Section>

        <Section index="13" title="사이트 맵과 표시 계약" description="관리 위치와 공개 화면의 공통 구조를 실제 경로 기준으로 연결">
          <div className="ds-sitemap-stack">
            <SiteMap eyebrow="ADMIN SITE MAP" title="어드민 정보 구조" description="콘텐츠 편집, 접근 관리, 시스템 설정의 실제 메뉴 계층입니다." root="#admin" groups={adminSiteMap} />
            <SiteMap eyebrow="PUBLIC COMMON SITE MAP" title="프론트 공통 정보 구조" description="테마가 달라도 유지되는 인증 흐름, 경로, 콘텐츠 순서입니다." root="AuthGate → authenticated routes" groups={publicSiteMap} />
          </div>
          <div className="ds-content-map" role="table" aria-label="어드민 데이터와 공개 화면 연결">
            <div className="is-head" role="row"><b role="columnheader">어드민 원본</b><b role="columnheader">공개 위치</b><b role="columnheader">표시 규칙</b></div>
            {contentMap.map(([source, destination, rule]) => <div role="row" key={source}><b role="cell">{source}</b><code role="cell">{destination}</code><span role="cell">{rule}</span></div>)}
          </div>
          <div className="ds-ia-contract"><b>구조 계약</b><span>현재 메뉴·페이지 제목·저장 상태를 항상 식별할 수 있어야 합니다.</span><span>목록에서 상세로 들어가도 필터와 스크롤 위치를 보존합니다.</span><span>테마는 표현만 바꾸며 경로·콘텐츠 계층·공개 조건을 바꾸지 않습니다.</span></div>
        </Section>

        <Section index="14" title="어드민 반응형 미리보기" description="어드민 셸·내비게이션·액션·데이터가 화면별로 전환되는 방식">
          <div className="ds-preview-toolbar" role="group" aria-label="미리보기 화면 크기">{Object.entries(previewModes).map(([key, item]) => <button key={key} type="button" aria-pressed={previewMode === key} onClick={() => { setPreviewMode(key); setMobilePreviewMenuOpen(false) }}>{item.label}<span>{item.width}px</span></button>)}</div>
          <div className="ds-viewport-stage"><div className={`ds-viewport ds-admin-viewport is-${previewMode}`} style={{ '--preview-width': `${previewModes[previewMode].width}px` }}><header><span>ADMIN RESPONSIVE CONTRACT</span><b>{previewModes[previewMode].label} · {previewModes[previewMode].width}px</b></header><AdminResponsivePreview mode={previewMode} mobileMenuOpen={mobilePreviewMenuOpen} onMobileMenuToggle={() => setMobilePreviewMenuOpen((open) => !open)} /><footer>{previewModes[previewMode].note} · 공개 포트폴리오 미리보기와 분리</footer></div></div>
        </Section>

        <Section index="15" title="적용과 검수" description="모든 변경이 통과해야 하는 고정 절차">
          <ol className="ds-phases"><li><span>1</span><div><b>Foundation</b><p>토큰, 컨테이너, 헤더, 필드, 버튼</p></div></li><li><span>2</span><div><b>Content editors</b><p>프로젝트·소개·성과·저니의 목록/상세 패턴</p></div></li><li><span>3</span><div><b>Access operations</b><p>토큰 발급과 로그를 고밀도 테이블로 재구성</p></div></li><li><span>4</span><div><b>QA</b><p>라이트·다크, 360/768/1280px, 데이터 보존 검증</p></div></li></ol>
          <div className="ds-quality-gate"><header><b>REPEAT-PROOF QUALITY GATE</b><span>한 곳을 고친 뒤 같은 패턴 전체를 확인합니다.</span></header><ul><li>글자 베이스라인과 아이콘의 시각 중심</li><li>공통 시작선·간격·센터 미들 규칙</li><li>역할 토큰에 맞는 글자 크기와 버튼 높이</li><li>모든 버튼 variant의 Light·Dark 상태 대비</li><li>360·768·1280px 오버플로와 줄바꿈</li><li>플로팅 조작부의 safe area·본문 비중첩</li><li>중첩 입력의 단일 포커스 선과 select 화살표</li><li>삭제 확인·빈 상태·오류·복원·데이터 보존</li></ul></div>
        </Section>

        <footer className="ds-approval"><div><span>SYSTEM STATUS / ACTIVE</span><h2>새 화면과 수정은 이 페이지의 규칙을 통과해야 합니다.</h2><p>규칙을 바꿀 때는 구현과 문서를 같은 커밋에서 함께 갱신합니다.</p></div><button className="ds-button ds-button--primary" onClick={onBack}>관리자로 돌아가기</button></footer>
      </div>
    </main>
  )
}
