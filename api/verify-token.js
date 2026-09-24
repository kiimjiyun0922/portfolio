// Vercel serverless function: verifies a visitor access token SERVER-SIDE
// and mints a Firebase custom auth token with a {visitor: true} claim.
// Dependency-free: JWT signing via node:crypto, Firestore via REST.
import { createSign, createHash } from 'node:crypto'

const MAX_TOKEN_LENGTH = 256
const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX = 20
const VISITOR_CLAIM_TTL_MS = 6 * 60_000
const attempts = new Map()

function clientIp(req) {
  return String(req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown')
    .split(',')[0]
    .trim()
}

function isRateLimited(req) {
  const key = clientIp(req)
  const now = Date.now()
  const current = attempts.get(key)
  if (!current || now - current.startedAt >= RATE_LIMIT_WINDOW_MS) {
    attempts.set(key, { startedAt: now, count: 1 })
    return false
  }
  current.count += 1
  return current.count > RATE_LIMIT_MAX
}

function b64url(input) {
  return Buffer.from(input).toString('base64url')
}

function signJwt(payload, privateKey) {
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const body = b64url(JSON.stringify(payload))
  const signer = createSign('RSA-SHA256')
  signer.update(`${header}.${body}`)
  return `${header}.${body}.${signer.sign(privateKey).toString('base64url')}`
}

// OAuth2 access token for Firestore REST (cached across warm invocations)
let cachedAccess = { token: null, exp: 0 }

async function getAccessToken(sa) {
  if (cachedAccess.token && Date.now() < cachedAccess.exp - 60_000) return cachedAccess.token
  const now = Math.floor(Date.now() / 1000)
  const assertion = signJwt(
    {
      iss: sa.client_email,
      scope: 'https://www.googleapis.com/auth/datastore',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: now + 3600,
    },
    sa.private_key,
  )
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${assertion}`,
  })
  const d = await r.json()
  if (!d.access_token) throw new Error('oauth: ' + JSON.stringify(d))
  cachedAccess = { token: d.access_token, exp: Date.now() + (d.expires_in || 3600) * 1000 }
  return d.access_token
}

async function fetchTokens(sa) {
  const access = await getAccessToken(sa)
  const url = `https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents/site/tokens`
  const r = await fetch(url, { headers: { Authorization: `Bearer ${access}` } })
  if (r.status === 404) return []
  if (!r.ok) throw new Error('firestore: HTTP ' + r.status)
  const d = await r.json()
  const values = d.fields?.items?.arrayValue?.values || []
  return values.map((v) => {
    const f = v.mapValue?.fields || {}
    return {
      id: f.id?.stringValue,
      label: f.label?.stringValue,
      token: f.token?.stringValue,
      tokenHash: f.tokenHash?.stringValue,
      expiresAt: Number(f.expiresAt?.integerValue ?? f.expiresAt?.doubleValue ?? 0),
      forceExpired: !!f.forceExpired?.booleanValue,
      revoked: !!f.revoked?.booleanValue,
      theme: f.theme?.stringValue || '',
    }
  })
}

// Firebase custom auth token (the client exchanges it via signInWithCustomToken)
function mintCustomToken(sa, uid, claims) {
  const now = Math.floor(Date.now() / 1000)
  return signJwt(
    {
      iss: sa.client_email,
      sub: sa.client_email,
      aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
      iat: now,
      exp: now + 3600,
      uid,
      claims,
    },
    sa.private_key,
  )
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    res.status(405).json({ error: 'method-not-allowed' })
    return
  }
  if (isRateLimited(req)) {
    res.status(429).json({ error: 'too-many-requests' })
    return
  }
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
    // Production clients fail closed when server verification is unavailable.
    res.status(501).json({ error: 'not-configured' })
    return
  }
  try {
    const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    const token = String(req.body?.token || '').trim()
    if (!token || token.length > MAX_TOKEN_LENGTH) {
      res.status(400).json({ error: 'invalid-request' })
      return
    }
    const items = await fetchTokens(sa)
    const hash = createHash('sha256').update(token).digest('hex')
    const now = Date.now()
    const match = items.find(
      (t) =>
        !t.revoked &&
        (t.tokenHash ? t.tokenHash === hash : t.token === token) && // legacy plaintext tokens still verify
        t.expiresAt > now &&
        !t.forceExpired,
    )
    if (!match) {
      res.status(401).json({ error: 'invalid-token' })
      return
    }
    const accessExpiresAt = Math.min(match.expiresAt, now + VISITOR_CLAIM_TTL_MS)
    res.status(200).json({
      customToken: mintCustomToken(sa, `visitor-${match.id}`, {
        visitor: true,
        tokenId: match.id,
        accessExpiresAt,
      }),
      id: match.id,
      label: match.label,
      expiresAt: match.expiresAt,
      theme: match.theme || '',
    })
  } catch (e) {
    console.error('[verify-token]', e)
    res.status(500).json({ error: 'server-error' })
  }
}
