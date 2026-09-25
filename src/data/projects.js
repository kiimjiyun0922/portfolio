import { cloudSet, cloudDelete, cloudSaveSnapshot } from '../utils/db'
import { sampleProjects } from './sampleContent'

const STORAGE_KEY = 'portfolio_projects'
const LEGACY_DESIGN_SAMPLE_IDS = new Set([
  'sample-atlas-system',
  'sample-archive-editorial',
  'sample-field-notes',
  'sample-horizon-campaign',
])
const LEGACY_DESIGN_SAMPLE_IMAGE = '/assets/design-project-samples.webp'

// 설치 직후 데모용 샘플 (sampleContent.js). 어드민 저장 후엔 Firestore가 우선.
export const defaultProjects = sampleProjects

const SAMPLE_DESIGN_PROJECTS_BY_KEY = new Map(
  defaultProjects.designProjects.flatMap((project) => [
    [project.id, project],
    [project.slug, project],
  ]),
)

function isLegacyDesignSample(project) {
  return LEGACY_DESIGN_SAMPLE_IDS.has(project?.id)
    || project?.coverImage === LEGACY_DESIGN_SAMPLE_IMAGE
}

function hydrateSampleDesignProject(project) {
  const sample = SAMPLE_DESIGN_PROJECTS_BY_KEY.get(project?.id)
    || SAMPLE_DESIGN_PROJECTS_BY_KEY.get(project?.slug)
  if (!sample) return project

  return {
    ...sample,
    ...project,
    coverImage: project.coverImage?.trim() || sample.coverImage,
    coverAlt: project.coverAlt?.trim() || sample.coverAlt,
    coverPosition: project.coverPosition || sample.coverPosition,
    coverMode: project.coverMode || sample.coverMode,
    gallery: Array.isArray(project.gallery) && project.gallery.length > 0
      ? project.gallery
      : sample.gallery,
  }
}

export function migrateDesignProjects(savedDesignProjects) {
  if (!Array.isArray(savedDesignProjects) || savedDesignProjects.length === 0) {
    return defaultProjects.designProjects
  }

  const retainedProjects = savedDesignProjects.filter((project) => !isLegacyDesignSample(project))
  const customProjects = retainedProjects.map(hydrateSampleDesignProject)
  const hadLegacySamples = retainedProjects.length !== savedDesignProjects.length
  const hydratedSampleData = customProjects.some((project, index) => project !== retainedProjects[index])

  if (!hadLegacySamples) return hydratedSampleData ? customProjects : savedDesignProjects

  const customIds = new Set(customProjects.flatMap((project) => [project.id, project.slug]).filter(Boolean))
  const freshSamples = defaultProjects.designProjects.filter(
    (project) => !customIds.has(project.id) && !customIds.has(project.slug),
  )
  return [...freshSamples, ...customProjects]
}

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
          designProjects: migrateDesignProjects(parsed.designProjects),
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
