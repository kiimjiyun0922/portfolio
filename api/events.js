import { findActiveToken, getServiceAccount, saveAccessSession } from './_firebase-service.js'
import { cleanSession, createRateLimiter, normalizeToken } from './_validation.js'

const limited = createRateLimiter(60)
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'method-not-allowed' }) }
  if (limited(req)) return res.status(429).json({ error: 'too-many-requests' })
  try {
    const account = getServiceAccount()
    if (!account) return res.status(501).json({ error: 'not-configured' })
    const token = normalizeToken(req.body?.token)
    if (!token) return res.status(400).json({ error: 'invalid-request' })
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
