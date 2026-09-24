import { useState } from 'react'
import SectionWrapper from './ui/SectionWrapper'
import ProjectCard from './ProjectCard'
import { loadProjects } from '../data/projects'
import { loadResumeConfig } from '../utils/crypto'
import NotebookOrnaments from './ui/NotebookOrnaments'

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
    el.classList.add('ring-1', 'ring-accent/40', 'rounded-xl')
    setTimeout(() => el.classList.remove('ring-1', 'ring-accent/40', 'rounded-xl'), 2000)
  }
}

export default function Projects() {
  const [data] = useState(loadProjects)
  const resume = loadResumeConfig()
  const work = resume.work || []
  const hasContent = data.groups?.some((g) => g.projects?.some((p) => p.title))

  if (!hasContent) return null

  return (
    <SectionWrapper id="projects">
      <p className="text-accent text-xs font-mono tracking-widest uppercase mb-2">Projects</p>
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-8 sm:mb-12">Featured Projects</h2>
      <NotebookOrnaments variant="projects" marks={['star', 'clover']} />

      <div className="projects-archive space-y-16">
        {data.groups.map((group, gi) => {
          const expId = group.linkToExperience || findExperienceId(group.title, work)
          return (
          <div key={gi} className="projects-archive-group">
            {/* Group Header */}
            <div className="projects-archive-heading mb-6">
              {expId ? (
                <h3
                  className="admin-copy text-lg md:text-xl font-bold text-white inline-flex items-center gap-2 cursor-pointer hover:text-accent transition-colors group"
                  onClick={() => scrollToExperience(expId)}
                >
                  {group.title}
                  <svg className="w-4 h-4 text-gray-600 group-hover:text-accent transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 19.5 15-15m0 0H8.25m11.25 0v11.25" />
                  </svg>
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
    </SectionWrapper>
  )
}
