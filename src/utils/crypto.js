import { cloudSet, cloudDelete, cloudSaveSnapshot, cloudDeleteAccessSession, cloudClearAccessSessions } from './db'
import { SITE } from '../site.config'
import { sampleAbout, sampleAchievements, sampleJourney, sampleResume } from '../data/sampleContent'

const ADMIN_KEY = 'portfolio_admin_hash'
const TOKENS_KEY = 'portfolio_access_tokens'
const ADMIN_SESSION_KEY = 'portfolio_admin_session'
const ACCESS_LOG_KEY = 'portfolio_access_log'
const HERO_KEY = 'portfolio_hero_config'
const TAXONOMY_KEY = 'portfolio_taxonomy_config'

// --- PBKDF2 helpers (Web Crypto API) ---

async function deriveKey(password, salt) {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: enc.encode(salt), iterations: 310000, hash: 'SHA-256' },
    keyMaterial,
    256,
  )
  return Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function generateSalt() {
  const buf = new Uint8Array(32)
  crypto.getRandomValues(buf)
  return Array.from(buf).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function generateToken() {
  const buf = new Uint8Array(24)
  crypto.getRandomValues(buf)
  return Array.from(buf).map((b) => b.toString(16).padStart(2, '0')).join('')
}

function generateSessionId() {
  return generateToken()
}

// --- Admin Passcode ---

// Build-time embedded credentials (from .env)
const ENV_SALT = import.meta.env.VITE_ADMIN_SALT || ''
const ENV_HASH = import.meta.env.VITE_ADMIN_HASH || ''
const hasEnvAdmin = !!(ENV_SALT && ENV_HASH)

export function isAdminSetup() {
  if (hasEnvAdmin) return true
  return !!localStorage.getItem(ADMIN_KEY)
}

export function isEnvAdmin() {
  return hasEnvAdmin
}

// Admin URL path — derived from hash to prevent guessing
export const ADMIN_PATH = import.meta.env.VITE_ADMIN_PATH || (ENV_HASH ? ENV_HASH.slice(0, 12) : 'admin')

export async function setupAdminPasscode(passcode) {
  const salt = generateSalt()
  const hash = await deriveKey(passcode, salt)
  localStorage.setItem(ADMIN_KEY, JSON.stringify({ salt, hash }))
}

export async function verifyAdminPasscode(passcode) {
  // Check env-embedded credentials first
  if (hasEnvAdmin) {
    const attempt = await deriveKey(passcode, ENV_SALT)
    if (attempt === ENV_HASH) return true
  }
  // Fallback to localStorage
  const stored = localStorage.getItem(ADMIN_KEY)
  if (!stored) return false
  const { salt, hash } = JSON.parse(stored)
  const attempt = await deriveKey(passcode, salt)
  return attempt === hash
}

export function createAdminSession() {
  const id = generateSessionId()
  const expires = Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify({ id, expires }))
}

export function isAdminSessionValid() {
  const raw = localStorage.getItem(ADMIN_SESSION_KEY)
  if (!raw) return false
  const { expires } = JSON.parse(raw)
  if (Date.now() > expires) {
    localStorage.removeItem(ADMIN_SESSION_KEY)
    return false
  }
  return true
}

export function clearAdminSession() {
  localStorage.removeItem(ADMIN_SESSION_KEY)
}

export function resetAdminPasscode() {
  localStorage.removeItem(ADMIN_KEY)
  localStorage.removeItem(ADMIN_SESSION_KEY)
}

// --- Visitor Access Tokens ---

export function getAccessTokens() {
  try {
    const raw = localStorage.getItem(TOKENS_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

function saveAccessTokens(tokens) {
  localStorage.setItem(TOKENS_KEY, JSON.stringify(tokens))
  cloudSet('tokens', { items: tokens })
}

async function sha256Hex(str) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str))
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function createAccessToken(label, expiresAt, theme = 'mist') {
  // Tokens are stored as SHA-256 hashes — the plaintext is returned once for copying
  // and can never be recovered from Firestore afterwards.
  const token = generateToken()
  const tokenHash = await sha256Hex(token)
  const tokens = getAccessTokens()
  tokens.push({
    id: crypto.randomUUID(),
    label,
    tokenHash,
    tokenHint: `${token.slice(0, 4)}…${token.slice(-4)}`,
    createdAt: Date.now(),
    expiresAt: new Date(expiresAt).getTime(),
    forceExpired: false,
    theme,
  })
  saveAccessTokens(tokens)
  return token
}

export function setAccessTokenTheme(id, theme) {
  const tokens = getAccessTokens().map((t) =>
    t.id === id ? { ...t, theme } : t,
  )
  saveAccessTokens(tokens)
}

export function renameAccessToken(id, newLabel) {
  const tokens = getAccessTokens().map((t) =>
    t.id === id ? { ...t, label: newLabel } : t,
  )
  saveAccessTokens(tokens)
}

export function revokeAccessToken(id) {
  // Revoke = the secret material is deleted outright (can never verify again);
  // only identifying metadata (label, hint, dates) is kept for the audit trail.
  const tokens = getAccessTokens().map((t) => {
    if (t.id !== id) return t
    const { token, tokenHash: _tokenHash, ...meta } = t
    return {
      ...meta,
      tokenHint: t.tokenHint || (token ? `${token.slice(0, 4)}…${token.slice(-4)}` : ''),
      revoked: true,
      revokedAt: Date.now(),
    }
  })
  saveAccessTokens(tokens)
}

export function deleteAccessToken(id) {
  // Hard delete — removes the record entirely
  const tokens = getAccessTokens().filter((t) => t.id !== id)
  saveAccessTokens(tokens)
}

export function forceExpireToken(id) {
  const tokens = getAccessTokens().map((t) =>
    t.id === id ? { ...t, forceExpired: true } : t,
  )
  saveAccessTokens(tokens)
}

export function extendAccessToken(id, addDays) {
  // Extends from current expiry if still active, from now if already expired.
  // Re-activates force-expired tokens and appends to the extension history.
  const now = Date.now()
  const tokens = getAccessTokens().map((t) => {
    if (t.id !== id) return t
    const base = Math.max(t.expiresAt, now)
    const newExpiresAt = base + addDays * 24 * 60 * 60 * 1000
    const extensions = [...(t.extensions || []), { at: now, from: t.expiresAt, to: newExpiresAt, addDays }]
    return { ...t, expiresAt: newExpiresAt, forceExpired: false, extensions }
  })
  saveAccessTokens(tokens)
}

export async function verifyAccessToken(input) {
  const tokens = getAccessTokens()
  const now = Date.now()
  const hash = await sha256Hex(input)
  const match = tokens.find(
    (t) =>
      (t.tokenHash ? t.tokenHash === hash : t.token === input) && // legacy plaintext tokens still verify
      t.expiresAt > now &&
      !t.forceExpired &&
      !t.revoked,
  )
  if (!match) return null
  return { id: match.id, label: match.label, expiresAt: match.expiresAt, theme: match.theme }
}

// --- Access Log ---

export function getAccessLog() {
  try {
    const raw = localStorage.getItem(ACCESS_LOG_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

function saveAccessLog(log) {
  localStorage.setItem(ACCESS_LOG_KEY, JSON.stringify(log))
}

let activeAnalyticsToken = null

async function syncAccessSession(session) {
  if (!activeAnalyticsToken || !session) return
  try {
    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: activeAnalyticsToken, session }),
      keepalive: true,
    })
  } catch {
    // Analytics must never interrupt the portfolio experience.
  }
}

export function recordAccess(tokenId, tokenLabel, plaintextToken = '') {
  // Owner's own browser is excluded from access stats
  if (isOwnerBrowser()) return null
  const sessionId = crypto.randomUUID()
  const log = getAccessLog()
  activeAnalyticsToken = plaintextToken || null
  const session = {
    tokenId,
    tokenLabel,
    sessionId,
    accessedAt: Date.now(),
    lastSeenAt: Date.now(),
    userAgent: navigator.userAgent,
    language: navigator.language,
  }
  log.push(session)
  saveAccessLog(log)
  void syncAccessSession(session)
  return sessionId
}

// Detailed action tracking: buffered in memory, flushed a few seconds after
// the last action (so short visits persist too) and with each heartbeat.
let pendingActions = []
let activeSessionId = null
let flushTimer = null

export function setActiveSession(sid) {
  activeSessionId = sid || null
  if (!sid) activeAnalyticsToken = null
}

export function trackAction(kind, target) {
  // kind: 'section' | 'tab' | 'journey'
  if (isOwnerBrowser()) return
  pendingActions.push({ t: Date.now(), kind, target: String(target).slice(0, 60) })
  if (pendingActions.length > 60) pendingActions = pendingActions.slice(-60)
  // Debounced flush — a quick look-and-close visit still leaves its trail
  if (activeSessionId) {
    clearTimeout(flushTimer)
    flushTimer = setTimeout(() => recordHeartbeat(activeSessionId), 4000)
  }
}

export function recordHeartbeat(sessionId) {
  // Keeps lastSeenAt fresh while the visitor keeps the page open → 체류 시간·현재 열람 중 추적
  // Also drains buffered actions into the session entry (capped at 50 per session).
  if (!sessionId || isOwnerBrowser()) return
  const log = getAccessLog()
  const idx = log.findIndex((e) => e.sessionId === sessionId)
  if (idx === -1) return
  const actions = [...(log[idx].actions || []), ...pendingActions].slice(-50)
  pendingActions = []
  log[idx] = { ...log[idx], lastSeenAt: Date.now(), actions }
  saveAccessLog(log)
  void syncAccessSession(log[idx])
}

export function getAccessLogForToken(tokenId) {
  return getAccessLog().filter((entry) => entry.tokenId === tokenId)
}

export function clearAccessLog() {
  localStorage.setItem(ACCESS_LOG_KEY, JSON.stringify([]))
  void cloudClearAccessSessions()
}

export function removeAccessLogEntry(accessedAt) {
  const log = getAccessLog()
  const target = log.find((e) => e.accessedAt === accessedAt)
  saveAccessLog(log.filter((e) => e.accessedAt !== accessedAt))
  if (target?.sessionId) void cloudDeleteAccessSession(target.sessionId)
}

// --- Owner Browser Marker (exclude the site owner from visit stats) ---

const OWNER_KEY = 'portfolio_is_owner'

export function markOwnerBrowser() {
  try { localStorage.setItem(OWNER_KEY, '1') } catch {}
}

export function isOwnerBrowser() {
  try { return localStorage.getItem(OWNER_KEY) === '1' } catch { return false }
}

// --- Gate Visit Log (visitors who reached the auth gate, incl. non-authenticated) ---

const GATE_LOG_KEY = 'portfolio_gate_log'

export function getGateLog() {
  try {
    const raw = localStorage.getItem(GATE_LOG_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

function saveGateLog(log) {
  localStorage.setItem(GATE_LOG_KEY, JSON.stringify(log))
  cloudSet('gate_log', { items: log })
}

export function removeGateLogEntry(visitedAt) {
  saveGateLog(getGateLog().filter((e) => e.visitedAt !== visitedAt))
}

export function clearGateLog() {
  saveGateLog([])
}

export function recordGateVisit() {
  // Owner's own browser is excluded from visit stats
  if (isOwnerBrowser()) return
  // Headless browsers / crawlers (Vercel deploy capture, search bots) are not visitors
  if (/HeadlessChrome|bot|crawler|spider|slurp|preview/i.test(navigator.userAgent)) return
  // One record per browser session — reloads on the gate screen don't inflate counts
  try {
    if (sessionStorage.getItem('portfolio_gate_visited')) return
    sessionStorage.setItem('portfolio_gate_visited', '1')
  } catch {}
  const log = getGateLog()
  log.push({
    visitedAt: Date.now(),
    userAgent: navigator.userAgent,
    language: navigator.language,
    referrer: document.referrer || '',
  })
  const capped = log.slice(-500)
  localStorage.setItem(GATE_LOG_KEY, JSON.stringify(capped))
  cloudSet('gate_log', { items: capped })
}

// --- Email Alert (EmailJS) ---

const EMAILJS_SERVICE = SITE.emailjs.service
const EMAILJS_TEMPLATE = SITE.emailjs.template
const EMAILJS_PUBLIC_KEY = SITE.emailjs.publicKey
const ALERT_EMAIL_COOLDOWN_KEY = 'portfolio_alert_email_last'
const ALERT_EMAIL_COOLDOWN = 10 * 60 * 1000 // same browser: max 1 email per 10 min

function uaSummary() {
  const ua = navigator.userAgent
  const browser = ua.includes('Edg') ? 'Edge' : ua.includes('Chrome') ? 'Chrome' : ua.includes('Safari') ? 'Safari' : ua.includes('Firefox') ? 'Firefox' : '기타'
  const os = ua.includes('Windows') ? 'Windows' : ua.includes('Mac') ? 'macOS' : ua.includes('Android') ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : '기타'
  return `${browser} · ${os} · ${navigator.language}`
}

async function sendAlertEmail(alertType, detail) {
  if (!EMAILJS_SERVICE) return // 알림 이메일 미설정 (site.config.js)
  try {
    const last = parseInt(localStorage.getItem(ALERT_EMAIL_COOLDOWN_KEY) || '0', 10)
    if (Date.now() - last < ALERT_EMAIL_COOLDOWN) return
    localStorage.setItem(ALERT_EMAIL_COOLDOWN_KEY, String(Date.now()))
    await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE,
        template_id: EMAILJS_TEMPLATE,
        user_id: EMAILJS_PUBLIC_KEY,
        template_params: {
          alert_type: alertType,
          detail: detail || '—',
          time: new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }),
          browser: uaSummary(),
        },
      }),
    })
  } catch {}
}

// --- Security Alert Log (failed token attempts, failed admin logins) ---

const ALERT_LOG_KEY = 'portfolio_alert_log'

export function getAlertLog() {
  try {
    const raw = localStorage.getItem(ALERT_LOG_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return []
}

function saveAlertLog(log) {
  localStorage.setItem(ALERT_LOG_KEY, JSON.stringify(log))
  cloudSet('alert_log', { items: log })
}

export function removeAlertLogEntry(at) {
  saveAlertLog(getAlertLog().filter((e) => e.at !== at))
}

export function clearAlertLog() {
  saveAlertLog([])
}

const ALERT_TYPE_LABEL = {
  token_fail: '잘못된 토큰 입력 시도',
  admin_fail: '어드민 로그인 실패',
}

export function recordSecurityAlert(type, detail = '') {
  // Owner's own browser (admin logged-in) is excluded — typos aren't threats
  if (isOwnerBrowser()) return
  const log = getAlertLog()
  log.push({
    type, // 'token_fail' | 'admin_fail'
    detail,
    at: Date.now(),
    userAgent: navigator.userAgent,
    language: navigator.language,
  })
  const capped = log.slice(-200)
  localStorage.setItem(ALERT_LOG_KEY, JSON.stringify(capped))
  cloudSet('alert_log', { items: capped })
  sendAlertEmail(ALERT_TYPE_LABEL[type] || type, detail) // fire-and-forget
}

// --- AuthGate Config ---

const AUTH_GATE_KEY = 'portfolio_authgate_config'

const defaultAuthGateConfig = {
  tagline: 'PM Portfolio',
  headline: 'Data-driven decisions,\nUser-centric design',
  subtitle: 'A product manager who drives growth through data-driven decisions and user-centric design',
  cardTitle: 'Enter Access Code',
  cardDescription: 'Authentication is required to view the portfolio',
  buttonText: 'View Portfolio',
  contactEmail: SITE.contactEmail,
  contactMessage: "Don't have an access code?",
  contactHint: 'Request one via the email above',
}

export function loadAuthGateConfig() {
  try {
    const raw = localStorage.getItem(AUTH_GATE_KEY)
    if (raw) return { ...defaultAuthGateConfig, ...JSON.parse(raw) }
  } catch {}
  return defaultAuthGateConfig
}

export function saveAuthGateConfig(config) {
  localStorage.setItem(AUTH_GATE_KEY, JSON.stringify(config))
  cloudSet('authgate', config)
  cloudSaveSnapshot('authgate', config)
}

export function resetAuthGateConfig() {
  localStorage.removeItem(AUTH_GATE_KEY)
  cloudDelete('authgate')
  return defaultAuthGateConfig
}

// --- Theme Settings ---
// entryTheme: the theme of the access-gate screen (seen before authentication)
// defaultVisitorTheme: applied when a token has no theme of its own

const THEME_SETTINGS_KEY = 'portfolio_theme_settings'

const defaultThemeSettings = {
  entryTheme: 'mist',
  defaultVisitorTheme: 'mist',
}

export function loadThemeSettings() {
  try {
    const raw = localStorage.getItem(THEME_SETTINGS_KEY)
    if (raw) return { ...defaultThemeSettings, ...JSON.parse(raw) }
  } catch {}
  return defaultThemeSettings
}

export function saveThemeSettings(config) {
  localStorage.setItem(THEME_SETTINGS_KEY, JSON.stringify(config))
  cloudSet('theme_settings', config)
  cloudSaveSnapshot('theme_settings', config)
}

export function resetThemeSettings() {
  localStorage.removeItem(THEME_SETTINGS_KEY)
  cloudDelete('theme_settings')
  return defaultThemeSettings
}

// --- Content taxonomy ---

export const defaultTaxonomyConfig = {
  categories: [
    { key: 'default', label: '기본', color: '#6b7280' },
    { key: 'ai', label: 'AI', color: '#34d399' },
    { key: 'data', label: '데이터', color: '#60a5fa' },
    { key: 'ux', label: 'UX', color: '#f472b6' },
    { key: 'ops', label: '운영', color: '#fbbf24' },
  ],
}

export function loadTaxonomyConfig() {
  try {
    const raw = localStorage.getItem(TAXONOMY_KEY)
    if (raw) return { ...defaultTaxonomyConfig, ...JSON.parse(raw) }
  } catch {}
  return defaultTaxonomyConfig
}

export function saveTaxonomyConfig(config) {
  localStorage.setItem(TAXONOMY_KEY, JSON.stringify(config))
  cloudSet('taxonomy', config)
  cloudSaveSnapshot('taxonomy', config)
}

export function resetTaxonomyConfig() {
  localStorage.removeItem(TAXONOMY_KEY)
  cloudDelete('taxonomy')
  return defaultTaxonomyConfig
}

// --- Resume Config ---

const RESUME_KEY = 'portfolio_resume_config'

// 설치 직후 데모용 샘플 (src/data/sampleContent.js). 어드민에서 저장하면
// Firestore 데이터가 우선합니다.
export const defaultResumeConfig = sampleResume

export function loadResumeConfig() {
  try {
    const raw = localStorage.getItem(RESUME_KEY)
    if (raw) return { ...defaultResumeConfig, ...JSON.parse(raw) }
  } catch {}
  return defaultResumeConfig
}

export function saveResumeConfig(config) {
  localStorage.setItem(RESUME_KEY, JSON.stringify(config))
  cloudSet('resume', config)
  cloudSaveSnapshot('resume', config)
}

export function resetResumeConfig() {
  localStorage.removeItem(RESUME_KEY)
  cloudDelete('resume')
  return defaultResumeConfig
}

// --- Hero Config ---

const defaultHeroConfig = {
  siteTitle: '김지윤 | Product Manager',
  tagline: 'PM Portfolio',
  headline: 'Data-driven decisions,\nUser-centric design',
  subtitle: 'A product manager who drives growth through data-driven decisions and user-centric design',
  ctaText: 'View Cases',
}

export function loadHeroConfig() {
  try {
    const raw = localStorage.getItem(HERO_KEY)
    if (raw) return { ...defaultHeroConfig, ...JSON.parse(raw) }
  } catch {}
  return defaultHeroConfig
}

export function saveHeroConfig(config) {
  localStorage.setItem(HERO_KEY, JSON.stringify(config))
  cloudSet('hero', config)
  cloudSaveSnapshot('hero', config)
  window.dispatchEvent(new CustomEvent('portfolio-site-title-change'))
}

export function resetHeroConfig() {
  localStorage.removeItem(HERO_KEY)
  cloudDelete('hero')
  window.dispatchEvent(new CustomEvent('portfolio-site-title-change'))
  return defaultHeroConfig
}

// --- About Config ---

const ABOUT_KEY = 'portfolio_about_config'

const defaultAboutConfig = sampleAbout

export function loadAboutConfig() {
  try {
    const raw = localStorage.getItem(ABOUT_KEY)
    if (raw) return { ...defaultAboutConfig, ...JSON.parse(raw) }
  } catch {}
  return defaultAboutConfig
}

export function saveAboutConfig(config) {
  localStorage.setItem(ABOUT_KEY, JSON.stringify(config))
  cloudSet('about', config)
  cloudSaveSnapshot('about', config)
}

export function resetAboutConfig() {
  localStorage.removeItem(ABOUT_KEY)
  cloudDelete('about')
  return defaultAboutConfig
}

// --- Achievements Config ---

const ACHIEVEMENTS_KEY = 'portfolio_achievements_config'

const defaultAchievementsConfig = sampleAchievements

export function loadAchievementsConfig() {
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_KEY)
    if (raw) return { ...defaultAchievementsConfig, ...JSON.parse(raw) }
  } catch {}
  return defaultAchievementsConfig
}

export function saveAchievementsConfig(config) {
  localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(config))
  cloudSet('achievements', config)
  cloudSaveSnapshot('achievements', config)
}

export function resetAchievementsConfig() {
  localStorage.removeItem(ACHIEVEMENTS_KEY)
  cloudDelete('achievements')
  return defaultAchievementsConfig
}

// --- Journey Config ---

const JOURNEY_KEY = 'portfolio_journey_config'

const defaultJourneyConfig = sampleJourney

export function loadJourneyConfig() {
  try {
    const raw = localStorage.getItem(JOURNEY_KEY)
    if (raw) return { ...defaultJourneyConfig, ...JSON.parse(raw) }
  } catch {}
  return defaultJourneyConfig
}

export function saveJourneyConfig(config) {
  localStorage.setItem(JOURNEY_KEY, JSON.stringify(config))
  cloudSet('journey', config)
  cloudSaveSnapshot('journey', config)
}

export function resetJourneyConfig() {
  localStorage.removeItem(JOURNEY_KEY)
  cloudDelete('journey')
  return defaultJourneyConfig
}

export { defaultJourneyConfig }

// --- Contact Config ---

const CONTACT_KEY = 'portfolio_contact_config'

const defaultContactConfig = {
  heading: 'Contact',
  message: "Interested in working together? Let's connect.",
  email: 'hello@example.com',
  linkedinUrl: 'https://linkedin.com/in/',
  linkedinLabel: 'LinkedIn',
  copyright: '© 2026. All rights reserved.',
}

export function loadContactConfig() {
  try {
    const raw = localStorage.getItem(CONTACT_KEY)
    if (raw) return { ...defaultContactConfig, ...JSON.parse(raw) }
  } catch {}
  return defaultContactConfig
}

export function saveContactConfig(config) {
  localStorage.setItem(CONTACT_KEY, JSON.stringify(config))
  cloudSet('contact', config)
  cloudSaveSnapshot('contact', config)
}

export function resetContactConfig() {
  localStorage.removeItem(CONTACT_KEY)
  cloudDelete('contact')
  return defaultContactConfig
}
