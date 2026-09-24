import { createHash, createSign } from 'node:crypto'

let cachedAccess = { token: null, exp: 0 }

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

export function getServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) return null
  const account = JSON.parse(raw)
  if (!account.project_id || !account.client_email || !account.private_key) {
    throw new Error('invalid-service-account')
  }
  return account
}

export async function getGoogleAccessToken(account) {
  if (cachedAccess.token && Date.now() < cachedAccess.exp - 60_000) return cachedAccess.token
  const now = Math.floor(Date.now() / 1000)
  const assertion = signJwt({
    iss: account.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }, account.private_key)
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=${encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer')}&assertion=${assertion}`,
  })
  const data = await response.json()
  if (!response.ok || !data.access_token) throw new Error(`oauth-http-${response.status}`)
  cachedAccess = { token: data.access_token, exp: Date.now() + (data.expires_in || 3600) * 1000 }
  return data.access_token
}

export async function findActiveToken(account, plaintextToken) {
  const access = await getGoogleAccessToken(account)
  const url = `https://firestore.googleapis.com/v1/projects/${account.project_id}/databases/(default)/documents/site/tokens`
  const response = await fetch(url, { headers: { Authorization: `Bearer ${access}` } })
  if (response.status === 404) return null
  if (!response.ok) throw new Error(`firestore-http-${response.status}`)
  const data = await response.json()
  const values = data.fields?.items?.arrayValue?.values || []
  const hash = createHash('sha256').update(plaintextToken).digest('hex')
  const now = Date.now()
  for (const value of values) {
    const f = value.mapValue?.fields || {}
    const token = {
      id: f.id?.stringValue,
      label: f.label?.stringValue || '',
      token: f.token?.stringValue,
      tokenHash: f.tokenHash?.stringValue,
      expiresAt: Number(f.expiresAt?.integerValue ?? f.expiresAt?.doubleValue ?? 0),
      forceExpired: !!f.forceExpired?.booleanValue,
      revoked: !!f.revoked?.booleanValue,
      theme: f.theme?.stringValue || '',
    }
    if (!token.revoked && !token.forceExpired && token.expiresAt > now &&
      (token.tokenHash ? token.tokenHash === hash : token.token === plaintextToken)) return token
  }
  return null
}

export function mintCustomToken(account, uid, claims) {
  const now = Math.floor(Date.now() / 1000)
  return signJwt({
    iss: account.client_email,
    sub: account.client_email,
    aud: 'https://identitytoolkit.googleapis.com/google.identity.identitytoolkit.v1.IdentityToolkit',
    iat: now,
    exp: now + 3600,
    uid,
    claims,
  }, account.private_key)
}

function firestoreValue(value) {
  if (typeof value === 'string') return { stringValue: value }
  if (typeof value === 'number') return { integerValue: String(Math.trunc(value)) }
  if (Array.isArray(value)) return { arrayValue: { values: value.map((item) => firestoreValue(item)) } }
  if (value && typeof value === 'object') {
    return { mapValue: { fields: Object.fromEntries(Object.entries(value).map(([k, v]) => [k, firestoreValue(v)])) } }
  }
  return { nullValue: null }
}

export async function saveAccessSession(account, session) {
  const access = await getGoogleAccessToken(account)
  const id = encodeURIComponent(session.sessionId)
  const url = `https://firestore.googleapis.com/v1/projects/${account.project_id}/databases/(default)/documents/site/access_log/sessions/${id}`
  const response = await fetch(url, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${access}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: Object.fromEntries(Object.entries(session).map(([k, v]) => [k, firestoreValue(v)])) }),
  })
  if (!response.ok) throw new Error(`firestore-write-http-${response.status}`)
}
