# 토큰 게이트 포트폴리오 — AI 개발 가이드

접속 토큰으로 보호되는 개인 포트폴리오. React 19 + Vite + Tailwind CSS v4 + Firestore + Vercel 서버리스. 처음 설정하는 절차와 개인값 체크리스트는 `TEMPLATE.md` 참고.

## 명령어

```bash
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드 (변경 후 반드시 통과 확인)
npm run lint     # ESLint (기존 경고가 많음 — 새 에러만 추가하지 말 것)
```

## 아키텍처

- `src/App.jsx` — 라우팅 없는 단일 앱. 상태로 분기: 어드민(`#관리경로` 해시) / 게이트(AuthGate) / 방문자 뷰. 테마는 화면당 하나: 어드민=기본, 게이트=진입 테마, 방문자=토큰 테마.
- `src/components/` — 방문자 섹션(Hero, About, Journey, Achievements, Projects, Experience, Resume, Contact) + `Admin.jsx`(어드민 콘솔 전체) + `AuthGate.jsx`(토큰 입력).
- `src/utils/crypto.js` — 토큰 생성·검증(SHA-256 해시), 접속/게이트/보안 로그, 모든 콘텐츠 config의 load/save/reset. localStorage 캐시 + Firestore 동기화(`utils/db.js`의 SYNC_MAP).
- `api/verify-token.js` — Vercel 함수. 서비스 계정으로 Firestore의 토큰을 서버측 검증하고 Firebase 커스텀 토큰 발급. 의존성 없음(node:crypto + REST).
- `src/site.config.js` — 도메인·이메일 등 사이트 정체성. 개인값은 반드시 여기(또는 VITE_* 환경변수)로.
- `src/themes.js` + `src/index.css` 테마 섹션 — 테마 레지스트리와 CSS 변수 블록.

## 불변 규칙

1. **실제(본인) 콘텐츠는 코드에 넣지 않는다.** 본인 경력·프로젝트는 어드민을 통해 Firestore에만 저장한다. 코드의 기본값은 `src/data/sampleContent.js`의 가상 인물 샘플뿐이며, 번들에서 실제 개인 정보가 읽히면 안 된다.
2. **토큰 원문은 저장하지 않는다.** 생성 직후 1회 표시 후 해시만 보관. 폐기 시 비밀값 즉시 삭제.
3. **색은 gray 램프와 accent 토큰으로만.** 컴포넌트에 hex나 고정 색 유틸리티(slate-*, zinc-*)를 넣지 말 것 — 테마가 `--color-gray-*`/`--color-accent`/`--color-white`를 리맵하는 구조라, 램프 밖의 색은 라이트 테마에서 깨진다. 시맨틱 상태색(red/green/emerald/…-400)은 예외이며, 새로 쓰면 index.css의 라이트 테마 리맵 블록에 추가.
4. **공통 테마는 색·서체·형태만 바꾼다.** 단, 현재 기본값인 `Mist`는 인쇄물형 전용 레이아웃과 반응형 규칙을 가진다. `Mist` 수정 시 320·360·390·430·768·1024·1280px을 확인한다. `.justify-center` 같은 유틸리티 일괄 오버라이드는 금지한다(과거 회귀 원인).
5. **새 테마 추가 절차는 TEMPLATE.md의 "새 테마 추가하기"를 따른다.** WCAG AA 대비(본문 4.5:1, 컨트롤 3:1) 확인 필수.
6. **새 사이트 설정 문서(Firestore `site/*`)를 추가하면** `db.js`의 SYNC_MAP과 crypto.js의 load/save/reset 세트를 함께 추가하고, 비인증 접근이 필요한지 firestore.rules를 검토.
7. **방문자 UI 텍스트는 영어, 어드민 UI는 한국어**가 현재 관례.
8. UI 변경 후에는 `npm run build`와 방문자 화면 스모크(게이트가 JS 에러 없이 뜨는지)를 확인하고, 테마 영향이 있으면 기본+라이트+좌측정렬 테마 각 1개씩 확인.
9. **사용자에게 보이는 변경은 문서와 함께 반영한다.** 세부 UI 변경은 `docs/CHANGELOG.md`, 지속할 디자인 규칙은 `docs/DESIGN_SYSTEM.md`, 설치·운영·구조 변경은 `README.md`와 `TEMPLATE.md`를 같은 커밋에서 갱신한다.
10. **방문자 화면에는 이모지를 사용하지 않는다.** 장식은 CSS 기하학 기호나 프로젝트에서 채택한 아이콘 체계로 표현한다.
