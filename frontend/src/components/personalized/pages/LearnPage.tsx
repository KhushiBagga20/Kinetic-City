import { motion, AnimatePresence } from 'framer-motion'
import { useState, useMemo, useEffect, useRef } from 'react'
import { useAppStore, type FearType } from '../../../store/useAppStore'
import { formatINR } from '../../../lib/formatINR'
import { Check, ChevronDown, ChevronRight, Search, BookOpen, Map, Zap, Shield, Target, Lock } from 'lucide-react'
import FYComparison from '../FYComparison'
import CopyTheMarket from '../CopyTheMarket'
import XIRRExplainer from '../XIRRExplainer'
import MarketExplainer from '../MarketExplainer'
import CrashTimeline from '../CrashTimeline'
import NewsImpactCard from '../../news/NewsImpactCard'
import { CRASH_SUMMARY_STATS } from '../../../lib/crashData'
import {
  getTrackForFear, isModuleLocked,
  TRACK_NAMES, TRACK_COLORS, TYPE_COLORS, ALL_TRACKS,
  type FearTrack,
} from '../../../lib/curriculumData'

// ── GLOSSARY — 40 essential investing terms ─────────────────────────────────

interface GlossaryTerm {
  term: string
  def: string
  analogy: string
  example: string
  category: 'basics' | 'funds' | 'metrics' | 'risk' | 'tax'
}

const GLOSSARY: GlossaryTerm[] = [
  { term: 'SIP', def: 'Systematic Investment Plan — auto-investing a fixed amount every month.', analogy: 'Like a Netflix subscription, but for investing.', example: '₹500/month SIP for 10 years = ₹60,000 invested, grows to ~₹1.6L.', category: 'basics' },
  { term: 'NAV', def: 'Net Asset Value — the price of one unit of a mutual fund.', analogy: 'Like the price tag on one share of a group investment.', example: 'If NAV is ₹50 and you invest ₹500, you get 10 units.', category: 'funds' },
  { term: 'Mutual Fund', def: 'A pool of money from many investors, managed as one.', analogy: 'Like a potluck — everyone brings money, one chef invests it.', example: 'A Nifty 50 fund buys all 50 biggest companies with your ₹500.', category: 'funds' },
  { term: 'Index Fund', def: 'A fund that copies a market index exactly, no human decisions.', analogy: 'Like photocopying the top 50 companies list.', example: 'Nifty 50 Index Fund = owns all 50 Nifty companies. Expense: 0.1%.', category: 'funds' },
  { term: 'CAGR', def: 'Compound Annual Growth Rate — smoothed yearly growth rate.', analogy: 'If your plant grew unevenly, CAGR is the average growth per year.', example: '₹1L growing to ₹2L in 5 years = 14.87% CAGR.', category: 'metrics' },
  { term: 'XIRR', def: 'Extended Internal Rate of Return — your actual returns considering timing.', analogy: 'Like calculating real car speed including traffic stops.', example: 'XIRR of 14% means your money grew at 14%/year on average.', category: 'metrics' },
  { term: 'Expense Ratio', def: 'The annual fee a fund charges, taken from your returns.', analogy: 'Like a management fee your landlord charges on your flat.', example: '0.1% on ₹1L = ₹100/year. 2% = ₹2,000/year. Choose low.', category: 'funds' },
  { term: 'AUM', def: 'Assets Under Management — total money in a fund.', analogy: 'Like the total balance in a shared bank account.', example: 'SBI Nifty 50 Index Fund: AUM ₹5,000 Cr+.', category: 'funds' },
  { term: 'Nifty 50', def: 'Index of India\'s 50 largest companies by market cap.', analogy: 'India\'s stock market scoreboard — the top 50 players.', example: 'Includes Reliance, HDFC, Infosys, TCS, etc.', category: 'basics' },
  { term: 'Sensex', def: 'Index of 30 largest BSE-listed companies.', analogy: 'Like Nifty 50 but with fewer companies.', example: 'When news says "market up 500 points" — they usually mean Sensex.', category: 'basics' },
  { term: 'Lumpsum', def: 'Investing a large amount all at once instead of monthly.', analogy: 'Like paying full fees upfront vs. EMI.', example: '₹1L invested once vs ₹8,333/month for 12 months.', category: 'basics' },
  { term: 'Diversification', def: 'Spreading money across many investments to reduce risk.', analogy: 'Don\'t put all eggs in one basket.', example: 'Index fund = instant diversification across 50 stocks.', category: 'risk' },
  { term: 'Volatility', def: 'How much an investment\'s value goes up and down.', analogy: 'Like waves in the ocean — bigger waves = more volatility.', example: 'Nifty 50: 18% annual volatility, 14% average return.', category: 'risk' },
  { term: 'Returns', def: 'The profit or loss on your investment.', analogy: 'How much your money grew (or shrank).', example: '₹1L invested, now worth ₹1.2L = 20% return.', category: 'metrics' },
  { term: 'Portfolio', def: 'The collection of all your investments.', analogy: 'Like your playlist of songs — but with money.', example: '60% equity funds + 30% debt + 10% gold = a balanced portfolio.', category: 'basics' },
  { term: 'Equity', def: 'Ownership in a company through stocks.', analogy: 'Like owning a tiny piece of a big business.', example: 'Buying 1 share of Reliance = you own a tiny bit of Reliance.', category: 'basics' },
  { term: 'Debt Fund', def: 'A fund that invests in bonds and fixed-income securities.', analogy: 'Like lending money to companies — they pay you interest.', example: 'Debt fund returns: 6-8% vs FD: 6.8%.', category: 'funds' },
  { term: 'FD', def: 'Fixed Deposit — bank savings with guaranteed but low returns.', analogy: 'Like a safe locker that pays you a small rent.', example: '₹1L in FD at 6.8% for 10 years = ₹1.93L. After inflation: ₹1.09L.', category: 'basics' },
  { term: 'Inflation', def: 'The rate at which prices increase, reducing your money\'s value.', analogy: 'Your money\'s superpower slowly weakening over time.', example: '₹100 today buys what ₹60 bought 10 years ago (6% inflation).', category: 'risk' },
  { term: 'Compounding', def: 'Earning returns on your returns — exponential growth.', analogy: 'Like a snowball rolling downhill — gets bigger as it rolls.', example: '₹1L at 14% for 20 years = ₹13.7L. Most growth happens in last 5 years.', category: 'basics' },
  { term: 'Bull Market', def: 'When stock prices are rising steadily.', analogy: 'Like a bull charging upward with its horns.', example: '2017-2018: Nifty went from 8,500 to 11,000 — classic bull run.', category: 'basics' },
  { term: 'Bear Market', def: 'When stock prices fall 20%+ from recent highs.', analogy: 'Like a bear swiping downward with its paws.', example: 'March 2020: COVID crashed Nifty from 12,000 to 8,600 — bear market.', category: 'risk' },
  { term: 'P/E Ratio', def: 'Price-to-Earnings — how expensive a stock is vs its profits.', analogy: 'Like paying ₹20 vs ₹40 for a ₹1 earning dal shop.', example: 'Nifty 50 avg P/E: 22. Above 25 = expensive. Below 18 = cheap.', category: 'metrics' },
  { term: 'Dividend', def: 'Profit shared by a company with its shareholders.', analogy: 'Like getting a bonus from the company you partly own.', example: 'ITC pays ~₹6/share dividend yearly. Hold 100 shares = ₹600/year.', category: 'metrics' },
  { term: 'Liquidity', def: 'How quickly you can convert an investment to cash.', analogy: 'How fast you can sell your phone on OLX.', example: 'Mutual fund redemption: money in your bank in 1-3 days.', category: 'risk' },
  { term: 'Corpus', def: 'The total amount of money you\'ve accumulated.', analogy: 'Your investment piggy bank total.', example: '₹500/month for 20 years at 14% CAGR ≈ ₹9.5L corpus.', category: 'basics' },
  { term: 'KYC', def: 'Know Your Customer — identity verification for investing.', analogy: 'Like showing your ID to open a bank account.', example: 'PAN card + Aadhaar + selfie = KYC done in 10 minutes online.', category: 'basics' },
  { term: 'ELSS', def: 'Equity Linked Savings Scheme — tax-saving mutual fund.', analogy: 'Invest AND save tax — double benefit.', example: '₹1.5L in ELSS = up to ₹46,800 tax saved (30% bracket).', category: 'tax' },
  { term: 'Section 80C', def: 'Income tax deduction up to ₹1.5L for specified investments.', analogy: 'The government\'s "invest & save tax" coupon.', example: 'ELSS, PPF, EPF, NPS — all count under 80C.', category: 'tax' },
  { term: 'LTCG', def: 'Long Term Capital Gains — tax on profits held 1+ year.', analogy: 'Tax on patient investing — lower rate as a reward for holding.', example: 'Equity LTCG above ₹1L: taxed at 10%. ₹2L gain = ₹10,000 tax.', category: 'tax' },
  { term: 'STCG', def: 'Short Term Capital Gains — tax on profits held < 1 year.', analogy: 'Higher tax for impatient selling.', example: 'Equity STCG: taxed at 15%. ₹50,000 gain = ₹7,500 tax.', category: 'tax' },
  { term: 'AMC', def: 'Asset Management Company — the company that runs mutual funds.', analogy: 'Like the restaurant chain that manages all its branches.', example: 'SBI MF, HDFC MF, UTI MF — all are AMCs.', category: 'funds' },
  { term: 'SEBI', def: 'Securities and Exchange Board of India — the market regulator.', analogy: 'Like the traffic police of the stock market.', example: 'SEBI ensures no company can cheat investors. Protects your money.', category: 'basics' },
  { term: 'Demat Account', def: 'Digital account to hold stocks and securities electronically.', analogy: 'Like a digital wallet, but for stocks.', example: 'Open on Zerodha/Groww — takes 15 minutes.', category: 'basics' },
  { term: 'Folio', def: 'Your unique investor ID at a fund house.', analogy: 'Like your bank account number, but for mutual funds.', example: 'One folio can hold multiple schemes from the same AMC.', category: 'funds' },
  { term: 'Redemption', def: 'Selling your fund units to get cash back.', analogy: 'Cashing out your chips at the end of a game.', example: 'Redeem 100 units at NAV ₹50 = ₹5,000 in your bank in 2 days.', category: 'funds' },
  { term: 'SWP', def: 'Systematic Withdrawal Plan — auto-withdraw a fixed amount monthly.', analogy: 'Like a salary from your investments.', example: '₹50L corpus, ₹25,000/month SWP = 16+ years of income.', category: 'funds' },
  { term: 'Rebalancing', def: 'Adjusting your portfolio to maintain target allocation.', analogy: 'Like tuning your guitar — keep things in harmony.', example: 'Target: 70% equity, 30% debt. If equity grows to 80%, move 10% to debt.', category: 'risk' },
  { term: 'Direct Plan', def: 'Buying a fund directly from AMC — no distributor, lower fees.', analogy: 'Buying from the factory vs. a middleman shop.', example: 'Direct plan expense: 0.1%. Regular plan: 1.5%. You save ₹1,400/L/year.', category: 'funds' },
  { term: 'Exit Load', def: 'Fee charged if you redeem a fund before a set period.', analogy: 'Like a cancellation charge on a hotel booking.', example: 'Most equity funds: 1% exit load if redeemed within 1 year.', category: 'funds' },
  { term: 'Primary Market', def: 'Where companies sell shares directly to investors through IPOs.', analogy: 'Buying shoes directly from the Nike factory.', example: 'When Nykaa listed in 2021, investors bought shares from Nykaa directly.', category: 'basics' },
  { term: 'Secondary Market', def: 'Where investors trade shares with each other on stock exchanges.', analogy: 'Buying shoes from someone on OLX.', example: 'When you buy Reliance shares on Zerodha, you buy from another investor.', category: 'basics' },
]

const CATEGORY_LABELS: Record<string, string> = {
  basics: 'Basics', funds: 'Funds', metrics: 'Metrics', risk: 'Risk', tax: 'Tax',
}

// ── INVESTING ROADMAP ───────────────────────────────────────────────────────

interface RoadmapStep {
  step: number
  title: string
  description: string
  status: 'locked' | 'current' | 'done'
  icon: typeof Target
}

const ROADMAP_STEPS: Omit<RoadmapStep, 'status'>[] = [
  { step: 1, title: 'Understand your fear', description: 'Complete the Fear Profiler quiz', icon: Shield },
  { step: 2, title: 'Learn the basics', description: 'Kill 10 jargon words from the glossary', icon: BookOpen },
  { step: 3, title: 'See the math', description: 'Run your first SIP simulation', icon: Zap },
  { step: 4, title: 'Survive a crash', description: 'Complete the Time Machine experience', icon: Target },
  { step: 5, title: 'Ask your doubts', description: 'Have your first conversation with KINU', icon: Map },
  { step: 6, title: 'Start investing', description: 'Open a demat account → Start ₹500 SIP', icon: Target },
]

// ── FEAR-SPECIFIC MODULES ───────────────────────────────────────────────────

interface Module {
  id: string
  title: string
  readTime: string
  // Use a factory fn so component refs are resolved lazily at render time
  content: () => React.ReactNode
}

function getModulesForFear(fearType: FearType): Module[] {
  // Shared practical modules 6-10 — keyed by prefix
  const shared6to10 = (prefix: string): Module[] => [
    { id: `${prefix}-6`, title: "How KINETIC's simulators work", readTime: '5 min', content: () => <SimulatorsOverview /> },
    { id: `${prefix}-7`, title: 'SIP vs Lumpsum vs FD — the comparison', readTime: '6 min', content: () => <SipVsFdComparison /> },
    { id: `${prefix}-8`, title: 'Reading the Monte Carlo fan chart', readTime: '4 min', content: () => <MonteCarloExplainer /> },
    {
      id: `${prefix}-9`,
      title: prefix === 'trust' ? 'The fee X-ray advanced' : prefix === 'pattern' ? 'Verify a real fund' : prefix === 'clarity' ? 'Build your first SIP calculation' : 'The ₹500 Time Machine',
      readTime: '5 min',
      content: () => prefix === 'trust' ? <FeeCalculatorAdvanced /> : prefix === 'pattern' ? <VerifyRealFund /> : prefix === 'clarity' ? <SipCalculatorLearn /> : <TimeMachineExplainer />,
    },
    { id: `${prefix}-10`, title: 'Set up your first goal', readTime: '3 min', content: () => <GoalSetupLearn /> },
  ]

  switch (fearType) {
    case 'loss': return [
      { id: 'loss-1', title: 'Why your brain is wired to lose', readTime: '4 min', content: () => <LossModule1 /> },
      { id: 'loss-2', title: 'The crash survival record', readTime: '5 min', content: () => <LossModule2 /> },
      { id: 'loss-3', title: 'SIP vs lump sum in a crisis', readTime: '8 min', content: () => <SipVsLumpsum /> },
      { id: 'loss-4', title: 'The FD trap', readTime: '3 min', content: () => <FDTrap /> },
      { id: 'loss-5', title: 'Your first ₹100', readTime: '3 min', content: () => <First100 /> },
      ...shared6to10('loss'),
    ]
    case 'jargon': return [
      { id: 'clarity-1', title: 'The 20 words you need', readTime: '6 min', content: () => <SipExplainer /> },
      { id: 'clarity-2', title: 'How your ₹500 actually travels', readTime: '4 min', content: () => <MoneyFlow /> },
      { id: 'clarity-3', title: 'Reading a fund page', readTime: '5 min', content: () => <FundFactSheet /> },
      { id: 'clarity-4', title: 'XIRR vs CAGR — what your money actually earned', readTime: '5 min', content: () => <ActiveVsPassive /> },
      { id: 'clarity-5', title: 'Ask KINU your most embarrassing question', readTime: '3 min', content: () => <AskKinu /> },
      ...shared6to10('clarity'),
    ]
    case 'scam': return [
      { id: 'pattern-1', title: 'How to spot a scam in 10 seconds', readTime: '6 min', content: () => <RedFlagQuiz /> },
      { id: 'pattern-2', title: 'The wall that protects your money', readTime: '5 min', content: () => <SebiProtection /> },
      { id: 'pattern-3', title: 'Verified: how your money is held', readTime: '4 min', content: () => <MoneyFlow /> },
      { id: 'pattern-4', title: 'Due diligence checklist', readTime: '3 min', content: () => <DueDiligenceChecklist /> },
      { id: 'pattern-5', title: 'Build your own verified portfolio', readTime: '8 min', content: () => <DataSources /> },
      ...shared6to10('pattern'),
    ]
    case 'trust': return [
      { id: 'trust-1', title: 'Why index funds need no humans', readTime: '4 min', content: () => <IndexFundExplainer /> },
      { id: 'trust-2', title: 'The fee X-ray', readTime: '4 min', content: () => <FeeCalculator /> },
      { id: 'trust-3', title: 'Active vs passive: the 20-year race', readTime: '6 min', content: () => <ActiveVsPassive /> },
      { id: 'trust-4', title: 'GDP → Nifty → your portfolio', readTime: '4 min', content: () => <IndiaGrowth /> },
      { id: 'trust-5', title: 'Your autonomous 3-fund portfolio', readTime: '6 min', content: () => <ZeroTrustStart /> },
      ...shared6to10('trust'),
    ]
  }
}

// ── Crash History Module with timeline, stats, and KINU insight ─────────────

function TypewriterText({ text, delay = 30 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState('')
  const ref = useRef<HTMLParagraphElement>(null)
  const inView = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !inView.current) {
          inView.current = true
          let i = 0
          const timer = setInterval(() => {
            setDisplayed(text.slice(0, i + 1))
            i++
            if (i >= text.length) clearInterval(timer)
          }, delay)
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [text, delay])

  return (
    <p ref={ref} className="font-sans text-sm text-white/50 leading-relaxed">
      {displayed}
      {displayed.length < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          style={{ color: 'var(--accent)' }}
        >
          |
        </motion.span>
      )}
    </p>
  )
}

// ── SUB-COMPONENTS (Fear module content) ────────────────────────────────────

function LossModule1() {
  return (
    <div className="space-y-4">
      <p className="font-sans text-sm text-white/60 leading-relaxed">Kahneman's research proved that <strong className="text-white">losses feel 2.5x more painful than equivalent gains feel good.</strong> This is biology, not weakness.</p>
      <p className="font-sans text-sm text-white/60 leading-relaxed">When you see your portfolio drop ₹5,000, your brain processes it as if you lost ₹12,500 worth of happiness. But when it gains ₹5,000, you feel only ₹5,000 worth of joy.</p>
      <div className="rounded-2xl p-5 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <p className="font-sans text-xs text-white/40 mb-2">This is why you:</p>
        <ul className="font-sans text-sm text-white/55 space-y-2 list-disc list-inside">
          <li>Check your portfolio obsessively during dips</li>
          <li>Sell winning stocks too early to "lock in" gains</li>
          <li>Avoid investing altogether</li>
        </ul>
      </div>
    </div>
  )
}

function LossModule2() {
  const crashes = [
    { year: '2008', drop: '-52%', recovery: '18 months', sip: '₹54K → ₹1.82L' },
    { year: '2011', drop: '-28%', recovery: '8 months', sip: '₹30K → ₹52K' },
    { year: '2020', drop: '-38%', recovery: '6 months', sip: '₹30K → ₹68K' },
  ]
  return (
    <div className="space-y-4">
      <p className="font-sans text-sm text-white/60 leading-relaxed">Every major Nifty 50 crash — and how SIP investors came out ahead:</p>
      {crashes.map(c => (
        <div key={c.year} className="rounded-2xl p-4 border flex items-center justify-between" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div><p className="font-mono text-sm font-bold text-white">{c.year}</p><p className="font-sans text-xs text-white/30">Recovery: {c.recovery}</p></div>
          <div className="text-right"><p className="font-mono text-sm" style={{ color: 'var(--danger)' }}>{c.drop}</p><p className="font-sans text-[10px]" style={{ color: 'var(--teal)' }}>{c.sip}</p></div>
        </div>
      ))}
    </div>
  )
}

function SipVsLumpsum() {
  return (
    <div className="space-y-4">
      <p className="font-sans text-sm text-white/60 leading-relaxed">During a crash, SIP investors benefit by buying more units at lower prices.</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl p-4 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <p className="text-[9px] font-sans font-bold tracking-wider text-white/25 uppercase mb-2">₹60K lump sum</p>
          <p className="font-display font-semibold text-lg text-white">₹78,000</p>
          <p className="font-sans text-[10px] text-white/30 mt-1">After 10 years through 2008</p>
        </div>
        <div className="rounded-2xl p-4 border" style={{ background: 'var(--surface)', borderColor: 'var(--teal)', borderWidth: '2px' }}>
          <p className="text-[9px] font-sans font-bold tracking-wider text-white/25 uppercase mb-2">₹500/month SIP</p>
          <p className="font-display font-semibold text-lg" style={{ color: 'var(--teal)' }}>₹1,12,000</p>
          <p className="font-sans text-[10px] text-white/30 mt-1">Bought dips automatically</p>
        </div>
      </div>
    </div>
  )
}

function FDTrap() {
  return (
    <div className="space-y-4">
      <p className="font-sans text-sm text-white/60 leading-relaxed">"Safe" money in a fixed deposit is the risky choice over 10 years.</p>
      <div className="rounded-2xl p-5 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <p className="font-sans text-xs text-white/40 mb-3">₹1,00,000 in FD for 10 years at 6.8%</p>
        <div className="flex justify-between items-end">
          <div><p className="text-white/25 text-[9px] uppercase">Nominal</p><p className="font-display font-semibold text-white">₹1,93,000</p></div>
          <div className="text-right"><p className="text-white/25 text-[9px] uppercase">Real (after inflation)</p><p className="font-display font-semibold" style={{ color: 'var(--danger)' }}>₹1,09,000</p></div>
        </div>
      </div>
    </div>
  )
}

function First100() {
  return (
    <div className="space-y-4">
      <p className="font-sans text-sm text-white/60 leading-relaxed">₹100/month becomes:</p>
      {[{ y: 10, v: 23000 }, { y: 20, v: 95000 }, { y: 30, v: 350000 }].map(r => (
        <div key={r.y} className="rounded-2xl p-4 border flex justify-between items-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <p className="font-sans text-sm text-white/50">{r.y} years</p>
          <p className="font-display font-semibold" style={{ color: 'var(--teal)' }}>{formatINR(r.v)}</p>
        </div>
      ))}
    </div>
  )
}

function SipExplainer() {
  return (
    <div className="space-y-4">
      <p className="font-sans text-sm text-white/60 leading-relaxed">Day 1: ₹500 leaves your account automatically. It buys X units of the fund at today's NAV.</p>
      <div className="rounded-2xl p-4 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <p className="font-sans text-xs text-white/50">Month 1: NAV ₹50 → 10 units</p>
        <p className="font-sans text-xs text-white/50">Month 2: NAV ₹45 → 11.1 units</p>
        <p className="font-sans text-xs text-white/50">Month 3: NAV ₹55 → 9.1 units</p>
        <p className="font-sans text-xs text-white/30 mt-2">Total: ₹1,500 invested, 30.2 units, worth ₹1,661.</p>
      </div>
    </div>
  )
}

function MoneyFlow() {
  const steps = ['Your bank account', 'AMC (Asset Management Company)', 'Custodian Bank', 'Stocks / Bonds']
  return (
    <div className="space-y-3">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ background: 'var(--surface)', color: 'var(--teal)' }}>{i + 1}</div>
          <p className="font-sans text-sm text-white/60">{step}</p>
          {i < steps.length - 1 && <ChevronRight className="w-4 h-4 text-white/20" />}
        </div>
      ))}
      <p className="font-sans text-xs text-white/40 italic mt-2">Your money never sits with the fund manager — it goes to a custodian bank regulated by SEBI.</p>
    </div>
  )
}

function FundFactSheet() {
  const rows = [
    { l: 'Fund Name', v: 'SBI Nifty 50 Index Fund' }, { l: 'NAV', v: '₹186.42' }, { l: 'Expense Ratio', v: '0.10%' },
    { l: 'AUM', v: '₹5,234 Cr' }, { l: '1Y Return', v: '+18.4%' }, { l: '5Y Return', v: '+14.2% CAGR' },
  ]
  return (
    <div className="rounded-2xl p-5 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <p className="text-[9px] font-sans font-bold tracking-wider text-white/25 uppercase mb-3">Sample Fund Fact Sheet</p>
      {rows.map(r => (
        <div key={r.l} className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
          <span className="font-sans text-xs text-white/40">{r.l}</span>
          <span className="font-sans text-xs text-white/70">{r.v}</span>
        </div>
      ))}
    </div>
  )
}

function ActiveVsPassive() {
  return (
    <div className="space-y-4">
      <p className="font-sans text-sm text-white/60 leading-relaxed">In 2023, <strong className="text-white">84% of large-cap active funds underperformed the Nifty 50</strong> index over 10 years. (Source: SPIVA India Report)</p>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl p-4 border text-center" style={{ background: 'var(--surface)', borderColor: 'var(--danger)' }}>
          <p className="text-[9px] font-sans text-white/25 uppercase mb-1">Active funds avg</p>
          <p className="font-display text-xl font-bold" style={{ color: 'var(--danger)' }}>11.2%</p>
        </div>
        <div className="rounded-2xl p-4 border text-center" style={{ background: 'var(--surface)', borderColor: 'var(--teal)' }}>
          <p className="text-[9px] font-sans text-white/25 uppercase mb-1">Nifty 50 Index</p>
          <p className="font-display text-xl font-bold" style={{ color: 'var(--teal)' }}>14.0%</p>
        </div>
      </div>
    </div>
  )
}

function AskKinu() {
  return (
    <div className="space-y-4">
      <p className="font-sans text-sm text-white/60 leading-relaxed">Ask KINU your most confusing question. He explains everything without jargon.</p>
      <p className="font-sans text-xs text-white/40">Pro tip: Start with the terms you haven't learned yet from the Glossary.</p>
    </div>
  )
}

function SebiProtection() {
  const milestones = [
    { y: '1993', e: 'SEBI established' }, { y: '1996', e: 'Mutual funds regulated' },
    { y: '2017', e: 'Total expense ratio caps' }, { y: '2020', e: 'Fund categorization standardized' },
  ]
  return (
    <div className="space-y-3">
      {milestones.map(m => (
        <div key={m.y} className="flex items-center gap-3 rounded-2xl p-4 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <Check className="w-4 h-4 shrink-0" style={{ color: 'var(--teal)' }} />
          <div><p className="font-mono text-sm font-bold text-white">{m.y}</p><p className="font-sans text-xs text-white/40">{m.e}</p></div>
        </div>
      ))}
    </div>
  )
}

function RedFlagQuiz() {
  const questions = [
    { q: '"Fund guarantees 40% annual returns"', a: false, e: 'No fund can guarantee returns. SEBI prohibits this.' },
    { q: '"SEBI registered AMC, NAV published daily"', a: true, e: 'This is how regulated funds operate — fully transparent.' },
    { q: '"WhatsApp group promising 3x in 6 months"', a: false, e: 'Classic scam. No legitimate investment promises specific multipliers.' },
    { q: '"Monthly statement from CAMS/KFintech"', a: true, e: 'These are SEBI-authorized registrars. Legitimate operations.' },
    { q: '"This fund only accepts cash deposits"', a: false, e: 'Legitimate funds only accept bank transfers.' },
  ]
  const [cur, setCur] = useState(0)
  const [score, setScore] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [userAns, setUserAns] = useState<boolean | null>(null)
  const done = cur >= questions.length

  const answer = (isLegit: boolean) => { setUserAns(isLegit); setAnswered(true); if (isLegit === questions[cur].a) setScore(s => s + 1) }
  const next = () => { setCur(c => c + 1); setAnswered(false); setUserAns(null) }

  if (done) return <p className="font-sans text-sm" style={{ color: 'var(--teal)' }}>You scored {score}/{questions.length}. You can spot a scam. ✓</p>

  const q = questions[cur]
  return (
    <div className="space-y-4">
      <p className="font-sans text-xs text-white/30">{cur + 1} of {questions.length}</p>
      <p className="font-sans text-sm text-white/70">{q.q}</p>
      {!answered ? (
        <div className="flex gap-3">
          <button onClick={() => answer(true)} className="flex-1 py-3 rounded-xl font-sans text-sm border" style={{ borderColor: 'var(--border)', color: 'var(--teal)' }}>Legit</button>
          <button onClick={() => answer(false)} className="flex-1 py-3 rounded-xl font-sans text-sm border" style={{ borderColor: 'var(--border)', color: 'var(--danger)' }}>Scam</button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="font-sans text-sm font-medium" style={{ color: userAns === q.a ? 'var(--teal)' : 'var(--danger)' }}>{userAns === q.a ? 'Correct!' : 'Wrong!'}</p>
          <p className="font-sans text-xs text-white/40">{q.e}</p>
          <button onClick={next} className="text-[10px] font-sans font-bold uppercase tracking-wider" style={{ color: 'var(--accent)' }}>{cur < questions.length - 1 ? 'Next →' : 'See score'}</button>
        </div>
      )}
    </div>
  )
}

function DueDiligenceChecklist() {
  const items = ['Is it SEBI registered?', 'Is NAV published daily on AMFI?', 'Is expense ratio below 1%?', 'Can you withdraw anytime?', 'Is the custodian a major bank?']
  const [checked, setChecked] = useState<boolean[]>(items.map(() => false))
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <button key={i} onClick={() => { const c = [...checked]; c[i] = !c[i]; setChecked(c) }}
          className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-[border-color,background-color] duration-200"
          style={{ background: checked[i] ? 'rgba(29,158,117,0.05)' : 'var(--surface)', borderColor: checked[i] ? 'rgba(29,158,117,0.2)' : 'var(--border)' }}
        >
          <div className="w-5 h-5 rounded border flex items-center justify-center shrink-0" style={{ borderColor: checked[i] ? 'var(--teal)' : 'var(--border)' }}>
            {checked[i] && <Check className="w-3 h-3" style={{ color: 'var(--teal)' }} />}
          </div>
          <span className="font-sans text-sm" style={{ color: checked[i] ? 'var(--teal)' : 'rgba(255,255,255,0.5)' }}>{item}</span>
        </button>
      ))}
      {checked.every(c => c) && <p className="font-sans text-sm" style={{ color: 'var(--teal)' }}>All clear — it's legitimate. ✓</p>}
    </div>
  )
}

function DataSources() {
  return (
    <div className="space-y-3">
      {[{ n: 'NSE India', d: 'Nifty 50 data', u: 'nseindia.com' }, { n: 'RBI', d: 'CPI inflation data', u: 'rbi.org.in' }, { n: 'AMFI', d: 'Fund NAV data', u: 'amfiindia.com' }, { n: 'SEBI', d: 'Regulations', u: 'sebi.gov.in' }].map(s => (
        <div key={s.n} className="rounded-2xl p-4 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <p className="font-sans text-sm font-medium text-white">{s.n}</p>
          <p className="font-sans text-xs text-white/40">{s.d}</p>
          <p className="font-sans text-[10px] mt-1" style={{ color: 'var(--accent)' }}>{s.u} ↗</p>
        </div>
      ))}
    </div>
  )
}

function IndexFundExplainer() {
  return (
    <div className="space-y-4">
      <p className="font-sans text-sm text-white/60 leading-relaxed">The Nifty 50 is a list of India's 50 largest companies. An index fund buys all 50.</p>
      {[{ n: 'Reliance', w: '10.2%' }, { n: 'HDFC Bank', w: '8.1%' }, { n: 'Infosys', w: '6.8%' }, { n: 'TCS', w: '5.4%' }].map(c => (
        <div key={c.n} className="flex justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
          <span className="font-sans text-sm text-white/60">{c.n}</span>
          <span className="font-mono text-sm text-white/40">{c.w}</span>
        </div>
      ))}
      <p className="font-sans text-xs text-white/40 italic">No one decided this. The market decided.</p>
    </div>
  )
}

function FeeCalculator() {
  const [expense, setExpense] = useState(1.5)
  const monthly = 5000; const yrs = 20
  const totalInvested = monthly * yrs * 12
  const withFee = totalInvested * Math.pow(1 + (0.14 - expense / 100), yrs) * 0.45
  const withoutFee = totalInvested * Math.pow(1 + (0.14 - 0.001), yrs) * 0.45
  const feeLost = withoutFee - withFee
  return (
    <div className="space-y-4">
      <div>
        <label className="font-sans text-[11px] text-white/40 uppercase tracking-wider block mb-2">Expense ratio: {expense}%</label>
        <input type="range" min={0.1} max={2.5} step={0.1} value={expense} onChange={e => setExpense(Number(e.target.value))}
          className="w-full h-1 rounded-full appearance-none cursor-pointer" style={{ accentColor: 'var(--accent)', background: 'rgba(255,255,255,0.08)' }} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl p-4 border" style={{ background: 'var(--surface)', borderColor: 'var(--danger)' }}>
          <p className="text-[9px] font-sans text-white/25 uppercase mb-1">Fees lost ({expense}%)</p>
          <p className="font-display font-semibold text-lg" style={{ color: 'var(--danger)' }}>{formatINR(feeLost)}</p>
        </div>
        <div className="rounded-2xl p-4 border" style={{ background: 'var(--surface)', borderColor: 'var(--teal)' }}>
          <p className="text-[9px] font-sans text-white/25 uppercase mb-1">You keep (0.1%)</p>
          <p className="font-display font-semibold text-lg" style={{ color: 'var(--teal)' }}>{formatINR(withoutFee)}</p>
        </div>
      </div>
    </div>
  )
}

function IndiaGrowth() {
  return (
    <div className="space-y-4">
      <p className="font-sans text-sm text-white/60 leading-relaxed">You're not betting on a person. You're betting on India.</p>
      <p className="font-sans text-xs text-white/40">India — projected 3rd largest economy by 2030. The index reflects that growth.</p>
    </div>
  )
}

function ZeroTrustStart() {
  const steps = ['Open a demat account (Zerodha / Groww)', 'Search "Nifty 50 index fund"', 'Filter by expense ratio below 0.2%', 'Set up ₹500/month SIP', 'Don\'t look at it for 12 months']
  return (
    <div className="space-y-3">
      {steps.map((s, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl p-3 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0" style={{ background: 'rgba(192,241,142,0.08)', color: 'var(--accent)' }}>{i + 1}</div>
          <p className="font-sans text-xs text-white/55">{s}</p>
        </div>
      ))}
    </div>
  )
}

// ── MODULES 6-10 CONTENT — KINETIC tool explainers ─────────────────────────

function SimulatorsOverview() {
  return (
    <div className="space-y-4">
      <p className="font-sans text-sm text-white/60 leading-relaxed">KINETIC has four interactive simulators — each teaches you something a textbook cannot.</p>
      <div className="space-y-3">
        {[
          { name: 'Monte Carlo Simulation', desc: 'Run 1,000 futures of your SIP. See the range of outcomes — best, median, and worst.', emoji: '📈' },
          { name: 'Time Machine', desc: 'Put ₹500/month through real Indian market history — 2008, 2011, 2020. See if you would have panicked.', emoji: '⏱' },
          { name: 'Sandbox', desc: 'Allocate ₹50,000 across Nifty, Midcap, Smallcap and Debt for a specific year. Watch it play out month by month.', emoji: '🧪' },
          { name: 'SIP vs FD Comparison', desc: 'Live, interactive comparison of SIP returns vs Fixed Deposit at current rates.', emoji: '⚖️' },
        ].map(s => (
          <div key={s.name} className="rounded-2xl p-4 border flex gap-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <span className="text-xl shrink-0">{s.emoji}</span>
            <div>
              <p className="font-sans text-sm font-medium text-white/80 mb-1">{s.name}</p>
              <p className="font-sans text-xs text-white/40">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="font-sans text-xs text-white/30 italic">You can access all simulators from the sidebar. Try the Monte Carlo first.</p>
    </div>
  )
}

function SipVsFdComparison() {
  const [monthly, setMonthly] = useState(5000)
  const years = 10
  const sipResult = monthly * ((Math.pow(1.1164, years) - 1) / (1.1164 - 1)) * Math.pow(1.1164, 1)
  const fdResult = monthly * 12 * years * Math.pow(1 + 0.068 / 12, years * 12) / (years * 12)
  const fdSimple = monthly * 12 * years * 1.068
  return (
    <div className="space-y-4">
      <p className="font-sans text-sm text-white/60 leading-relaxed">Adjust your monthly investment to see the 10-year difference.</p>
      <div>
        <label className="font-sans text-[11px] text-white/40 uppercase tracking-wider block mb-2">Monthly amount: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(monthly)}</label>
        <input type="range" min={500} max={50000} step={500} value={monthly} onChange={e => setMonthly(Number(e.target.value))}
          className="w-full h-1 rounded-full appearance-none cursor-pointer" style={{ accentColor: 'var(--accent)', background: 'rgba(255,255,255,0.08)' }} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl p-4 border text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <p className="text-[9px] font-sans text-white/25 uppercase mb-2">FD at 6.8%</p>
          <p className="font-display font-semibold text-lg" style={{ color: 'var(--danger)' }}>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(fdSimple)}</p>
        </div>
        <div className="rounded-2xl p-4 border text-center" style={{ background: 'var(--surface)', borderColor: 'var(--teal)', borderWidth: '2px' }}>
          <p className="text-[9px] font-sans text-white/25 uppercase mb-2">SIP at 14% CAGR</p>
          <p className="font-display font-semibold text-lg" style={{ color: 'var(--teal)' }}>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(sipResult)}</p>
        </div>
      </div>
      <p className="font-sans text-xs text-white/30">SIP invests monthly; each instalment compounds independently. The more time, the bigger the gap.</p>
    </div>
  )
}

function MonteCarloExplainer() {
  return (
    <div className="space-y-4">
      <p className="font-sans text-sm text-white/60 leading-relaxed">The Monte Carlo simulation runs your SIP through <strong className="text-white">1,000 possible futures</strong> — each with different market conditions — and shows you the range of outcomes.</p>
      <div className="rounded-2xl p-5 border space-y-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <p className="font-sans text-xs text-white/40 uppercase tracking-wider">How to read the fan chart</p>
        {[
          { label: 'P90 (top line)', desc: 'Best 10% of outcomes — bull market scenario', color: 'var(--teal)' },
          { label: 'P50 (middle)', desc: 'The most likely outcome — median of 1,000 simulations', color: 'var(--accent)' },
          { label: 'P10 (bottom line)', desc: 'Worst 10% — bear market / prolonged crash scenario', color: 'var(--danger)' },
        ].map(r => (
          <div key={r.label} className="flex items-start gap-3">
            <div className="w-3 h-3 rounded-full shrink-0 mt-0.5" style={{ background: r.color }} />
            <div>
              <p className="font-sans text-xs font-medium text-white/70">{r.label}</p>
              <p className="font-sans text-[10px] text-white/35">{r.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="font-sans text-xs text-white/30 italic">Even in the P10 worst case, your SIP typically beats an FD over 10+ years. That's the power of equity compounding.</p>
    </div>
  )
}

function TimeMachineExplainer() {
  return (
    <div className="space-y-4">
      <p className="font-sans text-sm text-white/60 leading-relaxed">The Time Machine puts your ₹500/month SIP through actual Nifty 50 history — including every major crash.</p>
      <div className="space-y-3">
        {[
          { year: 'FY2008', event: 'Global Financial Crisis', drop: '−52%', lesson: 'SIP investors who held through 2008 tripled their money by 2012.' },
          { year: 'FY2020', event: 'COVID-19 Crash', drop: '−38%', lesson: 'The fastest crash recovery in history — Nifty recovered in 6 months.' },
          { year: 'FY2011', event: 'Eurozone Crisis', drop: '−28%', lesson: 'Mid-term dip. SIP investors bought cheap units throughout.' },
        ].map(r => (
          <div key={r.year} className="rounded-2xl p-4 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex justify-between items-start mb-1">
              <p className="font-mono text-sm font-bold text-white">{r.year} — {r.event}</p>
              <span className="font-mono text-xs" style={{ color: 'var(--danger)' }}>{r.drop}</span>
            </div>
            <p className="font-sans text-xs text-white/40">{r.lesson}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function FeeCalculatorAdvanced() {
  const [expense, setExpense] = useState(1.5)
  const [monthly, setMonthly] = useState(10000)
  const yrs = 20
  const lowFee = 0.001
  const highFee = expense / 100
  const totalInvested = monthly * yrs * 12
  const fv = (rate: number) => {
    const r = (0.14 - rate) / 12
    const n = yrs * 12
    return monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r)
  }
  const withLow = fv(lowFee)
  const withHigh = fv(highFee)
  const feeLost = withLow - withHigh
  return (
    <div className="space-y-4">
      <p className="font-sans text-sm text-white/60 leading-relaxed">A higher expense ratio silently eats your corpus. Use this to see exactly how much you'd lose.</p>
      <div className="space-y-3">
        <div>
          <label className="font-sans text-[11px] text-white/40 uppercase tracking-wider block mb-2">Monthly SIP: ₹{monthly.toLocaleString('en-IN')}</label>
          <input type="range" min={1000} max={50000} step={1000} value={monthly} onChange={e => setMonthly(Number(e.target.value))}
            className="w-full h-1 rounded-full appearance-none cursor-pointer" style={{ accentColor: 'var(--accent)', background: 'rgba(255,255,255,0.08)' }} />
        </div>
        <div>
          <label className="font-sans text-[11px] text-white/40 uppercase tracking-wider block mb-2">Expense ratio to compare: {expense}%</label>
          <input type="range" min={0.1} max={2.5} step={0.1} value={expense} onChange={e => setExpense(Number(e.target.value))}
            className="w-full h-1 rounded-full appearance-none cursor-pointer" style={{ accentColor: 'var(--danger)', background: 'rgba(255,255,255,0.08)' }} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl p-4 border text-center" style={{ background: 'var(--surface)', borderColor: 'var(--danger)' }}>
          <p className="text-[9px] font-sans text-white/25 uppercase mb-1">At {expense}% fee</p>
          <p className="font-display font-semibold text-base" style={{ color: 'var(--danger)' }}>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(withHigh)}</p>
        </div>
        <div className="rounded-2xl p-4 border text-center" style={{ background: 'var(--surface)', borderColor: 'var(--teal)' }}>
          <p className="text-[9px] font-sans text-white/25 uppercase mb-1">At 0.1% fee</p>
          <p className="font-display font-semibold text-base" style={{ color: 'var(--teal)' }}>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(withLow)}</p>
        </div>
      </div>
      <p className="font-sans text-xs text-center" style={{ color: 'var(--danger)' }}>You would lose {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(feeLost)} to fees over 20 years.</p>
    </div>
  )
}

function VerifyRealFund() {
  const checks = [
    { q: 'Find the fund on AMFI India website', url: 'amfiindia.com', done: false },
    { q: 'Check SEBI registration of the AMC', url: 'sebi.gov.in', done: false },
    { q: 'Verify NAV is published daily', url: 'valueresearchonline.com', done: false },
    { q: 'Confirm expense ratio below 1%', url: 'moneycontrol.com', done: false },
    { q: 'Check custodian is a major Indian bank', url: 'camsrepository.com', done: false },
  ]
  const [checked, setChecked] = useState(checks.map(() => false))
  const allDone = checked.every(Boolean)
  return (
    <div className="space-y-3">
      <p className="font-sans text-sm text-white/60 leading-relaxed">Practice verifying a real fund. Go through each step for any fund you're considering.</p>
      {checks.map((c, i) => (
        <button key={i} onClick={() => { const next = [...checked]; next[i] = !next[i]; setChecked(next) }}
          className="w-full flex items-start gap-3 p-3 rounded-xl border text-left transition-[border-color,background-color] duration-200"
          style={{ background: checked[i] ? 'rgba(29,158,117,0.05)' : 'var(--surface)', borderColor: checked[i] ? 'rgba(29,158,117,0.2)' : 'var(--border)' }}>
          <div className="w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5" style={{ borderColor: checked[i] ? 'var(--teal)' : 'var(--border)' }}>
            {checked[i] && <Check className="w-3 h-3" style={{ color: 'var(--teal)' }} />}
          </div>
          <div>
            <span className="font-sans text-sm" style={{ color: checked[i] ? 'var(--teal)' : 'rgba(255,255,255,0.5)' }}>{c.q}</span>
            <p className="font-sans text-[10px] mt-0.5" style={{ color: 'var(--accent)' }}>{c.url} ↗</p>
          </div>
        </button>
      ))}
      {allDone && <p className="font-sans text-sm text-center" style={{ color: 'var(--teal)' }}>All verified — this is a safe, regulated fund. ✓</p>}
    </div>
  )
}

function SipCalculatorLearn() {
  const [monthly, setMonthly] = useState(5000)
  const [yrs, setYrs] = useState(10)
  const r = 0.14 / 12
  const n = yrs * 12
  const fv = monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r)
  const invested = monthly * n
  const gain = fv - invested
  const fmt = (v: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v)
  return (
    <div className="space-y-4">
      <p className="font-sans text-sm text-white/60 leading-relaxed">A live SIP calculator — see how compounding works at India's long-term Nifty 50 average of 14%.</p>
      <div className="space-y-3">
        <div>
          <label className="font-sans text-[11px] text-white/40 uppercase tracking-wider block mb-2">Monthly SIP: {fmt(monthly)}</label>
          <input type="range" min={500} max={50000} step={500} value={monthly} onChange={e => setMonthly(Number(e.target.value))}
            className="w-full h-1 rounded-full appearance-none cursor-pointer" style={{ accentColor: 'var(--accent)', background: 'rgba(255,255,255,0.08)' }} />
        </div>
        <div>
          <label className="font-sans text-[11px] text-white/40 uppercase tracking-wider block mb-2">Duration: {yrs} years</label>
          <input type="range" min={1} max={30} step={1} value={yrs} onChange={e => setYrs(Number(e.target.value))}
            className="w-full h-1 rounded-full appearance-none cursor-pointer" style={{ accentColor: 'var(--accent)', background: 'rgba(255,255,255,0.08)' }} />
        </div>
      </div>
      <div className="rounded-2xl p-5 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex justify-between mb-2">
          <span className="font-sans text-xs text-white/40">Invested</span>
          <span className="font-mono text-sm text-white/70">{fmt(invested)}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span className="font-sans text-xs text-white/40">Gains</span>
          <span className="font-mono text-sm" style={{ color: 'var(--teal)' }}>{fmt(gain)}</span>
        </div>
        <div className="flex justify-between pt-2 border-t" style={{ borderColor: 'var(--border)' }}>
          <span className="font-sans text-sm font-medium text-white">Total corpus</span>
          <span className="font-display font-semibold text-lg" style={{ color: 'var(--accent)' }}>{fmt(fv)}</span>
        </div>
      </div>
    </div>
  )
}

function GoalSetupLearn() {
  return (
    <div className="space-y-4">
      <p className="font-sans text-sm text-white/60 leading-relaxed">A goal converts abstract "investing" into a concrete target — making it emotionally real and mathematically trackable.</p>
      <div className="space-y-3">
        {[
          { goal: '₹15L home down payment', years: '5 years', sip: '₹18,500/month', emoji: '🏠' },
          { goal: '₹3L emergency fund', years: '1 year', sip: '₹23,500/month', emoji: '🛡' },
          { goal: '₹2Cr retirement corpus', years: '25 years', sip: '₹8,200/month', emoji: '☀️' },
        ].map(g => (
          <div key={g.goal} className="rounded-2xl p-4 border flex gap-3" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <span className="text-xl shrink-0">{g.emoji}</span>
            <div className="flex-1">
              <p className="font-sans text-sm font-medium text-white/80">{g.goal}</p>
              <p className="font-sans text-[10px] text-white/35 mt-0.5">{g.years} · {g.sip}</p>
            </div>
          </div>
        ))}
      </div>
      <p className="font-sans text-xs text-white/30 italic">Set up your own goal in the Portfolio section. It tracks your SIP progress toward each target.</p>
    </div>
  )
}

// ── MAIN LEARN PAGE ─────────────────────────────────────────────────────────

export default function LearnPage() {
  const fearType = useAppStore(s => s.fearType) ?? 'loss'
  const completedModules = useAppStore(s => s.completedModules)
  const completeModule = useAppStore(s => s.completeModule)
  const simulationResult = useAppStore(s => s.simulationResult)
  const timeMachineResult = useAppStore(s => s.timeMachineResult)
  const setDashboardSection = useAppStore(s => s.setDashboardSection)

  const [activeTab, setActiveTab] = useState<'roadmap' | 'glossary' | 'modules'>('modules')
  const [activeModule, setActiveModule] = useState(0)
  const [search, setSearch] = useState('')
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null)
  const [catFilter, setCatFilter] = useState<string>('all')
  const [showOtherTracks, setShowOtherTracks] = useState(false)

  const modules = getModulesForFear(fearType)
  const curriculumTrack = getTrackForFear(fearType)
  // Count against the full 10-module curriculum track — same source as the profile dropdown
  const completedCount = curriculumTrack.filter(m => completedModules.includes(m.id)).length
  const totalModules = curriculumTrack.length
  const trackName = TRACK_NAMES[fearType as FearTrack] || 'Your Track'

  // Glossary search + filter
  const filteredGlossary = useMemo(() => {
    let list = GLOSSARY
    if (catFilter !== 'all') list = list.filter(t => t.category === catFilter)
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(t => t.term.toLowerCase().includes(q) || t.def.toLowerCase().includes(q))
    }
    return list
  }, [search, catFilter])

  // Roadmap status
  const roadmap: RoadmapStep[] = ROADMAP_STEPS.map(s => ({
    ...s,
    status: s.step === 1 ? 'done'
      : s.step === 2 ? (completedModules.length >= 10 ? 'done' : completedModules.length > 0 ? 'current' : 'locked')
        : s.step === 3 ? (simulationResult ? 'done' : 'current')
          : s.step === 4 ? (timeMachineResult ? 'done' : simulationResult ? 'current' : 'locked')
            : s.step <= 3 ? 'locked' : 'locked',
  }))

  const tabs = [
    { id: 'modules' as const, label: `${trackName} Track`, icon: Target },
    { id: 'roadmap' as const, label: 'Roadmap', icon: Map },
    { id: 'glossary' as const, label: 'Glossary', icon: BookOpen },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
      {/* News Impact Card */}
      <div className="mb-6">
        <NewsImpactCard context="learn" fearType={fearType} />
      </div>

      {/* Calculator Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => setDashboardSection('compare')}
          className="rounded-2xl p-5 border text-left transition-all duration-200 hover:border-white/12 group"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(55,138,221,0.08)' }}>
              <span className="text-sm">📊</span>
            </div>
            <h3 className="font-sans text-sm font-medium text-white/70 group-hover:text-white transition-colors">SIP vs FD vs Lumpsum</h3>
          </div>
          <p className="font-sans text-xs text-white/30">Compare 14% Nifty CAGR against fixed deposits. Interactive chart.</p>
        </button>
        <button
          onClick={() => setDashboardSection('calculators')}
          className="rounded-2xl p-5 border text-left transition-all duration-200 hover:border-white/12 group"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(192,241,142,0.08)' }}>
              <span className="text-sm">🧮</span>
            </div>
            <h3 className="font-sans text-sm font-medium text-white/70 group-hover:text-white transition-colors">SIP & SWP Calculators</h3>
          </div>
          <p className="font-sans text-xs text-white/30">Plan your wealth building. Step-up SIP, withdrawal planning, breakeven rates.</p>
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-sans text-sm font-medium whitespace-nowrap transition-[background-color,color,border-color] duration-200 border shrink-0"
              style={{
                background: isActive ? 'rgba(192,241,142,0.07)' : 'var(--surface)',
                borderColor: isActive ? 'rgba(192,241,142,0.18)' : 'var(--border)',
                color: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.4)',
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* ── ROADMAP TAB ──────────────────────────────────────────────── */}
        {activeTab === 'roadmap' && (
          <motion.div key="roadmap" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <h2 className="font-display font-semibold text-xl text-white mb-2">Your Investing Roadmap</h2>
            <p className="font-sans text-sm text-white/40 mb-8">6 steps from zero to your first SIP.</p>

            <div className="relative space-y-0">
              {/* Vertical line */}
              <div className="absolute left-5 top-8 bottom-8 w-[2px]" style={{ background: 'var(--border)' }} />

              {roadmap.map((step, i) => {
                const Icon = step.icon
                return (
                  <motion.div
                    key={step.step}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                    className="relative flex items-start gap-5 pb-8"
                  >
                    {/* Dot */}
                    <div className="relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border" style={{
                      background: step.status === 'done' ? 'rgba(29,158,117,0.12)' : step.status === 'current' ? 'rgba(192,241,142,0.10)' : 'var(--surface)',
                      borderColor: step.status === 'done' ? 'rgba(29,158,117,0.3)' : step.status === 'current' ? 'rgba(192,241,142,0.25)' : 'var(--border)',
                    }}>
                      {step.status === 'done' ? <Check className="w-4 h-4" style={{ color: 'var(--teal)' }} /> : <Icon className="w-4 h-4" style={{ color: step.status === 'current' ? 'var(--accent)' : 'rgba(255,255,255,0.2)' }} />}
                    </div>
                    {/* Content */}
                    <div className="rounded-2xl p-5 border flex-1" style={{
                      background: step.status === 'current' ? 'rgba(192,241,142,0.04)' : 'var(--surface)',
                      borderColor: step.status === 'current' ? 'rgba(192,241,142,0.12)' : 'var(--border)',
                    }}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[10px] font-bold" style={{ color: step.status === 'done' ? 'var(--teal)' : step.status === 'current' ? 'var(--accent)' : 'rgba(255,255,255,0.2)' }}>STEP {step.step}</span>
                        {step.status === 'done' && <span className="text-[9px] font-sans px-2 py-0.5 rounded-full" style={{ background: 'rgba(29,158,117,0.1)', color: 'var(--teal)' }}>Done</span>}
                        {step.status === 'current' && <span className="text-[9px] font-sans px-2 py-0.5 rounded-full" style={{ background: 'rgba(192,241,142,0.08)', color: 'var(--accent)' }}>Current</span>}
                      </div>
                      <p className="font-display font-medium text-sm text-white mb-1">{step.title}</p>
                      <p className="font-sans text-xs text-white/35">{step.description}</p>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* ── GLOSSARY TAB ─────────────────────────────────────────────── */}
        {activeTab === 'glossary' && (
          <motion.div key="glossary" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <h2 className="font-display font-semibold text-xl text-white mb-2">The Glossary</h2>
            <p className="font-sans text-sm text-white/40 mb-6">{GLOSSARY.length} essential terms. Search or browse by category.</p>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search terms..."
                className="w-full bg-transparent border rounded-xl pl-11 pr-4 py-3 font-sans text-sm text-white outline-none placeholder:text-white/20 focus:border-[var(--border-bright)] transition-[border-color] duration-200"
                style={{ borderColor: 'var(--border)' }}
              />
            </div>

            {/* Category pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              {['all', 'basics', 'funds', 'metrics', 'risk', 'tax'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCatFilter(cat)}
                  className="px-3 py-1.5 rounded-full text-[11px] font-sans font-medium border transition-[background-color,border-color,color] duration-200"
                  style={{
                    background: catFilter === cat ? 'rgba(192,241,142,0.07)' : 'transparent',
                    borderColor: catFilter === cat ? 'rgba(192,241,142,0.18)' : 'var(--border)',
                    color: catFilter === cat ? 'var(--accent)' : 'rgba(255,255,255,0.35)',
                  }}
                >
                  {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>

            {/* Results count */}
            <p className="font-sans text-xs text-white/25 mb-4">{filteredGlossary.length} terms</p>

            {/* Term list */}
            <div style={{ height: '480px', overflowY: 'scroll', scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }} className="space-y-1 pr-2">
              {filteredGlossary.map(t => {
                const isOpen = expandedTerm === t.term
                return (
                  <div key={t.term}>
                    <button
                      onClick={() => setExpandedTerm(isOpen ? null : t.term)}
                      className="w-full flex items-center justify-between p-4 rounded-xl border transition-[background-color,border-color] duration-200"
                      style={{
                        background: isOpen ? 'rgba(192,241,142,0.04)' : 'var(--surface)',
                        borderColor: isOpen ? 'rgba(192,241,142,0.12)' : 'var(--border)',
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-display font-semibold text-sm text-white">{t.term}</span>
                        <span className="text-[9px] font-sans px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.25)' }}>
                          {CATEGORY_LABELS[t.category]}
                        </span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-white/20 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-4 ml-4 border-l-2 space-y-2" style={{ borderColor: 'var(--accent)' }}>
                            <p className="font-sans text-sm text-white/60">{t.def}</p>
                            <p className="font-sans text-xs text-white/35"><span style={{ color: 'var(--accent)' }}>Analogy:</span> {t.analogy}</p>
                            <p className="font-sans text-xs text-white/35"><span style={{ color: 'var(--teal)' }}>Example:</span> {t.example}</p>
                            {t.term === 'XIRR' && (
                              <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}><XIRRExplainer /></div>
                            )}
                            {(t.term === 'Primary Market' || t.term === 'Secondary Market') && (
                              <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}><MarketExplainer /></div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })}
              {filteredGlossary.length === 0 && <p className="font-sans text-sm text-white/30 text-center py-8">No terms match your search.</p>}
            </div>
          </motion.div>
        )}

        {/* ── MODULES TAB ──────────────────────────────────────────────── */}
        {activeTab === 'modules' && (
          <motion.div key="modules" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">

            {/* FY Comparison Card */}
            <FYComparison />

            {/* Copy the Market */}
            <CopyTheMarket />

            <div className="mb-6">
              <p className="font-sans text-sm text-white/40">
                <span className="text-white font-medium">{completedCount} of {totalModules}</span> modules completed
              </p>
              <div className="h-1 rounded-full mt-2 overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <div className="h-full rounded-full transition-all duration-500" style={{ background: 'var(--accent)', width: `${totalModules > 0 ? (completedCount / totalModules) * 100 : 0}%` }} />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
              {/* Vertical curriculum list */}
              <div className="space-y-1.5">
                {modules.map((m, i) => {
                  const done = completedModules.includes(m.id)
                  const active = activeModule === i
                  const curriculum = curriculumTrack[i]
                  const locked = curriculum ? isModuleLocked(curriculum, completedModules) : false
                  const moduleType = curriculum?.type || 'Concept'
                  const typeColor = TYPE_COLORS[moduleType] || '#c0f18e'

                  return (
                    <button key={m.id}
                      onClick={() => !locked && setActiveModule(i)}
                      disabled={locked}
                      className="w-full flex items-start gap-3 p-3.5 rounded-xl text-left transition-[background-color,border-color,opacity] duration-200 border group relative"
                      style={{
                        background: active ? 'rgba(192,241,142,0.06)' : 'var(--surface)',
                        borderColor: active ? 'rgba(192,241,142,0.18)' : 'var(--border)',
                        opacity: locked ? 0.4 : 1,
                        cursor: locked ? 'not-allowed' : 'pointer',
                      }}
                    >
                      {/* Number / check / lock */}
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{
                        background: done ? 'rgba(29,158,117,0.12)' : locked ? 'rgba(255,255,255,0.03)' : active ? 'rgba(192,241,142,0.08)' : 'rgba(255,255,255,0.04)',
                      }}>
                        {done
                          ? <Check className="w-3.5 h-3.5" style={{ color: 'var(--teal)' }} />
                          : locked
                            ? <Lock className="w-3 h-3 text-white/15" />
                            : <span className="font-mono text-[10px] font-bold" style={{ color: active ? 'var(--accent)' : 'rgba(255,255,255,0.25)' }}>{i + 1}</span>
                        }
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`font-sans text-sm leading-tight ${done ? 'text-white/35 line-through' : 'text-white/70'}`}>{m.title}</p>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[9px] font-sans font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider"
                            style={{ background: `${typeColor}12`, color: `${typeColor}cc` }}>
                            {moduleType}
                          </span>
                          <span className="font-mono text-[9px] text-white/20">{m.readTime}</span>
                        </div>
                      </div>
                    </button>
                  )
                })}

                {/* Explore other tracks */}
                <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
                  <button
                    onClick={() => setShowOtherTracks(!showOtherTracks)}
                    className="w-full flex items-center justify-between py-2 text-left"
                  >
                    <span className="font-sans text-xs text-white/30">Explore other tracks</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-white/20 transition-transform duration-200 ${showOtherTracks ? 'rotate-180' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {showOtherTracks && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-2 pt-2">
                          {(Object.keys(ALL_TRACKS) as FearTrack[]).filter(t => t !== fearType).map(trackId => (
                            <div key={trackId} className="rounded-xl p-3 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                              <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 rounded-full" style={{ background: TRACK_COLORS[trackId] }} />
                                <p className="font-sans text-xs font-medium text-white/60">{TRACK_NAMES[trackId]}</p>
                              </div>
                              <p className="font-sans text-[10px] text-white/25">{ALL_TRACKS[trackId].length} modules</p>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Module content area */}
              <div className="rounded-3xl p-6 md:p-8 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <AnimatePresence mode="wait">
                  <motion.div key={activeModule} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
                    <div className="flex items-center gap-2.5 mb-6">
                      <h3 className="font-display font-semibold text-lg text-white tracking-tight">{modules[activeModule].title}</h3>
                      {curriculumTrack[activeModule] && (
                        <span className="text-[9px] font-sans font-bold px-1.5 py-0.5 rounded-full uppercase tracking-wider"
                          style={{ background: `${TYPE_COLORS[curriculumTrack[activeModule].type]}12`, color: `${TYPE_COLORS[curriculumTrack[activeModule].type]}cc` }}>
                          {curriculumTrack[activeModule].type}
                        </span>
                      )}
                    </div>
                    {modules[activeModule].content()}
                    {!completedModules.includes(modules[activeModule].id) ? (
                      <button onClick={() => completeModule(modules[activeModule].id, curriculumTrack[activeModule]?.fearProgressIncrement)}
                        className="mt-8 px-6 py-3 rounded-full font-sans font-bold text-sm text-[#0a1a00] active:scale-[0.97] transition-transform duration-200"
                        style={{ background: 'var(--accent)' }}
                      >Mark as completed</button>
                    ) : (
                      <div className="mt-8 flex items-center gap-2"><Check className="w-4 h-4" style={{ color: 'var(--teal)' }} /><span className="font-sans text-sm" style={{ color: 'var(--teal)' }}>Completed</span></div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
