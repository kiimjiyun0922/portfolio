import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

const read = (file) => readFile(new URL(`../${file}`, import.meta.url), 'utf8')

test('Firestore rules keep visitor access read-only and expiry-bound', async () => {
  const rules = await read('firestore.rules')
  assert.match(rules, /request\.auth\.token\.visitor == true/)
  assert.match(rules, /request\.time\.toMillis\(\) < request\.auth\.token\.accessExpiresAt/)
  assert.match(rules, /allow write: if isOwner\(\)/)
  assert.match(rules, /match \/\{document=\*\*\}[\s\S]*allow read, write: if false/)
  assert.doesNotMatch(rules, /allow write: if isVisitor/)
})

test('Storage rules restrict uploads to owner images under the size cap', async () => {
  const rules = await read('storage.rules')
  assert.match(rules, /request\.resource\.size < 8 \* 1024 \* 1024/)
  assert.match(rules, /image\/\(webp\|jpeg\|png\|avif\)/)
  assert.match(rules, /match \/\{allPaths=\*\*\}[\s\S]*allow read, write: if false/)
})
