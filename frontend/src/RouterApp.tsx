import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Lenis from 'lenis'
import { useAppStore } from './store/useAppStore'
import MarketingLanding from './components/marketing/MarketingLanding'
import AppFlow from './App'
import PersonalizedDashboard from './components/personalized/PersonalizedDashboard'
import LoginModal from './components/auth/LoginModal'
import { setLandingTitle } from './lib/pageTitles'

// Thin wrapper so we can set the landing page title without touching MarketingLanding.tsx
function LandingRoute() {
  useEffect(() => { setLandingTitle() }, [])
  return <MarketingLanding />
}

// /start — boot the view-based App in quiz mode
function StartRoute() {
  const setView = useAppStore(s => s.setView)
  useEffect(() => { setView('quiz') }, [setView])
  return <AppFlow />
}

// /dashboard — personalized dashboard, syncs URL param with store and guards if no fearType
function DashboardRoute() {
  const { section, moduleId } = useParams()
  const navigate = useNavigate()
  const fearType = useAppStore(s => s.fearType)
  const setDashboardSection = useAppStore(s => s.setDashboardSection)
  const activeModuleId = useAppStore(s => s.activeModuleId)
  const setActiveModuleId = useAppStore(s => s.setActiveModuleId)

  const isAuthLoading = useAppStore(s => s.isAuthLoading)

  // Sync URL → Store on every URL change. Always call setDashboardSection so
  // we never get stuck with a stale Zustand value vs the URL param.
  useEffect(() => {
    if (moduleId) {
      setDashboardSection('module-reader')
      if (activeModuleId !== moduleId) setActiveModuleId(moduleId)
    } else if (section) {
      setDashboardSection(section)
      if (activeModuleId !== null) setActiveModuleId(null)
    } else {
      navigate('/dashboard/home', { replace: true })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, moduleId])

  if (isAuthLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#00161b]">
        <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-[#00f2fe] animate-spin" />
      </div>
    )
  }

  if (!fearType) return <Navigate to="/start" replace />
  return <PersonalizedDashboard />
}

// /sandbox — jump to dashboard with sandbox section
function SandboxRoute() {
  const fearType = useAppStore(s => s.fearType)
  if (!fearType) return <Navigate to="/start" replace />
  return <Navigate to="/dashboard/sandbox" replace />
}

export default function RouterApp() {
  const [loginOpen, setLoginOpen] = useState(false)
  const [splashDone, setSplashDone] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), 1200)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.08, smoothWheel: true })
    const raf = (t: number) => { lenis.raf(t); requestAnimationFrame(raf) }
    const id = requestAnimationFrame(raf)
    return () => { cancelAnimationFrame(id); lenis.destroy() }
  }, [])

  // Global login modal event listener
  useEffect(() => {
    const handler = () => setLoginOpen(true)
    window.addEventListener('kinetic:open-login', handler)
    return () => window.removeEventListener('kinetic:open-login', handler)
  }, [])

  return (
    <>
      {/* ── Splash screen — shown for 1.2s then fades out ── */}
      <AnimatePresence>
        {!splashDone && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="fixed inset-0 z-[1000] flex flex-col items-center justify-center"
            style={{ background: '#00161b' }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center font-display font-black text-[18px]"
                style={{ background: '#c0f18e', color: '#00161b' }}>
                K
              </div>
              <span className="font-display font-bold text-white text-[28px] tracking-tight">
                KINETIC
              </span>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="font-sans text-[12px] mt-3"
              style={{ color: 'rgba(255,255,255,0.25)' }}
            >
              Overcome your investing fear.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      <Routes>
        <Route path="/" element={<LandingRoute />} />
        <Route path="/start" element={<StartRoute />} />
        <Route path="/dashboard" element={<DashboardRoute />} />
        <Route path="/dashboard/:section" element={<DashboardRoute />} />
        <Route path="/dashboard/module/:moduleId" element={<DashboardRoute />} />
        <Route path="/sandbox" element={<SandboxRoute />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <LoginModal isOpen={loginOpen} onClose={() => setLoginOpen(false)} />
    </>
  )
}
