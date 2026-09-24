import { useState } from 'react'
import { loadContactConfig } from '../utils/crypto'

export default function Contact() {
  const [config] = useState(loadContactConfig)

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer id="contact" className="notebook-footer">
      <div className="notebook-footer__column notebook-footer__column--start">
        {config.email && <a href={`mailto:${config.email}`} className="notebook-footer__strong">{config.email}</a>}
      </div>

      <div className="notebook-footer__column notebook-footer__column--center">
        <p className="admin-copy">{config.message}</p>
        {config.linkedinUrl && (
          <a href={config.linkedinUrl} target="_blank" rel="noopener noreferrer" className="notebook-footer__strong">
            {config.linkedinLabel || 'LinkedIn'} ↗
          </a>
        )}
      </div>

      <div className="notebook-footer__column notebook-footer__column--end">
        <button type="button" onClick={scrollToTop} className="notebook-footer__link">
          Back to top <span aria-hidden="true">↑</span>
        </button>
        <p className="admin-copy">{config.copyright}</p>
      </div>
    </footer>
  )
}
