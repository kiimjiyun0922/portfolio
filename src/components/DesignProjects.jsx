import { useMemo, useState } from 'react'
import { loadProjects } from '../data/projects'
import { handleInternalNavigation } from '../utils/navigation'

function ProjectVisual({ project, className = '' }) {
  if (!project.coverImage) {
    return <div className={`design-project-visual design-project-visual--empty ${className}`}><span>Image pending</span></div>
  }
  return (
    <div
      className={`design-project-visual ${className}`}
      role="img"
      aria-label={project.coverAlt || `${project.title} cover`}
      style={{
        backgroundImage: `url(${project.coverImage})`,
        backgroundPosition: project.coverPosition || '50% 50%',
        backgroundSize: project.coverMode === 'sheet' ? '200% 200%' : 'cover',
      }}
    />
  )
}

export default function DesignProjects() {
  const data = loadProjects()
  const projects = useMemo(() => (data.designProjects || []).filter((project) => project.published), [data])
  const featured = projects.filter((project) => project.featured)
  const selectedProjects = featured.length ? featured : projects.slice(0, 3)
  const [selectedId, setSelectedId] = useState(selectedProjects[0]?.id)
  const selected = selectedProjects.find((project) => project.id === selectedId) || selectedProjects[0]
  const archive = data.designArchive || {}
  const showArchive = projects.length >= Math.max(1, Number(archive.archiveThreshold) || 4)

  if (!selected) return null

  return (
    <section className="design-projects" aria-labelledby="design-projects-title">
      <header className="design-projects__header">
        <h2 id="design-projects-title">{archive.title || 'Selected Design Work'}</h2>
        {archive.intro && <p>{archive.intro}</p>}
      </header>

      <div className="design-projects__editorial">
        <div className="design-projects__index" aria-label="Selected design projects">
          {selectedProjects.map((project, index) => (
            <button
              key={project.id || project.slug}
              type="button"
              aria-pressed={selected.id === project.id}
              onClick={() => setSelectedId(project.id)}
              className="design-projects__index-row"
            >
              <span>{String(index + 1).padStart(2, '0')}</span>
              <span><strong>{project.title}</strong><small>{project.category} · {project.year}</small></span>
            </button>
          ))}
        </div>

        <article className="design-projects__feature">
          <a href={`/projects/${selected.slug}`} onClick={(event) => handleInternalNavigation(event, `/projects/${selected.slug}`)}>
            <ProjectVisual project={selected} />
          </a>
          <div className="design-projects__feature-copy">
            <div>
              <p>{selected.category} · {selected.year}</p>
              <h3>{selected.title}</h3>
              <p>{selected.summary}</p>
            </div>
            <a className="design-projects__case-link" href={`/projects/${selected.slug}`} onClick={(event) => handleInternalNavigation(event, `/projects/${selected.slug}`)}>
              View case study <span aria-hidden="true">↗</span>
            </a>
          </div>
        </article>
      </div>

      {showArchive && (
        <div className="design-projects__archive-link">
          <a href="/projects" onClick={(event) => handleInternalNavigation(event, '/projects')}>View all design projects <span aria-hidden="true">↗</span></a>
          <span>{String(projects.length).padStart(2, '0')} projects</span>
        </div>
      )}
    </section>
  )
}

export { ProjectVisual }
