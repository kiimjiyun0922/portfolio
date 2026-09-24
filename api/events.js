import { findActiveToken, getServiceAccount, saveAccessSession } from './_firebase-service.js'

const attempts = new Map()
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
function limited(req) {
  const key = String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown').split(',')[0].trim()
  const now = Date.now(), hit = attempts.get(key)
  if (!hit || now - hit.at >= 60_000) { attempts.set(key, { at: now, count: 1 }); return false }
  hit.count += 1
  return hit.count > 60
}
function cleanSession(input, verified) {
  const sessionId = String(input?.sessionId || '')
  if (!UUID.test(sessionId)) return null
  const now = Date.now(), accessedAt = Number(input.accessedAt)
  if (!Number.isFinite(accessedAt) || accessedAt > now + 60_000 || accessedAt < now - 30 * 24 * 60 * 60_000) return null
  const actions = Array.isArray(input.actions) ? input.actions.slice(-50).map((a) => ({
    t: Math.min(now, Math.max(accessedAt, Number(a?.t) || accessedAt)),
    kind: String(a?.kind || '').slice(0, 20), target: String(a?.target || '').slice(0, 60),
  })) : []
  return {
    sessionId, tokenId: verified.id, tokenLabel: verified.label, accessedAt,
    lastSeenAt: Math.min(now, Math.max(accessedAt, Number(input.lastSeenAt) || accessedAt)),
    userAgent: String(input.userAgent || '').slice(0, 300), language: String(input.language || '').slice(0, 30), actions,
  }
}
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'method-not-allowed' }) }
  if (limited(req)) return res.status(429).json({ error: 'too-many-requests' })
  try {
    const account = getServiceAccount()
    if (!account) return res.status(501).json({ error: 'not-configured' })
    const token = String(req.body?.token || '').trim()
    if (!token || token.length > 256) return res.status(400).json({ error: 'invalid-request' })
    const verified = await findActiveToken(account, token)
    if (!verified) return res.status(401).json({ error: 'invalid-token' })
    const session = cleanSession(req.body?.session, verified)
    if (!session) return res.status(400).json({ error: 'invalid-event' })
    await saveAccessSession(account, session)
    return res.status(204).end()
  } catch (error) {
    console.error('[events]', error)
    return res.status(500).json({ error: 'server-error' })
  }
}
