import test from 'node:test'
import assert from 'node:assert/strict'
import { buildLogRows, countLogRows } from '../src/components/admin/logModel.js'
import { filterTokens, getTokenStatus, isActiveToken } from '../src/components/admin/tokenModel.js'

test('log model merges, labels, and sorts all stores', () => {
  const rows = buildLogRows({
    now: 1_000_000,
    accessLogs: [{ accessedAt: 900_000, lastSeenAt: 950_000, tokenLabel: 'A', actions: [] }],
    gateLogs: [{ visitedAt: 980_000, referrer: 'https://example.com/path' }],
    alertLogs: [{ at: 990_000, type: 'admin_fail' }],
  })
  assert.deepEqual(rows.map((row) => row.kind), ['alert', 'gate', 'access'])
  assert.equal(rows[1].detail, '유입: example.com/path')
  assert.deepEqual(countLogRows(rows), { all: 3, access: 1, gate: 1, alert: 1 })
})

test('token model consistently classifies token lifecycle', () => {
  const now = 1000
  const tokens = [
    { id: 'active', expiresAt: 2000 },
    { id: 'expired', expiresAt: 500 },
    { id: 'forced', expiresAt: 2000, forceExpired: true },
    { id: 'revoked', expiresAt: 2000, revoked: true },
  ]
  assert.equal(isActiveToken(tokens[0], now), true)
  assert.equal(getTokenStatus(tokens[2], now).text, '만료(강제)')
  assert.deepEqual(filterTokens(tokens, 'active', now).map((token) => token.id), ['active'])
  assert.deepEqual(filterTokens(tokens, 'expired', now).map((token) => token.id), ['expired', 'forced'])
  assert.deepEqual(filterTokens(tokens, 'revoked', now).map((token) => token.id), ['revoked'])
})
