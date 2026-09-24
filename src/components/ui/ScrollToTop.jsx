import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ScrollToTop() {
  const [homeVisible, setHomeVisible] = useState(true)
  const [footerVisible, setFooterVisible] = useState(false)

  useEffect(() => {
    const home = document.getElementById('home')
    const footer = document.getElementById('contact')
    if (!home || !footer) return undefined

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.target.id === 'home') setHomeVisible(entry.isIntersecting)
        if (entry.target.id === 'contact') setFooterVisible(entry.isIntersecting)
      })
    }, { threshold: 0.05 })

    observer.observe(home)
    observer.observe(footer)
    return () => observer.disconnect()
  }, [])

  const show = !homeVisible && !footerVisible

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
          <span aria-hidden="true" className="notebook-top-button__index">00</span>
          <span>Top</span>
          <span aria-hidden="true">↑</span>
        </motion.button>
      )}
    </AnimatePresence>
  )
}
