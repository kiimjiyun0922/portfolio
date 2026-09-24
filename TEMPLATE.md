# 토큰 게이트 포트폴리오 템플릿 가이드

이 저장소는 **접속 토큰으로 보호되는 개인 포트폴리오 시스템**입니다. 포크해서 아래 체크리스트만 채우면 본인의 포트폴리오로 배포할 수 있습니다.

## 시스템 개요

| 구성 | 설명 |
|---|---|
| 프론트엔드 | React 19 + Vite + Tailwind CSS v4 + Framer Motion |
| 콘텐츠 저장소 | Firestore (`site/*` 문서) — 실제 경력·프로젝트 내용은 코드에 없고 어드민에서 입력 |
| 접속 제어 | 방문자별 접속 토큰 (SHA-256 해시 저장, 만료·연장·폐기·강제만료) |
| 토큰 검증 | Vercel 서버리스 함수 `api/verify-token.js` (서비스 계정) + 클라이언트 폴백 |
| 어드민 콘솔 | `/#<관리경로>` — 콘텐츠 편집, 토큰 발급, 접속 로그, 테마, 변경 이력, PDF 출력 |
| 테마 시스템 | 방문자 토큰별 비주얼 테마 (Mist + 기본·Signal·Bold·Blueprint·Bento·Mono) |
| 분석 | 게이트 방문·인증 접속·섹션 도달·클릭 추적, 보안 알림(EmailJS, 선택) |

## 처음 설정하기

### 1. Firebase

1. [Firebase 콘솔](https://console.firebase.google.com)에서 프로젝트 생성
2. **Firestore Database** 생성 (프로덕션 모드)
3. **Authentication → Google 로그인** 활성화 (어드민 로그인용)
4. 프로젝트 설정 → 웹 앱 추가 → 구성값 6개를 `.env`(로컬)와 Vercel 환경변수에 입력 (`VITE_FIREBASE_*`)
5. `firestore.rules`의 소유자 이메일을 **본인 Google 계정**으로 교체 후 배포:
   ```bash
   npx firebase-tools deploy --only firestore:rules
   ```
6. 프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성 → JSON 전체를 Vercel 환경변수 `FIREBASE_SERVICE_ACCOUNT`에 입력 (서버측 토큰 검증용)

### 2. 어드민 인증

```bash
node scripts/gen-admin-hash.mjs   # 패스코드 입력 → SALT/HASH 출력
```
출력된 `VITE_ADMIN_SALT`, `VITE_ADMIN_HASH`를 환경변수에 설정합니다. 어드민 URL 경로는 해시 앞 12자가 되며(`https://내도메인/#abc123def456`), `VITE_ADMIN_PATH`로 직접 지정할 수도 있습니다. 게이트 입력창에 `#admin`을 입력해도 이동합니다.

### 3. 개인값 교체 체크리스트

| 파일 | 바꿀 것 |
|---|---|
| `src/site.config.js` | 도메인, 소유자 이메일, 연락 이메일, EmailJS 키 (환경변수로 대체 가능) |
| `firestore.rules` | `isOwner()`의 이메일 (site.config의 ownerEmail과 일치) |
| `index.html` | `<title>`, meta description·author, OG/트위터 태그, canonical URL |
| `public/sitemap.xml` `public/robots.txt` | 도메인 |
| `public/profile.jpg` | 프로필 사진 |
| `.firebaserc` | Firebase 프로젝트 ID |

### 4. 배포 (Vercel)

저장소를 Vercel에 연결하면 끝입니다 (프레임워크: Vite 자동 감지, `api/`는 서버리스 함수로 배포). 환경변수: `VITE_FIREBASE_*` 6개, `VITE_ADMIN_SALT/HASH`, `FIREBASE_SERVICE_ACCOUNT`, 그리고 선택적으로 `VITE_SITE_URL` 등 site.config 오버라이드.

### 5. 콘텐츠 입력

설치 직후에는 가상 인물 "Minseo Han"의 샘플 콘텐츠(`src/data/sampleContent.js`)가 표시됩니다 — 화면 구성을 확인하는 데모용이며, 어드민에서 본인 콘텐츠를 저장하는 순간부터 Firestore 데이터가 우선합니다. 배포 후 어드민에 로그인해서 히어로·소개·경력·프로젝트·연락처를 입력하세요. 저장할 때마다 Firestore에 동기화되고 변경 이력(문서당 10개)이 남습니다. 코드 번들에는 실제 콘텐츠가 포함되지 않습니다.

## 운영 가이드

- **토큰 발급**: 어드민 → 토큰 → 새 토큰 생성 (라벨, 만료, 테마 선택). 생성 직후 한 번만 원문이 표시됩니다 — 복사·링크·QR로 전달하세요. 이후에는 해시만 남습니다.
- **토큰 관리**: 연장 / 강제 만료 / 재발급 / 폐기(비밀값 즉시 삭제, 감사 기록 보존). 활성 토큰의 테마는 목록의 드롭다운으로 변경할 수 있습니다(다음 접속부터 적용).
- **접속 분석**: 홈 대시보드와 접속 로그에서 방문·섹션 도달·클릭·체류를 확인합니다. 어드민 로그인한 브라우저는 통계에서 제외됩니다.
- **PDF 출력**: 수신자(회사)별 토큰이 자동 발급되어 PDF의 QR/링크에 심어지므로 문서별 열람 추적이 가능합니다.

## 테마 시스템

테마는 Tailwind v4 토큰과 테마별 스타일을 조합합니다. 현재 기본값인 `Mist`는 인쇄물형 레이아웃과 별도의 반응형 규칙을 포함합니다. 다른 테마의 공통 레이아웃을 수정할 때는 `Mist`의 모바일·태블릿·데스크톱 동작도 함께 확인해야 합니다.

- **적용 규칙**: 어드민은 항상 기본 디자인, 진입 화면은 "진입 화면 테마", 방문자는 토큰의 테마(미지정 시 "기본 방문자 테마"). 새 설치의 진입 화면과 기본 방문자 테마는 `Mist`입니다. 어드민 → 테마에서 설정·미리보기.
- **훅 클래스**: `t-page`(방문자 페이지 루트) `t-hero` `t-gate` `t-stats` `t-card` `t-num` — 테마 CSS가 시그니처 스타일을 걸 수 있는 지점입니다.

### 새 테마 추가하기

1. `src/themes.js`의 `THEMES` 배열에 항목 추가:
   ```js
   { id: 'mytheme', name: 'MyTheme', desc: '설명', dark: true,
     swatch: ['#캔버스', '#표면', '#액센트'], fonts: 'Google+Font:wght@400;700' }
   ```
2. `src/index.css`의 테마 섹션에 블록 추가 — 기존 테마 하나를 복사해서 시작하세요:
   - **다크 테마**: `signal` 블록 복사 (gray-950=캔버스 → gray-100=본문 밝음)
   - **라이트 테마**: `bento` 블록 복사 (램프 반전: gray-950=밝은 캔버스, `--color-white`=잉크)
   - 필요 시 시그니처 스타일(`.t-card` 보더/섀도, `.t-num` 서체, `.bg-accent` 글자색, 헤딩 서체) 추가
3. **대비 체크리스트** (WCAG AA): 본문 4.5:1↑, 큰 텍스트·컨트롤 3:1↑. 특히 라이트 테마에서 `text-accent`가 캔버스 위에서 읽히는지, `bg-accent` 버튼 글자색이 충분한지 확인. 시맨틱 색(emerald/blue/purple/amber-400)은 라이트 테마용 리맵 블록에 추가.
4. 좌측 정렬 월드로 만들려면 `signal`의 `.t-hero`/`.t-gate` 정렬 규칙과 파일 하단의 "shared left rail" 블록에 테마를 추가하세요.

## AI 에이전트와 함께 설정·개발하기

Claude Code는 저장소의 `CLAUDE.md`(아키텍처·불변 규칙)를 자동으로 읽으므로 별도 프롬프트 없이 바로 작업을 시켜도 됩니다. 다른 AI 코딩 도구를 쓰거나 처음 설정을 통째로 맡기고 싶다면 아래 프롬프트를 복사해 쓰세요.

### 프롬프트 1 — 초기 설정 (포크 직후 1회)

`{{ }}` 부분을 본인 값으로 채워서 그대로 붙여넣으세요.

```text
이 저장소는 토큰 게이트 포트폴리오 템플릿이야. TEMPLATE.md와 CLAUDE.md를 먼저 읽고,
아래 내 정보로 개인화해줘.

- 배포 도메인: {{https://my-domain.com}}
- 어드민용 Google 계정(소유자): {{me@gmail.com}}
- 토큰 요청 연락 이메일: {{contact@my-domain.com}}
- 사이트 제목/설명(OG 메타용): {{이름 | 직함}} / {{한 줄 소개}}
- Firebase 프로젝트 ID: {{my-project-id}} (아직 없으면 만드는 절차를 안내해줘)

작업 내용:
1. TEMPLATE.md의 "개인값 교체 체크리스트"에 있는 모든 파일을 위 값으로 수정
   (src/site.config.js, firestore.rules, index.html 메타태그, public/sitemap.xml,
   public/robots.txt, .firebaserc). EmailJS는 쓰지 않을 거면 비활성화해줘.
2. .env.example을 복사해 .env를 만들고, 내가 채워야 할 값과 얻는 방법을
   항목별로 알려줘 (Firebase 웹 구성 6개, FIREBASE_SERVICE_ACCOUNT).
3. node scripts/gen-admin-hash.mjs 실행을 안내하고 결과를 .env에 반영해줘.
4. npm run build가 통과하는지 확인하고, 남은 수동 작업(프로필 사진 교체,
   Firestore 규칙 배포, Vercel 환경변수 등록)을 체크리스트로 정리해줘.

주의: 실제 경력·프로젝트 콘텐츠는 코드에 넣지 마 — 배포 후 어드민에서 입력할 거야.
```

### 프롬프트 2 — 기능 개발·수정 (매 세션)

Claude Code가 아닌 도구에서 개발 작업을 시킬 때 요청 앞에 붙이세요.

```text
컨텍스트: 이 저장소는 토큰 게이트 포트폴리오다 (React 19 + Vite + Tailwind v4 +
Firestore + Vercel 함수). 작업 전에 CLAUDE.md의 아키텍처와 불변 규칙을 읽고 따라라.
특히: ① 실제 콘텐츠·개인값을 코드에 하드코딩하지 말 것(site.config.js/Firestore 사용),
② 컴포넌트 색은 gray 램프·accent 토큰만 사용(테마가 CSS 변수를 리맵함),
③ 테마 CSS는 색·서체·형태만 — 레이아웃/브레이크포인트 변경 금지,
④ 변경 후 npm run build 통과와 모바일(375px) 확인,
⑤ 새 테마는 TEMPLATE.md의 "새 테마 추가하기" 절차와 WCAG AA 대비 체크를 따를 것.

작업 요청: {{여기에 할 일을 적으세요}}
```

## 주의 사항

- 토큰 원문은 어디에도 저장되지 않습니다. 분실 시 재발급하세요.
- `firestore.rules`의 이메일과 `site.config.js`의 `ownerEmail`이 다르면 어드민 로그인은 되지만 저장이 실패합니다.
- EmailJS를 쓰지 않으면 `VITE_EMAILJS_SERVICE=`(빈 값)로 두면 됩니다 — 보안 알림 이메일만 꺼지고 나머지는 동작합니다.
