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

function Section({ index, title, description, children }) {
  return <section className="ds-section"><header className="ds-section__header"><span>{index}</span><div><h2>{title}</h2><p>{description}</p></div></header>{children}</section>
}

function FieldDemo({ label, children }) {
  return <label className="ds-field"><span>{label}</span>{children}</label>
}

export default function AdminDesignSystem({ onBack }) {
  const [mode, setMode] = useState('light')
  return (
    <main className="ds-page" data-mode={mode}>
      <header className="ds-topbar">
        <div><span className="ds-eyebrow">ADMIN SYSTEM / PROPOSAL 01</span><strong>운영 인터페이스 규칙</strong></div>
        <div className="ds-topbar__actions">
          <div className="ds-mode" aria-label="색상 모드"><button aria-pressed={mode === 'light'} onClick={() => setMode('light')}>Light</button><button aria-pressed={mode === 'dark'} onClick={() => setMode('dark')}>Dark</button></div>
          <button className="ds-button ds-button--quiet" onClick={onBack}>관리자로 돌아가기</button>
        </div>
      </header>

      <div className="ds-wrap">
        <section className="ds-intro">
          <div><span className="ds-kicker">검토용 · 아직 미적용</span><h1>작업이 먼저 보이고,<br />장식은 뒤로 물러납니다.</h1></div>
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
        </Section>

        <Section index="04" title="페이지 헤더와 액션" description="모든 관리 페이지에서 같은 위치와 순서">
          <div className="ds-page-demo">
            <header><div><span>접속 관리</span><h3>접속 토큰</h3><p>방문자에게 발급한 접근 권한을 관리합니다.</p></div><div className="ds-identity"><i />관리자 1명</div></header>
            <nav><button className="ds-button ds-button--primary">저장</button><button className="ds-button">새 토큰</button><span /><button className="ds-button ds-button--quiet">JSON 가져오기</button><button className="ds-button ds-button--quiet">내보내기</button></nav>
          </div>
          <ul className="ds-checks"><li>사용자 이메일은 사이드바에 반복 노출하지 않고 계정 메뉴 안에서만 표시</li><li>페이지 제목·설명·상태는 한 헤더 안에서 끝냄</li><li>주요 행동은 왼쪽, 데이터 이동과 보조 행동은 오른쪽</li><li>모바일에서는 중요도 순으로 줄바꿈하되 버튼 글자를 세로로 쌓지 않음</li></ul>
        </Section>

        <Section index="05" title="데이터 화면" description="토큰과 로그는 카드가 아니라 스캔 가능한 표">
          <div className="ds-data-grid">
            <article><header><div><h3>접속 토큰</h3><p>활성 8 · 만료 임박 2</p></div><button className="ds-button ds-button--primary">새 토큰</button></header><div className="ds-table"><div className="is-head"><span>이름</span><span>상태</span><span>만료</span><span>최근 접속</span><span /></div><div><b>채용 검토</b><span className="ds-status is-live">활성</span><span>3일 후</span><span>오늘 14:32</span><button>•••</button></div><div><b>파트너 공유</b><span className="ds-status is-warn">임박</span><span>8시간 후</span><span>어제</span><button>•••</button></div></div></article>
            <article><header><div><h3>접속 로그</h3><p>행동 흐름을 시간순으로 확인</p></div><button className="ds-button">필터</button></header><div className="ds-log"><div><time>14:32:08</time><b>프로젝트 열람</b><span>채용 검토 · NOMA Product Launch</span></div><div><time>14:31:42</time><b>섹션 도달</b><span>채용 검토 · 프로젝트</span></div><div><time>14:30:11</time><b>접속 성공</b><span>채용 검토 · Desktop</span></div></div></article>
          </div>
        </Section>

        <Section index="06" title="적용 기준" description="컨펌 후 이 순서로 교체">
          <ol className="ds-phases"><li><span>1</span><div><b>Foundation</b><p>토큰, 컨테이너, 헤더, 필드, 버튼</p></div></li><li><span>2</span><div><b>Content editors</b><p>프로젝트·소개·성과·저니의 목록/상세 패턴</p></div></li><li><span>3</span><div><b>Access operations</b><p>토큰 발급과 로그를 고밀도 테이블로 재구성</p></div></li><li><span>4</span><div><b>QA</b><p>라이트·다크, 360/768/1280px, 데이터 보존 검증</p></div></li></ol>
        </Section>

        <footer className="ds-approval"><div><span>CONFIRMATION REQUIRED</span><h2>이 규칙을 기준으로 전체 관리자 화면을 재구성할까요?</h2><p>승인 전에는 기존 화면에 이 시스템을 적용하지 않습니다.</p></div><button className="ds-button ds-button--primary" onClick={onBack}>검토 후 관리자에서 의견 남기기</button></footer>
      </div>
    </main>
  )
}
