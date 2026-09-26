export const VIEWPORTS = {
  mobile: { label: 'Mobile', width: 390, note: '20px gutter · 4 columns' },
  tablet: { label: 'Tablet', width: 768, note: '32px gutter · 6 columns' },
  desktop: { label: 'Desktop', width: 1280, note: '64px gutter · 12 columns' },
}

export const CORE_RULES = [
  ['Start line', '모든 섹션과 행은 공통 컨테이너와 고정 열을 사용하고 같은 묶음의 그룹 헤더·데이터 행은 열 정의를 공유', '섹션마다 임의 margin을 쓰거나 헤더·행마다 다른 그리드를 적용'],
  ['Optical alignment', '서체별 line-box를 통일하고 한 줄은 중앙, 여러 줄은 첫 줄 상단 정렬', '서로 다른 서체를 CSS baseline 하나로 처리'],
  ['Vertical rhythm', '카드와 행의 상하 padding을 같은 토큰으로 사용', '고정 높이·빈 줄·상단 margin으로 균형 보정'],
  ['Boundaries', '데이터 묶음은 첫 상단선과 마지막 하단선을 모두 소유', '섹션 제목의 선을 첫 행의 상단선으로 대체'],
  ['Line breaks', '관리자에서 저장한 개행을 우선하고 공간 부족 시에만 자연 줄바꿈', '넓은 화면 강제 개행·한글 낱글자 고립'],
  ['Interaction', 'hover·focus·pressed는 색·선·농도만 변경', 'scale·translate·padding 변경으로 레이아웃 이동'],
  ['Focus indicator', '브라우저 기본선을 제거한 뒤 테마의 단일 2px 표시선만 제공', '기본 outline·border·shadow가 겹치는 이중 선택선'],
  ['Selection marker', '3px 투명 좌측 border를 예약하고 aria-pressed 행의 색만 변경', 'hover·shadow·outline이 지속 선택선을 대체하거나 중첩'],
  ['Legibility', '설명·결과 15px 이상, 프로젝트 본문 16px/26px 이상·대비 4.5:1을 우선', '읽어야 할 내용을 메타 크기나 옅은 색으로 축소'],
  ['Theme isolation', '장식 없음에서 시작하고 기능·개념상 필요할 때만 해당 테마 규칙을 정의', 'Mist 장식 전이 또는 테마마다 장식 세트를 억지로 추가'],
  ['Responsive', '정보 순서는 유지하고 열만 단계적으로 축소', '모바일에서 내용 삭제·극단적 축소·가로 스크롤'],
  ['Data states', 'Loading·Empty·Error에 원인과 다음 행동 제공', '빈 면·무반응·막다른 화면'],
  ['Access state', '접속 만료 배너에 상태·원인·재인증 행동을 함께 제공', '콘텐츠를 덮는 배너·행동 없는 만료 문구'],
]

export const CORE_RELEASE = [
  ['LAYOUT', [
    '모든 섹션이 같은 컨테이너와 시작선을 사용한다',
    '같은 정보 묶음의 그룹 헤더와 데이터 행은 하나의 열 정의를 공유하며 시작선 오차는 1px 이하다',
    '섹션 제목과 첫 목록 사이 간격은 16–36px이다',
    '데이터 묶음은 상단선과 하단선을 모두 가진다',
    '행과 카드의 상하 padding이 대칭이다',
    '고정 높이와 임의 margin으로 빈 공간을 보정하지 않는다',
    '가이드의 모든 표본과 체크리스트도 같은 광학 정렬 규칙을 통과한다',
  ]],
  ['TYPE', [
    '한글 제목은 Gowun Batang 또는 테마가 명시한 한글 제목 서체를 사용한다',
    '연도·번호·메타는 제목 크기로 확대하지 않는다',
    '본문은 15px 이상, 보조 정보는 12px 이상이다',
    '저장된 개행을 우선하고 넓은 화면의 불필요한 줄바꿈이 없다',
  ]],
  ['RESPONSIVE', [
    '320·360·390·430px에서 가로 스크롤이 없다',
    '768·1024px에서 열·시작선·44px 터치 영역이 유지된다',
    '1280·1440px에서 편측 쏠림과 불필요한 제목 개행이 없다',
    '390·430·768·1024px 전체 페이지 캡처에서 과도한 공백과 부자연스러운 줄바꿈이 없다',
    '390px 이상에서 푸터 안내 문장은 한 줄이며 이메일·LinkedIn·Back to top 내부 줄바꿈이 없다',
    '긴 제목·본문·빈 데이터에서도 내용이 잘리지 않는다',
  ]],
  ['INTERACTION', [
    'hover·focus·pressed에서 요소의 위치와 크기가 변하지 않는다',
    '모든 터치 대상은 최소 44×44px이다',
    'focus-visible은 브라우저 기본선을 대체한 단일 2px 표시선만 사용한다',
    'prefers-reduced-motion에서 반복 모션이 정지한다',
  ]],
  ['LEGIBILITY', [
    '본문은 15px 이상, 보조 정보는 12px 이상이며 행간은 140–160%다',
    '텍스트와 배경의 대비는 4.5:1 이상이다',
    '장식·포그·그리드·이미지는 텍스트 위에 겹치지 않는다',
    '테마 면색 위에서도 본문·메타·링크의 위계가 구분된다',
  ]],
  ['THEME ISOLATION', [
    '각 테마는 자신의 팔레트·서체·선·모서리를 사용하며 장식은 기본적으로 두지 않는다',
    'Mist의 포그·종이 질감·반짝이·랜덤 커서는 다른 테마에 상속하지 않는다',
    '장식이 정보 이해를 돕는지 먼저 검증하고 필요성이 없으면 추가하지 않는다',
    '공통 코어 변경과 테마 전용 변경을 별도 검토한다',
    '테마 전환 후 이전 테마의 클래스·변수·장식이 남지 않는다',
  ]],
  ['PROJECT', [
    '상세 우측 상단 Close는 언제나 홈으로 돌아간다',
    '상세와 아카이브 모두 공통 푸터를 사용한다',
    '아카이브는 동일 폭 2열/1열이며 nth-child 엇갈림과 화면 이탈이 없다',
    'Meta와 Brief가 공유하는 경계선은 한 번만 그린다',
    '공통 푸터가 보이면 플로팅 Top을 숨긴다',
    '샘플 프로젝트 이미지는 실제 공통 데이터에서 로드된다',
    '갤러리는 순서·카운터·이전/다음·썸네일·스와이프를 제공한다',
    'Previous·All·Next와 모든 화살표는 실제 목적지에 연결된다',
  ]],
  ['ACCESS STATE', [
    '접속 만료 배너는 전 테마에서 동일한 정보 구조를 사용한다',
    '배너는 문서 흐름 안에 놓이며 헤더나 본문을 덮지 않는다',
    '상태명·원인·재인증 행동을 제공하고 스크린리더에 알린다',
    '모바일에서는 문구와 행동을 세로로 쌓고 44px 터치 영역을 유지한다',
  ]],
  ['CONTENT', [
    '원문·관리자 개행·항목 순서·기본 데이터를 삭제하지 않는다',
    'Loading·Empty·Error는 제목·원인·다음 행동을 제공한다',
    '이모지는 사용하지 않고 테마가 정한 기하학 기호만 사용한다',
    '테마 장식은 본문·버튼·구분선과 겹치지 않는다',
  ]],
]

const commonType = {
  koreanTitle: 'Noto Sans KR',
  body: 'Noto Sans KR',
  mono: 'ui-monospace',
}

export const THEME_SYSTEMS = {
  midnight: {
    registryId: 'default',
    name: 'Midnight',
    version: '1.0',
    mode: 'dark',
    description: '깊은 네이비 위에서 제품 정보와 성과를 선명하게 읽는 기본 제품 테마.',
    colors: [
      ['Canvas', '#030712', '전체 배경'], ['Surface', '#111827', '카드와 패널'],
      ['Ink', '#f9fafb', '제목'], ['Body', '#cbd5e1', '본문'],
      ['Meta', '#94a3b8', '보조 정보'], ['Accent', '#0064ff', '행동과 현재 상태'],
    ],
    css: { canvas: '#030712', surface: '#111827', raised: '#172033', ink: '#f9fafb', body: '#cbd5e1', meta: '#94a3b8', accent: '#0064ff', accentInk: '#ffffff', line: '#334155', radius: '12px', shadow: '0 16px 40px rgba(0,0,0,.24)', display: "'Instrument Sans', sans-serif", bodyFont: "'Instrument Sans','Noto Sans KR',sans-serif", koreanTitle: "'Noto Sans KR',sans-serif", sectionIndexShift: '-6px' },
    type: { ...commonType, display: 'Instrument Sans', titleRule: '영문 표제는 Instrument Sans, 한글 정보 제목은 Noto Sans KR' },
    signature: ['12px radius', 'soft elevation', 'blue action', 'dark product canvas'],
    ornaments: '사용하지 않음. 블루는 상태와 행동에만 사용',
    motion: '상태 전환 160–220ms; 카드와 버튼의 위치·크기는 고정',
    cursor: '기본 시스템 커서. 프로젝트 링크에서만 목적 라벨 표시 가능',
    geometry: [],
    effects: { page: '160ms surface crossfade', scroll: '220ms depth fade · blur 4px → 0', reason: '야간 콘솔의 표면이 차례로 활성화되는 감각을 전달' },
    analysis: {
      metaphor: '야간 제품 콘솔. 장식보다 상태와 업무 정보가 먼저 보이는 차분한 다크 제품 화면',
      hierarchy: '밝은 제목 → 회청색 본문 → 낮은 채도의 메타 순서로 읽고 블루는 행동에만 사용',
      surface: '네이비 캔버스 위 명도차가 있는 12px 패널. 그림자는 보조 수단이며 경계를 대신하지 않음',
      typography: 'Instrument Sans 영문 표제와 Noto Sans KR 한글 정보 제목을 역할별로 분리',
      interaction: '160–220ms 색·표면 전환만 허용하고 카드 이동이나 확대는 사용하지 않음',
      exclude: 'Mist 종이 질감, 포그, 자유 장식과 포스터식 하드 섀도',
    },
    specific: ['블루는 링크·현재 상태·주요 행동에만 사용', '카드 경계는 surface와 line의 명도차로 구분', '다크 모드 입체감은 과한 그림자보다 표면 밝기로 표현'],
  },
  signal: {
    registryId: 'signal', name: 'Signal', version: '1.0', mode: 'dark',
    description: '데이터 터미널의 정확성과 빠른 스캔을 전면에 둔 시안 액센트 테마.',
    colors: [['Canvas','#0c1015','전체 배경'],['Surface','#111820','데이터 패널'],['Ink','#f2f7fc','제목'],['Body','#b7c2cd','본문'],['Meta','#7d8ea1','메타'],['Signal','#22d3ee','행동·상태']],
    css: { canvas:'#0c1015',surface:'#111820',raised:'#17212c',ink:'#f2f7fc',body:'#b7c2cd',meta:'#7d8ea1',accent:'#22d3ee',accentInk:'#062a31',line:'#2a3644',radius:'6px',shadow:'none',display:"'Noto Sans KR',sans-serif",bodyFont:"'Noto Sans KR',sans-serif",koreanTitle:"'Noto Sans KR',sans-serif",sectionIndexShift:'-5px' },
    type: { ...commonType, display:'Noto Sans KR', mono:'JetBrains Mono', titleRule:'한글·영문 제목과 본문은 Noto Sans KR, 경로·숫자·메타만 JetBrains Mono' },
    signature:['6px radius','tabular numbers','cyan signal','left rail'],
    ornaments:'자유 장식 없음. 데이터 tick은 값이나 좌표를 설명할 때만 구조 안에서 사용', motion:'상태 전환 140ms; 반복 스캔 장식 없음', cursor:'기본 시스템 커서. 조준점 장식은 사용하지 않음',
    geometry:[], effects:{page:'immediate terminal update',scroll:'180ms horizontal scan reveal',reason:'명령 결과가 왼쪽에서 오른쪽으로 출력되는 판독 흐름을 전달'}, specific:['숫자는 tabular-nums로 열을 고정', '시안은 현재 상태와 행동에만 사용', '제목·본문·통계는 공통 좌측 레일을 공유'],
    analysis:{metaphor:'데이터 리딩룸과 터미널. 꾸미는 화면이 아니라 상태를 빠르게 판독하는 화면',hierarchy:'경로·상태 시안 → 흰 제목 → 회청색 설명 → 고정폭 수치 순서',surface:'6px 데이터 패널과 어두운 셀. 선은 셀 구조를 설명할 때만 사용',typography:'Noto Sans KR가 제목·본문을 담당하고 JetBrains Mono는 경로·숫자·메타에만 사용',interaction:'명령 결과처럼 180ms 수평 reveal. 반복 스캔, 깜박임, 조준 장식 없음',exclude:'종이 질감, 부유 기호, 둥근 타일, 하드 섀도'},
  },
  bold: {
    registryId:'bold',name:'Bold',version:'1.0',mode:'light',description:'포스터의 강한 대비와 인쇄 마커를 쓰는 직선적 테마.',
    colors:[['Paper','#f5f3ef','전체 배경'],['Surface','#ffffff','정보 면'],['Ink','#121212','제목·선'],['Body','#45423c','본문'],['Meta','#6e6960','메타'],['Marker','#ffd400','강조 면']],
    css:{canvas:'#f5f3ef',surface:'#ffffff',raised:'#ffffff',ink:'#121212',body:'#45423c',meta:'#6e6960',accent:'#ffd400',accentInk:'#121212',line:'#121212',radius:'0px',shadow:'6px 6px 0 #121212',display:"'Black Han Sans','Noto Sans KR',sans-serif",bodyFont:"'Noto Sans KR',sans-serif",koreanTitle:"'Noto Sans KR',sans-serif",sectionIndexShift:'-2px'},
    type:{...commonType,display:'Black Han Sans',titleRule:'포스터 표제는 Black Han Sans, 한글 정보 제목과 본문은 Noto Sans KR'},
    signature:['square corners','3px keyline','hard shadow','yellow marker'],ornaments:'자유 장식 없음. 검정 bar와 노란 면은 콘텐츠 묶음에만 사용',motion:'즉시 전환 또는 120ms; 들썩임·탄성·scale 금지',cursor:'기본 시스템 커서. 별도 추종 도형 없음',
    geometry:[], effects:{page:'HARD CUT · 0ms',scroll:'HARD CUT · no interpolation',reason:'인쇄 포스터가 한 장씩 교체되는 단호한 리듬을 유지'}, specific:['노란색은 텍스트가 아닌 마커 면으로 사용', '주요 카드에만 3px 선과 6px 하드 섀도 사용', '모든 모서리는 0px로 유지'],
    analysis:{metaphor:'인쇄 포스터와 물리적 마커. 한눈에 핵심 문장과 성과를 잡는 고대비 화면',hierarchy:'초대형 검정 표제 → 노란 마커 → 굵은 수치 → 밀도 낮은 본문 순서',surface:'0px 모서리, 3px 잉크선, 제한된 6px 하드 섀도. 얇은 회색 카드선은 사용하지 않음',typography:'Black Han Sans는 포스터 표제에만, 한글 정보 제목과 본문은 Noto Sans KR로 분리',interaction:'하드 컷과 색 반전만 사용. hover에서 들썩임·확대·섀도 이동 금지',exclude:'얇은 종이선, 유리 면, 포그, 소프트 라운드 카드'},
  },
  blueprint: {
    registryId:'blueprint',name:'Blueprint',version:'1.0',mode:'dark',description:'설계 도면의 선, 좌표, 주석 체계를 활용하는 기술적 테마.',
    colors:[['Canvas','#0d1b2e','도면 배경'],['Surface','#12233a','패널'],['Ink','#eef5fc','제목'],['Body','#b9cade','본문'],['Meta','#8aa2bd','주석'],['Guide','#4cc3ff','좌표·행동']],
    css:{canvas:'#0d1b2e',surface:'#12233a',raised:'#152a44',ink:'#eef5fc',body:'#b9cade',meta:'#8aa2bd',accent:'#4cc3ff',accentInk:'#0d1b2e',line:'#2e4a6b',radius:'0px',shadow:'none',display:"'Noto Sans KR',sans-serif",bodyFont:"'Noto Sans KR',sans-serif",koreanTitle:"'Noto Sans KR',sans-serif",sectionIndexShift:'-5px'},
    type:{...commonType,display:'Noto Sans KR',mono:'JetBrains Mono',titleRule:'제목과 본문은 Noto Sans KR, 도면 주석·수치만 JetBrains Mono'},
    signature:['zero radius','1px linework','coordinate labels','cyan guide'],ornaments:'도면 프레임의 crop·axis 표식만 허용. 자유 부유 장식은 금지',motion:'도면선 reveal 240ms; 반복 장식 없음',cursor:'기본 시스템 커서. 좌표 표식은 콘텐츠 프레임 안에만 존재',
    geometry:['crop','axis'], effects:{page:'line reveal 240ms',scroll:'240ms frame draw · top to bottom',reason:'새 도면 프레임과 참조선이 그려지는 순서를 한 번만 설명'}, specific:['카드는 투명 면과 1px 청회색 선으로 구분', '시안은 좌표·현재·행동에만 사용', '배경 grid는 텍스트 대비를 해치지 않는 4% 이하 농도'],
    analysis:{metaphor:'프로덕트 설계 도면. 정보가 면이 아니라 좌표·주석·프레임으로 조직되는 화면',hierarchy:'fig. 참조 → 작업 제목 → 설명 → 규격 수치의 도면 읽기 순서',surface:'0px 모서리, 투명 패널, 1px 청회색 라인워크와 필요한 코너 마커',typography:'Noto Sans KR가 제목·본문을 담당하고 JetBrains Mono는 참조·수치·도면 주석에만 사용',interaction:'새 프레임에 한해 240ms 선 reveal. 스크롤 장식과 반복 애니메이션 없음',exclude:'채워진 카드 더미, 소프트 섀도, 종이 장식, 목적 없는 기하 기호'},
  },
  bento: {
    registryId:'bento',name:'Bento',version:'1.0',mode:'light',description:'포슬린 바탕의 모듈형 타일로 정보를 빠르게 묶는 부드러운 테마.',
    colors:[['Canvas','#f2f1ee','전체 배경'],['Tile','#ffffff','정보 타일'],['Ink','#1c1b19','제목'],['Body','#45423d','본문'],['Meta','#5a5751','메타'],['Accent','#cf4708','주요 행동']],
    css:{canvas:'#f2f1ee',surface:'#ffffff',raised:'#ffffff',ink:'#1c1b19',body:'#45423d',meta:'#5a5751',accent:'#cf4708',accentInk:'#ffffff',line:'#e3e2dd',radius:'16px',shadow:'0 10px 28px -14px rgba(60,50,30,.18)',display:"'Outfit','Noto Sans KR',sans-serif",bodyFont:"'Noto Sans KR',sans-serif",koreanTitle:"'Noto Sans KR',sans-serif",sectionIndexShift:'-4px'},
    type:{...commonType,display:'Outfit',titleRule:'영문 표제는 Outfit, 한글 제목과 본문은 Noto Sans KR'},
    signature:['16px tiles','porcelain canvas','soft elevation','orange action'],ornaments:'사용하지 않음. 타일 자체가 구조이므로 별도 도형을 추가하지 않음',motion:'타일 표면색 180ms; 위치·크기·그림자 범위 변화 금지',cursor:'기본 시스템 커서. 별도 추종 도형 없음',
    geometry:[], effects:{page:'surface fade 180ms',scroll:'220ms tile stagger · 36ms interval',reason:'관련 타일이 묶음 단위로 나타나 정보 구조를 드러냄'}, specific:['정보 관계가 있는 항목만 같은 타일에 묶음', '주황은 행동과 선택 상태에만 사용', '타일 간 gap은 16/24/32 토큰만 사용'],
    analysis:{metaphor:'모듈형 포슬린 타일. 관련 정보를 하나의 부드러운 면 안에서 빠르게 묶는 화면',hierarchy:'큰 히어로 타일 → 사진·통계 타일 → 설명·프로젝트 타일의 크기 대비',surface:'16px 흰 타일과 낮은 명도 섀도. 타일 내부에는 불필요한 구분선을 반복하지 않음',typography:'Outfit 영문 표제와 Noto Sans KR 한글 제목·본문을 조합',interaction:'내용 교체 시 180ms 표면 농도 변화만 허용하고 타일 이동·확대는 금지',exclude:'도면 주석, 하드 잉크선, 포그, 자유 기하 장식'},
  },
  mono: {
    registryId:'mono',name:'Mono',version:'1.0',mode:'light',description:'스위스 편집 그리드와 단색 대비를 중심으로 한 절제된 테마.',
    colors:[['Paper','#fcfcfb','전체 배경'],['Surface','#ffffff','정보 면'],['Ink','#111111','제목·선'],['Body','#333338','본문'],['Meta','#6b6b70','메타'],['Electric','#2733ff','행동·선택']],
    css:{canvas:'#fcfcfb',surface:'#ffffff',raised:'#ffffff',ink:'#111111',body:'#333338',meta:'#6b6b70',accent:'#2733ff',accentInk:'#fcfcfb',line:'#d9d9d4',radius:'0px',shadow:'none',display:"'Archivo','Noto Sans KR',sans-serif",bodyFont:"'Noto Sans KR',sans-serif",koreanTitle:"'Noto Sans KR',sans-serif",sectionIndexShift:'-3px'},
    type:{...commonType,display:'Archivo',titleRule:'영문 표제는 Archivo, 한글 제목과 본문은 Noto Sans KR'},
    signature:['swiss grid','zero radius','uppercase labels','electric blue'],ornaments:'사용하지 않음. 그리드와 타이포그래피만으로 위계를 구성',motion:'선과 색 150ms; 반복 장식 모션 없음',cursor:'기본 시스템 커서. 별도 추종 도형 없음',
    geometry:[], effects:{page:'HARD CUT · 0–120ms',scroll:'180ms column wipe · left to right',reason:'스위스 편집면의 열 순서를 드러내되 부유감은 만들지 않음'}, specific:['일렉트릭 블루는 링크·선택·focus에만 사용', '카드는 흰 면과 1px 검정/회색 선으로 구분', '영문 섹션 라벨은 uppercase와 일정 자간 유지'],
    analysis:{metaphor:'스위스 편집 지면. 그리드·타이포·검정 선만으로 정보 관계를 드러내는 화면',hierarchy:'대문자 표제 → 검정 규칙선 → 작은 레이블 → 일렉트릭 블루 행동 순서',surface:'0px 모서리와 평평한 흰 면. 그림자 없이 검정·회색 규칙선으로만 구분',typography:'Archivo 영문 표제와 Noto Sans KR 한글 제목·본문, 고정폭 메타를 역할별 사용',interaction:'하드 컷 또는 120ms 이하의 색 전환. 장식 모션과 표면 부유 없음',exclude:'라운드 타일, 하드 섀도, 도면 기호, 종이 장식'},
  },
}

export const SYSTEM_ORDER = ['mist', 'midnight', 'signal', 'bold', 'blueprint', 'bento', 'mono']

export function getThemeSystem(id) {
  return THEME_SYSTEMS[id] || THEME_SYSTEMS.midnight
}
