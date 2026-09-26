export function downloadJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function importJson(file) {
  return new Promise((resolve, reject) => {
    if (!file || file.size > 2 * 1024 * 1024) {
      reject(new Error('JSON 파일은 2MB 이하여야 합니다.'))
      return
    }
    const reader = new FileReader()
    reader.onload = (event) => {
      try { resolve(validateImportedJson(JSON.parse(event.target.result))) }
      catch (error) { reject(error instanceof Error ? error : new Error('JSON 파싱 실패')) }
    }
    reader.onerror = () => reject(new Error('파일 읽기 실패'))
    reader.readAsText(file)
  })
}

export function validateImportedJson(value) {
  let count = 0
  const visit = (current, depth) => {
    if (depth > 30) throw new Error('JSON 중첩 깊이가 너무 큽니다.')
    if (++count > 50_000) throw new Error('JSON 항목 수가 너무 많습니다.')
    if (!current || typeof current !== 'object') return current
    for (const key of Object.keys(current)) {
      if (['__proto__', 'prototype', 'constructor'].includes(key)) throw new Error('허용되지 않는 JSON 키입니다.')
      visit(current[key], depth + 1)
    }
    return current
  }
  return visit(value, 0)
}

export function summarizeJsonDiff(before, after) {
  const left = before && typeof before === 'object' ? before : {}
  const right = after && typeof after === 'object' ? after : {}
  const keys = new Set([...Object.keys(left), ...Object.keys(right)])
  const summary = { added: [], removed: [], changed: [] }
  for (const key of keys) {
    if (!(key in left)) summary.added.push(key)
    else if (!(key in right)) summary.removed.push(key)
    else if (JSON.stringify(left[key]) !== JSON.stringify(right[key])) summary.changed.push(key)
  }
  return summary
}
