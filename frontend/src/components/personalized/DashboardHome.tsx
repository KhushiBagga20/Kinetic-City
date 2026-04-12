import { motion, AnimatePresence } from 'framer-motion'
import { useState, useMemo, useEffect } from 'react'
import { useAppStore, type FearType } from '../../store/useAppStore'
import { fetchPortfolioSummary, type MetricItem } from '../../lib/api'
import FearProgressBar from './shared/FearProgressBar'
import StreakTracker from './shared/StreakTracker'
import FearHomePage from './home/FearHomePage'
import PortfolioPulse from './PortfolioPulse'
import AgeAllocation from './AgeAllocation'
import { Zap, ChevronDown, Search, FlaskConical, ArrowRight, TrendingUp, Sprout } from 'lucide-react'
import FearQuote from './shared/FearQuote'

const FEAR_COLORS: Record<FearType, string> = {
  loss: '#E24B4A', jargon: '#378ADD', scam: '#c0f18e', trust: '#1D9E75',
}

const DAILY_TERMS = [
  { term: 'SIP', def: 'Invest a fixed amount every month automatically. Like a subscription, but your money grows.' },
  { term: 'NAV', def: 'Price of one unit of a mutual fund. Lower NAV = more units per rupee.' },
  { term: 'CAGR', def: 'Your average yearly growth rate, smoothed out. Like average speed on a road trip.' },
  { term: 'Index Fund', def: 'Copies the top 50 companies automatically. No human picks stocks. Just math.' },
  { term: 'Compounding', def: 'Earning returns on your returns. The longer you stay, the faster it snowballs.' },
  { term: 'Expense Ratio', def: 'Annual fee a fund charges. 0.1% is ₹100/L/year. Always go low.' },
  { term: 'Inflation', def: 'Prices rising every year. If your money grows slower than 6%, you\'re losing.' },
  { term: 'Demat', def: 'Digital account to hold stocks. Open on Zerodha or Groww in 15 minutes.' },
  { term: 'ELSS', def: 'Tax-saving mutual fund. Invest up to ₹1.5L/year, save up to ₹46,800 in taxes.' },
  { term: 'Exit Load', def: 'Fee if you sell too early. Most equity funds charge 1% if sold within 1 year.' },
]

const JARGON_WORDS = [
  { term: 'NAV', def: 'Price of one mutual fund unit' },
  { term: 'SIP', def: 'Monthly auto-invest plan' },
  { term: 'XIRR', def: 'Your true annualized return' },
  { term: 'CAGR', def: 'Average yearly growth rate' },
  { term: 'Expense Ratio', def: 'Annual fee the fund charges you' },
  { term: 'Index Fund', def: 'Fund that copies the market automatically' },
  { term: 'AUM', def: 'Total money managed by a fund' },
  { term: 'Nifty 50', def: "India's top 50 companies index" },
  { term: 'Lumpsum', def: 'Investing all money at once' },
  { term: 'Mutual Fund', def: 'Pooled money invested together' },
  { term: 'Returns', def: 'Profit or loss on your investment' },
  { term: 'Portfolio', def: 'All your investments together' },
  { term: 'Dividend', def: 'Profit shared by company with shareholders' },
  { term: 'Volatility', def: 'How much prices swing up and down' },
  { term: 'Bull Market', def: 'Rising market — optimism' },
  { term: 'Bear Market', def: 'Falling market — pessimism' },
  { term: 'P/E Ratio', def: 'How expensive a stock is vs its profits' },
  { term: 'FD', def: 'Fixed deposit — safe but low returns' },
  { term: 'Inflation', def: 'Prices going up every year' },
  { term: 'Compounding', def: 'Earning returns on your returns' },
  { term: 'Demat', def: 'Digital account to hold stocks' },
  { term: 'LTCG', def: 'Tax on long-term gains (1+ year)' },
  { term: 'STCG', def: 'Tax on short-term gains (<1 year)' },
  { term: 'SEBI', def: 'Stock market regulator of India' },
  { term: 'KYC', def: 'Identity verification for investing' },
  { term: 'AMC', def: 'Company that runs mutual funds' },
  { term: 'Direct Plan', def: 'Buy directly from AMC = lower fees' },
  { term: 'Exit Load', def: 'Fee if you sell too early' },
  { term: 'Equity', def: 'Ownership in a company via stocks' },
  { term: 'Debt Fund', def: 'Fund that invests in bonds (safer)' },
]

export default function DashboardHome() {
  const fearType = useAppStore(s => s.fearType) ?? 'loss'
  const rawName = useAppStore(s => s.userName)
  const firstName = rawName && rawName !== 'Explorer' ? rawName.split(' ')[0] : ''
  const setDashboardSection = useAppStore(s => s.setDashboardSection)

  const [jargonSearch, setJargonSearch] = useState('')
  const [expandedJargon, setExpandedJargon] = useState<string | null>(null)
  const [portfolioMetrics, setPortfolioMetrics] = useState<MetricItem[] | null>(null)

  const dailyTerm = DAILY_TERMS[new Date().getDate() % DAILY_TERMS.length]

  // Try to fetch portfolio data (silently — this only shows if backend is running)
  useEffect(() => {
    fetchPortfolioSummary()
      .then(setPortfolioMetrics)
      .catch(() => setPortfolioMetrics(null))
  }, [])

  const filteredJargon = useMemo(() => {
    if (!jargonSearch.trim()) return JARGON_WORDS
    const q = jargonSearch.toLowerCase()
    return JARGON_WORDS.filter(w => w.term.toLowerCase().includes(q) || w.def.toLowerCase().includes(q))
  }, [jargonSearch])

  const color = FEAR_COLORS[fearType]
  const hasPortfolio = portfolioMetrics !== null
  const hour = new Date().getHours()
  const timeOfDay = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'

  // Personal greeting copy
  const greetingLine = firstName
    ? `Good ${timeOfDay}, ${firstName}.`
    : `Good ${timeOfDay}.`

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="space-y-6">

      {/* ── Portfolio Pulse (hero position) ────────────────────────────── */}
      <PortfolioPulse />

      {/* ── Contextual Greeting ────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="rounded-3xl px-7 py-5 border relative overflow-hidden"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)', borderLeft: `3px solid ${color}` }}
      >
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ background: `radial-gradient(circle at 90% 50%, ${color}, transparent 60%)` }} />
        <p className="font-sans text-sm text-white/60 leading-relaxed">{greetingLine}</p>
        <FearQuote context="dashboard" variant="subtle" className="mt-2" />
        {hasPortfolio && (
          <p className="font-sans text-xs text-white/25 mt-1">
            Your portfolio is live. <button onClick={() => setDashboardSection('portfolio')} className="underline hover:text-white/40 transition-colors" style={{ color: 'var(--accent)' }}>View details →</button>
          </p>
        )}
      </motion.div>

      {/* ── Fear Progress ─────────────────────────────────────────────── */}
      <FearProgressBar />

      {/* ── Portfolio Summary (if backend is connected) ────────────────── */}
      {hasPortfolio && (
        <motion.button
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 }}
          onClick={() => setDashboardSection('portfolio')}
          className="w-full rounded-3xl p-6 border text-left group transition-[border-color] duration-200 hover:border-[rgba(192,241,142,0.2)]"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <TrendingUp className="w-4 h-4" style={{ color: 'var(--teal)' }} />
              <p className="font-display font-medium text-sm text-white">Your Portfolio</p>
            </div>
            <ArrowRight className="w-3.5 h-3.5 text-white/15 group-hover:text-white/40 group-hover:translate-x-1 transition-all duration-200" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {portfolioMetrics!.slice(0, 4).map(m => (
              <div key={m.title}>
                <p className="text-[7px] font-sans text-white/20 uppercase tracking-wider mb-0.5">{m.title}</p>
                <p className="font-display font-semibold text-base text-white tracking-tight">{m.value}</p>
                <p className={`font-sans text-[9px] ${m.highlight ? 'text-[var(--accent)]' : 'text-white/25'}`}>{m.subtext}</p>
              </div>
            ))}
          </div>
        </motion.button>
      )}

      {/* ── Age Allocation Guide ──────────────────────────────────────── */}
      <AgeAllocation />

      {/* ── Sandbox CTA ──────────────────────────────────────────────── */}
      <motion.button
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.12 }}
        onClick={() => setDashboardSection('sandbox')}
        className="w-full rounded-3xl p-7 border text-left group transition-[border-color] duration-200 hover:border-[rgba(192,241,142,0.2)]"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3 mb-2">
          <FlaskConical className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          <p className="font-display font-medium text-base text-white">Sandbox FY Time Machine</p>
        </div>
        <p className="font-sans text-xs text-white/35">Pick any year from 2001–02 to 2023–24. Allocate ₹50,000. Watch what really happened.</p>
      </motion.button>

      {/* ── Harvest Room CTA ────────────────────────────────────────────── */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.14 }}
        onClick={() => setDashboardSection('harvest')}
        className="w-full rounded-3xl p-7 border text-left group transition-[border-color] duration-200 hover:border-[rgba(29,158,117,0.25)]"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-3 mb-2">
          <Sprout className="w-4 h-4" style={{ color: 'var(--teal)' }} />
          <p className="font-display font-medium text-base text-white">The Harvest Room</p>
        </div>
        <p className="font-sans text-xs text-white/35">Pick an era. Plant your money. See what history grew across 5, 10, or 20 years.</p>
      </motion.button>

      {/* ── Streak ───────────────────────────────────────────────────── */}
      <StreakTracker />

      {/* ── Fear-specific content ─────────────────────────────────────── */}
      <FearHomePage fearType={fearType} />

      {/* ── Today's One Thing ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="rounded-3xl p-7 border"
        style={{ background: 'var(--surface)', borderColor: 'rgba(192,241,142,0.18)', borderWidth: '1px' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
          <p className="font-sans text-xs text-white/30 font-medium">Today's One Thing</p>
        </div>
        <h3 className="font-display font-bold text-3xl mb-2" style={{ color: 'var(--accent)' }}>{dailyTerm.term}</h3>
        <p className="font-sans text-sm text-white/55 leading-relaxed mb-3">{dailyTerm.def}</p>
        <button onClick={() => setDashboardSection('arjun')} className="font-sans text-[10px] text-white/20 hover:text-white/40 transition-[color] duration-200">
          Ask Arjun to explain it differently →
        </button>
      </motion.div>

      {/* ── Jargon Graveyard ──────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-3xl p-7 border"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-display font-medium text-base text-white">Jargon Graveyard</h3>
          <span className="font-mono text-[10px] text-white/20">{JARGON_WORDS.length} terms</span>
        </div>
        <p className="font-sans text-xs text-white/30 mb-4">Search any investing term.</p>

        <div className="relative mb-3">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/15" />
          <input
            type="text"
            value={jargonSearch}
            onChange={e => setJargonSearch(e.target.value)}
            placeholder="Search terms..."
            className="w-full bg-transparent border rounded-xl pl-10 pr-4 py-2.5 font-sans text-sm text-white outline-none placeholder:text-white/15 focus:border-[var(--border-bright)] transition-[border-color] duration-200"
            style={{ borderColor: 'var(--border)' }}
          />
        </div>

        <div style={{ height: '260px', overflowY: 'scroll', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }} className="space-y-0.5 pr-1">
          {filteredJargon.map(w => {
            const isOpen = expandedJargon === w.term
            return (
              <div key={w.term}>
                <button onClick={() => setExpandedJargon(isOpen ? null : w.term)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-[background-color] duration-200"
                  style={{ background: isOpen ? 'rgba(192,241,142,0.05)' : 'transparent' }}
                >
                  <span className="font-sans text-sm text-white/60">{w.term}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-white/15 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <p className="px-3.5 py-2 font-sans text-xs text-white/35 border-l-2 ml-3.5 mb-1" style={{ borderColor: 'var(--accent)' }}>{w.def}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
          {filteredJargon.length === 0 && (
            <p className="font-sans text-xs text-white/25 text-center py-6">No terms match "{jargonSearch}"</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
