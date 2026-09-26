// Theme registry — each theme remaps the site's design tokens (CSS variables)
// while the layout, content and responsive behavior stay identical.
// Adding a theme = add an entry here + a [data-theme="..."] block in index.css.

export const THEMES = [
  {
    id: 'mist',
    name: 'Mist',
    desc: '종이와 무채색 포그, 타우프 잉크의 에디토리얼 테마',
    dark: false,
    swatch: ['#fbfbf8', '#292824', '#786f58'],
  },
  {
    id: 'default',
    name: 'Midnight',
    desc: '다크 네이비 + 클리어 블루의 제품 중심 테마',
    dark: true,
    swatch: ['#030712', '#111827', '#0064FF'],
  },
  {
    id: 'signal',
    name: 'Signal',
    desc: '데이터 터미널 — 모노스페이스 숫자, 그리드, 시안 액센트',
    dark: true,
    swatch: ['#0c1015', '#111820', '#22d3ee'],
    fonts: 'JetBrains+Mono:wght@400;600',
  },
  {
    id: 'bold',
    name: 'Bold',
    desc: '포스터 — 초고대비, 하드 섀도, 옐로 하이라이트',
    dark: false,
    swatch: ['#f5f3ef', '#121212', '#ffd400'],
    fonts: 'Black+Han+Sans',
  },
  {
    id: 'blueprint',
    name: 'Blueprint',
    desc: '설계 도면 — 딥 블루, 라인워크, 모노 주석',
    dark: true,
    swatch: ['#0d1b2e', '#2e4a6b', '#4cc3ff'],
    fonts: 'JetBrains+Mono:wght@400;600',
  },
  {
    id: 'bento',
    name: 'Bento',
    desc: '타일 그리드 — 포슬린 라이트, 소프트 라운드, 오렌지',
    dark: false,
    swatch: ['#f2f1ee', '#ffffff', '#f97316'],
    fonts: 'Outfit:wght@500;700;800',
  },
  {
    id: 'mono',
    name: 'Mono',
    desc: '스위스 — 순백, 거대 그로테스크, 일렉트릭 블루',
    dark: false,
    swatch: ['#fcfcfb', '#111111', '#2733ff'],
    fonts: 'Archivo:wght@700;800;900',
  },
]

export const THEME_IDS = THEMES.map((t) => t.id)

export function getTheme(id) {
  return THEMES.find((t) => t.id === id) || THEMES.find((t) => t.id === 'default')
}

// Google Fonts are loaded lazily, once per font spec
const loadedFonts = new Set()

function ensureFonts(theme) {
  if (!theme.fonts || loadedFonts.has(theme.fonts)) return
  loadedFonts.add(theme.fonts)
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = `https://fonts.googleapis.com/css2?family=${theme.fonts}&display=swap`
  document.head.appendChild(link)
}

export function applyTheme(id) {
  const theme = getTheme(id)
  ensureFonts(theme)
  const root = document.documentElement
  if (theme.id === 'default') {
    root.removeAttribute('data-theme')
  } else {
    root.setAttribute('data-theme', theme.id)
  }
  // Keep the browser UI (address bar) in step with the canvas color
  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', theme.swatch[0])
}
