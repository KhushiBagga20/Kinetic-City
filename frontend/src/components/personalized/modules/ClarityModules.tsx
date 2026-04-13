import { motion } from 'framer-motion'
import { useState } from 'react'
import { BookOpen, Search, Zap, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { useAppStore } from '../../../store/useAppStore'

// ── Jargon terms data ────────────────────────────────────────────────────────

const JARGON_TERMS = [
  { term: 'NAV', explanation: 'The price of one unit of a mutual fund. Like a share price, but for funds.', analogy: 'Think of it like the price tag on a single cookie in a cookie box.' },
  { term: 'SIP', explanation: 'Systematic Investment Plan — you invest the same amount every month automatically.', analogy: "Like a subscription, but your money grows instead of getting you shows." },
  { term: 'XIRR', explanation: 'Your actual yearly return. It accounts for when you invested, not just how much.', analogy: 'Like your GPA — a single grade for how well your money performed.' },
  { term: 'CAGR', explanation: 'Compound Annual Growth Rate — the average yearly return if growth was smooth.', analogy: "If your money took the stairs instead of the elevator, this is how fast it'd climb." },
  { term: 'Expense Ratio', explanation: "The fee a mutual fund charges yearly to manage your money. Usually 0.1% to 2.5%.", analogy: "Like a delivery charge — lower is better because you keep more of your food." },
  { term: 'Index Fund', explanation: "A fund that copies the top 50 (or 500) companies. No human picks stocks.", analogy: "Like ordering 'one of everything' from the menu instead of trusting the chef's special." },
  { term: 'AUM', explanation: "Assets Under Management — total money a fund manages.", analogy: "Like a restaurant's total orders — bigger usually means more trusted." },
  { term: 'Nifty 50', explanation: "India's benchmark index. The top 50 companies by market cap.", analogy: "The 'Top 50 Songs' chart, but for companies." },
  { term: 'Lumpsum', explanation: "Investing all your money at once instead of monthly SIPs.", analogy: "Like buying the whole cake vs. one slice at a time." },
  { term: 'Mutual Fund', explanation: "A pool of money from many people, invested together by a fund manager (or an algorithm).", analogy: "Like a potluck — everyone brings a little, and the whole table is better." },
  { term: 'Returns', explanation: 'The profit your investment makes, usually shown as a percentage per year.', analogy: "Like interest, but with potential to be much higher (or sometimes lower)." },
  { term: 'Portfolio', explanation: 'All your investments combined — stocks, funds, everything.', analogy: "Like your playlist — different songs (investments), one collection." },
  { term: 'Dividend', explanation: 'Money companies pay you just for owning their stock. Like a bonus.', analogy: "Like getting free fries with every burger — just for being a customer." },
  { term: 'Volatility', explanation: 'How much prices go up and down. High volatility = big swings.', analogy: "Like weather — some days are sunny, some stormy. It averages out." },
  { term: 'Bull Market', explanation: 'When the market is going up. Everyone feels confident.', analogy: "Spring season — everything is growing." },
  { term: 'Bear Market', explanation: "When the market drops 20%+ from its peak. Feels scary but it's temporary.", analogy: "Winter — cold but it always ends." },
  { term: 'P/E Ratio', explanation: "Price-to-Earnings ratio. How expensive a stock is vs what the company earns.", analogy: "Like paying ₹200 for a thali vs ₹2000 — is it worth it?" },
  { term: 'FD', explanation: "Fixed Deposit — you lock money in a bank for a fixed period at a guaranteed rate.", analogy: "Like parking your car — safe, but it's not going anywhere." },
  { term: 'Inflation', explanation: "Prices going up over time. Your ₹100 buys less each year.", analogy: "Same ice cream, higher price — your money shrinks without you spending it." },
  { term: 'Compounding', explanation: "Earning returns on your returns. Money grows faster over time.", analogy: "Like a snowball rolling downhill — small at first, huge by the end." },
]

const DAILY_CONCEPTS = [
  { word: 'NAV', explanation: "NAV just means the price of one unit of a fund. That's it." },
  { word: 'XIRR', explanation: 'XIRR is just your actual yearly return. Like a school grade for your money.' },
  { word: 'SIP', explanation: "SIP means you invest the same amount every month automatically. Like a subscription, but your money grows." },
  { word: 'CAGR', explanation: "CAGR is just the average yearly growth rate. If your investment was a student, this would be their GPA." },
  { word: 'Inflation', explanation: "Inflation means prices go up every year. Your ₹100 today will buy less tomorrow. That's why saving isn't enough." },
]

const CONCEPT_INSIGHTS = [
  "Understanding NAV could save you from buying a fund at the wrong time. That's worth ~₹8,000 over 10 years.",
  "Knowing about expense ratios could save you ₹45,000 in fees over 10 years on a ₹5,000/month SIP.",
  "Understanding SIP vs lumpsum could prevent you from panicking during a crash — saving ₹1.2L in missed recovery gains.",
]

// ── Module 1: Today's One Thing ─────────────────────────────────────────────

function TodaysOneThing() {
  const dayIndex = new Date().getDate() % DAILY_CONCEPTS.length
  const concept = DAILY_CONCEPTS[dayIndex]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="rounded-3xl p-7 md:p-8 border cursor-pointer group"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(55,138,221,0.12)' }}>
          <BookOpen className="w-4 h-4" style={{ color: '#378ADD' }} />
        </div>
        <h3 className="font-display text-lg text-white font-medium tracking-tight">Today's One Thing</h3>
      </div>

      <motion.p
        className="font-display font-bold tracking-tight leading-none mb-6"
        style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', color: '#378ADD' }}
      >
        {concept.word}
      </motion.p>

      <p className="font-sans text-sm text-white/60 leading-relaxed mb-4">
        {concept.explanation}
      </p>

      <p className="text-[10px] font-sans text-white/25">
        Tap to ask KINU to explain it differently
      </p>
    </motion.div>
  )
}

// ── Module 2: Jargon Graveyard ──────────────────────────────────────────────

function JargonGraveyard() {
  const completedModules = useAppStore(s => s.completedModules)
  const completeModule = useAppStore(s => s.completeModule)

  const learnedTerms = JARGON_TERMS.filter((_, i) => completedModules.includes(`jargon-term-${i}`))
  const learnedCount = learnedTerms.length

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
      className="rounded-3xl p-7 border"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <h3 className="font-display text-lg text-white font-medium tracking-tight mb-2">Jargon Graveyard</h3>
      <p className="text-xs font-sans text-white/40 mb-5">
        You've killed {learnedCount}/{JARGON_TERMS.length} jargon words.
      </p>

      <div className="flex flex-wrap gap-2">
        {JARGON_TERMS.map((item, i) => {
          const isLearned = completedModules.includes(`jargon-term-${i}`)
          return (
            <motion.button
              key={item.term}
              onClick={() => !isLearned && completeModule(`jargon-term-${i}`)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 * i, duration: 0.3 }}
              className="px-3.5 py-2 rounded-full text-xs font-sans border transition-[background-color,border-color,color] duration-200"
              style={{
                background: isLearned ? 'rgba(29,158,117,0.08)' : 'rgba(255,255,255,0.03)',
                borderColor: isLearned ? 'rgba(29,158,117,0.2)' : 'rgba(255,255,255,0.06)',
                color: isLearned ? '#1D9E75' : 'rgba(255,255,255,0.35)',
                textDecoration: isLearned ? 'line-through' : 'none',
              }}
            >
              {isLearned && <Check className="w-3 h-3 inline mr-1" />}
              {item.term}
            </motion.button>
          )
        })}
      </div>
    </motion.div>
  )
}

// ── Module 3: The Glossary ──────────────────────────────────────────────────

function TheGlossary() {
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)

  const filtered = JARGON_TERMS.filter(t =>
    t.term.toLowerCase().includes(search.toLowerCase()) ||
    t.explanation.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
      className="rounded-3xl p-7 border"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <h3 className="font-display text-lg text-white font-medium tracking-tight mb-5">The Glossary</h3>

      {/* Search */}
      <div className="relative mb-5">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search terms..."
          className="w-full pl-11 pr-4 py-3 rounded-xl font-sans text-sm text-white placeholder-white/25 outline-none"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        />
      </div>

      <div style={{ height: '380px', overflowY: 'scroll', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }} className="space-y-1">
        {filtered.slice(0, 20).map((item, i) => (
          <div key={item.term}>
            <button
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="w-full flex items-center justify-between p-3.5 rounded-xl hover:bg-white/[0.02] transition-colors text-left"
            >
              <span className="font-display text-sm text-white/80 font-medium">{item.term}</span>
              {expanded === i ?
                <ChevronUp className="w-4 h-4 text-white/25" /> :
                <ChevronDown className="w-4 h-4 text-white/25" />
              }
            </button>
            {expanded === i && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.3 }}
                className="px-3.5 pb-4"
              >
                <p className="font-sans text-xs text-white/50 leading-relaxed mb-2">{item.explanation}</p>
                <p className="font-sans text-[11px] text-white/30 leading-relaxed italic">
                  Analogy: {item.analogy}
                </p>
              </motion.div>
            )}
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ── Module 4: Concept to Real Money ─────────────────────────────────────────

function ConceptToRealMoney() {
  const dayIndex = new Date().getDate() % CONCEPT_INSIGHTS.length
  const insight = CONCEPT_INSIGHTS[dayIndex]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
      className="rounded-3xl p-6 border"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <h3 className="font-display text-sm text-white font-medium mb-3">Concept → Real Money</h3>
      <p className="font-sans text-sm text-white/55 leading-relaxed">{insight}</p>
    </motion.div>
  )
}

// ── Module 5: Today's Micro Action ──────────────────────────────────────────

function TodaysMicroAction() {
  const completeModule = useAppStore(s => s.completeModule)
  const completedModules = useAppStore(s => s.completedModules)

  const actions = [
    { id: 'clarity-micro-1', text: 'Learn one term from the Jargon Graveyard' },
    { id: 'clarity-micro-2', text: "Ask KINU to explain SIP like you're 12" },
    { id: 'clarity-micro-3', text: "Find out what your FD's real return is after inflation" },
  ]

  const dayIndex = new Date().getDate() % actions.length
  const action = actions[dayIndex]
  const isCompleted = completedModules.includes(action.id)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
      className="rounded-3xl p-6 border"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(192,241,142,0.10)' }}>
          <Zap className="w-4 h-4" style={{ color: '#EF9F27' }} />
        </div>
        <h3 className="font-display text-sm text-white font-medium">Today's Micro Action</h3>
      </div>

      <p className="font-sans text-sm text-white/60 leading-relaxed mb-4">{action.text}</p>

      <button
        onClick={() => !isCompleted && completeModule(action.id)}
        disabled={isCompleted}
        className="text-[10px] font-sans font-bold tracking-[0.15em] uppercase transition-all duration-200"
        style={{
          color: isCompleted ? '#1D9E75' : 'var(--color-primary-fixed)',
          opacity: isCompleted ? 0.7 : 1,
        }}
      >
        {isCompleted ? '✓ Completed' : 'Mark as done'}
      </button>
    </motion.div>
  )
}

// ── Export ───────────────────────────────────────────────────────────────────

export default function ClarityModules() {
  return (
    <div className="space-y-5">
      <TodaysOneThing />
      <JargonGraveyard />
      <TheGlossary />
      <ConceptToRealMoney />
      <TodaysMicroAction />
    </div>
  )
}
