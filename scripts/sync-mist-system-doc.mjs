import { writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import {
  MIST_BOUNDARY_TOKENS,
  MIST_GUIDE_VERSION,
  MIST_IA_MAP,
  MIST_RELEASE_CHECKS,
  MIST_RULES,
} from '../src/mist-system-contract.js'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const rows = MIST_RULES.map(([name, use, avoid]) => `| ${name} | ${use} | ${avoid} |`).join('\n')
const boundaries = MIST_BOUNDARY_TOKENS.map(([name, value, use]) => `| ${name} | ${value} | ${use} |`).join('\n')
const ia = MIST_IA_MAP.map(([scope, pages]) => `| ${scope} | ${pages.join(' → ')} |`).join('\n')
const release = MIST_RELEASE_CHECKS.map(([group, checks]) => `### ${group}\n\n${checks.map((item) => `- [ ] ${item}`).join('\n')}`).join('\n\n')

const markdown = `# Mist Front Design System v${MIST_GUIDE_VERSION}

이 문서는 \`front-system.html\`과 같은 원문 데이터에서 생성된다. 규칙을 직접 복사해 따로 수정하지 않는다. 변경은 \`src/mist-system-contract.js\`에서 한 번만 하고 \`npm run sync:mist-guide\`로 이 문서를 갱신한다.

## Boundary tokens

| Token | Ink alpha | Use |
| --- | ---: | --- |
${boundaries}

모든 선은 1px이다. 인접 경계는 한 번만 그리며 Background 내부에서 8%보다 진한 선을 사용하지 않는다.

## Normative rules

| Rule | Do | Don't |
| --- | --- | --- |
${rows}

## Information architecture

| Scope | Order |
| --- | --- |
${ia}

## Release checklist

${release}
`

await writeFile(path.join(root, 'docs/MIST_FRONT_SYSTEM.md'), markdown)
console.log('Synced docs/MIST_FRONT_SYSTEM.md from src/mist-system-contract.js')
