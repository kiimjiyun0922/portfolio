import { useEffect, useState } from 'react'
import { animate, motion, useMotionTemplate, useMotionValue, useReducedMotion } from 'framer-motion'
import { loadHeroConfig, loadResumeConfig } from '../utils/crypto'
import NotebookOrnaments from './ui/NotebookOrnaments'

export default function Hero() {
  const [hero] = useState(loadHeroConfig)
  const [resume] = useState(loadResumeConfig)
  const [isMobile, setIsMobile] = useState(false)
  const reduceMotion = useReducedMotion()
  const focusX = useMotionValue(50)
  const focusY = useMotionValue(48)
  const fogMask = useMotionTemplate`
    radial-gradient(ellipse clamp(82px, 12vw, 160px) clamp(66px, 9vw, 120px) at calc(${focusX}% - 7%) calc(${focusY}% + 2%), transparent 0 20%, rgba(0,0,0,.02) 38%, rgba(0,0,0,.1) 58%, rgba(0,0,0,.32) 78%, rgba(0,0,0,.7) 94%, black 100%),
    radial-gradient(ellipse clamp(94px, 14vw, 184px) clamp(74px, 10vw, 132px) at ${focusX}% calc(${focusY}% - 2%), transparent 0 22%, rgba(0,0,0,.02) 40%, rgba(0,0,0,.1) 60%, rgba(0,0,0,.32) 80%, rgba(0,0,0,.7) 94%, black 100%),
    radial-gradient(ellipse clamp(78px, 11vw, 150px) clamp(70px, 9vw, 116px) at calc(${focusX}% + 8%) calc(${focusY}% + 3%), transparent 0 18%, rgba(0,0,0,.02) 36%, rgba(0,0,0,.1) 58%, rgba(0,0,0,.32) 78%, rgba(0,0,0,.7) 94%, black 100%)
  `

  const workYears = (() => {
    const work = resume.work?.filter((item) => item.company && item.period) || []
    let months = 0
    work.forEach((item) => {
      const [startText, endText] = item.period.split('~').map((part) => part.trim())
      const start = startText?.match(/(\d{4})\.(\d{1,2})/)
      const end = endText?.match(/(\d{4})\.(\d{1,2})/)
      if (!start) return
      const startYear = Number(start[1])
      const startMonth = Number(start[2])
      const endYear = end ? Number(end[1]) : new Date().getFullYear()
      const endMonth = end ? Number(end[2]) : new Date().getMonth() + 1
      months += Math.max(0, (endYear - startYear) * 12 + endMonth - startMonth)
    })
    return Math.floor(months / 12)
  })()

  const totalProjects = resume.work?.reduce((sum, item) => {
    const mainProjects = item.projects?.length || 0
    const otherProjects = item.otherProjects ? (item.otherProjects.match(/^- /gm) || []).length : 0
    return sum + mainProjects + otherProjects
  }, 0) || 0

  const computedStats = [
    { num: `${workYears}+`, label: 'Years experience', link: 'journey' },
    { num: `${totalProjects}+`, label: 'Projects', link: 'projects' },
    { num: String(resume.work?.filter((item) => item.company).length || 0), label: 'Companies', link: 'journey' },
  ]
  const statItems = hero.stats?.length > 0 ? hero.stats : computedStats

  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return undefined
    const query = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (reduceMotion) {
      focusX.set(50)
      focusY.set(isMobile ? 43 : 48)
      return undefined
    }
    const horizontal = animate(focusX, [42, 58, 54, 46, 42], {
      duration: 9,
      repeat: Infinity,
      ease: 'easeInOut',
    })
    const vertical = animate(focusY, isMobile ? [43, 39, 47, 41, 43] : [44, 40, 48, 42, 44], {
      duration: 11,
      repeat: Infinity,
      ease: 'easeInOut',
    })
    return () => {
      horizontal.stop()
      vertical.stop()
    }
  }, [focusX, focusY, isMobile, reduceMotion])

  return (
    <section id="home" className="t-hero relative min-h-[100dvh] flex flex-col items-center justify-center px-5 text-center overflow-hidden">
      <div className="mist-hero-lockup">
        <div className="mist-hero-title relative" aria-label="Portfolio">
          <span>PORTFOLIO</span>
        </div>
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.48 }}
          className="mist-hero-intro"
        >
          <p className="admin-copy mist-hero-role">{hero.tagline}</p>
          <h1 className="admin-copy">{hero.headline}</h1>
        </motion.div>
      </div>

      <NotebookOrnaments variant="hero" marks={['star', 'dot', 'cross', 'clover']} />

      <motion.div
        aria-hidden="true"
        className="mist-fog-layer absolute inset-0 pointer-events-none"
        style={{
          maskImage: fogMask,
          maskComposite: 'intersect',
          WebkitMaskImage: fogMask,
          WebkitMaskComposite: 'source-in',
        }}
      />

      <div className="mist-hero-footer">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          className="mist-hero-meta text-left"
        >
          <p className="admin-copy text-gray-500 max-w-[42ch]">{hero.subtitle}</p>
        </motion.div>

        <motion.ul
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="mist-hero-stats"
          aria-label="Portfolio highlights"
        >
          {statItems.map((stat) => (
            <li key={`${stat.label}-${stat.num}`}>
              <button type="button" onClick={() => scrollTo(stat.link || 'projects')}>
                <span className="mist-hero-stat-value">{stat.num}</span>
                <span className="mist-hero-stat-label">{stat.label}</span>
              </button>
            </li>
          ))}
        </motion.ul>
      </div>

    </section>
  )
}
