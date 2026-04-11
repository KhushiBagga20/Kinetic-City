import { useEffect } from 'react'
import Lenis from 'lenis'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from './store/useAppStore'

import LandingNavbar from './components/layout/LandingNavbar'
import Hero from './components/landing/Hero'
import Partners from './components/landing/Partners'
import Features from './components/landing/Features'
import Insights from './components/landing/Insights'
import FinalCTA from './components/landing/FinalCTA'
import Footer from './components/layout/Footer'

import DashboardNavbar from './components/layout/DashboardNavbar'
import DashboardMain from './components/dashboard/DashboardMain'

function App() {
  const view = useAppStore(state => state.view)

  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true
    })

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)
    return () => lenis.destroy()
  }, [])

  // Scroll to top when switching views
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [view])

  return (
    <div className="relative min-h-screen bg-[#00161b] text-[rgba(255,255,255,0.65)]">
      <AnimatePresence mode="wait">
        {view === 'dashboard' ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <DashboardNavbar />
            <DashboardMain />
          </motion.div>
        ) : (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="relative"
          >
            {/* Atmospheric top gradient */}
            <div className="fixed top-0 left-0 right-0 h-[50vh] bg-gradient-to-b from-[#152e34]/40 to-transparent pointer-events-none -z-10" />

            <LandingNavbar />
            <main>
              <Hero />
              <Partners />
              <Features />
              <Insights />
              <FinalCTA />
            </main>
            <Footer />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
