import test from 'node:test'
import assert from 'node:assert/strict'
import { cleanSession, createRateLimiter, normalizeToken } from '../api/_validation.js'

test('normalizeToken trims valid tokens and rejects invalid lengths', () => {
  assert.equal(normalizeToken('  abc  '), 'abc')
  assert.equal(normalizeToken(''), null)
  assert.equal(normalizeToken('x'.repeat(257)), null)
})

test('cleanSession rejects invalid ids and stale timestamps', () => {
  const now = 1_800_000_000_000
  const verified = { id: 'token-1', label: 'Recruiter' }
  assert.equal(cleanSession({ sessionId: 'bad', accessedAt: now }, verified, now), null)
  assert.equal(cleanSession({ sessionId: '123e4567-e89b-42d3-a456-426614174000', accessedAt: now - 31 * 86400000 }, verified, now), null)
})

test('cleanSession trusts server token metadata and bounds visitor input', () => {
  const now = 1_800_000_000_000
  const accessedAt = now - 1000
  const session = cleanSession({
    sessionId: '123e4567-e89b-42d3-a456-426614174000',
    tokenId: 'spoofed', tokenLabel: 'spoofed', accessedAt, lastSeenAt: now + 999999,
    userAgent: 'u'.repeat(500), language: 'l'.repeat(50),
    actions: Array.from({ length: 55 }, (_, i) => ({ t: now + i, kind: 'k'.repeat(30), target: 't'.repeat(80) })),
  }, { id: 'real-id', label: 'Real label' }, now)
  assert.equal(session.tokenId, 'real-id')
  assert.equal(session.tokenLabel, 'Real label')
  assert.equal(session.lastSeenAt, now)
  assert.equal(session.userAgent.length, 300)
  assert.equal(session.language.length, 30)
  assert.equal(session.actions.length, 50)
  assert.equal(session.actions[0].kind.length, 20)
  assert.equal(session.actions[0].target.length, 60)
})

test('rate limiter isolates IPs and resets after its window', () => {
  const limited = createRateLimiter(2, 1000)
  const a = { headers: { 'x-forwarded-for': '1.2.3.4, 10.0.0.1' } }
  const b = { headers: { 'x-real-ip': '5.6.7.8' } }
  assert.equal(limited(a, 100), false)
  assert.equal(limited(a, 200), false)
  assert.equal(limited(a, 300), true)
  assert.equal(limited(b, 300), false)
  assert.equal(limited(a, 1200), false)
})
