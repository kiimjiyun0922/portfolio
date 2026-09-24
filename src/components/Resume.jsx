import { motion } from 'framer-motion'
import SectionWrapper from './ui/SectionWrapper'
import { loadResumeConfig } from '../utils/crypto'
import NotebookOrnaments from './ui/NotebookOrnaments'

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5 },
}

export default function Resume() {
  const resume = loadResumeConfig()
  const hasEducation = resume.education?.some((e) => e.school)
  const hasActivities = resume.activities?.some((a) => a.summary)

  if (!hasEducation && !hasActivities) return null

  return (
    <SectionWrapper id="resume">
      <NotebookOrnaments variant="resume" marks={['clover']} />
      <p className="text-accent text-xs font-mono tracking-widest uppercase mb-2">Education</p>
      <h2 className="text-2xl md:text-3xl font-bold mb-12">Education & Activity</h2>

      <div className="resume-sheet max-w-3xl mx-auto space-y-12">
        {/* Education */}
        {hasEducation && (
          <motion.div {...fadeUp} className="resume-block">
            <h3 className="resume-block__heading text-base md:text-lg font-bold text-accent mb-4">
              <span className="resume-index">01</span>
              <span>Education</span>
            </h3>
            <div className="resume-list space-y-3">
              {resume.education.filter((e) => e.school).map((edu, i) => (
                <div key={i} className="resume-education__row bg-gray-900 rounded-xl p-4">
                  <div className="resume-education__copy">
                    <p className="admin-copy text-white font-semibold">{edu.school}</p>
                    {edu.degree && <p className="admin-copy text-gray-400 text-sm">{edu.degree}</p>}
                  </div>
                  <span className="resume-education__period text-gray-500 text-sm">{edu.period}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Activities */}
        {hasActivities && (
          <motion.div {...fadeUp} className="resume-block">
            <h3 className="resume-block__heading text-base md:text-lg font-bold text-accent mb-4">
              <span className="resume-index">02</span>
              <span>Activities</span>
            </h3>
            <div className="resume-list space-y-3">
              {resume.activities.filter((a) => a.summary).map((act, i) => (
                <div key={i} className="resume-activity__row bg-gray-900 rounded-xl p-4">
                    {act.year && <span className="resume-activity__year text-gray-500 text-sm font-mono">{act.year}</span>}
                    {act.category && <span className="resume-activity__category text-accent text-sm font-medium">{act.category}</span>}
                    <div className="resume-activity__copy">
                      <p className="admin-copy text-gray-300 text-sm">{act.summary}</p>
                      {act.detail && <p className="admin-copy text-gray-500 text-xs mt-1">{act.detail}</p>}
                      {act.link && (
                        <a href={act.link} target="_blank" rel="noopener noreferrer" className="text-accent text-xs hover:underline mt-1 inline-block">
                          {act.linkLabel || act.link}
                        </a>
                      )}
                    </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

      </div>
    </SectionWrapper>
  )
}
