import test from 'node:test'
import assert from 'node:assert/strict'
import { redactTelemetry } from '../api/_redaction.js'

test('telemetry redacts bearer credentials and named secrets', () => {
  const input = 'authorization=Bearer abc.def.ghi token=super-secret-value api_key=abc123456'
  const output = redactTelemetry(input)
  assert.doesNotMatch(output, /super-secret-value|abc123456|abc\.def\.ghi/)
  assert.match(output, /\[REDACTED\]/)
})

test('telemetry is length bounded', () => {
  assert.equal(redactTelemetry('x'.repeat(50), 12).length, 12)
})
