import test from 'node:test'
import assert from 'node:assert/strict'

import clientErrorHandler from '../api/client-error.js'
import healthHandler from '../api/health.js'

function response() {
  return {
    headers: {},
    statusCode: 200,
    body: undefined,
    ended: false,
    setHeader(name, value) { this.headers[name] = value },
    status(code) { this.statusCode = code; return this },
    json(value) { this.body = value; return this },
    end() { this.ended = true; return this },
  }
}

test('monitoring endpoints reject unsupported methods', async () => {
  const healthResponse = response()
  await healthHandler({ method: 'POST', headers: {} }, healthResponse)
  assert.equal(healthResponse.statusCode, 405)
  assert.equal(healthResponse.headers.Allow, 'GET')

  const clientResponse = response()
  await clientErrorHandler({ method: 'GET', headers: {} }, clientResponse)
  assert.equal(clientResponse.statusCode, 405)
  assert.equal(clientResponse.headers.Allow, 'POST')
})

test('client error endpoint rejects reports without a message', async () => {
  const res = response()
  await clientErrorHandler({ method: 'POST', headers: { 'x-real-ip': 'monitoring-test' }, body: {} }, res)
  assert.equal(res.statusCode, 400)
  assert.deepEqual(res.body, { error: 'invalid-request' })
})
