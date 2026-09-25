import MarkdownRenderer from './ui/MarkdownRenderer'
import { loadProjects } from '../data/projects'
import { handleInternalNavigation } from '../utils/navigation'
import { ProjectVisual } from './DesignProjects'

const CASE_SECTIONS = [
  ['01', 'Problem', 'problem'],
  ['02', 'IA / User Flow', 'userFlow'],
  ['03', 'Design Solution', 'solution'],
  ['04', 'Validation', 'validation'],
  ['05', 'Design System', 'designSystem'],
]

export default function ProjectDetailPage({ slug }) {
  const data = loadProjects()
  const projects = (data.designProjects || []).filter((project) => project.published)
  const projectIndex = projects.findIndex((project) => project.slug === slug)
  const project = projects[projectIndex]

  if (!project) {
    return (
      <main className="portfolio-subpage project-detail-page">
        <div className="project-detail-missing">
          <p>Project not found</p>
          <a href="/projects" onClick={(event) => handleInternalNavigation(event, '/projects')}>Return to archive</a>
        </div>
      </main>
    )
  }

  const previous = projects[(projectIndex - 1 + projects.length) % projects.length]
  const next = projects[(projectIndex + 1) % projects.length]
  const gallery = project.gallery || []

  return (
    <main className="portfolio-subpage project-detail-page">
      <nav className="portfolio-subpage__nav" aria-label="Page navigation">
        <a href="/" onClick={(event) => handleInternalNavigation(event, '/')}>Portfolio</a>
        <a href="/projects" onClick={(event) => handleInternalNavigation(event, '/projects')}>Design archive</a>
        <span>{project.title}</span>
      </nav>

      <header className="project-detail-hero">
        <div className="project-detail-hero__copy">
          <p>{project.category} · {project.year}</p>
          <h1>{project.title}</h1>
          <p>{project.summary}</p>
        </div>
        <ProjectVisual project={project} />
      </header>

      <dl className="project-detail-meta">
        {project.client && <div><dt>Client</dt><dd>{project.client}</dd></div>}
        {project.role && <div><dt>Role</dt><dd>{project.role}</dd></div>}
        {project.duration && <div><dt>Duration</dt><dd>{project.duration}</dd></div>}
      </dl>

      {project.brief && <section className="project-detail-brief"><h2>Brief</h2><MarkdownRenderer content={project.brief} /></section>}

      <div className="project-detail-story">
        {CASE_SECTIONS.map(([number, label, key]) => project[key] ? (
          <section key={key}>
            <span>{number}</span>
            <h2>{label}</h2>
            <MarkdownRenderer content={project[key]} />
          </section>
        ) : null)}
      </div>

      {gallery.length > 0 && (
        <section className="project-detail-gallery" aria-label="Project gallery">
          {gallery.map((item, index) => (
            <figure key={`${item.url}-${index}`}>
              {item.url ? <img src={item.url} alt={item.alt || ''} loading="lazy" /> : <div className="project-detail-gallery__empty">Image pending</div>}
              {item.caption && <figcaption>{item.caption}</figcaption>}
            </figure>
          ))}
        </section>
      )}

      <nav className="project-detail-next" aria-label="Project navigation">
        {projects.length > 1 && <a href={`/projects/${previous.slug}`} onClick={(event) => handleInternalNavigation(event, `/projects/${previous.slug}`)}><span>Previous</span><strong>{previous.title}</strong></a>}
        <a href="/projects" onClick={(event) => handleInternalNavigation(event, '/projects')}><span>All projects</span></a>
        {projects.length > 1 && <a href={`/projects/${next.slug}`} onClick={(event) => handleInternalNavigation(event, `/projects/${next.slug}`)}><span>Next</span><strong>{next.title}</strong></a>}
      </nav>
    </main>
  )
}

