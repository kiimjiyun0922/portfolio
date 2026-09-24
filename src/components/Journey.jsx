import { useRef, useEffect, useState as useS, useState } from 'react'
import { motion } from 'framer-motion'
import SectionWrapper from './ui/SectionWrapper'
import { loadJourneyConfig, trackAction } from '../utils/crypto'

const COLS = 5

function scrollToCompany(id, org) {
  if (org) trackAction('journey', org)
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('ring-1', 'ring-accent/40', 'rounded-xl')
    setTimeout(() => el.classList.remove('ring-1', 'ring-accent/40', 'rounded-xl'), 2000)
  }
}

function Item({ item, i }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.3, delay: i * 0.04 }}
      data-no-global-track
      className="flex flex-col items-center text-center cursor-pointer group"
      onClick={() => scrollToCompany(item.companyId, item.org)}
    >
      <div
        className="w-3 h-3 rounded-full border-2 mb-3 relative z-10 group-hover:scale-150 transition-transform"
        style={{
          borderColor: 'var(--color-accent)',
          backgroundColor: item.current ? 'var(--color-accent)' : '#fbfbf8',
          boxShadow: 'none',
        }}
      />
      <span className="text-[11px] font-mono text-gray-500 mb-1">{item.year}</span>
      <span className="text-[11px] font-semibold text-white leading-tight mb-1 group-hover:text-accent transition-colors">
        {item.org}
      </span>
      <span
        className="text-[9px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
        style={{ color: 'var(--color-gray-500)' }}
      >
        {item.field}
      </span>
      {item.current && (
        <span className="text-[9px] font-bold text-accent mt-1 tracking-wider">NOW</span>
      )}
    </motion.div>
  )
}

function DesktopJourney({ journey }) {
  const containerRef = useRef(null)
  const dotRefs = useRef([])
  const [path, setPath] = useS('')

  const DESKTOP = [...journey].reverse() // chronological
  const rows = []
  for (let i = 0; i < DESKTOP.length; i += COLS) rows.push(DESKTOP.slice(i, i + COLS))

  useEffect(() => {
    const update = () => {
      const box = containerRef.current?.getBoundingClientRect()
      if (!box || dotRefs.current.length === 0) return

      const points = dotRefs.current
        .filter(Boolean)
        .map(el => {
          const r = el.getBoundingClientRect()
          return { x: r.left + r.width / 2 - box.left, y: r.top + r.height / 2 - box.top }
        })

      if (points.length < 2) return

      // Build smooth path through all dots
      // Row transitions happen at index multiples of COLS (e.g., 4→5, 9→10)
      let d = `M ${points[0].x} ${points[0].y}`
      for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1]
        const curr = points[i]
        const isRowTransition = (i % COLS === 0)

        if (isRowTransition) {
          // Row change — U-turn curve that swings outside the grid edge
          // Push control points outward: if both are on the right side, swing further right
          const boxW = box.width
          const isRightSide = prev.x > boxW / 2
          const bulge = isRightSide ? 120 : -120 // swing outward from the grid
          const cpX = prev.x + bulge
          d += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`
        } else {
          // Same row — straight line
          d += ` L ${curr.x} ${curr.y}`
        }
      }
      setPath(d)
    }

    update()
    window.addEventListener('resize', update)
    const timer = setTimeout(update, 500) // after animations
    return () => { window.removeEventListener('resize', update); clearTimeout(timer) }
  }, [journey, setPath])

  // Flatten items in display order
  let globalIdx = 0

  return (
    <div ref={containerRef} className="hidden md:block max-w-4xl mx-auto relative">
      {/* SVG path overlay */}
      {path && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" fill="none">
          <path d={path} stroke="#aaa79d" strokeWidth="1" strokeLinecap="round" />
        </svg>
      )}

      <div className="relative z-10" style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
        {rows.map((row, ri) => {
          const isReversed = ri % 2 === 1
          const items = isReversed ? [...row].reverse() : row

          return (
            <div key={ri} className="flex justify-between px-[5%]">
              {items.map((item, ci) => {
                const idx = globalIdx++
                const origIdx = ri * COLS + (isReversed ? row.length - 1 - ci : ci)
                return (
                  <div key={ci} style={{ width: `${100 / COLS}%` }} className="flex justify-center">
                    <div className="relative">
                      {/* Invisible dot ref for path calculation */}
                      <div
                        ref={el => { dotRefs.current[origIdx] = el }}
                        className="absolute left-1/2 top-[6px] w-0 h-0 -translate-x-1/2"
                      />
                      <Item item={item} i={idx} />
                    </div>
                  </div>
                )
              })}
              {Array.from({ length: COLS - row.length }).map((_, ci) => (
                <div key={`e-${ci}`} style={{ width: `${100 / COLS}%` }} />
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Journey() {
  const [config] = useState(loadJourneyConfig)
  const JOURNEY = config.items || []

  if (JOURNEY.length === 0) return null

  return (
    <SectionWrapper id="journey">
      <p className="text-accent text-xs font-mono tracking-widest uppercase mb-2">Journey</p>
      <h2 className="text-2xl md:text-3xl font-bold mb-8 md:mb-10">Career Journey</h2>

      {/* Mobile */}
      <div className="md:hidden relative max-w-md mx-auto">
        <div className="absolute left-[11px] top-3 bottom-3 w-px bg-gray-800" />
        {JOURNEY.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: i <= 1 ? 0 : 0.15, x: -16 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: i <= 1 ? 0.4 : 0.8 + i * 0.05, delay: i <= 1 ? i * 0.04 : 0, ease: 'easeOut' }}
            data-no-global-track
            className="relative pl-8 py-3 cursor-pointer"
            onClick={() => scrollToCompany(item.companyId, item.org)}
          >
            <div
              className="absolute left-[5px] top-[18px] w-[13px] h-[13px] rounded-full border-2"
              style={{
                borderColor: 'var(--color-accent)',
                backgroundColor: item.current ? 'var(--color-accent)' : '#fbfbf8',
                boxShadow: 'none',
              }}
            />
            <div className="flex items-center gap-3">
              <span className="text-sm font-mono text-gray-500 shrink-0 w-10">{item.year}</span>
              <span className="text-base font-semibold text-white">{item.org}</span>
              {item.current && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-accent/20 text-accent">NOW</span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="w-10 shrink-0" />
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                style={{ color: 'var(--color-gray-500)' }}
              >
                {item.field}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Desktop */}
      <DesktopJourney journey={JOURNEY} />
    </SectionWrapper>
  )
}
