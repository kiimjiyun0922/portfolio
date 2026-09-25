import { describe, expect, it } from 'vitest'
import { migrateDesignProjects } from '../../src/data/projects'

describe('design project data migration', () => {
  it('restores sample image fields in the data layer', () => {
    const [project] = migrateDesignProjects([{
      id: 'sample-noma-launch',
      slug: 'sample-noma-launch',
      title: 'NOMA Product Launch',
      coverImage: '',
      coverAlt: '',
    }])

    expect(project.coverImage).toBe('/assets/campaign-noma.webp')
    expect(project.coverAlt).toMatch(/NOMA/)
  })

  it('does not attach sample images to custom projects', () => {
    const [project] = migrateDesignProjects([{
      id: 'custom-project',
      slug: 'custom-project',
      title: 'Custom Project',
      coverImage: '',
    }])

    expect(project.coverImage).toBe('')
  })
})
