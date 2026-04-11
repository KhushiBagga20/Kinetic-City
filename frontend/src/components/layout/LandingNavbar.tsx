import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'

export default function LandingNavbar() {
  const [scrolled, setScrolled] = useState(false)
  const setView = useAppStore(state => state.setView)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <motion.nav
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, ease: "easeOut" as const }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-400 ${
        scrolled
          ? 'bg-[#00161b]/80 backdrop-blur-xl border-b border-white/[0.06] py-4'
          : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-5 bg-[var(--color-primary-fixed)] flex items-center justify-center">
            <div className="w-1.5 h-3.5 bg-[#00161b] skew-x-[15deg]" />
          </div>
          <span className="font-display font-semibold text-lg tracking-widest text-white">
            KINETIC
          </span>
        </div>

        {/* Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {['Market', 'Portfolio', 'Insights', 'Trade'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="font-sans text-sm text-white/55 hover:text-white transition-colors duration-200"
            >
              {item}
            </a>
          ))}
        </div>

        {/* Right */}
        <div className="flex items-center gap-6">
          <a
            href="#login"
            className="hidden md:block font-sans text-sm text-white/55 hover:text-white transition-colors duration-200"
          >
            Login
          </a>
          <button
            onClick={() => setView('dashboard')}
            className="bg-[var(--color-primary-fixed)] hover:bg-[#b4e882] text-[#0a1a00] font-sans font-semibold text-sm px-6 py-2.5 rounded-full transition-all duration-200 box-glow active:scale-[0.97]"
          >
            Get Started
          </button>
        </div>
      </div>
    </motion.nav>
  )
}
