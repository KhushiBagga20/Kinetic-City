import { motion } from 'framer-motion'
import { useAppStore, type FearType } from '../../../store/useAppStore'
import { Flame, Shield, BookOpen, AlertTriangle, Lock, BarChart3, Clock, CreditCard, Check, LogOut } from 'lucide-react'
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
  loss: 'You\'re wired to avoid losses more than you chase gains. That instinct protected humans from tigers. In investing, it can stop you from building wealth.',
  jargon: 'Unfamiliar words feel like barriers. Once you decode 3 key terms, investing becomes much more accessible than it seems.',
  scam: 'You have sharp pattern recognition. You can spot red flags others miss. Directed at regulated funds, that\'s a superpower.',
  trust: 'You prefer verified data over human opinions. Index funds were literally built for you — pure math, no people.',
}
const FEAR_STRENGTH: Record<FearType, string[]> = {
  loss: ['Careful with risk', 'Never invests emotionally', 'Holds well through recovery'],
  jargon: ['Asks before acting', 'Values simplicity', 'Learns fast once terms click'],
  scam: ['Reads fine print', 'Verifies before trusting', 'Immune to hype'],
  trust: ['Data-driven', 'Never follows the crowd', 'Prefers algorithm over advice'],
}

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

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="space-y-6 max-w-2xl mx-auto">

      {/* ── Hero card ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-8 border relative overflow-hidden"
        style={{ background: 'var(--surface)', borderColor: `${color}30`, borderWidth: '2px' }}
      >
        {/* Background glow */}
        <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ background: `radial-gradient(circle at 80% 30%, ${color}, transparent 60%)` }} />
        <div className="absolute right-8 top-8 opacity-[0.06] pointer-events-none">
          <FearIcon style={{ width: 100, height: 100, color }} />
        </div>

        <div className="relative flex items-start gap-5">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-display font-bold text-2xl shrink-0" style={{ background: `${color}15`, color }}>
            {(firstName || FEAR_NAMES[fearType].charAt(0)).charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="font-display font-bold text-2xl text-white tracking-tight mb-0.5">{userName || FEAR_NAMES[fearType]}</h1>
            {/* Fear badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-3"
              style={{ background: `${color}10`, borderColor: `${color}30`, color }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
              <span className="font-sans text-xs font-bold tracking-wide">{FEAR_NAMES[fearType]}</span>
            </div>
            {/* Streak */}
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

      {/* ── Fear profile ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-3xl p-7 border"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <p className="font-sans text-[10px] font-bold tracking-widest text-white/25 uppercase mb-4">Your Fear Profile</p>
        <p className="font-sans text-sm text-white/55 leading-relaxed mb-6">{FEAR_DESCRIPTIONS[fearType]}</p>

        <p className="font-sans text-[10px] font-bold tracking-widest text-white/25 uppercase mb-3">Your strengths as an investor</p>
        <div className="space-y-2">
          {strengths.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 + i * 0.07 }}
              className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: `${color}12` }}>
                <Check className="w-3 h-3" style={{ color }} />
              </div>
              <span className="font-sans text-sm text-white/55">{s}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── AI personalised quote ─────────────────────────────────────── */}
      <FearQuote context="profile" variant="card" />

      {/* ── Stats ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="grid grid-cols-2 md:grid-cols-3 gap-3"
      >
        {[
          { label: 'Fear overcome', value: `${fearProgress}%`, color: 'var(--accent)' },
          { label: 'Day streak', value: streakDays.toString(), color: 'var(--accent)' },
          { label: 'Modules done', value: completedModules.length.toString(), color: 'var(--teal)' },
          simulationResult ? { label: 'Median outcome', value: formatINR(simulationResult.p50), color: 'var(--teal)' } : { label: 'Simulation', value: 'Not run', color: 'rgba(255,255,255,0.2)' },
          timeMachineResult ? { label: 'Time Machine', value: timeMachineResult.didWithdraw ? 'Withdrew' : 'Stayed in', color: timeMachineResult.didWithdraw ? 'var(--danger)' : 'var(--teal)' } : { label: 'Time Machine', value: 'Not run', color: 'rgba(255,255,255,0.2)' },
          { label: 'Achievements', value: `${achievements.filter(a => a.done).length}/${achievements.length}`, color: 'var(--accent)' },
        ].map((stat, i) => (
          <div key={i} className="rounded-2xl p-4 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <p className="font-sans text-[9px] text-white/25 uppercase tracking-wider mb-1">{stat.label}</p>
            <p className="font-display font-bold text-xl" style={{ color: stat.color }}>{stat.value}</p>
          </div>
        ))}
      </motion.div>

      {/* ── Achievements ──────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="rounded-3xl p-7 border"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <p className="font-sans text-[10px] font-bold tracking-widest text-white/25 uppercase mb-5">Achievements</p>
        <div className="space-y-3">
          {achievements.map((a, i) => {
            const Icon = a.icon
            return (
              <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.06 }}
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
      </motion.div>

      {/* ── Quick links ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="rounded-3xl p-7 border"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
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
                className="flex items-center gap-3 p-3.5 rounded-xl border text-left hover:border-[var(--border-bright)] transition-[border-color] duration-200"
                style={{ borderColor: 'var(--border)' }}
              >
                <Icon className="w-4 h-4 text-white/25 shrink-0" />
                <span className="font-sans text-sm text-white/50">{item.label}</span>
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* ── Reset / logout ────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="flex justify-center pb-4"
      >
        <button
          onClick={() => { if (confirm('Reset your journey? This cannot be undone.')) reset() }}
          className="flex items-center gap-2 font-sans text-xs text-white/20 hover:text-[var(--danger)] transition-[color] duration-200"
        >
          <LogOut className="w-3.5 h-3.5" />
          Reset my journey
        </button>
      </motion.div>
    </motion.div>
  )
}
