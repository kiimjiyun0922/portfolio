import { useRef } from 'react'
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion'

export default function SectionWrapper({ children, className = '', id }) {
  const sectionRef = useRef(null)
  const reduceMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start 96%', 'start 48%'],
  })
  const clipPath = useTransform(scrollYProgress, [0, 1], ['inset(14% 0 0 0)', 'inset(0% 0 0 0)'])
  const y = useTransform(scrollYProgress, [0, 1], [28, 0])

  return (
    <motion.section
      ref={sectionRef}
      id={id}
      style={reduceMotion ? undefined : { clipPath, y }}
      className={`section-wrap px-5 py-20 sm:py-28 md:px-12 lg:px-24 ${className}`}
    >
      {children}
    </motion.section>
  )
}
