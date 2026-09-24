import test from 'node:test'
import assert from 'node:assert/strict'
import { validateProjectsImport, validateResumeImport } from '../src/utils/importValidation.js'

test('resume import validates collection fields', () => {
  assert.deepEqual(validateResumeImport({ work: [], education: [], activities: [], selfIntro: 'hello' }).work, [])
  assert.throws(() => validateResumeImport({ work: {} }), /work/)
})

test('project import requires nested project titles', () => {
  const valid = { groups: [{ title: 'Group', projects: [{ title: 'Project' }] }] }
  assert.equal(validateProjectsImport(valid), valid)
  assert.throws(() => validateProjectsImport({ groups: [{ projects: [{}] }] }), /title/)
})
