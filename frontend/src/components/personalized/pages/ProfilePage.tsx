import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useAppStore, type FearType } from '../../../store/useAppStore'
import {
  Flame, Shield, BookOpen, AlertTriangle, Lock, BarChart3, Clock,
  CreditCard, Check, LogOut, Settings, User, Bell, Eye, Trash2,
  Moon, Volume2, Mic, MessageSquare, RefreshCw, Download,
} from 'lucide-react'
import { formatINR } from '../../../lib/formatINR'
import FearQuote from '../shared/FearQuote'

const FEAR_NAMES: Record<FearType, string> = {
  loss: 'Loss Avoider', jargon: 'Clarity Seeker', scam: 'Pattern Detector', trust: 'Independence Guardian',
}
const FEAR_COLORS: Record<FearType, string> = {
  loss: '#E24B4A', jargon: '#378ADD', scam: '#c0f18e', trust: '#1D9E75',
}
const FEAR_ICONS: Record<FearType, typeof Shield> = {
  loss: Shield, jargon: BookOpen, scam: AlertTriangle, trust: Lock,
}
const FEAR_DESCRIPTIONS: Record<FearType, string> = {
  loss: "You're wired to avoid losses more than you chase gains. That instinct protected humans from tigers. In investing, it can stop you from building wealth.",
  jargon: 'Unfamiliar words feel like barriers. Once you decode 3 key terms, investing becomes much more accessible than it seems.',
  scam: "You have sharp pattern recognition. You can spot red flags others miss. Directed at regulated funds, that's a superpower.",
  trust: 'You prefer verified data over human opinions. Index funds were literally built for you — pure math, no people.',
}
const FEAR_STRENGTH: Record<FearType, string[]> = {
  loss: ['Careful with risk', 'Never invests emotionally', 'Holds well through recovery'],
  jargon: ['Asks before acting', 'Values simplicity', 'Learns fast once terms click'],
  scam: ['Reads fine print', 'Verifies before trusting', 'Immune to hype'],
  trust: ['Data-driven', 'Never follows the crowd', 'Prefers algorithm over advice'],
}

/* ── Toggle switch ──────────────────────────────────────────────────────── */
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="relative shrink-0 transition-all duration-300"
      style={{
        width: 44, height: 24, borderRadius: 12,
        background: on ? 'var(--accent)' : 'rgba(255,255,255,0.1)',
      }}
    >
      <motion.div
        animate={{ x: on ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          position: 'absolute', top: 2, width: 20, height: 20,
          borderRadius: '50%', background: on ? '#0a1a00' : 'rgba(255,255,255,0.4)',
        }}
      />
    </button>
  )
}

/* ── Settings row ───────────────────────────────────────────────────────── */
function SettingRow({
  icon: Icon, label, sub, children, color = 'rgba(255,255,255,0.3)',
}: {
  icon: typeof Bell; label: string; sub?: string; children: React.ReactNode; color?: string
}) {
  return (
    <div className="flex items-center justify-between py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <div>
          <p className="font-sans text-[13px] text-white/70">{label}</p>
          {sub && <p className="font-sans text-[11px] text-white/30 mt-0.5">{sub}</p>}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

/* ── Section header ─────────────────────────────────────────────────────── */
function SectionHeader({ label }: { label: string }) {
  return <p className="font-sans text-[10px] font-bold tracking-widest text-white/25 uppercase mb-1 mt-6 first:mt-0">{label}</p>
}

/* ══════════════════════════════════════════════════════════════════════════ */

export default function ProfilePage() {
  const fearType = useAppStore(s => s.fearType) ?? 'loss'
  const rawName = useAppStore(s => s.userName)
  const userName = rawName && rawName !== 'Explorer' ? rawName : ''
  const firstName = userName ? userName.split(' ')[0] : ''
  const streakDays = useAppStore(s => s.streakDays)
  const simulationResult = useAppStore(s => s.simulationResult)
  const timeMachineResult = useAppStore(s => s.timeMachineResult)
  const completedModules = useAppStore(s => s.completedModules)
  const fearProgress = useAppStore(s => s.fearProgress)
  const setDashboardSection = useAppStore(s => s.setDashboardSection)
  const reset = useAppStore(s => s.reset)

  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile')

  // Settings state
  const [darkMode] = useState(true)
  const [kinuVoice, setKinuVoice] = useState(true)
  const [kinuAutoNav, setKinuAutoNav] = useState(true)
  const [marketAlerts, setMarketAlerts] = useState(false)
  const [streakReminders, setStreakReminders] = useState(true)
  const [moduleReminders, setModuleReminders] = useState(true)
  const [showProgress, setShowProgress] = useState(true)
  const [compactCards, setCompactCards] = useState(false)
  const [hapticFeedback, setHapticFeedback] = useState(true)
  const [analyticsOptIn, setAnalyticsOptIn] = useState(true)

  const color = FEAR_COLORS[fearType]
  const FearIcon = FEAR_ICONS[fearType]
  const strengths = FEAR_STRENGTH[fearType]

  const achievements = [
    { label: 'Fear Profiled', done: true, icon: Shield },
    { label: 'First simulation', done: !!simulationResult, icon: BarChart3 },
    { label: 'Survived Time Machine', done: !!timeMachineResult, icon: Clock },
    { label: '5 modules completed', done: completedModules.length >= 5, icon: BookOpen },
    { label: '7-day streak', done: streakDays >= 7, icon: Flame },
    { label: 'Fear Fingerprint created', done: completedModules.includes('card-generated'), icon: CreditCard },
  ]

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'settings', label: 'Settings', icon: Settings },
  ] as const

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="space-y-6 max-w-2xl mx-auto">

      {/* ── Hero card ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01, boxShadow: `0 8px 32px ${color}15` }}
        className="rounded-3xl p-8 border relative overflow-hidden transition-all duration-300"
        style={{ background: 'var(--surface)', borderColor: `${color}30`, borderWidth: '2px' }}
      >
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ background: `radial-gradient(circle at 80% 30%, ${color}, transparent 60%)` }} />
        <div className="absolute right-8 top-8 opacity-[0.06] pointer-events-none">
          <FearIcon style={{ width: 100, height: 100, color }} />
        </div>
        <div className="relative flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-display font-bold text-2xl shrink-0" style={{ background: `${color}15`, color }}>
            {(firstName || FEAR_NAMES[fearType].charAt(0)).charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-white tracking-tight mb-0.5">{userName || FEAR_NAMES[fearType]}</h1>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-3" style={{ background: `${color}10`, borderColor: `${color}30`, color }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
              <span className="font-sans text-xs font-bold tracking-wide">{FEAR_NAMES[fearType]}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                <span className="font-mono text-sm font-bold" style={{ color: 'var(--accent)' }}>{streakDays}</span>
                <span className="font-sans text-xs text-white/30">day streak</span>
              </div>
              <span className="text-white/15">·</span>
              <span className="font-sans text-xs text-white/30">{completedModules.length} modules done</span>
              <span className="text-white/15">·</span>
              <span className="font-sans text-xs text-white/30">{fearProgress}% overcome</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Tabs ───────────────────────────────────────────────────────── */}
      <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'var(--surface)' }}>
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-sans text-sm font-medium transition-all duration-200"
              style={{
                background: isActive ? 'rgba(192,241,142,0.08)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.35)',
                border: isActive ? '1px solid rgba(192,241,142,0.15)' : '1px solid transparent',
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── Tab content ────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {activeTab === 'profile' ? (
          <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-6">

            {/* Fear profile */}
            <div className="rounded-3xl p-7 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <p className="font-sans text-[10px] font-bold tracking-widest text-white/25 uppercase mb-4">Your Fear Profile</p>
              <p className="font-sans text-sm text-white/55 leading-relaxed mb-6">{FEAR_DESCRIPTIONS[fearType]}</p>
              <p className="font-sans text-[10px] font-bold tracking-widest text-white/25 uppercase mb-3">Your strengths as an investor</p>
              <div className="space-y-2">
                {strengths.map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.07 }} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: `${color}12` }}>
                      <Check className="w-3 h-3" style={{ color }} />
                    </div>
                    <span className="font-sans text-sm text-white/55">{s}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <FearQuote context="profile" variant="card" />

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {[
                { label: 'Fear overcome', value: `${fearProgress}%`, color: 'var(--accent)' },
                { label: 'Day streak', value: streakDays.toString(), color: 'var(--accent)' },
                { label: 'Modules done', value: completedModules.length.toString(), color: 'var(--teal)' },
                simulationResult ? { label: 'Median outcome', value: formatINR(simulationResult.p50), color: 'var(--teal)' } : { label: 'Simulation', value: 'Not run', color: 'rgba(255,255,255,0.2)' },
                timeMachineResult ? { label: 'Time Machine', value: timeMachineResult.didWithdraw ? 'Withdrew' : 'Stayed in', color: timeMachineResult.didWithdraw ? 'var(--danger)' : 'var(--teal)' } : { label: 'Time Machine', value: 'Not run', color: 'rgba(255,255,255,0.2)' },
                { label: 'Achievements', value: `${achievements.filter(a => a.done).length}/${achievements.length}`, color: 'var(--accent)' },
              ].map((stat, i) => (
                <motion.div key={i} whileHover={{ scale: 1.03, boxShadow: '0 4px 20px rgba(192,241,142,0.08)' }} className="rounded-2xl p-4 border transition-all duration-200" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <p className="font-sans text-[9px] text-white/25 uppercase tracking-wider mb-1">{stat.label}</p>
                  <p className="font-display font-bold text-xl" style={{ color: stat.color }}>{stat.value}</p>
                </motion.div>
              ))}
            </div>

            {/* Achievements */}
            <div className="rounded-3xl p-7 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <p className="font-sans text-[10px] font-bold tracking-widest text-white/25 uppercase mb-5">Achievements</p>
              <div className="space-y-3">
                {achievements.map((a, i) => {
                  const Icon = a.icon
                  return (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.06 }}
                      className="flex items-center gap-3 p-3 rounded-xl border"
                      style={{ background: a.done ? 'rgba(192,241,142,0.04)' : 'transparent', borderColor: a.done ? 'rgba(192,241,142,0.12)' : 'var(--border)' }}
                    >
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0" style={{ background: a.done ? 'rgba(192,241,142,0.08)' : 'rgba(255,255,255,0.03)' }}>
                        <Icon className="w-4 h-4" style={{ color: a.done ? 'var(--accent)' : 'rgba(255,255,255,0.15)' }} />
                      </div>
                      <span className="font-sans text-sm flex-1" style={{ color: a.done ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.25)' }}>{a.label}</span>
                      {a.done && <Check className="w-4 h-4" style={{ color: 'var(--accent)' }} />}
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Quick links */}
            <div className="rounded-3xl p-7 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <p className="font-sans text-[10px] font-bold tracking-widest text-white/25 uppercase mb-4">Quick Access</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'my-card', label: 'Fear Fingerprint', icon: CreditCard },
                  { id: 'simulation', label: 'My Simulation', icon: BarChart3 },
                  { id: 'time-machine', label: 'Time Machine', icon: Clock },
                  { id: 'learn', label: 'Learn Center', icon: BookOpen },
                ].map(item => {
                  const Icon = item.icon
                  return (
                    <button key={item.id} onClick={() => setDashboardSection(item.id)}
                      className="flex items-center gap-3 p-3.5 rounded-xl border text-left hover:border-white/10 transition-all duration-200"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      <Icon className="w-4 h-4 text-white/25 shrink-0" />
                      <span className="font-sans text-sm text-white/50">{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Reset */}
            <div className="flex justify-center pb-4">
              <button onClick={() => { if (confirm('Reset your journey? This cannot be undone.')) reset() }}
                className="flex items-center gap-2 font-sans text-xs text-white/20 hover:text-[var(--danger)] transition-colors duration-200">
                <LogOut className="w-3.5 h-3.5" />
                Reset my journey
              </button>
            </div>
          </motion.div>

        ) : (
          <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="space-y-4">

            {/* Appearance */}
            <div className="rounded-3xl p-6 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <SectionHeader label="Appearance" />
              <SettingRow icon={Moon} label="Dark Mode" sub="Always on — built for night owls" color="var(--accent)">
                <Toggle on={darkMode} onChange={() => {}} />
              </SettingRow>
              <SettingRow icon={BarChart3} label="Show progress stats" sub="Display % fear overcome across pages" color="var(--teal)">
                <Toggle on={showProgress} onChange={setShowProgress} />
              </SettingRow>
              <SettingRow icon={RefreshCw} label="Compact cards" sub="Reduce card padding on dashboard" color="rgba(255,255,255,0.4)">
                <Toggle on={compactCards} onChange={setCompactCards} />
              </SettingRow>
            </div>

            {/* KINU AI */}
            <div className="rounded-3xl p-6 border" style={{ background: 'var(--surface)', borderColor: 'rgba(192,241,142,0.15)' }}>
              <SectionHeader label="KINU — AI Mentor" />
              <SettingRow icon={Mic} label="Voice input" sub="Use microphone for hands-free queries" color="var(--accent)">
                <Toggle on={kinuVoice} onChange={setKinuVoice} />
              </SettingRow>
              <SettingRow icon={MessageSquare} label="Auto-navigate" sub="Let KINU route you based on your questions" color="var(--accent)">
                <Toggle on={kinuAutoNav} onChange={setKinuAutoNav} />
              </SettingRow>
              <SettingRow icon={Volume2} label="Haptic feedback" sub="Vibrate on voice recognition events" color="rgba(255,255,255,0.4)">
                <Toggle on={hapticFeedback} onChange={setHapticFeedback} />
              </SettingRow>
            </div>

            {/* Notifications */}
            <div className="rounded-3xl p-6 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <SectionHeader label="Notifications" />
              <SettingRow icon={Bell} label="Streak reminders" sub="Daily nudge to keep your streak alive" color="#EF9F27">
                <Toggle on={streakReminders} onChange={setStreakReminders} />
              </SettingRow>
              <SettingRow icon={BookOpen} label="Module reminders" sub="Remind me when a new lesson unlocks" color="var(--teal)">
                <Toggle on={moduleReminders} onChange={setModuleReminders} />
              </SettingRow>
              <SettingRow icon={BarChart3} label="Market alerts" sub="Nifty 50 moves > 1.5% in a day" color="var(--danger)">
                <Toggle on={marketAlerts} onChange={setMarketAlerts} />
              </SettingRow>
            </div>

            {/* Privacy & data */}
            <div className="rounded-3xl p-6 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <SectionHeader label="Privacy & Data" />
              <SettingRow icon={Eye} label="Analytics" sub="Share anonymous usage data to improve the app" color="rgba(255,255,255,0.4)">
                <Toggle on={analyticsOptIn} onChange={setAnalyticsOptIn} />
              </SettingRow>
              <div className="pt-3 flex flex-col gap-2">
                <button className="flex items-center gap-3 py-2.5 px-3 rounded-xl text-left transition-all duration-150 hover:bg-white/5"
                  onClick={() => alert('Export will be available soon.')}>
                  <Download className="w-3.5 h-3.5 text-white/30" />
                  <div>
                    <p className="font-sans text-[13px] text-white/60">Export my data</p>
                    <p className="font-sans text-[11px] text-white/25 mt-0.5">Download a JSON of your progress, goals and streak</p>
                  </div>
                </button>
                <button
                  className="flex items-center gap-3 py-2.5 px-3 rounded-xl text-left transition-all duration-150 hover:bg-red-500/5"
                  onClick={() => { if (confirm('Delete all your data? This cannot be undone.')) reset() }}
                >
                  <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--danger)' }} />
                  <div>
                    <p className="font-sans text-[13px]" style={{ color: 'var(--danger)' }}>Delete all data</p>
                    <p className="font-sans text-[11px] text-white/25 mt-0.5">Wipes progress, goals, and resets the app</p>
                  </div>
                </button>
              </div>
            </div>

            {/* App info */}
            <div className="rounded-2xl px-6 py-4 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <p className="font-display font-bold text-sm text-white/20 tracking-widest">KINETIC</p>
              <p className="font-sans text-[10px] text-white/15 mt-1">v1.0.0 · Built with ♥ for fearless investors</p>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
