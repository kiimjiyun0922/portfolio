import { db, hasConfig } from './firebase'
import { doc, getDoc, setDoc, deleteDoc, collection, getDocs } from 'firebase/firestore'

const COLLECTION = 'site'
const ACCESS_LOG_KEY = 'portfolio_access_log'

async function syncAccessSessions() {
  if (!db) return { docId: 'access_log', found: false }
  try {
    const snaps = await getDocs(collection(db, COLLECTION, 'access_log', 'sessions'))
    const sessions = snaps.docs.map((item) => item.data()).sort((a, b) => (b.accessedAt || 0) - (a.accessedAt || 0))
    localStorage.setItem(ACCESS_LOG_KEY, JSON.stringify(sessions))
    return { docId: 'access_log', found: sessions.length > 0 }
  } catch (e) {
    console.warn('[Firestore] access sessions read failed:', e)
    return { docId: 'access_log', found: false }
  }
}

export async function cloudDeleteAccessSession(sessionId) {
  if (!db || !sessionId) return
  try {
    await deleteDoc(doc(db, COLLECTION, 'access_log', 'sessions', sessionId))
  } catch (e) {
    console.warn('[Firestore] access session delete failed:', e)
  }
}

export async function cloudClearAccessSessions() {
  if (!db) return
  try {
    const snaps = await getDocs(collection(db, COLLECTION, 'access_log', 'sessions'))
    await Promise.all(snaps.docs.map((item) => deleteDoc(item.ref)))
  } catch (e) {
    console.warn('[Firestore] access sessions clear failed:', e)
  }
}

// --- Low-level Firestore helpers ---

export async function cloudGet(docId) {
  if (!db) return null
  try {
    const snap = await getDoc(doc(db, COLLECTION, docId))
    return snap.exists() ? snap.data() : null
  } catch (e) {
    console.warn('[Firestore] read failed:', docId, e)
    return null
  }
}

export async function cloudSet(docId, data) {
  if (!db) return
  try {
    await setDoc(doc(db, COLLECTION, docId), data)
  } catch (e) {
    console.warn('[Firestore] write failed:', docId, e)
  }
}

export async function cloudDelete(docId) {
  if (!db) return
  try {
    await deleteDoc(doc(db, COLLECTION, docId))
  } catch (e) {
    console.warn('[Firestore] delete failed:', docId, e)
  }
}

// --- Version History (site/{doc}/history/{timestamp}) — owner-only via rules ---

const HISTORY_KEEP = 10

export async function cloudSaveSnapshot(docId, data) {
  if (!db) return
  try {
    const at = Date.now()
    await setDoc(doc(db, COLLECTION, docId, 'history', String(at)), {
      at,
      json: JSON.stringify(data),
    })
    // Retention: keep the newest N snapshots per document
    const snaps = await getDocs(collection(db, COLLECTION, docId, 'history'))
    const ids = snaps.docs.map((d) => d.id).sort((a, b) => Number(b) - Number(a))
    for (const id of ids.slice(HISTORY_KEEP)) {
      await deleteDoc(doc(db, COLLECTION, docId, 'history', id))
    }
  } catch (e) {
    console.warn('[Firestore] snapshot failed:', docId, e)
  }
}

export async function cloudListSnapshots(docId) {
  if (!db) return []
  const snaps = await getDocs(collection(db, COLLECTION, docId, 'history'))
  return snaps.docs
    .map((d) => ({ id: d.id, at: d.data().at, size: (d.data().json || '').length }))
    .sort((a, b) => b.at - a.at)
}

export async function cloudGetSnapshot(docId, snapId) {
  if (!db) return null
  const s = await getDoc(doc(db, COLLECTION, docId, 'history', snapId))
  if (!s.exists()) return null
  return JSON.parse(s.data().json)
}

// Apply restored data as the current version (localStorage + Firestore)
export function applyRestoredData(docId, data) {
  const key = SYNC_MAP[docId]
  if (!key) return false
  localStorage.setItem(key, JSON.stringify(data))
  cloudSet(docId, data)
  return true
}

// --- Sync map: Firestore doc ID → localStorage key ---

const SYNC_MAP = {
  hero: 'portfolio_hero_config',
  authgate: 'portfolio_authgate_config',
  resume: 'portfolio_resume_config',
  contact: 'portfolio_contact_config',
  about: 'portfolio_about_config',
  achievements: 'portfolio_achievements_config',
  journey: 'portfolio_journey_config',
  theme_settings: 'portfolio_theme_settings',
  projects: 'portfolio_projects',
  case_studies: 'portfolio_case_studies',
  tokens: 'portfolio_access_tokens',
  gate_log: 'portfolio_gate_log',
  alert_log: 'portfolio_alert_log',
}

// Array-type docs store data wrapped as { items: [...] }
const ARRAY_DOCS = new Set(['case_studies', 'tokens', 'gate_log', 'alert_log'])

/**
 * Pull all data from Firestore → localStorage cache.
 * Called once on app mount.
 */
export async function syncFromCloud() {
  if (!hasConfig) return

  const results = await Promise.all([
    syncAccessSessions(),
    ...Object.entries(SYNC_MAP).map(async ([docId, localKey]) => {
      const data = await cloudGet(docId)
      if (data) {
        const value = ARRAY_DOCS.has(docId) ? data.items : data
        localStorage.setItem(localKey, JSON.stringify(value))
      }
      return { docId, found: !!data }
    }),
  ])

  return results
}

export { hasConfig as isCloudEnabled }
