import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { verifyAccessToken, recordAccess, recordGateVisit, recordSecurityAlert, loadAuthGateConfig, ADMIN_PATH } from '../utils/crypto'
import { signInVisitor } from '../utils/firebase'
import { syncFromCloud } from '../utils/db'

const ALLOW_CLIENT_FALLBACK = import.meta.env.DEV
  && import.meta.env.VITE_ALLOW_CLIENT_TOKEN_FALLBACK === 'true'

// Server-side verification (Vercel function). Returns:
//  { ok, data }         — verified, custom auth token issued
//  { ok:false, invalid} — server checked and rejected the token
//  { ok:false, fallback}— server unavailable/not configured → legacy client check
async function verifyViaServer(token) {
  try {
    const r = await fetch('/api/verify-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    if (r.status === 401) return { ok: false, invalid: true }
    if (!r.ok) return { ok: false, fallback: true }
    return { ok: true, data: await r.json() }
  } catch {
    return { ok: false, fallback: true }
  }
}

export default function AuthGate({ onSuccess }) {
  // Auto-fill token from URL hash (e.g., #token=abc123)
  const hashToken = (() => {
    const h = window.location.hash
    const m = h.match(/[#&]token=([^&]+)/)
    return m ? decodeURIComponent(m[1]) : ''
  })()

  const [token, setToken] = useState(hashToken)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const config = loadAuthGateConfig()

  // Count every visitor who reaches the gate (once per browser session)
  useEffect(() => {
    recordGateVisit()
  }, [])

  // Unified authentication: server first, legacy client check as fallback
  const authenticate = async (raw) => {
    const t = raw.trim()
    const server = await verifyViaServer(t)
    if (server.ok) {
      try {
        await signInVisitor(server.data.customToken)
      } catch {
        return { error: '인증 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.' }
      }
      await syncFromCloud() // content reads are now permitted — pull it
      const sid = recordAccess(server.data.id, server.data.label, t)
      return { result: { id: server.data.id, expiresAt: server.data.expiresAt, sid, plainToken: t, theme: server.data.theme || '' } }
    }
    if (server.invalid) {
      recordSecurityAlert('token_fail', `${t.slice(0, 4)}…(${t.length}자)`)
      return { error: 'Invalid or expired access token.' }
    }
    // Legacy verification is opt-in for local development only. Production
    // must fail closed when the authoritative server cannot be reached.
    if (ALLOW_CLIENT_FALLBACK) {
      const result = await verifyAccessToken(t)
      if (result) {
        const sid = recordAccess(result.id, result.label, t)
        return { result: { id: result.id, expiresAt: result.expiresAt, sid, plainToken: t, theme: result.theme || '' } }
      }
      recordSecurityAlert('token_fail', `${t.slice(0, 4)}…(${t.length}자)`)
      return { error: 'Invalid or expired access token.' }
    }
    return { error: 'Authentication service is temporarily unavailable. Please try again shortly.' }
  }

  // Auto-submit if token came from URL
  useEffect(() => {
    if (hashToken) {
      authenticate(hashToken).then((r) => {
        if (r.result) {
          window.location.hash = ''
          onSuccess(r.result.expiresAt, r.result.id, r.result.sid, r.result.plainToken, r.result.theme)
        }
      })
    }
  // The URL token is intentionally consumed only once on initial mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!token.trim()) return
    setLoading(true)
    setError('')

    await new Promise((r) => setTimeout(r, 300))

    if (token.trim().toLowerCase() === '#admin') {
      window.location.hash = ADMIN_PATH
      setLoading(false)
      return
    }

    const r = await authenticate(token)
    if (r.result) {
      onSuccess(r.result.expiresAt, r.result.id, r.result.sid, r.result.plainToken, r.result.theme)
    } else {
      setError(r.error)
    }
    setLoading(false)
  }

  const headlineParts = config.headline.split('\n')

  return (
    <div className="t-gate relative min-h-screen bg-gray-950 flex flex-col items-center justify-center px-6 text-center overflow-hidden">
      {/* Background gradient */}
      <div className="gate-backdrop absolute inset-0 bg-gradient-to-b from-accent/10 via-transparent to-transparent pointer-events-none" />
      <div className="gate-backdrop absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/3 rounded-full blur-3xl" />
      </div>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="admin-copy gate-eyebrow relative text-accent text-sm md:text-base font-medium tracking-wider uppercase mb-6"
      >
        {config.tagline}
      </motion.p>

      {/* Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="gate-title relative text-2xl md:text-4xl lg:text-5xl font-bold leading-tight max-w-4xl"
      >
        {headlineParts.length > 1 ? (
          <>
            <span className="gate-title__line">{headlineParts[0]}</span>
            <span className="gate-title__line gate-title__line--accent">{headlineParts.slice(1).join('\n')}</span>
          </>
        ) : (
          config.headline
        )}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="admin-copy gate-deck relative mt-4 text-gray-400 text-sm md:text-base max-w-2xl"
      >
        {config.subtitle}
      </motion.p>

      {/* Auth Card - input only */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="gate-panel relative w-full max-w-md mt-12"
      >
        <div className="gate-card t-card bg-gray-900/60 backdrop-blur-xl rounded-2xl p-8 border border-gray-800/60 shadow-2xl">
          <form onSubmit={handleSubmit} className="gate-form space-y-4">
            <input
              type="text"
              value={token}
              onChange={(e) => { setToken(e.target.value); setError('') }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.nativeEvent.isComposing) { e.preventDefault(); handleSubmit(e) } }}
              placeholder="Enter access token"
              autoFocus
              spellCheck={false}
              autoComplete="off"
              className="w-full bg-gray-800/80 border border-gray-700/60 rounded-xl px-4 py-3.5 text-white text-center tracking-widest font-mono focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 placeholder:text-gray-600 placeholder:tracking-normal placeholder:font-sans transition-colors"
            />

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-400 text-sm text-center"
              >
                {error}
              </motion.p>
            )}

            <motion.button
              type="submit"
              disabled={loading || !token.trim()}
              className="w-full py-3.5 bg-accent hover:bg-accent-light disabled:bg-gray-700 disabled:text-gray-500 text-white font-medium rounded-xl transition-colors cursor-pointer"
            >
              {loading ? 'Verifying...' : config.buttonText}
            </motion.button>
          </form>
        </div>

        {/* Contact info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="gate-contact mt-6 text-center space-y-2"
        >
          <p className="admin-copy text-gray-500 text-sm">
            {config.contactMessage}
          </p>
          <div className="gate-contact__channel">
            <a
              href={`mailto:${config.contactEmail}?subject=Portfolio Access Token Request`}
              className="inline-flex items-center gap-2 text-accent hover:text-accent-light text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>
              {config.contactEmail}
            </a>
            <p className="admin-copy text-gray-600 text-xs">{config.contactHint}</p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
