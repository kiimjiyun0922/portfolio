import { useEffect, useState } from 'react'
import { animate, motion, useMotionTemplate, useMotionValue, useReducedMotion } from 'framer-motion'
import { loadHeroConfig, loadResumeConfig } from '../utils/crypto'
import NotebookOrnaments from './ui/NotebookOrnaments'

export default function Hero() {
  const [hero] = useState(loadHeroConfig)
  const [resume] = useState(loadResumeConfig)
  const [isMobile, setIsMobile] = useState(false)
  const reduceMotion = useReducedMotion()
  const fogAX = useMotionValue(18)
  const fogAY = useMotionValue(46)
  const fogBX = useMotionValue(78)
  const fogBY = useMotionValue(50)
  const fogCX = useMotionValue(46)
  const fogCY = useMotionValue(43)
  const fogMask = useMotionTemplate`
    radial-gradient(ellipse clamp(180px, 23vw, 360px) clamp(104px, 13vw, 190px) at ${fogAX}% ${fogAY}%, rgba(0,0,0,.58) 0 10%, rgba(0,0,0,.34) 34%, rgba(0,0,0,.1) 66%, transparent 94%),
    radial-gradient(ellipse clamp(210px, 27vw, 410px) clamp(112px, 14vw, 210px) at ${fogBX}% ${fogBY}%, rgba(0,0,0,.62) 0 10%, rgba(0,0,0,.36) 36%, rgba(0,0,0,.1) 68%, transparent 95%),
    radial-gradient(ellipse clamp(165px, 21vw, 330px) clamp(96px, 12vw, 176px) at ${fogCX}% ${fogCY}%, rgba(0,0,0,.52) 0 8%, rgba(0,0,0,.3) 34%, rgba(0,0,0,.08) 68%, transparent 94%)
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
      fogAX.set(22)
      fogAY.set(isMobile ? 43 : 46)
      fogBX.set(76)
      fogBY.set(isMobile ? 48 : 50)
      fogCX.set(48)
      fogCY.set(isMobile ? 46 : 43)
      return undefined
    }
    const horizontalA = animate(fogAX, [18, 42, 76, 34, 18], {
      duration: 27,
      repeat: Infinity,
      ease: 'easeInOut',
    })
    const verticalA = animate(fogAY, isMobile ? [43, 48, 44, 47, 43] : [46, 51, 45, 49, 46], {
      duration: 21,
      repeat: Infinity,
      ease: 'easeInOut',
    })
    const horizontalB = animate(fogBX, [78, 57, 24, 68, 78], {
      duration: 33,
      repeat: Infinity,
      ease: 'easeInOut',
    })
    const verticalB = animate(fogBY, isMobile ? [48, 44, 49, 45, 48] : [50, 46, 51, 47, 50], {
      duration: 25,
      repeat: Infinity,
      ease: 'easeInOut',
    })
    const horizontalC = animate(fogCX, [46, 72, 38, 16, 46], {
      duration: 38,
      repeat: Infinity,
      ease: 'easeInOut',
    })
    const verticalC = animate(fogCY, isMobile ? [46, 42, 47, 44, 46] : [43, 48, 44, 49, 43], {
      duration: 29,
      repeat: Infinity,
      ease: 'easeInOut',
    })
    return () => {
      horizontalA.stop()
      verticalA.stop()
      horizontalB.stop()
      verticalB.stop()
      horizontalC.stop()
      verticalC.stop()
    }
  }, [fogAX, fogAY, fogBX, fogBY, fogCX, fogCY, isMobile, reduceMotion])

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
          WebkitMaskImage: fogMask,
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
