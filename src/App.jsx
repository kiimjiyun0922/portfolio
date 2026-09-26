import { lazy, Suspense, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { recordHeartbeat, trackAction, setActiveSession, loadThemeSettings, loadHeroConfig, ADMIN_PATH } from './utils/crypto'
import { applyTheme, THEMES } from './themes'

const Admin = lazy(() => import('./components/Admin'))
const AdminDesignSystem = lazy(() => import('./components/AdminDesignSystem'))
const AuthGate = lazy(() => import('./components/AuthGate'))
const AdminLogin = lazy(() => import('./components/AdminLogin'))
const Hero = lazy(() => import('./components/Hero'))
const About = lazy(() => import('./components/About'))
const Journey = lazy(() => import('./components/Journey'))
const Projects = lazy(() => import('./components/Projects'))
const Experience = lazy(() => import('./components/Experience'))
const Achievements = lazy(() => import('./components/Achievements'))
const Resume = lazy(() => import('./components/Resume'))
const Contact = lazy(() => import('./components/Contact'))
const ScrollToTop = lazy(() => import('./components/ui/ScrollToTop'))
const PortfolioRail = lazy(() => import('./components/PortfolioRail'))
const NotebookCursor = lazy(() => import('./components/NotebookCursor'))
const ProjectArchivePage = lazy(() => import('./components/ProjectArchivePage'))
const ProjectDetailPage = lazy(() => import('./components/ProjectDetailPage'))

function ScreenLoader() {
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-gray-500 text-sm animate-pulse">Loading...</div>
    </div>
  )
}

// Admin chrome shown over the real visitor screen. It follows the saved
// admin color mode and never inherits the visitor theme being previewed.
function ThemePreviewBar({ preview, onChange, onClose }) {
  const width = preview.width || 'desktop'
  const adminTheme = localStorage.getItem('portfolio_admin_color_mode') || 'light'
  return (
    <div className="theme-preview-toolbar" data-admin-theme={adminTheme} role="toolbar" aria-label="방문자 테마 미리보기">
      <strong>테마 미리보기</strong>
      <label className="theme-preview-toolbar__control">
        <span>테마</span>
        <select
          value={preview.theme}
          onChange={(e) => onChange({ ...preview, theme: e.target.value })}
        >
          {THEMES.map((th) => <option key={th.id} value={th.id}>{th.name}</option>)}
        </select>
      </label>
      <div className="theme-preview-toolbar__control">
        <span>화면</span>
        <div className="theme-preview-toolbar__group" aria-label="화면">
          <button
            onClick={() => onChange({ ...preview, view: 'site' })}
            aria-pressed={preview.view === 'site'}
          >포트폴리오</button>
          <button
            onClick={() => onChange({ ...preview, view: 'gate' })}
            aria-pressed={preview.view === 'gate'}
          >진입 화면</button>
        </div>
      </div>
      <div className="theme-preview-toolbar__control">
        <span>폭</span>
        <div className="theme-preview-toolbar__group theme-preview-toolbar__width" aria-label="미리보기 폭">
          {[['mobile', 'M'], ['tablet', 'T'], ['desktop', 'D']].map(([key, label]) => <button key={key} type="button" aria-label={`${key} 폭`} aria-pressed={width === key} onClick={() => onChange({ ...preview, width: key })}>{label}</button>)}
        </div>
      </div>
      <button
        onClick={onClose}
        className="theme-preview-toolbar__close"
      >어드민으로</button>
    </div>
  )
}
import { syncFromCloud, isCloudEnabled, cloudGet } from './utils/db'
import { watchOwnerAuth, signInVisitor, signOutOwner, OWNER_EMAIL } from './utils/firebase'

const EXPIRY_WARNING_MS = 10 * 60 * 1000

export function TokenExpiryBanner({ expiresAt, onExpired }) {
  const [visible, setVisible] = useState(true)
  const [now, setNow] = useState(Date.now)

  useEffect(() => {
    if (!Number.isFinite(expiresAt)) return undefined

    let timer
    let interval

    const enforceExpiry = () => {
      if (Date.now() >= expiresAt) onExpired()
      else setNow(Date.now())
    }

    const schedule = () => {
      const remaining = expiresAt - Date.now()
      if (remaining <= 0) {
        onExpired()
        return
      }
      if (remaining <= EXPIRY_WARNING_MS) {
        setVisible(true)
        setNow(Date.now())
        interval = window.setInterval(() => setNow(Date.now()), 1000)
        timer = window.setTimeout(onExpired, remaining)
        return
      }
      timer = window.setTimeout(schedule, Math.min(remaining - EXPIRY_WARNING_MS, 60 * 60 * 1000))
    }

    schedule()
    window.addEventListener('focus', enforceExpiry)
    window.addEventListener('pageshow', enforceExpiry)
    document.addEventListener('visibilitychange', enforceExpiry)
    return () => {
      window.clearTimeout(timer)
      window.clearInterval(interval)
      window.removeEventListener('focus', enforceExpiry)
      window.removeEventListener('pageshow', enforceExpiry)
      document.removeEventListener('visibilitychange', enforceExpiry)
    }
  }, [expiresAt, onExpired])

  const diffMs = expiresAt - now
  if (!expiresAt || !visible || diffMs > EXPIRY_WARNING_MS || diffMs <= 0) return null

  const totalSeconds = Math.max(0, Math.ceil(diffMs / 1000))
  const remaining = `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -40, opacity: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="visitor-session-banner fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-3 px-4 py-2.5 bg-gray-900/90 backdrop-blur-md border-b border-gray-800/60 text-sm"
        role="status"
        aria-live="polite"
      >
        <svg className="w-4 h-4 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        <span className="visitor-session-banner__copy text-gray-400">
          <span className="visitor-session-banner__label">ACCESS EXPIRING</span>
          <span className="visitor-session-banner__remaining text-accent ml-1.5">{remaining}</span>
          <span>접속 만료 전 작업을 마치거나 접근 시간을 연장해 주세요.</span>
        </span>
        <button
          onClick={() => setVisible(false)}
          className="visitor-session-banner__close text-gray-600 hover:text-gray-300 ml-1 cursor-pointer"
          aria-label="만료 임박 안내 닫기"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </motion.div>
    </AnimatePresence>
  )
}

function App() {
  const adminHash = `#${ADMIN_PATH}`
  const adminSystemHash = `#${ADMIN_PATH}-system`
  const query = new URLSearchParams(window.location.search)
  const isLocalPreview = import.meta.env.DEV && query.has('preview')
  const isAdminPreviewFrame = query.get('admin-preview') === '1'
  const adminPreviewTheme = query.get('theme') || 'mist'
  const adminPreviewView = query.get('view') === 'gate' ? 'gate' : 'site'
  const [adminRoute, setAdminRoute] = useState(window.location.hash)
  const isAdmin = [adminHash, adminSystemHash].includes(adminRoute)
  // Visitor auth is memory-only: refresh = re-auth required
  const [visitorAuth, setVisitorAuth] = useState(false)
  const [gateReason, setGateReason] = useState('')
  const [tokenExpiresAt, setTokenExpiresAt] = useState(null)
  const [tokenId, setTokenId] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [plainToken, setPlainToken] = useState(null) // memory-only, for server re-verification
  // Admin auth = the owner's Google account (undefined while Firebase restores the session)
  const [adminUser, setAdminUser] = useState(undefined)
  const adminAuth = !!adminUser && adminUser.email === OWNER_EMAIL
  const [cloudReady, setCloudReady] = useState(!isCloudEnabled)
  // Theme carried by the visitor's token ('' = use the admin-set default)
  const [visitorTheme, setVisitorTheme] = useState('')
  // Admin theme preview: { view: 'site' | 'gate', theme } — renders the real
  // visitor screens under the chosen theme without leaving the admin session
  const [themePreview, setThemePreview] = useState(null)
  const [routePath, setRoutePath] = useState(window.location.pathname)

  const expireVisitorSession = useCallback(() => {
    setVisitorAuth(false)
    setGateReason('expired')
    setTokenId(null)
    setTokenExpiresAt(null)
    setSessionId(null)
    setPlainToken(null)
    setActiveSession(null)
    signOutOwner()
  }, [])

  useEffect(() => {
    const onRouteChange = () => setRoutePath(window.location.pathname)
    window.addEventListener('popstate', onRouteChange)
    return () => window.removeEventListener('popstate', onRouteChange)
  }, [])

  const renderPortfolio = () => {
    const detailMatch = routePath.match(/^\/projects\/([^/]+)\/?$/)
    if (detailMatch) {
      return <><ProjectDetailPage slug={decodeURIComponent(detailMatch[1])} /><ScrollToTop /></>
    }
    if (routePath === '/projects' || routePath === '/projects/') {
      return <><ProjectArchivePage /><ScrollToTop /></>
    }
    return (
      <>
        <Hero />
        <About />
        <Journey />
        <Achievements />
        <Projects />
        <Experience />
        <Resume />
        <Contact />
        <PortfolioRail />
        <ScrollToTop />
      </>
    )
  }

  useEffect(() => {
    const updateSiteTitle = () => {
      document.title = loadHeroConfig().siteTitle?.trim() || '김지윤 | Product Manager'
    }
    updateSiteTitle()
    window.addEventListener('portfolio-site-title-change', updateSiteTitle)
    return () => window.removeEventListener('portfolio-site-title-change', updateSiteTitle)
  }, [cloudReady])

  // One theme per screen: admin console stays on the default design,
  // the gate uses the admin-set entry theme, and an authenticated visitor
  // sees the theme attached to their token.
  useEffect(() => {
    const settings = loadThemeSettings()
    if (isAdminPreviewFrame && adminAuth) applyTheme(adminPreviewTheme)
    else if (themePreview && adminAuth) applyTheme(themePreview.theme)
    else if (isAdmin) applyTheme('default')
    else if (visitorAuth) applyTheme(visitorTheme || settings.defaultVisitorTheme)
    else applyTheme(settings.entryTheme)
  }, [isAdmin, visitorAuth, visitorTheme, cloudReady, themePreview, adminAuth, isAdminPreviewFrame, adminPreviewTheme])

  useEffect(() => watchOwnerAuth((u) => setAdminUser(u ?? null)), [])

  // Enforce token expiry on open tabs: local check every minute,
  // live revocation check (force-expire / revoke / extend) + heartbeat every 5 minutes
  useEffect(() => {
    if (!visitorAuth || !tokenExpiresAt) return
    let tick = 0
    let currentExpiry = tokenExpiresAt
    const kick = expireVisitorSession
    const iv = setInterval(async () => {
      if (Date.now() > currentExpiry) { kick(); return }
      tick++
      // Heartbeat every minute — even short sessions leave a dwell record
      if (sessionId) recordHeartbeat(sessionId)
      // Live revocation check every 5 minutes
      if (tick % 5 !== 0) return
      if (plainToken) {
        // Server-side re-verification (authoritative: revoke / force-expire / extend)
        try {
          const r = await fetch('/api/verify-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: plainToken }),
          })
          if (r.status === 401) { kick(); return }
          if (r.ok) {
            const d = await r.json()
            // Refresh the short-lived visitor claim so Firestore access cannot
            // outlive the server-side token re-verification window.
            if (d.customToken) await signInVisitor(d.customToken)
            if (d.expiresAt !== currentExpiry) { currentExpiry = d.expiresAt; setTokenExpiresAt(d.expiresAt) }
          }
        } catch {
          // Keep the UI session briefly; Firestore rules still expire the
          // visitor claim if server re-verification cannot renew it.
        }
      } else if (tokenId && isCloudEnabled) {
        // Legacy fallback (client-verified sessions)
        const data = await cloudGet('tokens')
        if (data?.items) {
          const t = data.items.find((x) => x.id === tokenId)
          if (!t || t.forceExpired || t.expiresAt <= Date.now()) kick()
          else if (t.expiresAt !== currentExpiry) { currentExpiry = t.expiresAt; setTokenExpiresAt(t.expiresAt) }
        }
      }
    }, 60 * 1000)
    return () => clearInterval(iv)
  }, [visitorAuth, tokenExpiresAt, tokenId, sessionId, plainToken, expireVisitorSession])

  // Detailed action tracking: which sections the visitor actually reached.
  // Flush buffered actions when the tab goes to background (best effort).
  useEffect(() => {
    if (!visitorAuth || !sessionId) return

    const SECTION_IDS = ['about', 'journey', 'achievements', 'projects', 'experience', 'resume', 'contact']
    const seen = new Set()

    // A section counts as "reached" when it spans the vertical middle of the viewport.
    // Scroll-position based — works for sections taller than the screen.
    const check = () => {
      const mid = window.innerHeight / 2
      for (const id of SECTION_IDS) {
        if (seen.has(id)) continue
        const el = document.getElementById(id)
        if (!el) continue
        const r = el.getBoundingClientRect()
        if (r.top <= mid && r.bottom >= mid) {
          seen.add(id)
          trackAction('section', id)
        }
      }
    }
    let last = 0
    const onScroll = () => {
      const n = Date.now()
      if (n - last > 200) { last = n; check() }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    const t = setTimeout(check, 800) // initial position after sections mount

    const onHide = () => { if (document.visibilityState === 'hidden') recordHeartbeat(sessionId) }
    document.addEventListener('visibilitychange', onHide)

    // Track every clickable element (event delegation) — components with
    // richer dedicated tracking opt out via data-no-global-track.
    const onClickCapture = (e) => {
      const el = e.target.closest?.('button, a, [role="button"], .cursor-pointer')
      if (!el || el.closest('[data-no-global-track]')) return
      let label = (el.getAttribute('aria-label') || el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 40)
      if (!label && el.tagName === 'A') label = el.getAttribute('href') || ''
      if (!label) return
      const sec = el.closest('section[id]')?.id
      trackAction('click', sec ? `${label} @${sec}` : label)
    }
    document.addEventListener('click', onClickCapture, true)

    return () => {
      clearTimeout(t)
      window.removeEventListener('scroll', onScroll)
      document.removeEventListener('visibilitychange', onHide)
      document.removeEventListener('click', onClickCapture, true)
    }
  }, [visitorAuth, sessionId])

  useEffect(() => {
    if (!isCloudEnabled) return
    // Wait for Firebase to restore any signed-in session first —
    // otherwise gated docs (access_log 등) would 403 and keep a stale cache.
    let done = false
    const unsub = watchOwnerAuth(() => {
      if (done) return
      done = true
      syncFromCloud().finally(() => setCloudReady(true))
    })
    return unsub
  }, [])

  useEffect(() => {
    const onHash = () => setAdminRoute(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [adminHash, adminSystemHash])

  if (!cloudReady) {
    return <ScreenLoader />
  }

  if (isAdminPreviewFrame) {
    if (adminUser === undefined || !adminAuth) return <ScreenLoader />
    if (adminPreviewView === 'gate') return <AuthGate onSuccess={() => {}} />
    return <div className="t-page min-h-screen bg-gray-950 text-gray-100 font-sans">{renderPortfolio()}<NotebookCursor /></div>
  }

  if (isLocalPreview) {
    return (
      <div className="t-page min-h-screen bg-gray-950 text-gray-100 font-sans">
        <Suspense fallback={<ScreenLoader />}>
          {renderPortfolio()}
          <NotebookCursor />
        </Suspense>
      </div>
    )
  }

  // Admin theme preview: real visitor screens + fixed preview bar
  if (themePreview && adminAuth) {
    const previewSrc = `${window.location.pathname}?admin-preview=1&theme=${encodeURIComponent(themePreview.theme)}&view=${themePreview.view}`
    return (
      <>
        <div className={`theme-preview-stage theme-preview-stage--${themePreview.width || 'desktop'}`}>
          <iframe key={previewSrc} title="방문자 테마 실제 화면" src={previewSrc} />
        </div>
        <ThemePreviewBar preview={themePreview} onChange={setThemePreview} onClose={() => setThemePreview(null)} />
      </>
    )
  }

  if (isAdmin) {
    if (adminUser === undefined) {
      // Firebase is restoring the signed-in session — avoid flashing the login screen
      return <ScreenLoader />
    }
    if (!adminAuth) {
      return <Suspense fallback={<ScreenLoader />}><AdminLogin /></Suspense>
    }
    if (adminRoute === adminSystemHash) {
      return <Suspense fallback={<ScreenLoader />}><AdminDesignSystem onBack={() => { window.location.hash = ADMIN_PATH }} /></Suspense>
    }
    return (
      <Suspense fallback={<ScreenLoader />}>
        <Admin
          onLogout={() => signOutOwner()}
          onViewPortfolio={() => { setVisitorAuth(true); window.location.hash = '' }}
          onPreviewTheme={(view, theme, width = 'desktop') => setThemePreview({ view, theme, width })}
          onOpenDesignSystem={() => { window.location.hash = `${ADMIN_PATH}-system` }}
        />
      </Suspense>
    )
  }

  if (!visitorAuth) {
    return (
      <Suspense fallback={<ScreenLoader />}><AuthGate reason={gateReason}
        onSuccess={(expiresAt, id, sid, plain, theme) => {
          setTokenExpiresAt(expiresAt)
          setTokenId(id || null)
          setSessionId(sid || null)
          setActiveSession(sid || null) // enables immediate action flushing
          setPlainToken(plain || null)
          setVisitorTheme(theme || '')
          setGateReason('')
          setVisitorAuth(true)
        }}
      /></Suspense>
    )
  }

  return (
    <div className="t-page min-h-screen bg-gray-950 text-gray-100 font-sans">
      {Number.isFinite(tokenExpiresAt) && (
        <TokenExpiryBanner expiresAt={tokenExpiresAt} onExpired={expireVisitorSession} />
      )}
      <Suspense fallback={<ScreenLoader />}>
        {renderPortfolio()}
        <NotebookCursor />
      </Suspense>
    </div>
  )
}

export default App
