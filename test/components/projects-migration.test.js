import { describe, expect, it } from 'vitest'
import { defaultProjects, migrateDesignProjects } from '../../src/data/projects'

describe('design project migration', () => {
  it('fills an empty saved list with the current campaign samples', () => {
    expect(migrateDesignProjects([])).toEqual(defaultProjects.designProjects)
  })

  it('replaces legacy samples without removing custom projects', () => {
    const custom = { id: 'real-project', slug: 'real-project', title: 'Real project' }
    const migrated = migrateDesignProjects([
      { id: 'sample-atlas-system', coverImage: '/assets/design-project-samples.webp' },
      custom,
    ])

    expect(migrated).toHaveLength(defaultProjects.designProjects.length + 1)
    expect(migrated.at(-1)).toBe(custom)
    expect(migrated.some((project) => project.id === 'sample-noma-launch')).toBe(true)
    expect(migrated.some((project) => project.id === 'sample-atlas-system')).toBe(false)
  })

  it('keeps a custom-only list authoritative', () => {
    const custom = [{ id: 'real-project', slug: 'real-project', title: 'Real project' }]
    expect(migrateDesignProjects(custom)).toBe(custom)
  })
})
