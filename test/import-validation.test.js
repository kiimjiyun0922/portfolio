import test from 'node:test'
import assert from 'node:assert/strict'
import { validateProjectsImport, validateResumeImport } from '../src/utils/importValidation.js'

test('resume import validates collection fields', () => {
  assert.deepEqual(validateResumeImport({ work: [], education: [], activities: [], selfIntro: 'hello' }).work, [])
  assert.throws(() => validateResumeImport({ work: {} }), /work/)
})

test('project import requires nested project titles', () => {
  const valid = {
    groups: [{ title: 'Group', projects: [{ title: 'Project' }] }],
    designProjects: [{ title: 'Design project', slug: 'design-project', gallery: [] }],
  }
  assert.equal(validateProjectsImport(valid), valid)
  assert.throws(() => validateProjectsImport({ groups: [{ projects: [{}] }] }), /title/)
  assert.throws(() => validateProjectsImport({ groups: [], designProjects: [{ title: 'Missing slug' }] }), /slug/)
  assert.throws(() => validateProjectsImport({ groups: [], designProjects: [{ title: 'Project', slug: 'project', gallery: {} }] }), /gallery/)
})

test('archive case blocks are validated on import', () => {
  const project = (blocks) => ({ groups: [], designProjects: [{ title: 'Case', slug: 'case', blocks }] })
  const valid = project([{ type: 'media', placement: 'solution', url: '/clip.mp4' }, { type: 'stats', items: [] }])
  assert.equal(validateProjectsImport(valid), valid)
  assert.throws(() => validateProjectsImport(project({})), /blocks/)
  assert.throws(() => validateProjectsImport(project([{ type: 'iframe' }])), /type/)
  assert.throws(() => validateProjectsImport(project([{ type: 'media', placement: 'footer' }])), /placement/)
  assert.throws(() => validateProjectsImport(project([{ type: 'tiles', items: {} }])), /items/)
})
