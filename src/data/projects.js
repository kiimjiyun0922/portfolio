import { cloudSet, cloudDelete, cloudSaveSnapshot } from '../utils/db'
import { sampleProjects } from './sampleContent'

const STORAGE_KEY = 'portfolio_projects'

// 설치 직후 데모용 샘플 (sampleContent.js). 어드민 저장 후엔 Firestore가 우선.
export const defaultProjects = sampleProjects

export function loadProjects() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      // Validate structure: must have groups array with at least one project
      if (parsed?.groups?.length > 0 && parsed.groups.some((g) => g.projects?.some((p) => p.title))) {
        return {
          ...defaultProjects,
          ...parsed,
          designArchive: { ...defaultProjects.designArchive, ...(parsed.designArchive || {}) },
          // Existing PM data remains authoritative. The design sample is only
          // seeded when this new collection has never been saved before.
          designProjects: Array.isArray(parsed.designProjects) ? parsed.designProjects : defaultProjects.designProjects,
        }
      }
    }
  } catch {
    // ignore
  }
  return defaultProjects
}

export function saveProjects(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  cloudSet('projects', data)
  cloudSaveSnapshot('projects', data)
}

export function resetProjects() {
  localStorage.removeItem(STORAGE_KEY)
  cloudDelete('projects')
}
