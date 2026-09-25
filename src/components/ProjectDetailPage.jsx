import { useRef, useState } from 'react'
import MarkdownRenderer from './ui/MarkdownRenderer'
import Contact from './Contact'
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
  const [galleryState, setGalleryState] = useState({ slug, index: 0 })
  const galleryTouchStartX = useRef(null)
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
  const gallery = (project.gallery || []).filter((item) => item.url)
  const activeGalleryIndex = galleryState.slug === slug && galleryState.index < gallery.length ? galleryState.index : 0
  const setActiveGalleryIndex = (index) => setGalleryState({ slug, index })
  const showPreviousImage = () => setActiveGalleryIndex((activeGalleryIndex - 1 + gallery.length) % gallery.length)
  const showNextImage = () => setActiveGalleryIndex((activeGalleryIndex + 1) % gallery.length)
  const handleGalleryTouchEnd = (event) => {
    if (gallery.length < 2 || galleryTouchStartX.current === null) return
    const distance = event.changedTouches[0].clientX - galleryTouchStartX.current
    galleryTouchStartX.current = null
    if (Math.abs(distance) < 48) return
    if (distance < 0) showNextImage()
    else showPreviousImage()
  }
  return (
    <>
      <main className="portfolio-subpage project-detail-page">
      <a
        className="project-detail-close"
        href="/"
        aria-label="Close project and return to portfolio"
        onClick={(event) => handleInternalNavigation(event, '/')}
      >
        <span>Close</span>
        <i aria-hidden="true" />
      </a>
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

      {project.brief && (
        <section className="project-detail-brief">
          <h2>Brief</h2>
          <MarkdownRenderer content={project.brief} />
        </section>
      )}

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
          <div
            className="project-detail-gallery__stage"
            tabIndex={gallery.length > 1 ? 0 : undefined}
            onKeyDown={(event) => {
              if (event.key === 'ArrowLeft') showPreviousImage()
              if (event.key === 'ArrowRight') showNextImage()
            }}
            onTouchStart={(event) => { galleryTouchStartX.current = event.touches[0].clientX }}
            onTouchEnd={handleGalleryTouchEnd}
            aria-label={gallery.length > 1 ? 'Project image gallery. Use left and right arrow keys or swipe.' : undefined}
          >
            <figure key={`${gallery[activeGalleryIndex].url}-${activeGalleryIndex}`}>
              <img src={gallery[activeGalleryIndex].url} alt={gallery[activeGalleryIndex].alt || ''} loading="lazy" />
              {gallery[activeGalleryIndex].caption && <figcaption>{gallery[activeGalleryIndex].caption}</figcaption>}
            </figure>
          </div>
          <div className="project-detail-gallery__controls">
            <span aria-live="polite">{String(activeGalleryIndex + 1).padStart(2, '0')} / {String(gallery.length).padStart(2, '0')}</span>
            <div>
              <button type="button" onClick={showPreviousImage} disabled={gallery.length < 2} aria-label="Previous project image">Previous</button>
              <button type="button" onClick={showNextImage} disabled={gallery.length < 2} aria-label="Next project image">Next</button>
            </div>
          </div>
          {gallery.length > 1 && (
            <div className="project-detail-gallery__thumbs" aria-label="Choose project image">
              {gallery.map((item, index) => (
                <button key={`${item.url}-${index}`} type="button" aria-current={index === activeGalleryIndex ? 'true' : undefined} aria-label={`Show image ${index + 1}`} onClick={() => setActiveGalleryIndex(index)}>
                  <img src={item.url} alt="" loading="lazy" />
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      <nav className="project-detail-next" aria-label="Project navigation">
        {projects.length > 1 && <a href={`/projects/${previous.slug}`} onClick={(event) => handleInternalNavigation(event, `/projects/${previous.slug}`)}><span>Previous</span><strong>{previous.title}</strong></a>}
        <a href="/projects" onClick={(event) => handleInternalNavigation(event, '/projects')}><span>All projects</span></a>
        {projects.length > 1 && <a href={`/projects/${next.slug}`} onClick={(event) => handleInternalNavigation(event, `/projects/${next.slug}`)}><span>Next</span><strong>{next.title}</strong></a>}
      </nav>

      </main>
      <Contact />
    </>
  )
}
