import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const config = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'))
const headers = Object.fromEntries(config.headers[0].headers.map(({ key, value }) => [key, value]))

test('production routes set the required browser security headers', () => {
  assert.equal(config.headers[0].source, '/(.*)')
  assert.match(headers['Content-Security-Policy'], /default-src 'self'/)
  assert.match(headers['Content-Security-Policy'], /object-src 'none'/)
  assert.match(headers['Content-Security-Policy'], /frame-ancestors 'self'/)
  assert.match(headers['Content-Security-Policy'], /connect-src[^;]*googleapis\.com/)
  assert.equal(headers['X-Content-Type-Options'], 'nosniff')
  assert.equal(headers['Referrer-Policy'], 'strict-origin-when-cross-origin')
  assert.match(headers['Strict-Transport-Security'], /max-age=31536000/)
  assert.equal(headers['Cross-Origin-Opener-Policy'], 'same-origin-allow-popups')
})

test('security policy keeps admin previews same-origin and blocks third-party framing', () => {
  assert.equal(headers['X-Frame-Options'], 'SAMEORIGIN')
  assert.doesNotMatch(headers['Content-Security-Policy'], /frame-ancestors \*/)
})
