import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Calendar, X } from 'lucide-react'

/* ── Seasonal patterns data ──────────────────────────────────────────────── */

interface Pattern {
  month: string
  short: string
  pattern: string
  direction: 'up' | 'down' | 'flat'
  reliability: 'high' | 'moderate' | 'low'
  insight: string
}

const PATTERNS: Pattern[] = [
  { month: 'January', short: 'Jan', pattern: 'January Effect', direction: 'up', reliability: 'moderate', insight: 'Small-caps tend to outperform in Jan as institutional investors rebalance after tax-loss harvesting in Dec. Nifty has been positive in 16 of last 23 Januaries.' },
  { month: 'February', short: 'Feb', pattern: 'Budget Rally', direction: 'up', reliability: 'moderate', insight: 'Union Budget expectations drive market movement. Pre-budget rally is common, but actual budget day is coin-flip volatile.' },
  { month: 'March', short: 'Mar', pattern: 'FY End Sell-off', direction: 'down', reliability: 'high', insight: 'Tax-loss harvesting, profit booking for FY closing, and FII rebalancing create selling pressure. March has been negative in 14 of last 23 years.' },
  { month: 'April', short: 'Apr', pattern: 'Fresh Money Inflow', direction: 'up', reliability: 'high', insight: 'New FY starts. SIP renewals, fresh mandates, and institutional allocations push markets up. April is historically the strongest month — positive 17 of 23 times.' },
  { month: 'May', short: 'May', pattern: '"Sell in May"', direction: 'down', reliability: 'moderate', insight: 'The global "Sell in May and go away" pattern weakly applies to India. FII flows slow as Western summer begins. Mixed results historically.' },
  { month: 'June', short: 'Jun', pattern: 'Monsoon Watch', direction: 'flat', reliability: 'low', insight: 'Markets watch monsoon forecasts. Good monsoon → rural demand boost → sentiment positive. But correlation is weak in modern Nifty.' },
  { month: 'July', short: 'Jul', pattern: 'Q1 Results', direction: 'up', reliability: 'moderate', insight: 'Q1 earnings season drives stock-specific action. Nifty tends to be flat-to-positive as results provide clarity.' },
  { month: 'August', short: 'Aug', pattern: 'Independence Dip', direction: 'down', reliability: 'low', insight: 'Historically slightly negative. No strong structural reason — likely seasonal low volume. August is the most unpredictable month.' },
  { month: 'September', short: 'Sep', pattern: 'Global Risk-Off', direction: 'down', reliability: 'moderate', insight: 'September is the worst month globally for equities. This pattern holds weakly for Nifty too. FII selling often peaks.' },
  { month: 'October', short: 'Oct', pattern: 'Festive Season', direction: 'up', reliability: 'high', insight: 'Diwali rally is real. Consumer spending, festive demand, and positive sentiment drive markets. Nifty has been positive in 16 of 23 Octobers.' },
  { month: 'November', short: 'Nov', pattern: 'FII Return', direction: 'up', reliability: 'moderate', insight: 'Post-US elections, post-Diwali momentum, and FII flows returning. November tends to be positive but with high variance.' },
  { month: 'December', short: 'Dec', pattern: 'Year-End Rally', direction: 'up', reliability: 'moderate', insight: 'Santa Claus rally effect. Institutional window dressing and optimism for new year. Low volume but positive bias.' },
]

const RELIABILITY_COLORS: Record<string, string> = {
  high: '#1D9E75',
  moderate: 'var(--accent)',
  low: 'rgba(255,255,255,0.25)',
}

const DIRECTION_ICONS: Record<string, string> = {
  up: '↑',
  down: '↓',
  flat: '→',
}

/* ── Component ───────────────────────────────────────────────────────────── */

export default function SeasonalPatterns() {
  const [selected, setSelected] = useState<number | null>(null)
  const currentMonth = new Date().getMonth() // 0-indexed

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="rounded-3xl p-6 border"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-2.5 mb-5">
        <Calendar className="w-4 h-4" style={{ color: 'var(--accent)' }} />
        <h3 className="font-display font-semibold text-base text-white">Market Patterns</h3>
        <span className="font-sans text-[9px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
          Historical
        </span>
      </div>

      {/* 12-month horizontal calendar */}
      <div className="grid grid-cols-6 md:grid-cols-12 gap-1.5 mb-4">
        {PATTERNS.map((p, i) => {
          const isCurrent = i === currentMonth
          const reliabilityColor = RELIABILITY_COLORS[p.reliability]
          return (
            <button
              key={p.short}
              onClick={() => setSelected(selected === i ? null : i)}
              className="relative flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl transition-all duration-200"
              style={{
                background: selected === i ? 'rgba(255,255,255,0.06)' : isCurrent ? 'rgba(192,241,142,0.04)' : 'transparent',
                border: `1px solid ${selected === i ? 'rgba(255,255,255,0.12)' : isCurrent ? 'rgba(192,241,142,0.15)' : 'transparent'}`,
              }}
            >
              <span className="font-sans text-[10px] text-white/30">{p.short}</span>
              <span className="text-xs" style={{ color: reliabilityColor }}>
                {DIRECTION_ICONS[p.direction]}
              </span>
              {isCurrent && (
                <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Pattern pill bar */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {PATTERNS.map((p, i) => (
          <button
            key={i}
            onClick={() => setSelected(selected === i ? null : i)}
            className="px-2.5 py-1 rounded-full font-sans text-[10px] transition-all duration-200"
            style={{
              background: selected === i ? `${RELIABILITY_COLORS[p.reliability]}15` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${selected === i ? `${RELIABILITY_COLORS[p.reliability]}30` : 'rgba(255,255,255,0.06)'}`,
              color: selected === i ? RELIABILITY_COLORS[p.reliability] : 'rgba(255,255,255,0.35)',
            }}
          >
            {p.pattern}
          </button>
        ))}
      </div>

      {/* Detail popover */}
      <AnimatePresence>
        {selected !== null && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div
              className="rounded-2xl p-5 border mt-1"
              style={{
                background: `${RELIABILITY_COLORS[PATTERNS[selected].reliability]}06`,
                borderColor: `${RELIABILITY_COLORS[PATTERNS[selected].reliability]}18`,
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="font-display font-semibold text-sm text-white">{PATTERNS[selected].month}</span>
                  <span className="font-sans text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                    style={{
                      background: `${RELIABILITY_COLORS[PATTERNS[selected].reliability]}15`,
                      color: RELIABILITY_COLORS[PATTERNS[selected].reliability],
                    }}>
                    {PATTERNS[selected].reliability} reliability
                  </span>
                </div>
                <button onClick={() => setSelected(null)} className="text-white/20 hover:text-white/50 transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="font-sans text-sm text-white/50 leading-relaxed">{PATTERNS[selected].insight}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disclaimer */}
      <p className="font-sans text-[9px] text-white/15 mt-3">
        Based on Nifty 50 data 2001–2024. Seasonal patterns are historical observations, not predictions. Past performance ≠ future results.
      </p>
    </motion.div>
  )
}
