import { useState } from 'react'
import { motion } from 'framer-motion'
import SectionWrapper from './ui/SectionWrapper'
import MarkdownRenderer from './ui/MarkdownRenderer'
import { loadAboutConfig } from '../utils/crypto'

const SKILL_COLORS = {
  data: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  ux: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  ai: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  ops: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  default: 'bg-gray-800 text-gray-300 border-gray-700',
}

export default function About() {
  const [config] = useState(loadAboutConfig)
  const headingLines = (config.heading || 'Designing the balance\nbetween users and business').split('\n')

  if (!config.bio && (!config.skills || config.skills.length === 0)) return null

  return (
    <SectionWrapper id="about">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-accent text-xs font-mono tracking-widest uppercase mb-2">About</p>
          <h2 className="about-heading text-xl sm:text-2xl md:text-3xl font-bold mb-6 sm:mb-8 leading-snug">
            {headingLines.map((line, index) => (
              <span key={`${line}-${index}`} className="about-heading__line">{line}</span>
            ))}
          </h2>
        </motion.div>

        {/* Profile photo + bio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-5 sm:gap-8 items-stretch mb-8"
        >
          <img
            src="/profile.jpg"
            alt="Profile"
            className="w-32 sm:w-44 md:w-48 rounded-2xl object-cover shrink-0 border border-gray-800 self-start sm:self-stretch"
            onError={(e) => { e.target.style.display = 'none' }}
          />
          {config.bio && (
            <div className="prose-dark flex-1 flex items-center">
              <MarkdownRenderer content={config.bio} />
            </div>
          )}
        </motion.div>

        {config.skills && config.skills.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex flex-wrap gap-2"
          >
            {config.skills.map((skill, i) => {
              const s = typeof skill === 'string' ? { label: skill, category: 'default' } : skill
              const colorCls = SKILL_COLORS[s.category] || SKILL_COLORS.default
              return (
                <span
                  key={i}
                  className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border ${colorCls}`}
                >
                  {s.label}
                </span>
              )
            })}
          </motion.div>
        )}
      </div>
    </SectionWrapper>
  )
}
