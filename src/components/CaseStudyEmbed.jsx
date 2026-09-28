import { useEffect, useRef, useState } from 'react'
import { navigateTo } from '../utils/navigation'

const RENDER = 'case-embed:render'
const READY = 'case-embed:ready'
const HEIGHT = 'case-embed:height'
const NAVIGATE = 'case-embed:navigate'

// Shows an owner-authored case-study page with its own design, inside the
// token-protected detail route. The viewer (public/case-embed.html) is
// same-origin so the site CSP still applies; uploaded scripts never run.
export default function CaseStudyEmbed({ project }) {
  const frameRef = useRef(null)
  const [height, setHeight] = useState(1200)

  useEffect(() => {
    const frame = frameRef.current
    const send = () => frame?.contentWindow?.postMessage({
      type: RENDER,
      html: project.caseStudyHtml,
      assets: project.caseStudyAssets || [],
    }, window.location.origin)
    const onMessage = (event) => {
      if (event.origin !== window.location.origin || event.source !== frame?.contentWindow) return
      const { type } = event.data || {}
      if (type === READY) send()
      if (type === HEIGHT && Number.isFinite(event.data.height)) setHeight(Math.max(320, event.data.height))
      if (type === NAVIGATE && typeof event.data.path === 'string' && event.data.path.startsWith('/')) navigateTo(event.data.path)
    }
    window.addEventListener('message', onMessage)
    send()
    return () => window.removeEventListener('message', onMessage)
  }, [project.caseStudyHtml, project.caseStudyAssets])

  return (
    <iframe
      ref={frameRef}
      className="project-detail-embed"
      src="/case-embed.html"
      title={`${project.title || 'Project'} case study`}
      style={{ height }}
      scrolling="no"
    />
  )
}
