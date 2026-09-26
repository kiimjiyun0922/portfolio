import test from 'node:test'
import assert from 'node:assert/strict'
import { ADMIN_IDLE_TIMEOUT_MS, ADMIN_IDLE_WARNING_MS, getAdminIdleState, readAdminActivity, writeAdminActivity } from '../src/utils/adminSession.js'

function memoryStorage() {
  const values = new Map()
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) }
}

test('admin idle policy warns before expiry and expires at the boundary', () => {
  const now = 10_000_000
  assert.deepEqual(getAdminIdleState(now, now), { expired: false, warning: false, remainingMs: ADMIN_IDLE_TIMEOUT_MS })
  assert.equal(getAdminIdleState(now - (ADMIN_IDLE_TIMEOUT_MS - ADMIN_IDLE_WARNING_MS), now).warning, true)
  assert.equal(getAdminIdleState(now - ADMIN_IDLE_TIMEOUT_MS, now).expired, true)
})

test('admin activity can be shared through browser storage', () => {
  const storage = memoryStorage()
  writeAdminActivity(42, storage)
  assert.equal(readAdminActivity(storage), 42)
})
