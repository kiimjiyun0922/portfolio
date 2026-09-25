import { useState } from 'react'
import MarkdownRenderer from './ui/MarkdownRenderer'
import { trackAction } from '../utils/crypto'

const BADGE_STYLES = {
  ai: 'bg-emerald-500/10 text-emerald-400',
  data: 'bg-blue-500/10 text-blue-400',
  ux: 'bg-rose-500/10 text-rose-400',
  ops: 'bg-amber-500/10 text-amber-400',
  default: 'bg-gray-800 text-gray-400',
}

const TABS = [
  { key: 'problem', label: 'Problem' },
  { key: 'solution', label: 'Solution' },
  { key: 'collaboration', label: 'Collab' },
  { key: 'result', label: 'Result' },
]

function StoryTabs({ project }) {
  const availableTabs = TABS.filter((t) => project[t.key])
  const defaultTab = availableTabs.find((t) => t.key === 'result')?.key || availableTabs[0]?.key || 'problem'
  const [active, setActive] = useState(defaultTab)

  if (availableTabs.length === 0) return null

  const isResult = active === 'result'

  return (
    <div className="project-story__inner">
      {project.highlights && project.highlights.length > 0 && (
        <div className="project-story__quicklook" aria-label="Project outcomes at a glance">
          <p>At a glance</p>
          <dl>
            {project.highlights.slice(0, 3).map((highlight, index) => (
              <div key={`${highlight.value}-${highlight.label}-${index}`}>
                <dd>{highlight.value}</dd>
                <dt>{highlight.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      )}
      {/* Tab bar */}
      <div className="project-story__nav flex flex-wrap items-center justify-center gap-0.5 pb-4 mb-5 border-b border-gray-700/40">
        {availableTabs.map((tab, i) => (
          <div key={tab.key} className="flex items-center">
            {i > 0 && <span className="text-gray-600 text-[10px] mx-0.5 select-none">&rarr;</span>}
            <button
              data-no-global-track
              data-active={active === tab.key ? 'true' : undefined}
              onClick={() => { setActive(tab.key); trackAction('tab', `${project.title} · ${tab.label}`) }}
              className={`px-2 sm:px-2.5 py-1.5 text-[11px] sm:text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                active === tab.key
                  ? tab.key === 'result'
                    ? 'text-accent bg-accent/10 ring-1 ring-accent/20'
                    : 'text-white bg-gray-700/50'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          </div>
        ))}
      </div>

      {/* Tab content */}
      {isResult ? (
        <div className="project-story__result space-y-6">
          {/* Highlights — card style */}
          {project.highlights && project.highlights.length > 0 && (
            <div className="project-story__highlights flex flex-wrap justify-center gap-2">
              {project.highlights.map((h, i) => (
                <div key={i} className="project-story__highlight bg-accent/5 border border-accent/15 rounded-lg px-3 sm:px-3.5 py-2 sm:py-2.5 text-center min-w-[70px] sm:min-w-[84px]">
                  <div className="project-story__value t-num text-sm sm:text-base md:text-lg font-bold text-accent leading-tight">{h.value}</div>
                  <div className="project-story__label text-[10px] text-gray-500 mt-0.5">{h.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Result detail */}
          <div className="project-story__copy text-sm md:text-[15px] leading-[1.8] text-gray-300">
            <MarkdownRenderer content={project.result} />
          </div>

              {/* Insight */}
              {project.insight && (
                <div className="project-story__insight bg-gray-900/80 border border-gray-700/40 rounded-lg px-4 py-4">
                  <div className="flex gap-3 items-start">
                    <div>
                  <p className="text-[10px] font-mono text-accent/50 uppercase tracking-wider mb-2">Insight</p>
                  <div className="text-[13px] text-gray-400 leading-[1.7]">
                    <MarkdownRenderer content={project.insight} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="project-story__copy text-sm md:text-[15px] leading-[1.8] text-gray-300">
          <MarkdownRenderer content={project[active]} />
        </div>
      )}
    </div>
  )
}

export default function ProjectCard({ project }) {
  const badgeCls = BADGE_STYLES[project.badgeType] || BADGE_STYLES.default
  const hasStory = project.problem || project.solution || project.collaboration || project.result

  return (
    <div
      data-note-cursor="CASE NOTE ↗"
      className="t-card h-full flex flex-col bg-gray-900 border border-gray-800 rounded-2xl p-5 sm:p-6 md:p-8 hover:border-accent/40 transition-colors duration-300"
    >
      {/* Header */}
      <div>
        <span className={`inline-block text-[11px] font-mono font-medium tracking-wider uppercase px-2.5 py-1 rounded mb-3 ${badgeCls}`}>
          {project.badge}
        </span>
        <h3 className="admin-copy text-lg md:text-xl font-bold text-white mb-2 leading-snug">{project.title}</h3>
        <p className="admin-copy text-sm text-gray-500 leading-relaxed">{project.subtitle}</p>
      </div>

      {/* Story Box */}
      {hasStory && (
        <div className="project-story flex-1 mt-4 sm:mt-6 bg-gray-800/25 border border-gray-800/50 rounded-xl p-4 sm:p-5 md:p-6">
          <StoryTabs project={project} />
        </div>
      )}

      {/* Legacy description fallback */}
      {!hasStory && project.description && (
        <div className="flex-1 mt-6">
          <div className="text-sm md:text-base text-gray-400 leading-relaxed"><MarkdownRenderer content={project.description} /></div>
        </div>
      )}
    </div>
  )
}
