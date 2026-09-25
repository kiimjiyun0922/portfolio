import { lazy, Suspense, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { recordHeartbeat, trackAction, setActiveSession, loadThemeSettings, loadHeroConfig, ADMIN_PATH } from './utils/crypto'
import { applyTheme, THEMES } from './themes'

const Admin = lazy(() => import('./components/Admin'))
const FrontDesignSystem = lazy(() => import('./components/FrontDesignSystem'))
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

// Fixed-color bar (independent of the active theme) shown while the admin
// previews a theme on the real visitor screens.
function ThemePreviewBar({ preview, onChange, onClose }) {
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[110] flex flex-wrap items-center justify-center gap-2 px-3 py-2 rounded-2xl sm:rounded-full bg-[#10141b]/95 border border-[#2c3442] shadow-2xl backdrop-blur-md max-w-[calc(100vw-2rem)]">
      <span className="text-[11px] font-semibold text-[#8b95a5] pl-1 whitespace-nowrap">미리보기</span>
      <select
        value={preview.theme}
        onChange={(e) => onChange({ ...preview, theme: e.target.value })}
        className="bg-[#1b2230] text-[#e6e9ef] text-xs rounded-full px-2.5 py-1.5 border border-[#2c3442] focus:outline-none cursor-pointer max-w-40"
      >
        {THEMES.map((th) => <option key={th.id} value={th.id}>{th.name}</option>)}
      </select>
      <div className="flex shrink-0 rounded-full overflow-hidden border border-[#2c3442]">
        <button
          onClick={() => onChange({ ...preview, view: 'site' })}
          className={`px-2.5 py-1.5 text-[11px] whitespace-nowrap cursor-pointer ${preview.view === 'site' ? 'bg-[#0064FF] text-white font-semibold' : 'bg-[#1b2230] text-[#8b95a5]'}`}
        >포트폴리오</button>
        <button
          onClick={() => onChange({ ...preview, view: 'gate' })}
          className={`px-2.5 py-1.5 text-[11px] whitespace-nowrap cursor-pointer ${preview.view === 'gate' ? 'bg-[#0064FF] text-white font-semibold' : 'bg-[#1b2230] text-[#8b95a5]'}`}
        >진입 화면</button>
      </div>
      <button
        onClick={onClose}
        className="px-3 py-1.5 text-[11px] font-semibold text-white bg-[#2c3442] hover:bg-[#3a465a] rounded-full cursor-pointer whitespace-nowrap"
      >어드민으로</button>
    </div>
  )
}
import { syncFromCloud, isCloudEnabled, cloudGet } from './utils/db'
import { watchOwnerAuth, signInVisitor, signOutOwner, OWNER_EMAIL } from './utils/firebase'

function TokenExpiryBanner({ expiresAt }) {
  const [visible, setVisible] = useState(true)
  const [now] = useState(Date.now)

  if (!expiresAt || !visible) return null

  const expiryDate = new Date(expiresAt)
  const diffMs = expiresAt - now
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

  let remaining
  if (diffDays > 0) {
    remaining = `${diffDays}d ${diffHours}h`
  } else if (diffHours > 0) {
    remaining = `${diffHours}h`
  } else {
    const diffMin = Math.max(1, Math.floor(diffMs / (1000 * 60)))
    remaining = `${diffMin}m`
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -40, opacity: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-3 px-4 py-2.5 bg-gray-900/90 backdrop-blur-md border-b border-gray-800/60 text-sm"
      >
        <svg className="w-4 h-4 text-accent shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
        <span className="text-gray-400">
          Access expires: <span className="text-white font-medium">{expiryDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          <span className="text-accent ml-1.5">({remaining} left)</span>
        </span>
        <button
          onClick={() => setVisible(false)}
          className="text-gray-600 hover:text-gray-300 ml-1 cursor-pointer"
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
  const isLocalPreview = import.meta.env.DEV && new URLSearchParams(window.location.search).has('preview')
  const [adminRoute, setAdminRoute] = useState(window.location.hash)
  const isAdmin = [adminHash, adminSystemHash].includes(adminRoute)
  // Visitor auth is memory-only: refresh = re-auth required
  const [visitorAuth, setVisitorAuth] = useState(false)
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
    if (themePreview && adminAuth) applyTheme(themePreview.theme)
    else if (isAdmin) applyTheme('default')
    else if (visitorAuth) applyTheme(visitorTheme || settings.defaultVisitorTheme)
    else applyTheme(settings.entryTheme)
  }, [isAdmin, visitorAuth, visitorTheme, cloudReady, themePreview, adminAuth])

  useEffect(() => watchOwnerAuth((u) => setAdminUser(u ?? null)), [])

  // Enforce token expiry on open tabs: local check every minute,
  // live revocation check (force-expire / revoke / extend) + heartbeat every 5 minutes
  useEffect(() => {
    if (!visitorAuth || !tokenExpiresAt) return
    let tick = 0
    let currentExpiry = tokenExpiresAt
    const kick = () => {
      setVisitorAuth(false); setTokenId(null); setTokenExpiresAt(null); setSessionId(null); setPlainToken(null)
      setActiveSession(null)
      signOutOwner() // end the visitor's Firebase session so content reads are locked again
    }
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
  }, [visitorAuth, tokenExpiresAt, tokenId, sessionId, plainToken])

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
    return (
      <>
        {themePreview.view === 'gate' ? (
          <AuthGate onSuccess={() => {}} />
        ) : (
          <div className="t-page min-h-screen bg-gray-950 text-gray-100 font-sans">
            {renderPortfolio()}
            <NotebookCursor />
          </div>
        )}
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
      return <Suspense fallback={<ScreenLoader />}><FrontDesignSystem onBack={() => { window.location.hash = ADMIN_PATH }} /></Suspense>
    }
    return (
      <Suspense fallback={<ScreenLoader />}>
        <Admin
          onLogout={() => signOutOwner()}
          onViewPortfolio={() => { setVisitorAuth(true); window.location.hash = '' }}
          onPreviewTheme={(view, theme) => setThemePreview({ view, theme })}
          onOpenDesignSystem={() => { window.location.hash = `${ADMIN_PATH}-system` }}
        />
      </Suspense>
    )
  }

  if (!visitorAuth) {
    return (
      <Suspense fallback={<ScreenLoader />}><AuthGate
        onSuccess={(expiresAt, id, sid, plain, theme) => {
          setTokenExpiresAt(expiresAt)
          setTokenId(id || null)
          setSessionId(sid || null)
          setActiveSession(sid || null) // enables immediate action flushing
          setPlainToken(plain || null)
          setVisitorTheme(theme || '')
          setVisitorAuth(true)
        }}
      /></Suspense>
    )
  }

  return (
    <div className="t-page min-h-screen bg-gray-950 text-gray-100 font-sans">
      <TokenExpiryBanner expiresAt={tokenExpiresAt} />
      <Suspense fallback={<ScreenLoader />}>
        {renderPortfolio()}
        <NotebookCursor />
      </Suspense>
    </div>
  )
}

export default App
