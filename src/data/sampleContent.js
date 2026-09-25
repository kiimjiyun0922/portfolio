// ════════════════════════════════════════════════════════════════
// SAMPLE CONTENT — 템플릿 데모용 가상 인물 "Minseo Han"의 콘텐츠.
//
// 이 데이터는 Firestore가 비어 있을 때(설치 직후)만 화면에 보이는
// 기본값입니다. 어드민에서 본인 콘텐츠를 입력·저장하는 순간부터는
// Firestore 데이터가 우선하므로 이 파일을 지울 필요는 없지만,
// 번들에 남기고 싶지 않다면 각 export를 빈 구조로 바꾸면 됩니다.
// 모든 인물·회사·수치는 허구입니다.
// ════════════════════════════════════════════════════════════════

export const sampleAbout = {
  heading: 'Designing the balance\nbetween users and business',
  bio: '데이터로 문제를 정의하고 실험으로 검증하는 프로덕트 매니저입니다. AI 추천, 커머스, 에듀테크를 거치며 기획부터 출시·운영까지 전 과정을 주도해 왔습니다. 복잡한 기술을 사용자가 체감하는 가치로 번역하는 일을 가장 잘합니다.',
  skills: [
    { label: 'Product Strategy', category: 'ops' },
    { label: 'A/B Testing', category: 'data' },
    { label: 'Data Analysis', category: 'data' },
    { label: 'AI/ML Product', category: 'ai' },
    { label: 'LLM / Prompt Engineering', category: 'ai' },
    { label: 'UX Research', category: 'ux' },
    { label: 'Service Planning', category: 'ux' },
    { label: 'Stakeholder Management', category: 'ops' },
  ],
}

export const sampleAchievements = {
  items: [
    {
      icon: '',
      iconBg: '#1e293b',
      title: 'AI 상담 어시스턴트 출시',
      description: '상담 처리 시간 **-42%**, 상담사 CSAT **4.6/5.0** — 9주 만에 MVP 출시 후 전사 확대',
      linkTo: 'projects',
    },
    {
      icon: '',
      iconBg: '#1c2a22',
      title: '추천 피드 전환율 개선',
      description: '홈 피드 개인화 실험 17회 누적으로 구매 전환율 **+31%**, 재방문율 **+18%**',
      linkTo: 'projects',
    },
    {
      icon: '',
      iconBg: '#2a2320',
      title: '온보딩 리디자인',
      description: '가입 완료율 **58% → 79%** — 리서치 기반 단계 축소와 빈 상태 재설계',
      linkTo: 'experience',
    },
    {
      icon: '',
      iconBg: '#241d2e',
      title: '크로스펑셔널 조직 리드',
      description: '개발 6 · 디자인 2 · 데이터 2로 구성된 스쿼드의 분기 로드맵과 실험 파이프라인 운영',
      linkTo: 'experience',
    },
  ],
}

export const sampleJourney = {
  items: [
    { year: '2018', org: 'Brightline Edu', emoji: '', field: 'EdTech PM', color: '#34d399', companyId: 'Brightline Edu' },
    { year: '2021', org: 'Novabridge', emoji: '', field: 'Commerce PM', color: '#f59e0b', companyId: 'Novabridge' },
    { year: '2023', org: 'Lumen Labs', emoji: '', field: 'AI Product', color: '#60a5fa', current: true, companyId: 'Lumen Labs' },
  ],
}

export const sampleProjects = {
  designArchive: {
    title: 'Selected Design Work',
    intro: '브랜드와 제품의 맥락을 이미지와 설계 근거로 기록한 디자인 프로젝트입니다.',
    archiveThreshold: 4,
  },
  designProjects: [
    {
      id: 'sample-atlas-system',
      slug: 'sample-atlas-system',
      title: 'Atlas Visual System',
      category: 'Brand System',
      year: '2026',
      summary: '이동과 확장을 전제로 설계한 모듈형 브랜드 시스템 샘플입니다.',
      role: 'Design Direction · UI',
      client: 'Sample Project',
      duration: '8 weeks',
      featured: true,
      published: true,
      coverImage: '/assets/design-project-samples.webp',
      coverMode: 'sheet',
      coverPosition: '0% 0%',
      coverAlt: '청회색 기하학 형태로 구성한 브랜드 인쇄물 샘플',
      brief: '새로운 서비스가 여러 채널로 확장되어도 동일한 인상을 유지하도록 시각 언어를 정리하는 샘플 과제입니다.',
      problem: '채널별 산출물이 서로 다른 규칙으로 제작되어 브랜드 인지가 분산되는 상황을 가정했습니다.',
      userFlow: '브랜드 접점과 제작 주체를 기준으로 핵심 템플릿의 우선순위를 정리했습니다.',
      solution: '원과 반원의 비례, 제한된 색상, 반복 가능한 지면 그리드로 시스템을 구성했습니다.',
      validation: '대표 산출물에 시스템을 적용해 확장성과 판독성을 확인하는 검증 시나리오를 포함합니다.',
      designSystem: '색상, 형태, 간격, 이미지 크롭 규칙을 토큰과 템플릿 단위로 정의하는 예시입니다.',
      gallery: [],
    },
    {
      id: 'sample-archive-editorial',
      slug: 'sample-archive-editorial',
      title: 'Archive Editorial',
      category: 'Editorial Design',
      year: '2025',
      summary: '자료의 관계와 탐색 순서를 지면 리듬으로 표현한 편집 디자인 샘플입니다.',
      role: 'Editorial · Art Direction',
      client: 'Sample Project',
      duration: '6 weeks',
      featured: true,
      published: true,
      coverImage: '/assets/design-project-samples.webp',
      coverMode: 'sheet',
      coverPosition: '100% 0%',
      coverAlt: '검정 기하학 이미지로 구성한 펼친 책 샘플',
      brief: '서로 다른 형식의 기록물을 한 흐름에서 읽을 수 있게 만드는 편집 구조를 탐색했습니다.',
      problem: '정보의 분량과 이미지 비율이 일정하지 않아 페이지별 위계가 흔들리는 상황을 가정했습니다.',
      userFlow: '목차, 장 구분, 상세 자료로 이어지는 읽기 순서를 먼저 설계했습니다.',
      solution: '비대칭 칼럼과 반복되는 캡션 기준선을 사용해 변화와 일관성을 함께 확보했습니다.',
      validation: '긴 제목과 이미지가 없는 항목까지 대입해 레이아웃의 엣지 케이스를 확인합니다.',
      designSystem: '타입 스케일과 8px 간격 단위, 이미지 비율별 템플릿을 정의하는 샘플입니다.',
      gallery: [],
    },
    {
      id: 'sample-field-notes',
      slug: 'sample-field-notes',
      title: 'Field Notes Interface',
      category: 'Digital Product',
      year: '2025',
      summary: '관찰 기록을 빠르게 분류하고 다시 찾는 인터페이스 디자인 샘플입니다.',
      role: 'UX · UI Design',
      client: 'Sample Project',
      duration: '10 weeks',
      featured: true,
      published: true,
      coverImage: '/assets/design-project-samples.webp',
      coverMode: 'sheet',
      coverPosition: '0% 100%',
      coverAlt: '세이지 색상의 자연 이미지와 정보 모듈로 구성한 화면 샘플',
      brief: '현장에서 수집한 기록이 개인 메모로 소실되지 않도록 탐색 가능한 인터페이스를 설계했습니다.',
      problem: '기록 형식이 제각각이고 분류가 사후 작업으로 밀리는 상황을 가정했습니다.',
      userFlow: '기록, 자동 분류, 검토, 공유로 이어지는 핵심 흐름을 단순화했습니다.',
      solution: '입력 단계에서는 선택을 줄이고 검토 단계에서 맥락을 보강하는 구조를 제안했습니다.',
      validation: '빈 상태, 긴 메모, 이미지 누락 상태를 포함한 사용성 점검 항목을 정의했습니다.',
      designSystem: '상태, 입력, 카드, 필터 컴포넌트의 변형과 반응형 규칙을 정리하는 샘플입니다.',
      gallery: [],
    },
    {
      id: 'sample-horizon-campaign',
      slug: 'sample-horizon-campaign',
      title: 'Horizon Campaign',
      category: 'Campaign',
      year: '2024',
      summary: '하나의 메시지를 인쇄물과 디지털 채널로 확장한 캠페인 샘플입니다.',
      role: 'Art Direction',
      client: 'Sample Project',
      duration: '5 weeks',
      featured: false,
      published: true,
      coverImage: '/assets/design-project-samples.webp',
      coverMode: 'sheet',
      coverPosition: '100% 100%',
      coverAlt: '산호색과 차콜 색상의 풍경 콜라주 캠페인 샘플',
      brief: '채널마다 다른 규격에서도 한눈에 같은 캠페인으로 인식되는 시각 장치를 탐색했습니다.',
      problem: '산출물 크기가 달라질 때 핵심 메시지와 이미지의 관계가 쉽게 무너지는 상황을 가정했습니다.',
      userFlow: '노출 환경별 시선 이동과 정보 우선순위를 기준으로 템플릿을 구분했습니다.',
      solution: '색면과 풍경 이미지의 대비를 핵심 장치로 두고 크롭 규칙을 단순화했습니다.',
      validation: '가장 작은 모바일 배너부터 큰 포스터까지 동일한 위계가 유지되는지 확인합니다.',
      designSystem: '캠페인 색상, 이미지 크롭, 제목 길이별 대응 규칙을 정의하는 샘플입니다.',
      gallery: [],
    },
  ],
  groups: [
    {
      title: 'AI Product',
      subtitle: 'LLM과 추천 시스템을 실제 지표로 연결한 프로젝트',
      linkToExperience: true,
      projects: [
        {
          title: 'LLM 고객 상담 어시스턴트',
          subtitle: '상담 처리 시간을 42% 줄인 AI 어시스턴트 도입',
          badge: 'AI Product',
          badgeType: 'ai',
          problem: '상담 대기열이 성수기마다 폭증했지만 상담사 증원은 비용 한계에 부딪힌 상황. 반복 문의가 전체의 60% 이상을 차지했다.',
          solution: 'FAQ성 문의를 LLM이 초안 응답하고 상담사가 검수·전송하는 co-pilot 구조로 설계. 자동화율 대신 **이관 정확도**를 북극성 지표로 삼았다.',
          collaboration: 'ML 엔지니어 2명과 프롬프트·평가셋을 공동 설계하고, CS팀 리드와 주간 품질 리뷰를 운영했다.',
          result: '9주 만에 MVP를 출시했고, 상담 처리 시간이 42% 줄었다. 상담사 만족도 4.6/5.0을 유지하며 전사 채널로 확대됐다.',
          highlights: [
            { value: '-42%', label: '처리 시간' },
            { value: '4.6', label: 'CSAT' },
            { value: '9주', label: 'MVP 출시' },
          ],
        },
        {
          title: '홈 피드 개인화 추천',
          subtitle: '실험 17회로 구매 전환율 31% 개선',
          badge: 'Data',
          badgeType: 'data',
          problem: '홈 피드가 전 사용자에게 동일해 신규 상품 노출이 상위 카테고리에 편중됐다.',
          solution: '세그먼트별 랭킹 가중치를 도입하고 실험 파이프라인을 표준화해 2주 단위로 가설을 검증했다.',
          collaboration: '데이터 사이언티스트와 오프라인 평가 지표를 합의하고, 디자이너와 탐색-활용 균형을 UI로 풀었다.',
          result: '17회 누적 실험으로 구매 전환율 +31%, 재방문율 +18%. 실험 표준은 타 스쿼드에도 이식됐다.',
          highlights: [
            { value: '+31%', label: '구매 전환' },
            { value: '+18%', label: '재방문' },
            { value: '17회', label: 'A/B 실험' },
          ],
        },
      ],
    },
  ],
}

export const sampleResume = {
  education: [
    { school: '한빛대학교', degree: '경영학·컴퓨터과학 복수전공', period: '2012 ~ 2016' },
  ],
  work: [
    {
      company: 'Lumen Labs',
      title: 'Senior Product Manager',
      period: '2023.03 ~',
      projects: [
        {
          title: 'LLM 고객 상담 어시스턴트',
          period: '2023.05 ~ 2024.01',
          role: 'PM (리드)',
          team: 'ML 2 · FE 2 · CS 협업',
          summary: '반복 문의를 LLM co-pilot으로 처리하는 상담 보조 시스템 기획·출시',
          result: '처리 시간 -42%, CSAT 4.6/5.0, 전사 채널 확대',
        },
        {
          title: 'AI 품질 평가 파이프라인',
          period: '2024.02 ~',
          role: 'PM',
          team: 'ML 2 · Data 1',
          summary: '프롬프트 회귀 테스트와 휴먼 평가를 결합한 상시 품질 게이트 구축',
          result: '릴리스당 품질 리그레션 0건 유지',
        },
      ],
      otherProjects: '- 사내 프롬프트 가이드라인 표준화\n- 신규 PM 온보딩 멘토링',
    },
    {
      company: 'Novabridge',
      title: 'Product Manager',
      period: '2020.06 ~ 2023.02',
      projects: [
        {
          title: '홈 피드 개인화 추천',
          period: '2021.03 ~ 2022.08',
          role: 'PM',
          team: 'DS 2 · BE 3 · 디자인 1',
          summary: '세그먼트 기반 랭킹과 실험 파이프라인 표준화',
          result: '구매 전환 +31%, 재방문 +18%',
        },
      ],
      otherProjects: '- 검색 자동완성 개편 (CTR +12%)\n- 리뷰 신뢰도 스코어 도입',
    },
    {
      company: 'Brightline Edu',
      title: 'Associate PM',
      period: '2018.01 ~ 2020.05',
      projects: [
        {
          title: '학습 온보딩 리디자인',
          period: '2019.02 ~ 2019.09',
          role: 'APM',
          team: 'FE 2 · 디자인 1',
          summary: '가입 퍼널 리서치와 단계 축소, 빈 상태 재설계',
          result: '가입 완료율 58% → 79%',
        },
      ],
      otherProjects: '- 학부모 리포트 위클리 다이제스트 기획',
    },
  ],
  activities: [
    {
      year: '2025',
      category: '발표',
      summary: 'AI 프로덕트의 품질 지표 설계',
      detail: '국내 PM 컨퍼런스에서 LLM 제품의 북극성 지표 설계 사례 발표',
      link: '',
      linkLabel: '',
    },
    {
      year: '2024',
      category: '기고',
      summary: '실험 문화가 무너지는 7가지 신호',
      detail: '프로덕트 뉴스레터 기고 — 조직의 실험 파이프라인 안티패턴 정리',
      link: '',
      linkLabel: '',
    },
  ],
  selfIntro: '숫자로 시작해 사용자로 끝나는 제품을 만듭니다. 기술의 가능성과 비즈니스의 제약 사이에서 팀이 같은 그림을 보게 만드는 것이 저의 역할이라고 믿습니다.',
}
