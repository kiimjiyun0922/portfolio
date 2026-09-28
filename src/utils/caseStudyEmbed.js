// Data contract for an owner-authored full case-study page shown inside the
// project detail route. The HTML lives in Firestore with the project; images
// and video live in Storage and are referenced by their relative paths.

export const CASE_STUDY_HTML_LIMIT = 400 * 1024
const REFERENCE_PATTERN = /\b(?:src|poster)\s*=\s*["']([^"']+)["']/gi
const EXTERNAL_PATTERN = /^(?:[a-z][a-z0-9+.-]*:|\/|#)/i

export function hasCaseStudyHtml(project) {
  return typeof project?.caseStudyHtml === 'string' && project.caseStudyHtml.trim().length > 0
}

// Relative image/video paths the page expects (for example img/hero.jpg).
export function extractCaseStudyAssetPaths(html) {
  const paths = new Set()
  for (const match of String(html || '').matchAll(REFERENCE_PATTERN)) {
    const value = match[1].trim().replace(/^\.\//, '')
    if (value && !EXTERNAL_PATTERN.test(value)) paths.add(value)
  }
  return [...paths]
}

export function isVideoPath(path) {
  return /\.(mp4|webm|mov)$/i.test(String(path || '').split('?')[0])
}

// Keep one row per referenced path, preserving URLs already entered.
export function syncCaseStudyAssets(html, assets = []) {
  const known = new Map((Array.isArray(assets) ? assets : []).map((asset) => [asset?.path, asset?.url || '']))
  return extractCaseStudyAssetPaths(html).map((path) => ({ path, url: known.get(path) || '' }))
}

export function validateCaseStudyEmbed(project, label = '프로젝트') {
  if (project.caseStudyHtml !== undefined && typeof project.caseStudyHtml !== 'string') {
    throw new Error(`${label}의 caseStudyHtml은 문자열이어야 합니다`)
  }
  if (typeof project.caseStudyHtml === 'string' && project.caseStudyHtml.length > CASE_STUDY_HTML_LIMIT) {
    throw new Error(`${label}의 caseStudyHtml은 400KB 이하여야 합니다`)
  }
  if (project.caseStudyAssets !== undefined) {
    if (!Array.isArray(project.caseStudyAssets)) throw new Error(`${label}의 caseStudyAssets는 배열이어야 합니다`)
    project.caseStudyAssets.forEach((asset, index) => {
      if (!asset || typeof asset.path !== 'string') throw new Error(`${label}의 ${index + 1}번째 caseStudyAssets 항목에 path 문자열이 필요합니다`)
    })
  }
}
