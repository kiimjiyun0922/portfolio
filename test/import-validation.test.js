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

test('authored case-study pages list their relative assets and are validated on import', async () => {
  const { extractCaseStudyAssetPaths, syncCaseStudyAssets } = await import('../src/utils/caseStudyEmbed.js')
  const html = '<img src="img/hero.jpg"><video src="./img/clip.mp4" poster="img/poster.jpg"></video><img src="https://cdn.example/x.png"><img src="/assets/y.png">'
  assert.deepEqual(extractCaseStudyAssetPaths(html), ['img/hero.jpg', 'img/clip.mp4', 'img/poster.jpg'])
  assert.deepEqual(syncCaseStudyAssets(html, [{ path: 'img/hero.jpg', url: 'https://storage/hero' }])[0], { path: 'img/hero.jpg', url: 'https://storage/hero' })
  const project = (extra) => ({ groups: [], designProjects: [{ title: 'Case', slug: 'case', ...extra }] })
  assert.ok(validateProjectsImport(project({ caseStudyHtml: html, caseStudyAssets: [{ path: 'img/hero.jpg', url: '' }] })))
  assert.throws(() => validateProjectsImport(project({ caseStudyHtml: 42 })), /caseStudyHtml/)
  assert.throws(() => validateProjectsImport(project({ caseStudyAssets: {} })), /caseStudyAssets/)
  assert.throws(() => validateProjectsImport(project({ caseStudyHtml: 'x'.repeat(400 * 1024 + 1) })), /400KB/)
})
