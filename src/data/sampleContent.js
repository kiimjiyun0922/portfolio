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
