import { useEffect, useState } from 'react'
import { animate, motion, useMotionTemplate, useMotionValue, useReducedMotion } from 'framer-motion'
import { loadHeroConfig, loadResumeConfig } from '../utils/crypto'

export default function Hero() {
  const [hero] = useState(loadHeroConfig)
  const [resume] = useState(loadResumeConfig)
  const reduceMotion = useReducedMotion()
  const focusX = useMotionValue(50)
  const focusY = useMotionValue(48)
  const fogMask = useMotionTemplate`radial-gradient(circle 270px at ${focusX}% ${focusY}%, transparent 0%, rgba(0,0,0,.03) 18%, rgba(0,0,0,.14) 38%, rgba(0,0,0,.42) 66%, rgba(0,0,0,.78) 88%, black 100%)`

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
    if (reduceMotion) {
      focusX.set(50)
      focusY.set(48)
      return undefined
    }
    const horizontal = animate(focusX, [38, 62, 56, 43, 38], {
      duration: 9,
      repeat: Infinity,
      ease: 'easeInOut',
    })
    const vertical = animate(focusY, [50, 40, 57, 45, 50], {
      duration: 11,
      repeat: Infinity,
      ease: 'easeInOut',
    })
    return () => {
      horizontal.stop()
      vertical.stop()
    }
  }, [focusX, focusY, reduceMotion])

  return (
    <section id="home" className="t-hero relative min-h-[100dvh] flex flex-col items-center justify-center px-5 text-center overflow-hidden">
      <div className="mist-hero-title relative" aria-label="Portfolio">
        <motion.span
          initial={reduceMotion ? false : { opacity: 0, filter: 'blur(16px)', letterSpacing: '0.13em' }}
          animate={{ opacity: 1, filter: 'blur(0px)', letterSpacing: '0.035em' }}
          transition={{ duration: 1.25, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
        >PORTFOLIO</motion.span>
      </div>

      <div className="notebook-ornaments notebook-ornaments--hero" aria-hidden="true">
        <i className="notebook-mark notebook-mark--star" />
        <i className="notebook-mark notebook-mark--dot" />
        <i className="notebook-mark notebook-mark--cross" />
        <i className="notebook-mark notebook-mark--clover" />
      </div>

      <motion.div
        aria-hidden="true"
        className="mist-fog-layer absolute inset-0 pointer-events-none"
        style={{ maskImage: fogMask, WebkitMaskImage: fogMask }}
      />

      <div className="mist-hero-footer">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.55 }}
          className="mist-hero-meta text-left"
        >
          <p className="font-semibold">{hero.tagline}</p>
          <h1 className="max-w-[28ch] mt-1 whitespace-pre-line">{hero.headline}</h1>
          <p className="mt-2 text-gray-500 max-w-[34ch]">{hero.subtitle}</p>
        </motion.div>

        <motion.dl
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7 }}
          className="mist-hero-stats"
          aria-label="Portfolio highlights"
        >
          {statItems.map((stat) => (
            <button key={`${stat.label}-${stat.num}`} type="button" onClick={() => scrollTo(stat.link || 'projects')}>
              <dd>{stat.num}</dd>
              <dt>{stat.label}</dt>
            </button>
          ))}
        </motion.dl>
      </div>

    </section>
  )
}
