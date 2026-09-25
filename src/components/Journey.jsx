import { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import SectionWrapper from './ui/SectionWrapper'
import NotebookOrnaments from './ui/NotebookOrnaments'
import { loadJourneyConfig, trackAction } from '../utils/crypto'

function scrollToCompany(id, org) {
  if (org) trackAction('journey', org)
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('ring-1', 'ring-accent/40', 'rounded-xl')
    setTimeout(() => el.classList.remove('ring-1', 'ring-accent/40', 'rounded-xl'), 2000)
  }
}

export default function Journey() {
  const [config] = useState(loadJourneyConfig)
  const reduceMotion = useReducedMotion()
  const journey = config.items || []

  if (journey.length === 0) return null

  return (
    <SectionWrapper id="journey">
      <NotebookOrnaments variant="journey" marks={['dot']} />
      <p className="text-accent text-xs font-mono tracking-widest uppercase mb-2">Journey</p>
      <h2 className="text-2xl md:text-3xl font-bold mb-8 md:mb-10">Career Journey</h2>

      <div className="journey-index max-w-4xl mx-auto">
        {journey.map((item, i) => (
          <motion.button
            key={`${item.year}-${item.org}`}
            type="button"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.38, delay: reduceMotion ? 0 : i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            data-no-global-track
            data-current={item.current ? 'true' : undefined}
            className="journey-index__row group"
            onClick={() => scrollToCompany(item.companyId, item.org)}
          >
            <span className="journey-index__number">{String(i + 1).padStart(2, '0')}</span>
            <span className="journey-index__year">{item.year}</span>
            <span className="admin-copy journey-index__company">{item.org}</span>
            <span className="admin-copy journey-index__field">{item.field}</span>
            {item.current && (
              <span
                className="journey-index__status"
                aria-label="현재 재직 중"
                title="현재 재직 중"
              >
                <i className="journey-index__status-mark" aria-hidden="true" />
                <span aria-hidden="true">Now</span>
              </span>
            )}
          </motion.button>
        ))}
      </div>
    </SectionWrapper>
  )
}
