import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, type FearType } from '../../store/useAppStore'
import { useState, useEffect, useRef, useCallback } from 'react'
import DashboardHome from './DashboardHome'
import KinuFloatingButton from './shared/KinuFloatingButton'
import SimulationPage from './pages/SimulationPage'
import TimeMachinePage from './pages/TimeMachinePage'
import LearnPage from './pages/LearnPage'
import KinuPage from './pages/KinuPage'
import MyCardPage from './pages/MyCardPage'
import ProfilePage from './pages/ProfilePage'
import Sandbox from './pages/Sandbox'
import PortfolioPage from './pages/PortfolioPage'
import FearProfilePage from './pages/FearProfilePage'
import HarvestRoom from './pages/HarvestRoom'
import HistoricalSimulators from './pages/HistoricalSimulators'
import ComparePage from './pages/ComparePage'
import CalculatorsPage from './pages/CalculatorsPage'
import { setPageTitle } from '../../lib/pageTitles'
import { getTrackForFear } from '../../lib/curriculumData'
import {
  LineChart, Clock, ChevronDown, ChevronRight, X, User,
  LogOut, LogIn, Fingerprint, CreditCard, Flame, BarChart3, Check,
} from 'lucide-react'

/* ── Constants ─────────────────────────────────────────────────────────────── */

const FEAR_NAMES: Record<FearType, string> = {
  loss: 'Loss Avoider', jargon: 'Clarity Seeker', scam: 'Pattern Detector', trust: 'Independence Guardian',
}
const FEAR_COLORS: Record<FearType, string> = {
  loss: '#E24B4A', jargon: '#378ADD', scam: '#EF9F27', trust: '#1D9E75',
}

const SIMULATE_SECTIONS = ['simulation', 'time-machine', 'sandbox', 'harvest', 'historical']

const SIMULATE_ITEMS = [
  { id: 'simulation',   label: 'My Simulation',  desc: 'Monte Carlo fan chart',                icon: LineChart },
  { id: 'time-machine', label: 'Time Machine',    desc: '₹500 through real market crashes',      icon: Clock },
]

/* ── Active state resolver ─────────────────────────────────────────────────── */

function getActiveTab(section: string): string | null {
  if (section === 'home') return 'home'
  if (SIMULATE_SECTIONS.includes(section)) return 'simulate'
  if (section === 'learn' || section === 'compare' || section === 'calculators') return 'learn'
  if (section === 'kinu') return 'kinu'
  if (section === 'portfolio') return 'portfolio'
  return null
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════════════ */

export default function PersonalizedDashboard() {
  const dashboardSection = useAppStore(s => s.dashboardSection)
  const setDashboardSection = useAppStore(s => s.setDashboardSection)
  const fearType = useAppStore(s => s.fearType) ?? 'loss'
  const userName = useAppStore(s => s.userName) || ''
  const userEmail = useAppStore(s => s.userEmail) || ''
  const displayName = userName && userName !== 'Explorer' ? userName.split(' ')[0] : ''
  const streakDays = useAppStore(s => s.streakDays)
  const updateStreak = useAppStore(s => s.updateStreak)
  const isAuthenticated = useAppStore(s => s.isAuthenticated)
  const signOut = useAppStore(s => s.signOut)
  const setView = useAppStore(s => s.setView)
  const fearProgress = useAppStore(s => s.fearProgress)
  const completedModules = useAppStore(s => s.completedModules)
  // Canonical track IDs for counting — matches LearnPage exactly
  const userTrack = fearType ? getTrackForFear(fearType) : []
  const trackCompletedCount = userTrack.filter(m => (completedModules || []).includes(m.id)).length
  const trackTotalModules = userTrack.length || 10

  useEffect(() => { updateStreak() }, [updateStreak])

  // Set dynamic page title per section
  useEffect(() => { setPageTitle(dashboardSection) }, [dashboardSection])

  /* ── Dropdown state — only one open at a time ─────────────────────── */
  const [openDropdown, setOpenDropdown] = useState<'simulate' | 'profile' | null>(null)
  const [mobileDrawer, setMobileDrawer] = useState(false)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  const activeTab = getActiveTab(dashboardSection)

  /* ── Outside-click for profile dropdown ───────────────────────────── */
  useEffect(() => {
    if (openDropdown !== 'profile') return
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [openDropdown])

  /* ── Simulate hover handlers (150ms close grace period) ──────────── */
  const openSimulate = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
    setOpenDropdown('simulate')
  }, [])

  const scheduleCloseSimulate = useCallback(() => {
    closeTimerRef.current = setTimeout(() => {
      setOpenDropdown(prev => prev === 'simulate' ? null : prev)
    }, 150)
  }, [])

  const keepSimulateOpen = useCallback(() => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current)
  }, [])

  /* ── Navigate helper ──────────────────────────────────────────────── */
  const nav = useCallback((section: string) => {
    setDashboardSection(section)
    setOpenDropdown(null)
    setMobileDrawer(false)
  }, [setDashboardSection])

  /* ── Section renderer ─────────────────────────────────────────────── */
  function renderSection() {
    switch (dashboardSection) {
      case 'home':        return <DashboardHome key="home" />
      case 'portfolio':   return <PortfolioPage key="portfolio" />
      case 'simulation':  return <SimulationPage key="simulation" />
      case 'time-machine':return <TimeMachinePage key="time-machine" />
      case 'sandbox':     return <Sandbox key="sandbox" />
      case 'harvest':     return <HarvestRoom key="harvest" />
      case 'historical':  return <HistoricalSimulators key="historical" />
      case 'learn':       return <LearnPage key="learn" />
      case 'compare':     return <ComparePage key="compare" />
      case 'calculators': return <CalculatorsPage key="calculators" />
      case 'fear-profile':return <FearProfilePage key="fear-profile" />
      case 'kinu':        return <KinuPage key="kinu" />
      case 'my-card':     return <MyCardPage key="my-card" />
      case 'profile':     return <ProfilePage key="profile" />
      default:            return <DashboardHome key="home" />
    }
  }

  /* ── Fear type colour helpers ──────────────────────────────────────── */
  const ftColor = FEAR_COLORS[fearType]
  const initial = (displayName || 'K').charAt(0).toUpperCase()

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* ══════════════════════════════════════════════════════════════════
          NAVBAR — Fixed, 60px, full width
          ══════════════════════════════════════════════════════════════════ */}
      <nav
        className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-between"
        style={{
          height: 60,
          padding: '0 40px',
          background: 'rgba(10,10,15,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* ── Left: KINETIC logo ──────────────────────────────────────── */}
        <button onClick={() => nav('home')} className="flex items-center gap-2 shrink-0">
          <div className="w-[18px] h-[18px] flex items-center justify-center" style={{ background: 'var(--accent)' }}>
            <div className="w-[5px] h-[12px] skew-x-[15deg]" style={{ background: '#00161b' }} />
          </div>
          <span className="font-display font-bold text-[18px] tracking-[0.12em] text-white">KINETIC</span>
        </button>

        {/* ── Centre: Nav items — hidden below md ─────────────────────── */}
        <div className="hidden md:flex items-center justify-center" style={{ gap: 0 }}>
          {/* Home */}
          <NavItem label="Home" active={activeTab === 'home'} onClick={() => nav('home')} />

          {/* Simulate (with dropdown) */}
          <div
            className="relative"
            onMouseEnter={openSimulate}
            onMouseLeave={scheduleCloseSimulate}
          >
            <NavItem
              label="Simulate"
              active={activeTab === 'simulate'}
              hasChevron
              chevronOpen={openDropdown === 'simulate'}
              onClick={() => nav('simulation')}
            />

            {/* Simulate Dropdown */}
            <AnimatePresence>
              {openDropdown === 'simulate' && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="fixed"
                  style={{ top: 60, zIndex: 200 }}
                  onMouseEnter={keepSimulateOpen}
                  onMouseLeave={scheduleCloseSimulate}
                >
                  <div
                    className="mt-2 overflow-hidden"
                    style={{
                      width: 280,
                      background: 'rgba(10,10,15,0.96)',
                      backdropFilter: 'blur(24px)',
                      WebkitBackdropFilter: 'blur(24px)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 16,
                      padding: 8,
                    }}
                  >
                    {SIMULATE_ITEMS.map((item, i) => {
                      const Icon = item.icon
                      return (
                        <div key={item.id}>
                          {i > 0 && <div className="mx-3" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />}
                          <button
                            onClick={() => nav(item.id)}
                            className="w-full flex items-start gap-3 text-left transition-[background-color] duration-150"
                            style={{ padding: '10px 14px', borderRadius: 10 }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <Icon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: 'var(--accent)', strokeWidth: 1 }} />
                            <div>
                              <p className="font-sans text-[14px] text-white leading-tight">{item.label}</p>
                              <p className="font-sans text-[11px] leading-tight mt-0.5" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
                            </div>
                          </button>
                        </div>
                      )
                    })}

                    {/* ── HISTORICAL SIMULATORS divider + grouped item ── */}
                    <div className="mx-3 my-1 flex items-center gap-2">
                      <div className="flex-1" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
                      <span className="font-sans text-[9px] font-bold tracking-[0.15em] text-white/20 uppercase whitespace-nowrap">Historical Simulators</span>
                      <div className="flex-1" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
                    </div>
                    <button
                      onClick={() => nav('historical')}
                      className="w-full flex items-start gap-3 text-left transition-[background-color] duration-150"
                      style={{ padding: '10px 14px', borderRadius: 10 }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      {/* Two overlapping circles icon */}
                      <div className="relative w-4 h-4 mt-0.5 shrink-0">
                        <div className="absolute top-0 left-0 w-3 h-3 rounded-full border" style={{ borderColor: 'var(--accent)', opacity: 0.7 }} />
                        <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border" style={{ borderColor: '#1D9E75', opacity: 0.7 }} />
                      </div>
                      <div className="flex-1">
                        <p className="font-sans text-[14px] text-white leading-tight">Sandbox / Harvest Room</p>
                        <p className="font-sans text-[11px] leading-tight mt-0.5" style={{ color: 'var(--text-secondary)' }}>Invest in any year · Plant money across eras</p>
                      </div>
                      <span className="font-sans text-[9px] px-2 py-0.5 rounded-full mt-0.5 shrink-0" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>2 tools</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Learn */}
          <NavItem label="Learn" active={activeTab === 'learn'} onClick={() => nav('learn')} />

          {/* KINU */}
          <NavItem label="KINU" active={activeTab === 'kinu'} onClick={() => nav('kinu')} />

          {/* Portfolio */}
          <NavItem label="Portfolio" active={activeTab === 'portfolio'} onClick={() => nav('portfolio')} />
        </div>

        {/* ── Right: Profile avatar (desktop) + Hamburger (mobile) ────── */}
        <div className="flex items-center gap-3 shrink-0">

          {/* Profile Avatar — desktop only */}
          <div className="hidden md:block relative" ref={profileRef}>
            <button
              onClick={() => setOpenDropdown(prev => prev === 'profile' ? null : 'profile')}
              className="transition-all duration-150"
              style={{
                width: 36, height: 36, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isAuthenticated ? `${ftColor}33` : 'rgba(255,255,255,0.06)',
                border: `1.5px solid ${isAuthenticated ? `${ftColor}99` : 'rgba(255,255,255,0.15)'}`,
                boxShadow: openDropdown === 'profile' ? `0 0 0 3px ${ftColor}66` : 'none',
              }}
              onMouseEnter={e => {
                if (openDropdown !== 'profile') e.currentTarget.style.boxShadow = `0 0 0 3px ${ftColor}33`
              }}
              onMouseLeave={e => {
                if (openDropdown !== 'profile') e.currentTarget.style.boxShadow = 'none'
              }}
            >
              {isAuthenticated ? (
                <span className="font-display font-medium text-[14px]" style={{ color: ftColor }}>{initial}</span>
              ) : (
                <User className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.35)' }} />
              )}
            </button>

            {/* Profile Dropdown */}
            <AnimatePresence>
              {openDropdown === 'profile' && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.97 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="fixed"
                  style={{ top: 60, right: 40, zIndex: 200 }}
                >
                  <div
                    className="mt-2 overflow-hidden"
                    style={{
                      width: 260,
                      background: 'rgba(10,10,15,0.96)',
                      backdropFilter: 'blur(24px)',
                      WebkitBackdropFilter: 'blur(24px)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 16,
                    }}
                  >
                    {/* Section A — Identity */}
                    <div style={{ padding: '14px 14px 12px' }}>
                      <p className="font-sans font-medium text-[15px] text-white">
                        {displayName || <span style={{ color: 'var(--text-secondary)' }}>Explorer</span>}
                      </p>
                      <p className="font-sans text-[12px] mt-0.5" style={{ color: isAuthenticated ? 'var(--text-secondary)' : 'rgba(255,255,255,0.2)' }}>
                        {isAuthenticated ? (userEmail || 'No email set') : 'Not signed in'}
                      </p>
                      {fearType && isAuthenticated && (
                        <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full"
                          style={{ border: `1px solid ${ftColor}40`, background: `${ftColor}10` }}>
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: ftColor }} />
                          <span className="font-sans text-[11px] font-medium" style={{ color: ftColor }}>{FEAR_NAMES[fearType]}</span>
                        </div>
                      )}
                    </div>

                    <Divider />

                    {/* Section B — Progress */}
                    <div style={{ padding: 8 }}>
                      <ProfileRow icon={<Flame className="w-[14px] h-[14px]" style={{ color: 'var(--accent)' }} />}
                        label="Day streak" value={`${streakDays || 0} days`} onClick={() => nav('fear-profile')} />
                      <ProfileRow icon={<BarChart3 className="w-[14px] h-[14px]" style={{ color: 'var(--teal)' }} />}
                        label="Fear overcome" value={`${fearProgress || 0}%`} onClick={() => nav('fear-profile')} />
                      <ProfileRow icon={<Check className="w-[14px] h-[14px]" style={{ color: 'var(--teal)' }} />}
                        label="Modules done" value={`${trackCompletedCount} of ${trackTotalModules}`} onClick={() => nav('learn')} />
                    </div>

                    <Divider />

                    {/* Section C — Profile links */}
                    <div style={{ padding: 8 }}>
                      <ProfileRow icon={<Fingerprint className="w-[14px] h-[14px]" style={{ color: 'var(--text-secondary)' }} />}
                        label="My Fear Profile" onClick={() => nav('fear-profile')} />
                      <ProfileRow icon={<CreditCard className="w-[14px] h-[14px]" style={{ color: 'var(--text-secondary)' }} />}
                        label="My Kinetic Card" onClick={() => nav('my-card')} />
                    </div>

                    <Divider />

                    {/* Section D — Auth */}
                    <div style={{ padding: 8 }}>
                      {isAuthenticated ? (
                        <button
                          onClick={() => { signOut(); setView('landing'); setOpenDropdown(null) }}
                          className="w-full flex items-center gap-3 text-left transition-[background-color] duration-150"
                          style={{ padding: '8px 10px', borderRadius: 8, color: 'var(--danger)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(226,75,74,0.06)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <LogOut className="w-[14px] h-[14px]" style={{ color: 'var(--danger)' }} />
                          <span className="font-sans text-[13px] font-medium">Sign out</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => nav('portfolio')}
                          className="w-full flex items-center gap-3 text-left transition-[background-color] duration-150"
                          style={{ padding: '8px 10px', borderRadius: 8, color: 'var(--accent)' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <LogIn className="w-[14px] h-[14px]" />
                          <span className="font-sans text-[13px] font-medium">Sign in or create account</span>
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Hamburger — mobile only */}
          <button
            className="md:hidden flex flex-col justify-center items-center"
            style={{ width: 34, height: 34, gap: 4 }}
            onClick={() => setMobileDrawer(true)}
          >
            <span className="block rounded-full" style={{ width: 18, height: 2, background: 'rgba(255,255,255,0.65)' }} />
            <span className="block rounded-full" style={{ width: 18, height: 2, background: 'rgba(255,255,255,0.65)' }} />
            <span className="block rounded-full" style={{ width: 18, height: 2, background: 'rgba(255,255,255,0.65)' }} />
          </button>
        </div>
      </nav>

      {/* ══════════════════════════════════════════════════════════════════
          MOBILE DRAWER — slides from right, 280px
          ══════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {mobileDrawer && (
          <>
            {/* Overlay */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="md:hidden fixed inset-0 z-[199]"
              style={{ background: 'rgba(0,0,0,0.5)' }}
              onClick={() => setMobileDrawer(false)}
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: 280 }} animate={{ x: 0 }} exit={{ x: 280 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="md:hidden fixed top-0 right-0 bottom-0 z-[200] flex flex-col"
              style={{
                width: 280,
                background: 'rgba(10,10,15,0.96)',
                backdropFilter: 'blur(24px)',
                WebkitBackdropFilter: 'blur(24px)',
                borderLeft: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between" style={{ padding: '0 20px', height: 60 }}>
                <span className="font-display font-bold text-[14px] tracking-[0.12em] text-white">KINETIC</span>
                <button onClick={() => setMobileDrawer(false)} className="text-white/50">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

              {/* Nav items */}
              <div className="flex-1 overflow-y-auto" style={{ padding: '8px 12px' }}>
                <MobileNavItem label="Home" active={activeTab === 'home'} onClick={() => nav('home')} />

                {/* Simulate group */}
                <div className="mt-1">
                  <p className="font-sans text-[11px] font-medium uppercase tracking-wider px-3 py-2" style={{ color: 'rgba(255,255,255,0.2)' }}>Simulate</p>
                  {SIMULATE_ITEMS.map(item => (
                    <MobileNavItem key={item.id} label={item.label} active={dashboardSection === item.id} indent onClick={() => nav(item.id)} />
                  ))}
                </div>

                <MobileNavItem label="Learn" active={activeTab === 'learn'} onClick={() => nav('learn')} />
                <MobileNavItem label="KINU" active={activeTab === 'kinu'} onClick={() => nav('kinu')} />
                <MobileNavItem label="Portfolio" active={activeTab === 'portfolio'} onClick={() => nav('portfolio')} />
              </div>

              {/* Bottom: Profile section */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {/* Identity */}
                <div style={{ padding: '14px 16px 10px' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-display font-medium text-[13px]"
                      style={{ background: `${ftColor}25`, border: `1.5px solid ${ftColor}80`, color: ftColor }}>
                      {initial}
                    </div>
                    <div>
                      <p className="font-sans text-[14px] text-white font-medium">{displayName || 'Explorer'}</p>
                      {fearType && (
                        <p className="font-sans text-[11px] mt-0.5" style={{ color: ftColor }}>{FEAR_NAMES[fearType]}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick links */}
                <div style={{ padding: '4px 8px 8px' }}>
                  <MobileNavItem label="My Fear Profile" onClick={() => nav('fear-profile')} />
                  <MobileNavItem label="My Kinetic Card" onClick={() => nav('my-card')} />
                </div>

                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 12px' }} />

                {/* Auth */}
                <div style={{ padding: '8px 12px 16px' }}>
                  {isAuthenticated ? (
                    <button onClick={() => { signOut(); setView('landing'); setMobileDrawer(false) }}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl font-sans text-[13px] font-medium"
                      style={{ color: 'var(--danger)' }}>
                      <LogOut className="w-4 h-4" /> Sign out
                    </button>
                  ) : (
                    <button onClick={() => nav('portfolio')}
                      className="w-full flex items-center gap-3 px-3 py-3 rounded-xl font-sans text-[13px] font-medium"
                      style={{ color: 'var(--accent)' }}>
                      <LogIn className="w-4 h-4" /> Sign in or create account
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════
          MAIN CONTENT — padding-top: 60px for fixed navbar
          ══════════════════════════════════════════════════════════════════ */}
      <main className="pb-8 px-5 md:px-8 lg:px-12" style={{ paddingTop: 60 }}>
        <div className="max-w-[1200px] mx-auto py-8">
          <AnimatePresence mode="wait">
            {renderSection()}
          </AnimatePresence>
        </div>
      </main>

      {dashboardSection !== 'kinu' && <KinuFloatingButton />}
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ══════════════════════════════════════════════════════════════════════════════ */

/** Desktop nav item */
function NavItem({
  label, active, onClick, hasChevron, chevronOpen,
}: {
  label: string; active: boolean; onClick: () => void; hasChevron?: boolean; chevronOpen?: boolean
}) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative font-sans text-[15px] font-medium transition-[color] duration-150 flex items-center"
      style={{
        padding: '0 32px',
        height: 60,
        color: active ? 'var(--accent)' : hovered ? 'rgba(255,255,255,0.85)' : 'var(--text-secondary)',
      }}
    >
      {label}
      {hasChevron && (
        <motion.span
          className="ml-1 inline-flex"
          animate={{ rotate: chevronOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-[10px] h-[10px]" style={{ strokeWidth: 1 }} />
        </motion.span>
      )}
      {/* Active underline — 3px */}
      {active && (
        <span
          className="absolute bottom-0 left-[32px] right-[32px]"
          style={{ height: 3, background: 'var(--accent)' }}
        />
      )}
    </button>
  )
}

/** Profile dropdown row */
function ProfileRow({
  icon, label, value, onClick,
}: {
  icon: React.ReactNode; label: string; value?: string; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 text-left transition-[background-color] duration-150"
      style={{ padding: '8px 10px', borderRadius: 8 }}
      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {icon}
      <span className="font-sans text-[13px] text-white/60 flex-1">{label}</span>
      {value && <span className="font-mono text-[12px] text-white/35">{value}</span>}
      <ChevronRight className="w-3 h-3" style={{ color: 'rgba(255,255,255,0.15)' }} />
    </button>
  )
}

/** Thin divider line */
function Divider() {
  return <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 8px' }} />
}

/** Mobile drawer nav item */
function MobileNavItem({
  label, active, indent, onClick,
}: {
  label: string; active?: boolean; indent?: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left transition-[background-color,color] duration-150"
      style={{
        height: 48,
        display: 'flex',
        alignItems: 'center',
        padding: indent ? '0 16px 0 32px' : '0 16px',
        borderRadius: 10,
        fontSize: indent ? 13 : 15,
        fontWeight: 500,
        color: active ? 'var(--accent)' : 'rgba(255,255,255,0.45)',
        background: active ? 'rgba(192,241,142,0.06)' : 'transparent',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
    >
      {label}
    </button>
  )
}
