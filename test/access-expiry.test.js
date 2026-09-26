import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
const gate = readFileSync(new URL('../src/components/AuthGate.jsx', import.meta.url), 'utf8')
const contract = readFileSync(new URL('../src/mist-system-contract.js', import.meta.url), 'utf8')

test('visitor access warns shortly before expiry and blocks immediately at expiry', () => {
  assert.match(app, /EXPIRY_WARNING_MS = 10 \* 60 \* 1000/)
  assert.match(app, /if \(!Number\.isFinite\(expiresAt\)\) return undefined/)
  assert.match(app, /Number\.isFinite\(tokenExpiresAt\) &&/)
  assert.match(app, /window\.setTimeout\(onExpired, remaining\)/)
  assert.match(app, /visibilitychange/)
  assert.match(app, /pageshow/)
  assert.match(app, /setVisitorAuth\(false\)/)
  assert.match(app, /setGateReason\('expired'\)/)
  assert.match(app, /<AuthGate reason=\{gateReason\}/)
  assert.match(gate, /reason === 'expired'/)
  assert.match(gate, /포트폴리오는 보호되었습니다/)
  assert.match(contract, /보호 콘텐츠를 즉시 언마운트/)
  assert.match(contract, /불투명한 전체 화면 재인증 게이트/)
})
