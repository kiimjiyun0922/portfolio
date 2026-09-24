# Token-Gated Portfolio

접속 토큰으로 보호되는 개인 포트폴리오입니다. React 19, Vite, Tailwind CSS v4, Firestore, Vercel로 구성되어 있으며 콘텐츠는 어드민에서 관리합니다.

현재 기본 방문자 화면은 흰 종이와 인쇄물을 연상시키는 `Mist` 테마를 사용합니다. 얇은 규칙선, 절제된 포인트 컬러, 편집 디자인형 타이포그래피, 작은 기하학 장식으로 정보를 구분합니다.

- 실제 사이트: [design-jy.vercel.app](https://design-jy.vercel.app)
- 설정 및 운영: [TEMPLATE.md](TEMPLATE.md)
- 디자인 규칙: [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)
- 변경 기록: [docs/CHANGELOG.md](docs/CHANGELOG.md)

## 주요 기능

- 방문자별 접속 토큰 발급, 만료, 연장, 폐기 및 서버 검증
- 히어로, 소개, 커리어 저니, 성과, 프로젝트, 경력, 교육·활동 콘텐츠 관리
- 어드민 콘솔의 콘텐츠 편집, 접속 분석, 변경 이력, PDF 출력
- Firestore 기반 콘텐츠 및 설정 동기화
- 데스크톱, 태블릿, 모바일 반응형 레이아웃
- 토큰별 테마 선택과 어드민 실시간 미리보기
- 게이트 방문, 섹션 도달, 클릭 추적 및 선택적 보안 알림

## 시작하기

저장소의 **Use this template** 또는 Fork를 사용한 뒤 다음 순서로 실행합니다.

```bash
git clone <저장소 주소>
cd <저장소>
npm install
cp .env.example .env
npm run dev
```

Firebase, 어드민 인증, 환경변수, 개인값 교체와 Vercel 배포 절차는 [TEMPLATE.md](TEMPLATE.md)를 따릅니다. 실제 경력과 프로젝트 데이터는 코드에 직접 넣지 않고 어드민을 통해 Firestore에 저장합니다.

## 명령어

```bash
npm run dev       # 로컬 개발 서버
npm run check     # 린트, 테스트, 프로덕션 빌드
npm run build     # 프로덕션 빌드
npm run preview   # 빌드 결과 미리보기
```

배포 전에는 `npm run check`를 통과해야 합니다.

## 구조

```text
api/                    Vercel 서버리스 함수
docs/                   디자인 규칙과 변경 기록
public/                 파비콘, 웹 앱 아이콘, 정적 자산
src/components/         방문자 화면, 게이트, 어드민 컴포넌트
src/data/               코드에 포함되는 가상 샘플 데이터
src/utils/              Firestore 동기화, 토큰, 로그, PDF 기능
src/index.css           공통 스타일과 테마별 반응형 규칙
src/themes.js           테마 레지스트리
src/site.config.js      도메인과 소유자 관련 설정
```

방문자 화면의 주요 섹션은 `Hero`, `About`, `Journey`, `Achievements`, `Projects`, `Experience`, `Resume`, `Contact`입니다. 입력한 줄바꿈은 넓은 화면에서 우선 보존하고, 좁은 화면에서는 콘텐츠가 넘치지 않도록 자연스럽게 재배치합니다.

## 현재 디자인 원칙

- 본문 배경은 노이즈가 과하지 않은 흰 종이 톤을 유지합니다.
- 장식은 이모지 대신 CSS 기하학 기호를 사용합니다.
- 호버 상태에서 요소의 크기나 위치가 움직이지 않게 합니다.
- 모바일 본문은 실제 읽는 문장을 15–16px로 유지합니다.
- 모바일 주요 섹션 제목은 같은 크기 체계로 통일합니다.
- 번호, 연도, 카테고리와 보조 메타 정보만 작은 글씨를 사용합니다.
- 어드민에 입력한 의도적인 줄바꿈을 우선하되 작은 화면에서는 안전하게 줄바꿈합니다.
- 프로젝트 및 경력 원문 데이터는 디자인 변경 과정에서 삭제하거나 축약하지 않습니다.

자세한 수치와 컴포넌트별 규칙은 [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)에 기록합니다.

## 배포

`main` 브랜치는 Vercel 프로젝트와 연결되어 있습니다. 변경 사항을 푸시하면 프로덕션 배포가 시작되며, 배포 후에는 실사이트의 생성 자산이 최신 빌드와 일치하는지 확인합니다.

## 문서 유지 규칙

사용자에게 보이는 구조, 반응형 동작, 인증 방식, 데이터 구조 또는 배포 과정이 바뀌면 같은 커밋에서 관련 문서를 함께 수정합니다. 세부 UI 변경은 `docs/CHANGELOG.md`, 지속적으로 지켜야 할 시각 규칙은 `docs/DESIGN_SYSTEM.md`, 설치·운영 변경은 `TEMPLATE.md`와 이 README에 반영합니다.
