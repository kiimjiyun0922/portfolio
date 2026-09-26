import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const entry = readFileSync(new URL('../src/front-system-entry.jsx', import.meta.url), 'utf8')
const guideCss = readFileSync(new URL('../src/front-system.css', import.meta.url), 'utf8')
const sharedHeader = readFileSync(new URL('../src/components/ThemeSystemHeader.jsx', import.meta.url), 'utf8')
const admin = readFileSync(new URL('../src/components/Admin.jsx', import.meta.url), 'utf8')

test('front design system is isolated from public and admin stylesheets', () => {
  assert.match(entry, /import ['"]\.\/front-system\.css['"]/)
  assert.doesNotMatch(entry, /index\.css|mist-theme\.css|admin/i)
  assert.doesNotMatch(guideCss, /@import\s+[^;]*(?:index|mist-theme|admin)/i)
})

test('theme system header and admin links keep a one-to-one theme mapping', () => {
  assert.match(sharedHeader, /id === 'mist' \? '\/front-system\.html' : `\/front-system-\$\{id\}\.html`/)
  assert.match(sharedHeader, /aria-current=\{id === themeId \? 'page'/)
  assert.match(admin, /target="_blank"/)
  assert.match(admin, /data-theme-design-system=\{th\.id\}/)
})
