import { loadProjects } from '../data/projects'
import { handleInternalNavigation } from '../utils/navigation'
import { ProjectVisual } from './DesignProjects'
import Contact from './Contact'

export default function ProjectArchivePage() {
  const data = loadProjects()
  const projects = (data.designProjects || []).filter((project) => project.published)
  const archive = data.designArchive || {}

  return (
    <>
      <main className="portfolio-subpage project-archive-page">
        <a
          className="project-detail-close"
          href="/"
          aria-label="Close design archive and return to portfolio"
          onClick={(event) => handleInternalNavigation(event, '/')}
        >
          <span>Close</span>
          <i aria-hidden="true" />
        </a>
        <nav className="portfolio-subpage__nav" aria-label="Page navigation">
          <a href="/" onClick={(event) => handleInternalNavigation(event, '/')}>Portfolio</a>
          <span>Design archive</span>
        </nav>
        <header className="portfolio-subpage__header">
          <p>Archive · {String(projects.length).padStart(2, '0')}</p>
          <h1>{archive.title || 'Design Projects'}</h1>
          {archive.intro && <p>{archive.intro}</p>}
        </header>

        {projects.length ? (
          <div className="project-archive-grid">
            {projects.map((project, index) => (
              <article key={project.id || project.slug} className="project-archive-card">
                <a href={`/projects/${project.slug}`} onClick={(event) => handleInternalNavigation(event, `/projects/${project.slug}`)}>
                  <ProjectVisual project={project} />
                  <div className="project-archive-card__copy">
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <div><h2>{project.title}</h2><p>{project.category} · {project.year}</p></div>
                  </div>
                </a>
              </article>
            ))}
          </div>
        ) : (
          <div className="project-archive-empty"><p>Published design projects will appear here.</p></div>
        )}
      </main>
      <Contact />
    </>
  )
}
