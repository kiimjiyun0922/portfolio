// Shared data contract for optional archive case-study blocks.
// Used by the public renderer, the admin editor and JSON import validation.

export const CASE_BLOCK_PLACEMENTS = ['brief', 'problem', 'userFlow', 'solution', 'validation', 'designSystem']
export const CASE_BLOCK_TYPES = ['media', 'compare', 'stats', 'tiles', 'annotated']
export const DEFAULT_CASE_BLOCK_PLACEMENT = 'solution'

const VIDEO_PATTERN = /\.(mp4|webm|mov)$/i

export function cleanText(value) {
  return typeof value === 'string' ? value.trim() : ''
}

export function isVideoUrl(url, kind) {
  if (kind === 'video') return true
  if (kind === 'image') return false
  const value = cleanText(url)
  if (!value) return false
  let path = value
  try {
    path = decodeURIComponent(new URL(value, 'https://placeholder.local').pathname)
  } catch {
    path = value.split('?')[0]
  }
  return VIDEO_PATTERN.test(path)
}

export function clampPercent(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return 50
  return Math.min(100, Math.max(0, number))
}

export function blockPlacement(block) {
  return CASE_BLOCK_PLACEMENTS.includes(block?.placement) ? block.placement : DEFAULT_CASE_BLOCK_PLACEMENT
}

export function isRenderableBlock(block) {
  if (!block || !CASE_BLOCK_TYPES.includes(block.type)) return false
  const items = Array.isArray(block.items) ? block.items : []
  if (block.type === 'media' || block.type === 'annotated') return Boolean(cleanText(block.url))
  if (block.type === 'compare') return Boolean(cleanText(block.beforeUrl) && cleanText(block.afterUrl))
  if (block.type === 'stats') return items.some((item) => cleanText(item?.value) && cleanText(item?.label))
  if (block.type === 'tiles') return items.some((item) => cleanText(item?.url) || cleanText(item?.title))
  return false
}

export function createCaseBlock(type) {
  const base = { id: `block-${Date.now()}`, type, placement: DEFAULT_CASE_BLOCK_PLACEMENT, title: '', caption: '' }
  if (type === 'media') return { ...base, url: '', alt: '', kind: 'auto', poster: '', frame: 'plain', frameLabel: '' }
  if (type === 'compare') return { ...base, beforeUrl: '', beforeAlt: '', beforeLabel: 'Before', afterUrl: '', afterAlt: '', afterLabel: 'After' }
  if (type === 'stats') return { ...base, items: [{ value: '', label: '', source: '' }] }
  if (type === 'tiles') return { ...base, items: [{ url: '', alt: '', eyebrow: '', title: '', text: '' }] }
  if (type === 'annotated') return { ...base, url: '', alt: '', pins: [{ x: 50, y: 50, note: '' }] }
  return base
}

export function validateCaseBlocks(blocks, label = '프로젝트') {
  if (blocks === undefined) return
  if (!Array.isArray(blocks)) throw new Error(`${label}의 blocks는 배열이어야 합니다`)
  blocks.forEach((block, index) => {
    const name = `${label}의 ${index + 1}번째 블록`
    if (!block || typeof block !== 'object' || Array.isArray(block)) throw new Error(`${name}은 객체여야 합니다`)
    if (!CASE_BLOCK_TYPES.includes(block.type)) throw new Error(`${name}의 type은 ${CASE_BLOCK_TYPES.join(', ')} 중 하나여야 합니다`)
    if (block.placement !== undefined && !CASE_BLOCK_PLACEMENTS.includes(block.placement)) {
      throw new Error(`${name}의 placement는 ${CASE_BLOCK_PLACEMENTS.join(', ')} 중 하나여야 합니다`)
    }
    for (const key of ['items', 'pins']) {
      if (block[key] !== undefined && !Array.isArray(block[key])) throw new Error(`${name}의 ${key}는 배열이어야 합니다`)
    }
  })
}
