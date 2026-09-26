import { createRateLimiter } from './_validation.js'
import { randomUUID } from 'node:crypto'
import { redactTelemetry } from './_redaction.js'

const limited = createRateLimiter(10)
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'method-not-allowed' }) }
  if (await limited(req)) return res.status(429).json({ error: 'too-many-requests' })
  const message = redactTelemetry(req.body?.message, 500)
  const stack = redactTelemetry(req.body?.stack, 2000)
  const path = redactTelemetry(req.body?.path, 300)
  if (!message) return res.status(400).json({ error: 'invalid-request' })
  console.error('[client-error]', { eventId: randomUUID(), message, stack, path, at: new Date().toISOString() })
  return res.status(204).end()
}
