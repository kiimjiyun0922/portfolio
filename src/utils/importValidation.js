function object(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function validateResumeImport(value) {
  if (!object(value)) throw new Error('올바른 이력서 JSON 형식이 아닙니다')
  for (const key of ['education', 'work', 'activities']) {
    if (value[key] !== undefined && !Array.isArray(value[key])) throw new Error(`${key} 항목은 배열이어야 합니다`)
  }
  if (value.selfIntro !== undefined && typeof value.selfIntro !== 'string') throw new Error('selfIntro 항목은 문자열이어야 합니다')
  return value
}

export function validateProjectsImport(value) {
  if (!object(value) || !Array.isArray(value.groups)) throw new Error('프로젝트 JSON에는 groups 배열이 필요합니다')
  value.groups.forEach((group, groupIndex) => {
    if (!object(group) || !Array.isArray(group.projects)) throw new Error(`${groupIndex + 1}번째 그룹의 projects는 배열이어야 합니다`)
    group.projects.forEach((project, projectIndex) => {
      if (!object(project) || typeof project.title !== 'string') {
        throw new Error(`${groupIndex + 1}번째 그룹의 ${projectIndex + 1}번째 프로젝트에 title 문자열이 필요합니다`)
      }
    })
  })
  return value
}
