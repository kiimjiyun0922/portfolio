import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'

const SECTIONS = [
  { id: 'home', label: 'Portfolio', detail: '제품의 문제를 정의하고 결과까지 연결한 작업들' },
  { id: 'about', label: 'About', detail: '사용자와 비즈니스 사이의 균형을 설계합니다' },
  { id: 'journey', label: 'Journey', detail: '지금까지 지나온 제품과 팀의 흐름' },
  { id: 'achievements', label: 'Achievements', detail: '성과로 확인된 주요 변화' },
  { id: 'projects', label: 'Projects', detail: '문제, 선택, 협업, 결과로 정리한 프로젝트' },
  { id: 'experience', label: 'Experience', detail: '역할과 책임이 확장되어 온 과정' },
  { id: 'resume', label: 'Education', detail: '학업과 외부 활동' },
  { id: 'contact', label: 'Contact', detail: '함께 이야기할 수 있는 연락처' },
]

export default function PortfolioRail() {
  const [active, setActive] = useState('home')
  const [open, setOpen] = useState(false)
  const reduceMotion = useReducedMotion()
  const current = SECTIONS.find((section) => section.id === active) || SECTIONS[0]

  useEffect(() => {
    const elements = SECTIONS.map((section) => document.getElementById(section.id)).filter(Boolean)
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
      if (visible) setActive(visible.target.id)
    }, { rootMargin: '-30% 0px -45% 0px', threshold: [0, 0.15, 0.35, 0.6] })

    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [])

  const navigate = (id) => document.getElementById(id)?.scrollIntoView({
    behavior: reduceMotion ? 'auto' : 'smooth',
    block: 'start',
  })

  return (
    <>
      <aside
        className="portfolio-rail"
        aria-label="Portfolio sections"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocusCapture={() => setOpen(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false)
        }}
      >
        <div className="portfolio-rail-ticks">
          {SECTIONS.map((section, index) => (
            <button
              key={section.id}
              type="button"
              aria-label={`${section.label} 섹션으로 이동`}
              aria-current={section.id === active ? 'location' : undefined}
              onClick={() => navigate(section.id)}
              className={`portfolio-rail-tick ${section.id === active ? 'is-active' : ''}`}
              style={{ '--tick-width': `${index % 3 === 0 ? 16 : index % 2 === 0 ? 11 : 7}px` }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {open && (
            <motion.button
              key={current.id}
              type="button"
              onClick={() => navigate(current.id)}
              className="portfolio-rail-card text-left"
              initial={reduceMotion ? false : { opacity: 0, x: -8, filter: 'blur(5px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              exit={reduceMotion ? undefined : { opacity: 0, x: -8, filter: 'blur(4px)' }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="portfolio-rail-label">{current.label}</span>
              <span className="portfolio-rail-detail">{current.detail}</span>
            </motion.button>
          )}
        </AnimatePresence>
      </aside>

      <button type="button" className="portfolio-mobile-status" onClick={() => navigate(current.id)}>
        <span>{current.label}</span>
        <span>{SECTIONS.findIndex((section) => section.id === active) + 1} / {SECTIONS.length}</span>
      </button>
    </>
  )
}
