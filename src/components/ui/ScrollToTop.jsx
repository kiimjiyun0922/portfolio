import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ScrollToTop() {
  const [homeVisible, setHomeVisible] = useState(true)
  const [footerVisible, setFooterVisible] = useState(false)
  const [hasHome, setHasHome] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    let frame = 0

    const updateVisibility = () => {
      // Lazy page sections may mount after this control. Resolve landmarks on
      // every scheduled pass so archive/detail pages never keep stale nulls.
      const home = document.getElementById('home')
      const footer = document.getElementById('contact')
      const inViewport = (element, clearance = 0) => {
        if (!element) return false
        const rect = element.getBoundingClientRect()
        return rect.top < window.innerHeight + clearance && rect.bottom > -clearance
      }
      setHasHome(Boolean(home))
      setHomeVisible(inViewport(home))
      // Retire the floating control before it can touch the footer. The footer
      // keeps its own Back to top action, so both controls must never coexist.
      setFooterVisible(inViewport(footer, 120))
      // Short archive pages need a usable interval between the reveal point
      // and the footer clearance zone. A 35vh trigger preserves that interval
      // without showing the control near the top of long pages.
      setScrolled(window.scrollY > Math.max(240, Math.min(480, window.innerHeight * .35)))
    }
    const scheduleUpdate = () => {
      window.cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(updateVisibility)
    }
    scheduleUpdate()
    const mutationObserver = new MutationObserver(scheduleUpdate)
    mutationObserver.observe(document.body, { childList: true, subtree: true })
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate)

    return () => {
      window.cancelAnimationFrame(frame)
      mutationObserver.disconnect()
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
    }
  }, [])

  const show = (hasHome ? !homeVisible : scrolled) && !footerVisible

  return (
    <AnimatePresence>
      {show && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.2 }}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="notebook-top-button fixed bottom-4 right-4 md:bottom-6 md:right-6 z-50 cursor-pointer"
          aria-label="Scroll to top"
        >
          <span>Top</span>
          <span aria-hidden="true">↑</span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
