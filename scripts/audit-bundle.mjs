import { readdir, stat, readFile } from 'node:fs/promises'
import { join } from 'node:path'

const assets = 'dist/assets'
const files = await readdir(assets)
const sizes = new Map(await Promise.all(files.map(async (file) => [file, (await stat(join(assets, file))).size])))
const largestMainCss = Math.max(0, ...[...sizes].filter(([name]) => name.startsWith('main-') && name.endsWith('.css')).map(([, size]) => size))
if (largestMainCss > 450_000) throw new Error(`main CSS budget exceeded: ${largestMainCss} bytes`)

const index = await readFile('dist/index.html', 'utf8')
const eagerOptional = [...index.matchAll(/href="\/assets\/([^"]*(?:mermaid|jspdf|html2canvas)[^"]*)"/gi)]
  .map((match) => match[1])
  .filter((name) => (sizes.get(name) || 0) > 50_000)
if (eagerOptional.length) throw new Error(`heavy optional libraries must not be eagerly loaded: ${eagerOptional.join(', ')}`)

const oversized = [...sizes].filter(([, size]) => size > 750_000)
if (oversized.length) throw new Error(`asset budget exceeded: ${oversized.map(([name, size]) => `${name}=${size}`).join(', ')}`)
console.log(`Bundle audit passed (${files.length} assets, main CSS ${largestMainCss} bytes)`)
