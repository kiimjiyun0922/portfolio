import { useState } from 'react'
import SectionWrapper from './ui/SectionWrapper'
import ProjectCard from './ProjectCard'
import { loadProjects } from '../data/projects'
import { loadResumeConfig } from '../utils/crypto'
import NotebookOrnaments from './ui/NotebookOrnaments'
import DesignProjects from './DesignProjects'

// Map group title to experience company index
function findExperienceId(groupTitle, work) {
  if (!groupTitle || !work) return null
  const title = groupTitle.toLowerCase()
  const idx = work.findIndex((w) => {
    const company = (w.company || '').toLowerCase()
    return title.includes('line') && company.includes('line')
      || title.includes('29cm') && company.includes('29cm')
      || title.includes('demaecan') && company.includes('line')
      || title.includes('coupang') && company.includes('coupang')
      || title.includes('nhn') && company.includes('nhn')
      || title.includes('yello') && company.includes('yello')
      || title.includes('sk') && company.includes('sk')
  })
  return idx >= 0 ? `exp-${idx}` : null
}

function scrollToExperience(id) {
  if (!id) return
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('experience-entry--linked')
    setTimeout(() => el.classList.remove('experience-entry--linked'), 1800)
  }
}

export default function Projects() {
  const [data] = useState(loadProjects)
  const resume = loadResumeConfig()
  const work = resume.work || []
  const hasContent = data.groups?.some((g) => g.projects?.some((p) => p.title)) || data.designProjects?.some((p) => p.title && p.published)

  if (!hasContent) return null

  return (
    <SectionWrapper id="projects">
      <p className="text-accent text-xs font-mono tracking-widest uppercase mb-2">Projects</p>
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-8 sm:mb-12">Featured Projects</h2>
      <NotebookOrnaments variant="projects" marks={['star', 'clover']} />

      <div className="projects-archive space-y-16">
        {data.groups.map((group, gi) => {
          const explicitExperienceId = typeof group.linkToExperience === 'string' ? group.linkToExperience : null
          const legacyExperienceId = group.linkToExperience === true ? `exp-${gi}` : null
          const expId = explicitExperienceId || legacyExperienceId || findExperienceId(group.title, work)
          return (
          <div key={gi} className="projects-archive-group">
            {/* Group Header */}
            <div className="projects-archive-heading mb-6">
              {expId ? (
                <h3>
                  <button
                    type="button"
                    className="projects-archive-heading__link admin-copy"
                    onClick={() => scrollToExperience(expId)}
                    aria-label={`${group.title} 관련 업무 경험으로 이동`}
                  >
                    {group.title}
                    <span aria-hidden="true">↖</span>
                  </button>
                </h3>
              ) : (
                <h3 className="admin-copy text-lg md:text-xl font-bold text-white">{group.title}</h3>
              )}
              <p className="admin-copy text-sm md:text-base text-gray-500 mt-1">{group.subtitle}</p>
            </div>

            {/* Project Cards Grid */}
            <div className="projects-archive-list grid grid-cols-1 md:grid-cols-2 gap-4">
              {group.projects.map((project, projectIndex) => {
                const span = project.fullWidth ? 'md:col-span-2' : ''
                return (
                  <div key={project.id || `${group.title}-${project.title}-${projectIndex}`} id={project.id ? `project-${project.id}` : undefined} className={`projects-archive-item ${span} transition-all duration-500`}>
                    <ProjectCard project={project} />
                  </div>
                )
              })}
            </div>
          </div>
        )})}
      </div>
      <DesignProjects />
    </SectionWrapper>
  )
}
