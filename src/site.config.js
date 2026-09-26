// ════════════════════════════════════════════════════════════════
// SITE CONFIG — 이 템플릿을 내 것으로 만들 때 편집하는 파일.
//
// 각 값은 환경변수(VITE_*)가 있으면 그것을 쓰고, 없으면 아래의
// 기본값을 씁니다. 개인 배포에서는 이 파일을 직접 고쳐도 되고,
// Vercel 환경변수로만 관리해도 됩니다.
//
// 코드 밖에서 함께 고쳐야 하는 파일은 TEMPLATE.md의 체크리스트를
// 참고하세요 (index.html 메타태그, firestore.rules의 소유자 이메일,
// public/sitemap.xml, public/robots.txt, .firebaserc, profile.jpg).
// ════════════════════════════════════════════════════════════════

const env = import.meta.env
const runtimeOrigin = typeof window !== 'undefined' ? window.location.origin : ''

export const SITE = {
  // 배포 도메인 (토큰 접속 링크·QR·PDF 각주에 사용)
  url: env.VITE_SITE_URL || runtimeOrigin,

  // 소유자 표시 이름 (PDF 헤더·파일명에 사용)
  ownerName: env.VITE_OWNER_NAME || 'Portfolio Owner',

  // 어드민 콘솔에만 로그인할 수 있는 소유자 Google 계정.
  // firestore.rules의 isOwner() 이메일과 반드시 일치해야 합니다.
  ownerEmail: env.VITE_OWNER_EMAIL || '',

  // 접속 화면(AuthGate)의 토큰 요청 연락처 기본값 — 어드민에서 수정 가능
  contactEmail: env.VITE_CONTACT_EMAIL || '',

  // 보안 알림 이메일 (EmailJS). service를 비우면 이메일 알림이 꺼집니다.
  emailjs: {
    service: env.VITE_EMAILJS_SERVICE ?? '',
    template: env.VITE_EMAILJS_TEMPLATE ?? '',
    publicKey: env.VITE_EMAILJS_PUBLIC_KEY ?? '',
  },
}

// 도메인 표기용 (프로토콜 제거)
export const SITE_HOST = SITE.url.replace(/^https?:\/\//, '')
