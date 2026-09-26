import assert from 'node:assert/strict'
import { createHash, generateKeyPairSync } from 'node:crypto'
import test from 'node:test'

import eventsHandler from '../api/events.js'
import verifyTokenHandler from '../api/verify-token.js'

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

function tokenDocument(token, expiresAt) {
  return {
    fields: {
      items: {
        arrayValue: {
          values: [{
            mapValue: {
              fields: {
                id: { stringValue: 'viewer-1' },
                label: { stringValue: 'Hiring team' },
                tokenHash: { stringValue: createHash('sha256').update(token).digest('hex') },
                expiresAt: { integerValue: String(expiresAt) },
                theme: { stringValue: 'mist' },
              },
            },
          }],
        },
      },
    },
  }
}

test('verified token receives a short-lived visitor claim and can save an access event', async () => {
  const plaintext = 'test-access-token'
  const expiresAt = Date.now() + 60 * 60_000
  const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
  const oldAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  const redisKeys = [
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN',
    'UPSTASH_REDIS_REST_KV_REST_API_URL',
    'UPSTASH_REDIS_REST_KV_REST_API_TOKEN',
    'KV_REST_API_URL',
    'KV_REST_API_TOKEN',
  ]
  const oldRedis = Object.fromEntries(redisKeys.map((key) => [key, process.env[key]]))
  const oldFetch = globalThis.fetch
  const requests = []

  process.env.FIREBASE_SERVICE_ACCOUNT = JSON.stringify({
    project_id: 'portfolio-test',
    client_email: 'firebase-admin@example.test',
    private_key: privateKey.export({ type: 'pkcs8', format: 'pem' }),
  })
  redisKeys.forEach((key) => delete process.env[key])
  globalThis.fetch = async (url, init = {}) => {
    requests.push({ url: String(url), init })
    if (String(url).includes('oauth2.googleapis.com/token')) {
      return { ok: true, status: 200, json: async () => ({ access_token: 'google-access', expires_in: 3600 }) }
    }
    if (init.method === 'PATCH') return { ok: true, status: 200, json: async () => ({}) }
    return { ok: true, status: 200, json: async () => tokenDocument(plaintext, expiresAt) }
  }

  try {
    const verifyRes = response()
    await verifyTokenHandler({
      method: 'POST',
      headers: { 'x-real-ip': 'api-handler-verify' },
      body: { token: plaintext },
    }, verifyRes)

    assert.equal(verifyRes.statusCode, 200)
    assert.equal(verifyRes.headers['Cache-Control'], 'no-store')
    assert.equal(verifyRes.body.id, 'viewer-1')
    assert.equal(verifyRes.body.label, 'Hiring team')
    assert.equal(verifyRes.body.theme, 'mist')
    assert.ok(verifyRes.body.customToken.split('.').length === 3)
    assert.ok(verifyRes.body.expiresAt === expiresAt)

    const eventRes = response()
    await eventsHandler({
      method: 'POST',
      headers: { 'x-real-ip': 'api-handler-event' },
      body: {
        token: plaintext,
        session: {
          sessionId: '123e4567-e89b-42d3-a456-426614174000',
          accessedAt: Date.now() - 1000,
          lastSeenAt: Date.now(),
          actions: [{ t: Date.now(), kind: 'section', target: 'projects' }],
        },
      },
    }, eventRes)

    assert.equal(eventRes.statusCode, 204)
    assert.equal(eventRes.headers['Cache-Control'], 'no-store')
    assert.equal(eventRes.ended, true)
    const write = requests.find(({ init }) => init.method === 'PATCH')
    assert.ok(write)
    assert.match(write.url, /site\/access_log\/sessions\/123e4567/)
    const fields = JSON.parse(write.init.body).fields
    assert.equal(fields.tokenId.stringValue, 'viewer-1')
    assert.equal(fields.tokenLabel.stringValue, 'Hiring team')
  } finally {
    globalThis.fetch = oldFetch
    if (oldAccount === undefined) delete process.env.FIREBASE_SERVICE_ACCOUNT
    else process.env.FIREBASE_SERVICE_ACCOUNT = oldAccount
    for (const key of redisKeys) {
      if (oldRedis[key] === undefined) delete process.env[key]
      else process.env[key] = oldRedis[key]
    }
  }
})

test('API handlers fail closed without server credentials', async () => {
  const oldAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  delete process.env.FIREBASE_SERVICE_ACCOUNT
  try {
    const verifyRes = response()
    await verifyTokenHandler({ method: 'POST', headers: { 'x-real-ip': 'missing-config-verify' }, body: { token: 'x' } }, verifyRes)
    assert.equal(verifyRes.statusCode, 501)
    assert.deepEqual(verifyRes.body, { error: 'not-configured' })

    const eventRes = response()
    await eventsHandler({ method: 'POST', headers: { 'x-real-ip': 'missing-config-event' }, body: { token: 'x' } }, eventRes)
    assert.equal(eventRes.statusCode, 501)
    assert.deepEqual(eventRes.body, { error: 'not-configured' })
  } finally {
    if (oldAccount === undefined) delete process.env.FIREBASE_SERVICE_ACCOUNT
    else process.env.FIREBASE_SERVICE_ACCOUNT = oldAccount
  }
})
