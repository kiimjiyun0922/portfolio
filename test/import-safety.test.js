import test from 'node:test'
import assert from 'node:assert/strict'
import { summarizeJsonDiff, validateImportedJson } from '../src/components/admin/JsonTransferUtils.js'
import { validatePortfolioImageMetadata } from '../src/utils/imageUpload.js'

test('generic JSON import rejects prototype pollution keys', () => {
  const unsafe = JSON.parse('{"__proto__":{"admin":true}}')
  assert.throws(() => validateImportedJson(unsafe), /허용되지 않는/)
  assert.deepEqual(validateImportedJson({ title: 'Safe', items: [] }), { title: 'Safe', items: [] })
})

test('JSON difference summary reports top-level changes', () => {
  assert.deepEqual(summarizeJsonDiff({ a: 1, b: 2 }, { b: 3, c: 4 }), {
    added: ['c'], removed: ['a'], changed: ['b'],
  })
})

test('image upload metadata rejects unsupported and oversized files', () => {
  assert.equal(validatePortfolioImageMetadata({ type: 'image/webp', size: 1024 }), 'webp')
  assert.throws(() => validatePortfolioImageMetadata({ type: 'image/svg+xml', size: 1024 }), /WebP/)
  assert.throws(() => validatePortfolioImageMetadata({ type: 'image/png', size: 9 * 1024 * 1024 }), /8MB/)
})
