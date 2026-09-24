import { findActiveToken, getServiceAccount, mintCustomToken } from './_firebase-service.js'
import { createRateLimiter, normalizeToken } from './_validation.js'

const limited = createRateLimiter(20)

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'method-not-allowed' }) }
  if (limited(req)) return res.status(429).json({ error: 'too-many-requests' })
  try {
    const account = getServiceAccount()
    if (!account) return res.status(501).json({ error: 'not-configured' })
    const token = normalizeToken(req.body?.token)
    if (!token) return res.status(400).json({ error: 'invalid-request' })
    const match = await findActiveToken(account, token)
    if (!match) return res.status(401).json({ error: 'invalid-token' })
    const accessExpiresAt = Math.min(match.expiresAt, Date.now() + 6 * 60_000)
    return res.status(200).json({
      customToken: mintCustomToken(account, `visitor-${match.id}`, { visitor: true, tokenId: match.id, accessExpiresAt }),
      id: match.id, label: match.label, expiresAt: match.expiresAt, theme: match.theme,
    })
  } catch (error) {
    console.error('[verify-token]', error)
    return res.status(500).json({ error: 'server-error' })
  }
}
