import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore, type FearType } from '../../store/useAppStore'
import {
  Home, LineChart, Clock, BookOpen, MessageCircle, CreditCard,
  Menu, X, Flame, FlaskConical, Wallet, Sprout, Fingerprint, LogIn, LogOut, ChevronDown
} from 'lucide-react'
import { useState, useEffect } from 'react'
import DashboardHome from './DashboardHome'
import ArjunFloatingButton from './shared/ArjunFloatingButton'
import SimulationPage from './pages/SimulationPage'
import TimeMachinePage from './pages/TimeMachinePage'
import LearnPage from './pages/LearnPage'
import ArjunPage from './pages/ArjunPage'
import MyCardPage from './pages/MyCardPage'
import ProfilePage from './pages/ProfilePage'
import Sandbox from './pages/Sandbox'
import PortfolioPage from './pages/PortfolioPage'
import FearProfilePage from './pages/FearProfilePage'
import HarvestRoom from './pages/HarvestRoom'

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home, tooltip: 'Your dashboard' },
  { id: 'portfolio', label: 'Portfolio', icon: Wallet, tooltip: 'Your investments' },
  { id: 'simulation', label: 'My Simulation', icon: LineChart, tooltip: 'Monte Carlo SIP' },
  { id: 'time-machine', label: 'Time Machine', icon: Clock, tooltip: 'Historical replay' },
  { id: 'sandbox', label: 'Sandbox', icon: FlaskConical, tooltip: 'FY Time Machine' },
  { id: 'harvest', label: 'Harvest Room', icon: Sprout, tooltip: 'Freeform simulator' },
  { id: 'learn', label: 'Learn', icon: BookOpen, tooltip: 'Investing basics' },
  { id: 'fear-profile', label: 'My Fear Profile', icon: Fingerprint, tooltip: 'Your fear type' },
  { id: 'arjun', label: 'Arjun', icon: MessageCircle, tooltip: 'AI mentor' },
  { id: 'my-card', label: 'My Card', icon: CreditCard, tooltip: 'Fear fingerprint' },
]

const FEAR_NAMES: Record<FearType, string> = {
  loss: 'Loss Avoider', jargon: 'Clarity Seeker', scam: 'Pattern Detector', trust: 'Independence Guardian',
}
const FEAR_COLORS: Record<FearType, string> = {
  loss: '#E24B4A', jargon: '#378ADD', scam: '#c0f18e', trust: '#1D9E75',
}

function NavTooltip({ text, show }: { text: string; show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.15 }}
          className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2.5 py-1 rounded-lg whitespace-nowrap pointer-events-none z-50"
          style={{ background: 'rgba(192,241,142,0.10)', border: '1px solid rgba(192,241,142,0.18)' }}
        >
          <span className="font-sans text-[10px]" style={{ color: 'var(--accent)' }}>{text}</span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function PersonalizedDashboard() {
  const dashboardSection = useAppStore(s => s.dashboardSection)
  const setDashboardSection = useAppStore(s => s.setDashboardSection)
  const fearType = useAppStore(s => s.fearType) ?? 'loss'
  const userName = useAppStore(s => s.userName) || ''
  const displayName = userName && userName !== 'Explorer' ? userName.split(' ')[0] : ''
  const streakDays = useAppStore(s => s.streakDays)
  const updateStreak = useAppStore(s => s.updateStreak)

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [hoveredNav, setHoveredNav] = useState<string | null>(null)
  const [streakHover, setStreakHover] = useState(false)
  const [profileDropdown, setProfileDropdown] = useState(false)
  const isAuthenticated = useAppStore(s => s.isAuthenticated)
  const signOut = useAppStore(s => s.signOut)
  const setView = useAppStore(s => s.setView)

  useEffect(() => { updateStreak() }, [updateStreak])

  function renderSection() {
    switch (dashboardSection) {
      case 'home':        return <DashboardHome key="home" />
      case 'portfolio':   return <PortfolioPage key="portfolio" />
      case 'simulation':  return <SimulationPage key="simulation" />
      case 'time-machine':return <TimeMachinePage key="time-machine" />
      case 'sandbox':     return <Sandbox key="sandbox" />
      case 'harvest':     return <HarvestRoom key="harvest" />
      case 'learn':       return <LearnPage key="learn" />
      case 'fear-profile':return <FearProfilePage key="fear-profile" />
      case 'arjun':       return <ArjunPage key="arjun" />
      case 'my-card':     return <MyCardPage key="my-card" />
      case 'profile':     return <ProfilePage key="profile" />
      default:            return <DashboardHome key="home" />
    }
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* ── Fixed Top Navbar ──────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b" style={{ background: 'var(--bg)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="max-w-[1400px] mx-auto px-5 md:px-8 flex items-center justify-between h-[64px]">

          {/* Logo */}
          <h1 className="font-display font-bold text-lg tracking-[0.08em] shrink-0 cursor-pointer"
            onClick={() => setDashboardSection('home')}
            style={{ color: 'var(--accent)' }}>
            KINETIC
          </h1>

          {/* Center nav — desktop */}
          <div className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map(item => {
              const isActive = dashboardSection === item.id
              const isHovered = hoveredNav === item.id
              return (
                <button key={item.id} onClick={() => setDashboardSection(item.id)}
                  onMouseEnter={() => setHoveredNav(item.id)}
                  onMouseLeave={() => setHoveredNav(null)}
                  className="relative px-4 py-2 font-sans text-[13px] font-medium transition-[color] duration-150"
                  style={{ color: isActive ? 'var(--text-primary)' : isHovered ? 'rgba(255,255,255,0.7)' : 'var(--text-secondary)' }}
                >
                  {item.label}
                  {isActive && (
                    <motion.div layoutId="nav-underline" className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full"
                      style={{ background: 'var(--accent)' }} transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                  )}
                  <NavTooltip text={item.tooltip} show={isHovered && !isActive} />
                </button>
              )
            })}
          </div>

          {/* Right — desktop */}
          <div className="hidden lg:flex items-center gap-4 shrink-0">
            {/* Streak */}
            {isAuthenticated && (
              <div className="relative flex items-center gap-1.5 cursor-default"
                onMouseEnter={() => setStreakHover(true)} onMouseLeave={() => setStreakHover(false)}>
                <Flame className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                <span className="font-mono text-[11px] font-bold" style={{ color: 'var(--accent)' }}>{streakDays || 0}</span>
                <NavTooltip text={streakDays > 0 ? `${streakDays} day streak` : 'Visit daily to streak'} show={streakHover} />
              </div>
            )}

            {isAuthenticated ? (
              <>
                {/* Profile button with dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setProfileDropdown(!profileDropdown)}
                    className="relative flex items-center gap-2.5 px-3 py-1.5 rounded-full border transition-[border-color,background-color] duration-200"
                    style={{
                      borderColor: profileDropdown ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)',
                      background: profileDropdown ? 'rgba(255,255,255,0.06)' : 'transparent',
                    }}
                  >
                    <div className="w-6 h-6 rounded-full flex items-center justify-center font-display font-bold text-[11px]"
                      style={{ background: `${FEAR_COLORS[fearType]}18`, color: FEAR_COLORS[fearType] }}>
                      {(displayName || 'K').charAt(0).toUpperCase()}
                    </div>
                    <span className="font-sans text-xs text-white/50">{displayName || FEAR_NAMES[fearType]}</span>
                    <ChevronDown className={`w-3 h-3 text-white/25 transition-transform duration-200 ${profileDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {profileDropdown && (
                      <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="fixed inset-0 z-30" onClick={() => setProfileDropdown(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: -4, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -4, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-2 w-48 rounded-xl border overflow-hidden z-40"
                          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                        >
                          <button
                            onClick={() => { setDashboardSection('profile'); setProfileDropdown(false) }}
                            className="w-full flex items-center gap-2 px-4 py-3 font-sans text-sm text-white/50 hover:text-white/70 hover:bg-white/[0.03] transition-[background-color,color] duration-150 text-left"
                          >
                            My Account
                          </button>
                          <div className="border-t" style={{ borderColor: 'var(--border)' }} />
                          <button
                            onClick={() => { signOut(); setView('landing'); setProfileDropdown(false) }}
                            className="w-full flex items-center gap-2 px-4 py-3 font-sans text-sm text-white/30 hover:text-[var(--danger)] hover:bg-white/[0.03] transition-[background-color,color] duration-150 text-left"
                          >
                            <LogOut className="w-3.5 h-3.5" /> Sign out
                          </button>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Fear badge */}
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-sans font-bold tracking-wide"
                  style={{ background: `${FEAR_COLORS[fearType]}10`, borderColor: `${FEAR_COLORS[fearType]}30`, color: FEAR_COLORS[fearType] }}>
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: FEAR_COLORS[fearType] }} />
                  {FEAR_NAMES[fearType]}
                </div>
              </>
            ) : (
              /* Guest — Sign In ghost button */
              <button
                onClick={() => setDashboardSection('portfolio')}
                className="flex items-center gap-2 px-4 py-2 rounded-full border font-sans text-xs font-medium text-white/50 hover:text-white/70 hover:border-white/15 transition-[border-color,color] duration-200"
                style={{ borderColor: 'var(--border)' }}
              >
                <LogIn className="w-3.5 h-3.5" /> Sign in
              </button>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden w-9 h-9 rounded-xl flex items-center justify-center text-white/50"
            style={{ background: 'rgba(255,255,255,0.04)' }}>
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </nav>

      {/* ── Mobile Drawer ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
            <motion.div initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="lg:hidden fixed top-0 left-0 bottom-0 w-[280px] z-50 border-r p-6 flex flex-col gap-2"
              style={{ background: 'var(--bg)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <h2 className="font-display font-bold text-lg tracking-[0.08em] mb-4" style={{ color: 'var(--accent)' }}>KINETIC</h2>
              {/* Profile row */}
              <button onClick={() => { setDashboardSection('profile'); setMobileMenuOpen(false) }}
                className="flex items-center gap-3 p-3 rounded-xl mb-2 border"
                style={{ borderColor: 'rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-display font-bold"
                  style={{ background: `${FEAR_COLORS[fearType]}18`, color: FEAR_COLORS[fearType] }}>
                  {(displayName || 'K').charAt(0).toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="font-sans text-sm text-white font-medium">{displayName || FEAR_NAMES[fearType]}</p>
                  <p className="font-sans text-[10px]" style={{ color: FEAR_COLORS[fearType] }}>{FEAR_NAMES[fearType]}</p>
                </div>
                <Flame className="w-3.5 h-3.5 ml-auto" style={{ color: 'var(--accent)' }} />
                <span className="font-mono text-[11px]" style={{ color: 'var(--accent)' }}>{streakDays}</span>
              </button>
              <div className="border-b mb-2" style={{ borderColor: 'rgba(255,255,255,0.05)' }} />
              {NAV_ITEMS.map(item => {
                const isActive = dashboardSection === item.id
                const Icon = item.icon
                return (
                  <button key={item.id} onClick={() => { setDashboardSection(item.id); setMobileMenuOpen(false) }}
                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-[background-color,color] duration-200"
                    style={{ background: isActive ? 'rgba(192,241,142,0.07)' : 'transparent', color: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.40)' }}>
                    <Icon className="w-4 h-4" />
                    <span className="font-sans text-sm font-medium">{item.label}</span>
                    <span className="font-sans text-[9px] text-white/20 ml-auto">{item.tooltip}</span>
                  </button>
                )
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <main className="pt-[64px] pb-8 px-5 md:px-8 lg:px-12">
        <div className="max-w-[1200px] mx-auto py-8">
          <AnimatePresence mode="wait">
            {renderSection()}
          </AnimatePresence>
        </div>
      </main>

      {dashboardSection !== 'arjun' && <ArjunFloatingButton />}
    </div>
  )
}
