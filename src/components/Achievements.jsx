import { useState } from 'react'
import SectionWrapper from './ui/SectionWrapper'
import MarkdownRenderer from './ui/MarkdownRenderer'
import NotebookOrnaments from './ui/NotebookOrnaments'
import { loadAchievementsConfig } from '../utils/crypto'

function scrollToTarget(linkTo) {
  // Try exact project ID first
  if (linkTo) {
    const el = document.getElementById(`project-${linkTo}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('ring-1', 'ring-accent/40', 'rounded-2xl')
      setTimeout(() => el.classList.remove('ring-1', 'ring-accent/40', 'rounded-2xl'), 2000)
      return
    }
  }
  // Fallback: scroll to projects section
  document.getElementById('projects')?.scrollIntoView({ behavior: 'smooth' })
}

export default function Achievements() {
  const [config] = useState(loadAchievementsConfig)

  if (!config.items || config.items.length === 0) return null

  return (
    <SectionWrapper id="achievements">
      <NotebookOrnaments variant="achievements" marks={['star']} />
      <p className="text-accent text-xs font-mono tracking-widest uppercase mb-2">Achievements</p>
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-8 sm:mb-10">Key Achievements</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {config.items.map((item, i) => (
          <div
            key={i}
            data-note-cursor="VIEW NOTE ↓"
            onClick={() => scrollToTarget(item.linkTo)}
            className="t-card flex items-start gap-3 md:gap-4 bg-gray-900 border border-gray-800 rounded-2xl p-5 md:p-6 hover:border-accent/40 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-accent/5 cursor-pointer"
          >
            <div className="achievement-index shrink-0">{String(i + 1).padStart(2, '0')}</div>
            <div className="flex-1 min-w-0">
              <h4 className="admin-copy text-base font-bold text-white mb-1 leading-snug">{item.title}</h4>
              <div className="text-sm text-gray-400 leading-relaxed"><MarkdownRenderer content={item.description} /></div>
            </div>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}
