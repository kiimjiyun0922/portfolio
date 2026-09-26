import { SYSTEM_ORDER, THEME_SYSTEMS } from '../theme-system-data'

const themeSystemPage = (id) => id === 'mist' ? '/front-system.html' : `/front-system-${id}.html`

export default function ThemeSystemHeader({ themeId, eyebrow, title }) {
  const closeReview = () => {
    if (window.opener && !window.opener.closed) {
      window.opener.focus()
      window.close()
      return
    }
    window.location.assign('/front-systems.html')
  }

  return (
    <header className="system-guide-header">
      <div className="system-guide-header__identity">
        <span>{eyebrow}</span>
        <strong>{title}</strong>
      </div>
      <nav className="system-guide-header__nav" aria-label="테마 디자인 시스템">
        {SYSTEM_ORDER.map((id) => (
          <a
            key={id}
            href={themeSystemPage(id)}
            className={id === themeId ? 'is-current' : ''}
            aria-current={id === themeId ? 'page' : undefined}
          >
            {id === 'mist' ? 'Mist' : THEME_SYSTEMS[id]?.name}
          </a>
        ))}
      </nav>
      <button type="button" className="system-guide-header__close" onClick={closeReview}>
        <span>검토 종료</span><i aria-hidden="true">×</i>
      </button>
    </header>
  )
}
