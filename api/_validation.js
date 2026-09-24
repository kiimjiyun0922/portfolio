const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function normalizeToken(value) {
  const token = String(value || '').trim()
  return token && token.length <= 256 ? token : null
}

export function cleanSession(input, verified, now = Date.now()) {
  const sessionId = String(input?.sessionId || '')
  if (!UUID.test(sessionId)) return null
  const accessedAt = Number(input.accessedAt)
  if (!Number.isFinite(accessedAt) || accessedAt > now + 60_000 || accessedAt < now - 30 * 24 * 60 * 60_000) return null
  const actions = Array.isArray(input.actions) ? input.actions.slice(-50).map((action) => ({
    t: Math.min(now, Math.max(accessedAt, Number(action?.t) || accessedAt)),
    kind: String(action?.kind || '').slice(0, 20),
    target: String(action?.target || '').slice(0, 60),
  })) : []
  return {
    sessionId,
    tokenId: verified.id,
    tokenLabel: verified.label,
    accessedAt,
    lastSeenAt: Math.min(now, Math.max(accessedAt, Number(input.lastSeenAt) || accessedAt)),
    userAgent: String(input.userAgent || '').slice(0, 300),
    language: String(input.language || '').slice(0, 30),
    actions,
  }
}

export function createRateLimiter(max, windowMs = 60_000) {
  const attempts = new Map()
  return (req, now = Date.now()) => {
    const key = String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown').split(',')[0].trim()
    const hit = attempts.get(key)
    if (!hit || now - hit.at >= windowMs) {
      attempts.set(key, { at: now, count: 1 })
      return false
    }
    hit.count += 1
    return hit.count > max
  }
}
