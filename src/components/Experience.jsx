import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import SectionWrapper from './ui/SectionWrapper'
import MarkdownRenderer from './ui/MarkdownRenderer'
import { loadResumeConfig, trackAction } from '../utils/crypto'

function ProjectDetail({ project }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="group">
      <button
        onClick={() => {
          if (!open) trackAction('detail', project.title) // track expansions only — that's the interest signal
          setOpen(!open)
        }}
        data-no-global-track
        className="w-full flex items-start gap-2.5 text-left py-2 cursor-pointer"
      >
        <svg
          className={`w-3 h-3 text-gray-600 group-hover:text-accent shrink-0 mt-[3px] transition-all ${open ? 'rotate-90 text-accent' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
        </svg>
        <div className="flex-1 min-w-0">
          <p className="admin-copy text-[13px] font-medium text-gray-300 group-hover:text-white transition-colors leading-snug">{project.title}</p>
          <p className="admin-copy text-[11px] text-gray-600 mt-0.5">{project.period}{project.role && ` · ${project.role}`}{project.team && ` · ${project.team}`}</p>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="pl-4 sm:pl-[22px] pb-4 space-y-3">
              {/* Summary — structured with labels */}
              {project.summary && (
                <div className="space-y-2">
                  <div className="text-xs leading-relaxed text-gray-400">
                    <MarkdownRenderer content={project.summary} />
                  </div>
                </div>
              )}

              {/* Result — box */}
              {project.result && (
                <div className="bg-accent/8 border border-accent/20 rounded-lg px-3 py-2.5">
                  <p className="text-[10px] font-mono text-accent/70 uppercase tracking-wider mb-1.5">Result</p>
                  <div className="text-xs leading-relaxed text-gray-200">
                    <MarkdownRenderer content={project.result} />
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function Experience() {
  const [resume] = useState(loadResumeConfig)
  const hasWork = resume.work?.some((w) => w.company)

  if (!hasWork) return null

  return (
    <SectionWrapper id="experience">
      <p className="text-accent text-xs font-mono tracking-widest uppercase mb-2">Experience</p>
      <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-8 sm:mb-12">Work Experience</h2>

      <div className="experience-ledger max-w-3xl mx-auto relative">
        <div className="experience-list">
          {resume.work.filter((w) => w.company).map((job, i) => (
            <motion.div
              key={i}
              id={`exp-${i}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
              className="experience-entry relative transition-all duration-500"
            >
              <span className="experience-entry__index">{String(i + 1).padStart(2, '0')}</span>

              <div className="experience-entry__identity">
                {/* Period */}
                <p className="admin-copy text-xs font-mono text-gray-500 mb-1">{job.period}</p>

                {/* Company & Title */}
                <h3 className="admin-copy text-base sm:text-lg md:text-xl font-bold text-white">{job.company}</h3>
                <p className="admin-copy text-sm text-accent font-medium mb-1">{job.title}</p>

                {/* Leave note */}
                {job.leaveNote && (
                  <span className="inline-block text-[11px] font-mono text-gray-500 bg-gray-800 px-2 py-0.5 rounded mt-1 mb-2">
                    {job.leaveNote}
                  </span>
                )}
              </div>

              <div className="experience-entry__body">
                {/* Projects — always visible, no toggle */}
                {job.projects?.length > 0 && (
                  <div className="experience-entry__projects space-y-0">
                    {job.projects.map((p, j) => (
                      <ProjectDetail key={j} project={p} />
                    ))}
                  </div>
                )}

                {/* Other projects — markdown */}
                {job.otherProjects && (
                  <div className="experience-entry__other mt-4">
                    <p className="text-[11px] font-mono text-gray-600 uppercase tracking-wider mb-2">Other Tasks</p>
                    <div className="text-xs text-gray-500 leading-relaxed pl-1">
                      <MarkdownRenderer content={job.otherProjects} />
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  )
}
