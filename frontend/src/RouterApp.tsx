import { Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Lenis from 'lenis'
import { useAppStore } from './store/useAppStore'
import MarketingLanding from './components/marketing/MarketingLanding'
import AppFlow from './App'
import PersonalizedDashboard from './components/personalized/PersonalizedDashboard'
import LoginModal from './components/auth/LoginModal'

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
  const dashboardSection = useAppStore(s => s.dashboardSection)
  const setDashboardSection = useAppStore(s => s.setDashboardSection)
  const activeModuleId = useAppStore(s => s.activeModuleId)
  const setActiveModuleId = useAppStore(s => s.setActiveModuleId)

  // Sync URL to Store (one-way only: URL → Store)
  // The "Store → URL" direction was removed — it created an infinite loop:
  // navigate() → URL change → useEffect re-fires → setDashboardSection → re-render → repeat.
  // Components that want to navigate call navigate() directly (which they already do).
  useEffect(() => {
    if (moduleId) {
      if (dashboardSection !== 'module-reader') setDashboardSection('module-reader')
      if (activeModuleId !== moduleId) setActiveModuleId(moduleId)
    } else if (section) {
      if (section !== dashboardSection) setDashboardSection(section)
      if (activeModuleId !== null) setActiveModuleId(null)
    } else {
      navigate('/dashboard/home', { replace: true })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, moduleId])

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
      <Routes>
        <Route path="/" element={<MarketingLanding />} />
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
