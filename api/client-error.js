import { createRateLimiter } from './_validation.js'

const limited = createRateLimiter(10)
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'method-not-allowed' }) }
  if (await limited(req)) return res.status(429).json({ error: 'too-many-requests' })
  const message = String(req.body?.message || '').slice(0, 500)
  const stack = String(req.body?.stack || '').slice(0, 2000)
  const path = String(req.body?.path || '').slice(0, 300)
  if (!message) return res.status(400).json({ error: 'invalid-request' })
  console.error('[client-error]', { message, stack, path })
  return res.status(204).end()
}
