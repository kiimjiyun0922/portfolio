import { getGoogleAccessToken, getServiceAccount } from './_firebase-service.js'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ status: 'error' }) }
  const startedAt = Date.now()
  const checks = { firebase: false, rateLimitStore: false }
  try {
    const account = getServiceAccount()
    if (account) { await getGoogleAccessToken(account); checks.firebase = true }
    const url = process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_REST_KV_REST_API_URL || process.env.KV_REST_API_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_REST_KV_REST_API_TOKEN || process.env.KV_REST_API_TOKEN
    if (url && token) {
      const response = await fetch(`${url.replace(/\/$/, '')}/ping`, { headers: { Authorization: `Bearer ${token}` }, signal: AbortSignal.timeout(2500) })
      checks.rateLimitStore = response.ok
    }
    const healthy = checks.firebase && checks.rateLimitStore
    return res.status(healthy ? 200 : 503).json({ status: healthy ? 'ok' : 'degraded', checks, latencyMs: Date.now() - startedAt })
  } catch (error) {
    console.error('[health]', error)
    return res.status(503).json({ status: 'degraded', checks, latencyMs: Date.now() - startedAt })
  }
}
