import { motion } from 'framer-motion'
import { useAppStore, type FearType } from '../../../store/useAppStore'
import { ArrowRight, TrendingUp, Shield, BookOpen, Eye, Lock, AlertTriangle, BarChart3 } from 'lucide-react'
import { formatINR } from '../../../lib/formatINR'

// ── Fear-specific stat blocks ───────────────────────────────────────────────

type StatCard = { label: string; value: string; sub?: string; positive?: boolean }

const FEAR_STATS: Record<FearType, StatCard[]> = {
  loss: [
    { label: 'Nifty crash recoveries', value: '100%', sub: 'Every single one', positive: true },
    { label: 'Longest recovery', value: '18 mo', sub: '2008 global crisis' },
    { label: 'COVID crash recovery', value: '6 mo', sub: 'March → Sep 2020', positive: true },
    { label: 'SIP beat lumpsum in 2008', value: '+43%', sub: 'By staying in', positive: true },
  ],
  jargon: [
    { label: 'Terms that matter', value: '3', sub: 'NAV, CAGR, Expense Ratio' },
    { label: 'Minutes to understand SIP', value: '2 min', sub: 'That\'s it. Really.' },
    { label: 'Funds that beat Nifty 50', value: '16%', sub: 'Active funds, 10 yr avg' },
    { label: 'Cost of index fund', value: '₹100/L', sub: '0.10% expense ratio', positive: true },
  ],
  scam: [
    { label: 'Mutual funds regulated by', value: 'SEBI', sub: 'Since 1993', positive: true },
    { label: 'Custodian of your money', value: 'Bank', sub: 'Not the AMC', positive: true },
    { label: 'Funds that ran away', value: '0', sub: 'In SEBI history', positive: true },
    { label: 'Guarantee red flag', value: '40%+', sub: '"Guaranteed returns" = scam' },
  ],
  trust: [
    { label: 'Active funds that lost to Nifty', value: '84%', sub: 'Over 10 years (SPIVA)' },
    { label: 'Index fund expense', value: '0.10%', sub: 'vs 1.5% active', positive: true },
    { label: 'Fee cost over 20 yrs', value: '₹12L', sub: '1.5% vs 0.1% on ₹5K SIP' },
    { label: 'NAV published daily', value: 'AMFI', sub: 'Publicly, always', positive: true },
  ],
}

// ── Fear-specific action cards ──────────────────────────────────────────────

type ActionCard = { id: string; label: string; desc: string; cta: string; icon: typeof Shield; priority: boolean }

const FEAR_ACTIONS: Record<FearType, ActionCard[]> = {
  loss: [
    { id: 'time-machine', label: 'Survive the COVID crash', desc: 'See what ₹500/month through the 2020 crash became. Make the real decision.', cta: 'Start Time Machine', icon: Shield, priority: true },
    { id: 'simulation', label: 'See your worst case', desc: 'Run 600 Monte Carlo scenarios. Know the floor before you invest.', cta: 'Run Simulation', icon: BarChart3, priority: false },
  ],
  jargon: [
    { id: 'learn', label: 'Kill 3 words today', desc: 'SIP, NAV, Expense Ratio. Learn them once, never be confused again.', cta: 'Go to Glossary', icon: BookOpen, priority: true },
    { id: 'kinu', label: 'Ask your dumbest question', desc: 'KINU has no jargon. Ask anything. There are no stupid questions here.', cta: 'Talk to KINU', icon: Eye, priority: false },
  ],
  scam: [
    { id: 'learn', label: 'Take the Red Flag Quiz', desc: 'Can you spot a scam from a real fund? 5 questions, instant feedback.', cta: 'Start Quiz', icon: AlertTriangle, priority: true },
    { id: 'kinu', label: 'Verify anything', desc: 'Tell KINU any fund or offer. He\'ll show you the SEBI data.', cta: 'Ask KINU', icon: Shield, priority: false },
  ],
  trust: [
    { id: 'simulation', label: 'Let the math speak', desc: '600 simulations. No opinions. Just historical data and probability.', cta: 'Run Simulation', icon: BarChart3, priority: true },
    { id: 'learn', label: 'See the fee calculator', desc: 'How much does 1.4% extra in fees cost you over 20 years? The number is ugly.', cta: 'Calculate fees', icon: TrendingUp, priority: false },
  ],
}

// ── Fear-specific insight ───────────────────────────────────────────────────

const FEAR_INSIGHTS: Record<FearType, { headline: string; body: string; source: string }> = {
  loss: {
    headline: 'The Nifty 50 has never not recovered.',
    body: 'Every crash in Indian market history — 2001, 2008, 2011, 2016, 2020 — recovered fully. The investors who came out ahead weren\'t the ones who timed the market. They were the ones who stayed.',
    source: 'NSE India historical data',
  },
  jargon: {
    headline: 'You don\'t need to understand everything.',
    body: 'The smartest investors keep it simple: one index fund, one SIP, one year of patience. The complexity is a sales tactic. You need exactly 3 terms: NAV, CAGR, Expense Ratio.',
    source: 'SPIVA India 2023 Report',
  },
  scam: {
    headline: 'No SEBI-registered mutual fund has ever run away.',
    body: 'Your money doesn\'t sit with the AMC. It\'s held by a custodian bank — like ICICI Bank or HDFC Bank — separate from the fund company. Even if the AMC shut down tomorrow, your money is untouched.',
    source: 'SEBI Mutual Fund Regulations, 1996',
  },
  trust: {
    headline: '84% of active fund managers underperformed the index.',
    body: 'In a 10-year study by SPIVA, 84% of large-cap actively managed funds in India delivered lower returns than the Nifty 50 index. The index doesn\'t have an ego or career risk. It just tracks the market.',
    source: 'SPIVA India Mid-Year 2023',
  },
}

// ── Fear colors ─────────────────────────────────────────────────────────────

const FEAR_COLORS: Record<FearType, string> = {
  loss: '#E24B4A', jargon: '#378ADD', scam: '#c0f18e', trust: '#1D9E75',
}

const FEAR_ICONS: Record<FearType, typeof Shield> = {
  loss: Shield, jargon: BookOpen, scam: AlertTriangle, trust: Lock,
}

// ── Component ───────────────────────────────────────────────────────────────

export default function FearHomePage({ fearType }: { fearType: FearType }) {
  const setDashboardSection = useAppStore(s => s.setDashboardSection)
  const simulationResult = useAppStore(s => s.simulationResult)

  const color = FEAR_COLORS[fearType]
  const stats = FEAR_STATS[fearType]
  const actions = FEAR_ACTIONS[fearType]
  const insight = FEAR_INSIGHTS[fearType]
  const FearIcon = FEAR_ICONS[fearType]

  return (
    <div className="space-y-6">

      {/* ── Stats row ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, duration: 0.4 }}
            className="rounded-2xl p-4 border"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <p className="font-display font-bold text-xl md:text-2xl mb-1" style={{ color: s.positive ? 'var(--accent)' : 'rgba(255,255,255,0.85)' }}>{s.value}</p>
            <p className="font-sans text-xs text-white/50 leading-tight">{s.label}</p>
            {s.sub && <p className="font-sans text-[10px] text-white/25 mt-0.5">{s.sub}</p>}
          </motion.div>
        ))}
      </div>

      {/* ── Main insight ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="rounded-3xl p-7 border relative overflow-hidden"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)', borderLeft: `3px solid ${color}` }}
      >
        <div className="absolute right-6 top-6 opacity-5 pointer-events-none">
          <FearIcon style={{ width: 80, height: 80, color }} />
        </div>
        <div className="relative">
          <p className="font-sans text-[10px] font-bold tracking-widest uppercase mb-3" style={{ color }}>
            Key insight for {fearType === 'loss' ? 'Loss Avoiders' : fearType === 'jargon' ? 'Clarity Seekers' : fearType === 'scam' ? 'Pattern Detectors' : 'Independence Guardians'}
          </p>
          <h3 className="font-display font-bold text-lg text-white mb-3 leading-snug">{insight.headline}</h3>
          <p className="font-sans text-sm text-white/50 leading-relaxed mb-4">{insight.body}</p>
          <p className="font-sans text-[10px] text-white/25 italic">Source: {insight.source}</p>
        </div>
      </motion.div>

      {/* ── Action cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actions.map((action, i) => {
          const Icon = action.icon
          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1, duration: 0.4 }}
              className="rounded-3xl p-6 border cursor-pointer group transition-[border-color] duration-200"
              style={{
                background: action.priority ? `${color}08` : 'var(--surface)',
                borderColor: action.priority ? `${color}25` : 'var(--border)',
              }}
              onClick={() => setDashboardSection(action.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: `${color}15` }}>
                  <Icon className="w-4 h-4" style={{ color }} />
                </div>
                {action.priority && (
                  <span className="text-[9px] font-sans font-bold px-2 py-0.5 rounded-full" style={{ background: `${color}15`, color }}>
                    Start here
                  </span>
                )}
              </div>
              <h4 className="font-display font-semibold text-base text-white mb-2">{action.label}</h4>
              <p className="font-sans text-xs text-white/40 leading-relaxed mb-4">{action.desc}</p>
              <div className="flex items-center gap-2" style={{ color }}>
                <span className="font-sans text-xs font-bold">{action.cta}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* ── Simulation summary (if run) ───────────────────────────────── */}
      {simulationResult && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="rounded-2xl p-5 border cursor-pointer group hover:border-[var(--border-bright)] transition-[border-color] duration-200"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          onClick={() => setDashboardSection('simulation')}
        >
          <p className="text-[9px] font-sans font-bold tracking-widest text-white/25 uppercase mb-2">Your last simulation</p>
          <div className="flex items-center justify-between">
            <div className="flex gap-6">
              <div><p className="font-sans text-[10px] text-white/30">Median outcome</p><p className="font-display font-semibold" style={{ color: 'var(--teal)' }}>{formatINR(simulationResult.p50)}</p></div>
              <div><p className="font-sans text-[10px] text-white/30">Bear case</p><p className="font-display font-semibold text-white/60">{formatINR(simulationResult.p10)}</p></div>
              <div><p className="font-sans text-[10px] text-white/30">Bull case</p><p className="font-display font-semibold" style={{ color: 'var(--teal)' }}>{formatINR(simulationResult.p90)}</p></div>
            </div>
            <ArrowRight className="w-4 h-4 text-white/20 group-hover:text-white/40 group-hover:translate-x-1 transition-all duration-200" />
          </div>
        </motion.div>
      )}
    </div>
  )
}
