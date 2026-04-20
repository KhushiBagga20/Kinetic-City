import { motion, AnimatePresence } from 'framer-motion'
import { useState, useMemo } from 'react'
import { useAppStore, type FearType } from '../../store/useAppStore'
import FearProgressBar from './shared/FearProgressBar'
import StreakTracker from './shared/StreakTracker'
import LearnShortcutCard from './LearnShortcutCard'
import MarketPulseBoard from './MarketPulseBoard'
import SeasonalPatterns from './SeasonalPatterns'
import GoalsSection from './goals/GoalsSection'
import FearQuote from './shared/FearQuote'
import MarketNewsFeed from '../news/MarketNewsFeed'
import NewsTickerBar from '../news/NewsTickerBar'
import { Zap, ChevronDown, Search, FlaskConical, ArrowUpRight, Sprout, LineChart, Clock, BookOpen, TrendingUp, ArrowRight } from 'lucide-react'
import { getTrackForFear } from '../../lib/curriculumData'

/* ── 30 rotating daily quotes ─────────────────────────────────────────────── */

const DAILY_QUOTES = [
  "The stock market is a device for transferring money from the impatient to the patient.",
  "Time in the market beats timing the market. Every time.",
  "Compound interest is the eighth wonder of the world.",
  "Your biggest investment risk is not volatility. It is not investing at all.",
  "Risk comes from not knowing what you're doing. Knowledge is the true hedge.",
  "The best time to plant a tree was twenty years ago. The second best time is now.",
  "In investing, what is comfortable is rarely profitable.",
  "The four most dangerous words in investing: 'This time it's different.'",
  "Price is what you pay. Value is what you get.",
  "Returns matter. But so does the journey. Nobody endures a bad journey for long.",
  "The biggest risk in life is not taking one.",
  "Markets will fluctuate. Your commitment shouldn't.",
  "An investment in knowledge pays the best interest.",
  "The goal isn't more money. The goal is living life on your terms.",
  "Every master was once a disaster. Every expert was once a beginner.",
  "Don't save what is left after spending; spend what is left after saving.",
  "Wealth is not about having a lot of money; it's about having a lot of options.",
  "It's not how much money you make, but how much money you keep.",
  "Inflation is taxation without legislation.",
  "Someone is sitting in the shade today because someone planted a tree a long time ago.",
  "Stop trying to predict the direction of the stock market. Start predicting your own behaviour.",
  "Money is a terrible master but an excellent servant.",
  "The secret to getting ahead is getting started.",
  "Your money is either working for you, or you are working for money.",
  "Financial peace isn't the acquisition of stuff. It's learning to live on less than you make.",
  "The habit of saving is itself an education.",
  "The only investors who shouldn't diversify are those who are right 100% of the time.",
  "Wide diversification is only required when investors do not understand what they are doing.",
  "The individual investor should act consistently as an investor and not as a speculator.",
  "Do not save what is left after spending, but spend what is left after saving.",
]

/* ── Jargon data ──────────────────────────────────────────────────────────── */

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

const DAILY_TERMS = [
  { term: 'SIP', def: 'Invest a fixed amount every month automatically. Like a subscription, but your money grows.' },
  { term: 'NAV', def: 'Price of one unit of a mutual fund. Lower NAV = more units per rupee.' },
  { term: 'CAGR', def: 'Your average yearly growth rate, smoothed out. Like average speed on a road trip.' },
  { term: 'Index Fund', def: 'Copies the top 50 companies automatically. No human picks stocks. Just math.' },
  { term: 'Compounding', def: 'Earning returns on your returns. The longer you stay, the faster it snowballs.' },
  { term: 'Expense Ratio', def: 'Annual fee a fund charges. 0.1% is ₹100/L/year. Always go low.' },
  { term: 'Inflation', def: "Prices rising every year. If your money grows slower than 6%, you're losing." },
  { term: 'Demat', def: 'Digital account to hold stocks. Open on Zerodha or Groww in 15 minutes.' },
  { term: 'ELSS', def: 'Tax-saving mutual fund. Invest up to ₹1.5L/year, save up to ₹46,800 in taxes.' },
  { term: 'Exit Load', def: 'Fee if you sell too early. Most equity funds charge 1% if sold within 1 year.' },
]

/* ── Next step logic (inlined from NextStepCard) ──────────────────────────── */

interface NextStep {
  icon: string
  headline: string
  subtext: string
  cta: string
  route: string
}

function getNextModuleName(fearType: string, completedModules: string[]): string {
  const track = getTrackForFear(fearType)
  const nextModule = track.find(m => !completedModules.includes(m.id))
  return nextModule ? nextModule.title : track[track.length - 1].title
}

function getNextStep(state: {
  portfolioSetup: boolean
  goals: { length: number }
  completedModules: string[]
  simulationResult: any
  timeMachineResult: any
  fearType: string
}): NextStep {
  if (!state.portfolioSetup) return {
    icon: '⚡',
    headline: 'Start your first SIP',
    subtext: 'Set up ₹100/month and watch it grow. Takes 3 minutes.',
    cta: 'Start investing →',
    route: 'portfolio',
  }

  if (state.goals.length === 0) return {
    icon: '🎯',
    headline: 'What are you investing for?',
    subtext: 'Set a goal and KINETIC will tell you exactly how much you need each month.',
    cta: 'Add your first goal →',
    route: 'portfolio',
  }

  const trackModules = state.completedModules.filter(m => m.startsWith(state.fearType))
  if (trackModules.length < 3) return {
    icon: '📚',
    headline: 'Continue your learning track',
    subtext: `You've completed ${trackModules.length} of 10 modules. Next: "${getNextModuleName(state.fearType, state.completedModules)}"`,
    cta: 'Continue learning →',
    route: 'learn',
  }

  if (!state.simulationResult) return {
    icon: '📊',
    headline: 'Run your first simulation',
    subtext: 'See 600 possible futures for your money. Takes 30 seconds.',
    cta: 'Open simulation →',
    route: 'simulation',
  }

  if (!state.timeMachineResult) return {
    icon: '⏳',
    headline: 'Survive the 2020 COVID crash',
    subtext: 'Run ₹500 through the worst crash in recent memory. Watch it recover.',
    cta: 'Open Time Machine →',
    route: 'time-machine',
  }

  return {
    icon: '✅',
    headline: "You're doing great",
    subtext: "You've covered the core KINETIC experience. Explore the Harvest Room next.",
    cta: 'Try the Harvest Room →',
    route: 'harvest',
  }
}

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function getGreeting(name: string): string {
  const hour = new Date().getHours()
  const n = name || ''
  if (hour >= 5 && hour < 12) return `Good morning, ${n}.`
  if (hour >= 12 && hour < 17) return `Good afternoon, ${n}.`
  if (hour >= 17 && hour < 21) return `Good evening, ${n}.`
  return `Still up, ${n}?`
}

function getDailyQuote(): string {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
  return DAILY_QUOTES[dayOfYear % DAILY_QUOTES.length]
}

/* ══════════════════════════════════════════════════════════════════════════ */

export default function DashboardHome() {
  const fearType = useAppStore(s => s.fearType) ?? 'loss'
  const rawName = useAppStore(s => s.userName)
  const firstName = rawName && rawName !== 'Explorer' ? rawName.split(' ')[0] : ''
  const setDashboardSection = useAppStore(s => s.setDashboardSection)
  const newsItems = useAppStore(s => s.newsItems) || []

  // Next step state
  const portfolioSetup = useAppStore(s => s.portfolioSetup)
  const goals = useAppStore(s => s.goals)
  const completedModules = useAppStore(s => s.completedModules)
  const simulationResult = useAppStore(s => s.simulationResult)
  const timeMachineResult = useAppStore(s => s.timeMachineResult)

  const [jargonSearch, setJargonSearch] = useState('')
  const [expandedJargon, setExpandedJargon] = useState<string | null>(null)
  const [marketOpen, setMarketOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 1024)

  const dailyTerm = DAILY_TERMS[new Date().getDate() % DAILY_TERMS.length]

  const filteredJargon = useMemo(() => {
    if (!jargonSearch.trim()) return JARGON_WORDS
    const q = jargonSearch.toLowerCase()
    return JARGON_WORDS.filter(w => w.term.toLowerCase().includes(q) || w.def.toLowerCase().includes(q))
  }, [jargonSearch])

  const step = getNextStep({
    portfolioSetup, goals, completedModules: [...new Set(completedModules)],
    simulationResult, timeMachineResult, fearType,
  })

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>

      {/* ── Today's Focus hero card ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        onClick={() => setDashboardSection(step.route)}
        className="rounded-3xl p-8 border cursor-pointer group mb-6"
        style={{ background: 'var(--surface)', borderColor: 'rgba(192,241,142,0.15)', borderLeft: '4px solid var(--accent)' }}
        whileHover={{ borderColor: 'rgba(192,241,142,0.4)', boxShadow: '0 8px 30px rgba(192,241,142,0.1)' }}
        whileTap={{ scale: 0.99 }}
      >
        <p style={{ color: 'var(--accent)' }} className="text-[11px] uppercase tracking-widest font-sans mb-3">Today's focus</p>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0" style={{ background: 'rgba(192,241,142,0.12)' }}>
            {step.icon}
          </div>
          <div className="flex-1">
            <p className="font-display font-bold text-white text-[20px] leading-snug">{step.headline}</p>
            <p className="text-[13px] mt-1" style={{ color: 'var(--text-secondary)' }}>{step.subtext}</p>
          </div>
          <ArrowRight className="w-5 h-5 shrink-0 opacity-40 group-hover:opacity-100 group-hover:translate-x-1 transition-all" style={{ color: 'var(--accent)' }} />
        </div>
      </motion.div>

      {/* ── Quick Actions 3-column grid ───────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { id: 'time-machine', label: 'Time Machine', desc: 'Survive real crashes', icon: Clock },
          { id: 'sandbox', label: 'Sandbox', desc: 'Pick any market year', icon: FlaskConical },
          { id: 'learn', label: 'Learn', desc: 'Your fear track', icon: BookOpen },
        ].map(item => (
          <motion.button key={item.id}
            onClick={() => setDashboardSection(item.id)}
            className="rounded-2xl p-4 border text-left cursor-pointer"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            whileHover={{ borderColor: 'rgba(192,241,142,0.2)', boxShadow: '0 4px 20px rgba(192,241,142,0.06)' }}
            whileTap={{ scale: 0.97 }}
          >
            <item.icon className="w-4 h-4 mb-2" style={{ color: 'var(--accent)' }} />
            <p className="font-sans font-medium text-white text-[13px]">{item.label}</p>
            <p className="font-sans text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>{item.desc}</p>
          </motion.button>
        ))}
      </div>

      {/* ── News Ticker ───────────────────────────────────────────────── */}
      {newsItems.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="rounded-2xl overflow-hidden border mb-6"
          style={{ borderColor: 'var(--border)' }}
        >
          <NewsTickerBar items={newsItems} />
        </motion.div>
      )}

      {/* ── Two-column grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-[7fr_4fr] gap-6">

        {/* ═══ LEFT COLUMN ═══════════════════════════════════════════ */}
        <div className="space-y-6">

          {/* ── Greeting + Quote ──────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ boxShadow: '0 8px 32px rgba(192,241,142,0.08)', borderColor: 'rgba(192,241,142,0.2)' }}
            className="rounded-3xl border transition-all duration-300"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', padding: '28px 32px' }}
          >
            <h2 className="font-display font-medium text-white leading-tight" style={{ fontSize: 22 }}>
              {getGreeting(firstName)}
            </h2>
            <p className="font-sans text-[13px] text-white/40 mt-1">
              {fearType === 'loss' && "Markets dip. They always recover. Your patience is your edge."}
              {fearType === 'jargon' && "One term a day. That's all it takes to demystify investing."}
              {fearType === 'scam' && "Every number here comes from SEBI-regulated public data."}
              {fearType === 'trust' && "No fund managers. No humans. Just index math working for you."}
            </p>
            <p className="font-sans text-[13px] leading-relaxed pl-3 mt-3" style={{ color: 'rgba(255,255,255,0.5)', borderLeft: '2px solid rgba(192,241,142,0.3)' }}>
              {getDailyQuote()}
            </p>
          </motion.div>

          {/* ── Learn Quick Access ────────────────────────────────── */}
          <LearnShortcutCard />

          {/* ── Market Intel (collapsible) ─────────────────────────── */}
          <div>
            <button
              onClick={() => setMarketOpen(v => !v)}
              className="flex items-center gap-2 mb-4 w-full text-left"
            >
              <span className="text-[11px] uppercase tracking-widest font-sans" style={{ color: 'rgba(255,255,255,0.3)' }}>Market Intel</span>
              <motion.div animate={{ rotate: marketOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
              </motion.div>
            </button>
            <AnimatePresence>
              {marketOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}
                  className="space-y-6 overflow-hidden"
                >
                  <MarketPulseBoard />
                  <SeasonalPatterns />
                  <MarketNewsFeed maxItems={5} fearType={fearType} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Streak Tracker ───────────────────────────────────────── */}
          <StreakTracker />
        </div>

        {/* ═══ RIGHT COLUMN ═══════════════════════════════════════════ */}
        <div className="space-y-6">

          {/* ── Fear Progress ────────────────────────────────────────── */}
          <FearProgressBar />

          {/* ── Goals ─────────────────────────────────────────────── */}
          <GoalsSection />

          {/* ── Today's Micro Action ──────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            whileHover={{ boxShadow: '0 8px 32px rgba(192,241,142,0.15)', borderColor: 'rgba(192,241,142,0.4)' }}
            className="rounded-3xl p-6 border transition-all duration-300 cursor-default"
            style={{ background: 'var(--surface)', borderColor: 'rgba(192,241,142,0.25)' }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
              <p className="font-sans text-xs text-white/30 font-medium">Today's One Thing</p>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex gap-4 items-start">
                <div className="flex-1">
                  <h3 className="font-display font-bold text-2xl mb-2" style={{ color: 'var(--accent)' }}>
                    {fearType === 'loss' && 'Market Recovery'}
                    {fearType === 'jargon' && dailyTerm.term}
                    {fearType === 'scam' && 'SEBI Regulated'}
                    {fearType === 'trust' && 'Auto-Rebalanced'}
                  </h3>
                  <p className="font-sans text-[13px] text-white/50 leading-relaxed">
                    {fearType === 'loss' && "Nifty 50 has recovered from every crash in its history. Average recovery time: 14 months."}
                    {fearType === 'jargon' && dailyTerm.def}
                    {fearType === 'scam' && "SEBI-regulated index funds are audited quarterly. Your money cannot disappear."}
                    {fearType === 'trust' && "The Nifty 50 index rebalances automatically. No human decides what's in it."}
                  </p>
                </div>
              </div>
              <button onClick={() => setDashboardSection('kinu')} className="font-sans text-[10px] text-white/20 hover:text-white/40 transition-[color] duration-200 mt-4 text-left">
                Ask KINU to explain it differently →
              </button>
            </div>
          </motion.div>

          {/* ── Quick Nav Cards ──────────────────────────────────────── */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: LineChart, label: 'Simulation', sub: 'Monte Carlo SIP', section: 'simulation', color: 'var(--accent)' },
              { icon: Clock, label: 'Time Machine', sub: 'Historical replay', section: 'time-machine', color: 'var(--teal)' },
              { icon: TrendingUp, label: 'Portfolio', sub: 'Your holdings', section: 'portfolio', color: 'var(--accent)' },
              { icon: BookOpen, label: 'Learn', sub: 'FD vs Equity', section: 'learn', color: 'var(--teal)' },
            ].map((nav, i) => (
              <motion.button
                key={nav.section}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.14 + i * 0.02 }}
                onClick={() => setDashboardSection(nav.section)}
                className="rounded-2xl p-4 border text-left transition-all duration-300 group cursor-pointer"
                style={{ background: 'var(--surface)', borderColor: 'rgba(255,255,255,0.06)' }}
                whileHover={{ boxShadow: `0 8px 24px ${nav.color}25`, borderColor: `${nav.color}60` }}
                whileTap={{ scale: 0.97 }}
              >
                <nav.icon className="w-4 h-4 mb-2.5 transition-transform duration-300 group-hover:scale-110" style={{ color: nav.color }} />
                <p className="font-display font-medium text-[13px] text-white">{nav.label}</p>
                <p className="font-sans text-[10px] text-white/25 mt-0.5">{nav.sub}</p>
              </motion.button>
            ))}
          </div>

          {/* ── KINU Daily Insight ────────────────────────────────────── */}
          <FearQuote context="dashboard" variant="card" />

          {/* ── Jargon Graveyard ───────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.18 }}
            whileHover={{ boxShadow: '0 8px 32px rgba(192,241,142,0.08)', borderColor: 'rgba(192,241,142,0.15)' }}
            className="rounded-3xl p-6 border transition-all duration-300"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-display font-medium text-sm text-white">Jargon Graveyard</h3>
              <span className="font-mono text-[10px] text-white/20">{JARGON_WORDS.length} terms</span>
            </div>
            <p className="font-sans text-[11px] text-white/25 mb-3">Search any investing term.</p>

            {/* Search */}
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-white/15" />
              <input
                type="text"
                value={jargonSearch}
                onChange={e => setJargonSearch(e.target.value)}
                placeholder="Search terms..."
                className="w-full bg-transparent border rounded-xl pl-9 pr-4 py-2 font-sans text-[13px] text-white outline-none placeholder:text-white/15 focus:border-white/12 transition-[border-color] duration-200"
                style={{ borderColor: 'var(--border)' }}
              />
            </div>

            {/* Term list */}
            <div
              className="space-y-0.5 pr-1 jargon-scroll"
              style={{
                maxHeight: 320,
                overflowY: 'auto',
                overflowX: 'hidden',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgba(255,255,255,0.12) transparent',
              }}
            >
              <style>{`
                .jargon-scroll::-webkit-scrollbar { width: 4px; }
                .jargon-scroll::-webkit-scrollbar-track { background: transparent; }
                .jargon-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 2px; }
              `}</style>
              {filteredJargon.map(w => {
                const isOpen = expandedJargon === w.term
                return (
                  <div key={w.term}>
                    <button onClick={() => setExpandedJargon(isOpen ? null : w.term)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-[background-color] duration-200"
                      style={{ background: isOpen ? 'rgba(192,241,142,0.04)' : 'transparent' }}
                    >
                      <span className="font-sans text-[13px] text-white/55">{w.term}</span>
                      <ChevronDown className={`w-3 h-3 text-white/15 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <p className="px-3 py-1.5 font-sans text-[11px] text-white/30 border-l-2 ml-3 mb-0.5" style={{ borderColor: 'var(--accent)' }}>{w.def}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
              {filteredJargon.length === 0 && (
                <p className="font-sans text-[11px] text-white/20 text-center py-4">No terms match &quot;{jargonSearch}&quot;</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
