import { useState } from 'react'
import { motion } from 'framer-motion'
import SectionWrapper from './ui/SectionWrapper'
import MarkdownRenderer from './ui/MarkdownRenderer'
import NotebookOrnaments from './ui/NotebookOrnaments'
import { loadAboutConfig, loadTaxonomyConfig } from '../utils/crypto'

export default function About() {
  const [config] = useState(loadAboutConfig)
  const [taxonomy] = useState(loadTaxonomyConfig)
  const headingLines = (config.heading || 'Designing the balance\nbetween users and business').split('\n')

  if (!config.bio && (!config.skills || config.skills.length === 0)) return null

  return (
    <SectionWrapper id="about">
      <NotebookOrnaments variant="about" marks={['cross']} />
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
              const category = (taxonomy.categories || []).find((item) => item.key === s.category)
              const color = category?.color || '#6b7280'
              return (
                <span
                  key={i}
                  className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium border"
                  style={{ color, borderColor: `color-mix(in srgb, ${color} 30%, transparent)`, backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)` }}
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
