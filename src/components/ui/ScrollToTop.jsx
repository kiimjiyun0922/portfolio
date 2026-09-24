import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ScrollToTop() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

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
