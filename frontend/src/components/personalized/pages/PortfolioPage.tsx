import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useAppStore, type FearType } from '../../../store/useAppStore'
import { postCreateUser, postSignIn } from '../../../lib/api'
import { formatINR } from '../../../lib/formatINR'
import { generateKinuChat } from '../../../lib/kinuAI'
import {
  TrendingUp, TrendingDown, Zap, BarChart3, Wallet,
  ChevronRight, Check, ArrowRight, Eye, EyeOff, LogIn, Share2,
} from 'lucide-react'
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  AreaSeries,
  ColorType,
  CrosshairMode,
} from 'lightweight-charts'
import NewsImpactCard from '../../news/NewsImpactCard'
import { getFearFraming } from '../../../lib/newsAPI'

// ── Animation presets ───────────────────────────────────────────────────────

const PAGE_TRANSITION = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.4, ease: 'easeOut' as const },
}

// ── Holdings data ───────────────────────────────────────────────────────────

interface Holding {
  name: string
  sector: string
  weight: number
}

const NIFTY_HOLDINGS: Holding[] = [
  { name: 'RELIANCE', sector: 'Energy', weight: 9.2 },
  { name: 'HDFC BANK', sector: 'Banking', weight: 8.1 },
  { name: 'INFOSYS', sector: 'IT', weight: 6.3 },
  { name: 'ICICI BANK', sector: 'Banking', weight: 5.8 },
  { name: 'TCS', sector: 'IT', weight: 5.1 },
  { name: 'BHARTI AIRTEL', sector: 'Telecom', weight: 3.2 },
  { name: 'AXIS BANK', sector: 'Banking', weight: 2.8 },
  { name: 'L&T', sector: 'Infrastructure', weight: 2.6 },
  { name: 'KOTAK MAHINDRA', sector: 'Banking', weight: 2.4 },
  { name: 'BAJAJ FINANCE', sector: 'NBFC', weight: 2.2 },
]

const MIDCAP_HOLDINGS: Holding[] = [
  { name: 'PERSISTENT SYSTEMS', sector: 'IT', weight: 18.5 },
  { name: 'DIXON TECH', sector: 'Electronics', weight: 17.2 },
  { name: 'VOLTAS', sector: 'Consumer', weight: 16.8 },
  { name: 'TATA ELXSI', sector: 'IT', weight: 16.5 },
  { name: 'ASTRAL', sector: 'Building', weight: 15.8 },
  { name: 'CROMPTON GREAVES', sector: 'Consumer', weight: 15.2 },
]

const MULTI_HOLDINGS: Holding[] = [
  { name: 'RELIANCE', sector: 'Energy', weight: 18.0 },
  { name: 'INFOSYS', sector: 'IT', weight: 14.0 },
  { name: 'HDFC BANK', sector: 'Banking', weight: 12.0 },
  { name: 'TCS', sector: 'IT', weight: 10.0 },
  { name: 'BHARAT BOND ETF', sector: 'Debt', weight: 26.0 },
  { name: 'NIPPON INDIA GOLD ETF', sector: 'Gold', weight: 20.0 },
]

function getHoldingsForFund(fund: string): Holding[] {
  if (fund.includes('Midcap')) return MIDCAP_HOLDINGS
  if (fund.includes('Multi')) return MULTI_HOLDINGS
  return NIFTY_HOLDINGS
}

// ── Fund options ────────────────────────────────────────────────────────────

const FUND_OPTIONS = [
  {
    id: 'nifty',
    name: 'Nifty 50 Index Fund',
    desc: "Copies India's top 50 companies. No human decisions. Lowest fees.",
    expense: '0.1%',
    recommended: true,
  },
  {
    id: 'midcap',
    name: 'Midcap Index Fund',
    desc: 'Mid-sized companies. Higher growth potential, higher volatility.',
    expense: '0.3%',
    recommended: false,
  },
  {
    id: 'multi',
    name: 'Multi-asset (Nifty 50 + Debt + Gold)',
    desc: 'Balanced from day one. Equity growth with a safety net.',
    expense: '0.4%',
    recommended: false,
  },
]

// ── KINU insights ──────────────────────────────────────────────────────────

const FEAR_PORTFOLIO_INSIGHTS: Record<FearType, string> = {
  loss: "Your portfolio is up. But more importantly — it has survived every simulated dip and recovered. That pattern is the whole point.",
  jargon: "In simple terms: your money is making money. The XIRR number shows your true annual return — it accounts for every SIP date. This is better than any FD.",
  scam: "Every holding here is from a SEBI-regulated index fund. The returns are calculated from publicly available NSE data. Nothing here is a black box.",
  trust: "No fund manager made a single decision in this portfolio. Every holding is determined by market capitalisation rules. Fully mechanical.",
}

// ── Simulated chart data ────────────────────────────────────────────────────

function generateSimulatedPath(months: number, monthlyAmount: number, cagr: number = 14): number[] {
  const monthlyRate = Math.pow(1 + cagr / 100, 1 / 12) - 1
  const values: number[] = []
  let total = 0
  for (let m = 0; m < months; m++) {
    total += monthlyAmount
    total *= (1 + monthlyRate + (Math.random() - 0.5) * 0.03) // small noise
    values.push(Math.round(total))
  }
  return values
}

function formatValue(v: number): string {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`
  if (v >= 100000) return `₹${(v / 100000).toFixed(2)}L`
  return `₹${v.toLocaleString('en-IN')}`
}

function projectedValue(monthly: number, years: number, cagr: number = 14): number {
  const r = cagr / 100 / 12
  const n = years * 12
  return monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r)
}

const PERIODS = ['1W', '1M', '3M', '6M', '1Y', 'ALL'] as const
type Period = (typeof PERIODS)[number]

// ═══════════════════════════════════════════════════════════════════════════
// STATE 1 — GUEST
// ═══════════════════════════════════════════════════════════════════════════

function GuestState() {
  const fearType = useAppStore(s => s.fearType) ?? 'loss'
  const metaphorStyle = useAppStore(s => s.metaphorStyle) ?? 'generic'
  const userName = useAppStore(s => s.userName) || ''
  const setUserProfile = useAppStore(s => s.setUserProfile)
  const setUserId = useAppStore(s => s.setUserId)

  const [mode, setMode] = useState<'signup' | 'signin'>('signup')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSignup = async () => {
    if (!email || !password) return
    setLoading(true)
    setError('')
    try {
      const displayName = name.trim() || email.split('@')[0]
      const res = await postCreateUser({
        name: displayName,
        email,
        fear_type: fearType,
        metaphor_style: metaphorStyle,
        password,
      })
      if (res.success) {
        setUserProfile(displayName, email, '')
        setUserId(res.user_id)
        useAppStore.setState({ isAuthenticated: true })
      } else {
        setError('Something went wrong. Please try again.')
      }
    } catch {
      setError('Could not connect to server.')
    } finally {
      setLoading(false)
    }
  }

  const handleSignin = async () => {
    if (!email || !password) return
    setLoading(true)
    setError('')
    try {
      const res = await postSignIn({ email, password })
      if (res.success) {
        setUserProfile(res.name || email.split('@')[0], email, '')
        setUserId(res.user_id)
        useAppStore.setState({ isAuthenticated: true })
        if (res.fear_type) {
          useAppStore.setState({ fearType: res.fear_type as FearType })
        }
      } else {
        setError('No account found with that email.')
      }
    } catch {
      setError('Could not connect to server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div {...PAGE_TRANSITION} key="guest" className="max-w-md mx-auto text-center py-8">
      {/* Kinetic logo mark */}
      <div className="w-16 h-16 rounded-3xl mx-auto mb-8 flex items-center justify-center"
        style={{ background: 'rgba(192,241,142,0.06)', border: '1px solid rgba(192,241,142,0.12)', boxShadow: '0 0 60px rgba(192,241,142,0.08)' }}>
        <span className="font-display font-bold text-xl" style={{ color: 'var(--accent)' }}>K</span>
      </div>

      <h1 className="font-display font-bold text-3xl text-white tracking-tight mb-3">Your portfolio lives here.</h1>
      <p className="font-sans text-sm text-white/35 leading-relaxed mb-8 max-w-sm mx-auto">
        When you're ready to track your progress, save your simulations, and set up your first SIP — this is where it all comes together.
      </p>

      {/* Auth form */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.25 }}
          className="rounded-3xl p-7 border text-left"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <div className="space-y-4">
            {/* Name field — signup only */}
            {mode === 'signup' && (
              <div>
                <label className="font-sans text-[10px] text-white/25 uppercase tracking-wider block mb-1.5">Your name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="What should we call you?"
                  className="w-full bg-transparent border rounded-xl px-4 py-3 font-sans text-sm text-white outline-none placeholder:text-white/15 focus:border-[rgba(192,241,142,0.25)] transition-[border-color] duration-200"
                  style={{ borderColor: 'var(--border)' }}
                />
              </div>
            )}
            <div>
              <label className="font-sans text-[10px] text-white/25 uppercase tracking-wider block mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full bg-transparent border rounded-xl px-4 py-3 font-sans text-sm text-white outline-none placeholder:text-white/15 focus:border-[rgba(192,241,142,0.25)] transition-[border-color] duration-200"
                style={{ borderColor: 'var(--border)' }}
              />
            </div>
            <div>
              <label className="font-sans text-[10px] text-white/25 uppercase tracking-wider block mb-1.5">
                {mode === 'signup' ? 'Create a password' : 'Password'}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Create a password' : 'Your password'}
                  className="w-full bg-transparent border rounded-xl px-4 py-3 pr-11 font-sans text-sm text-white outline-none placeholder:text-white/15 focus:border-[rgba(192,241,142,0.25)] transition-[border-color] duration-200"
                  style={{ borderColor: 'var(--border)' }}
                  onKeyDown={e => e.key === 'Enter' && (mode === 'signup' ? handleSignup() : handleSignin())}
                />
                <button onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/40 transition-colors">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="font-sans text-xs text-center" style={{ color: 'var(--danger)' }}>
                {error}
                {mode === 'signin' && error.includes('No account') && (
                  <button onClick={() => { setMode('signup'); setError('') }} className="ml-1 underline" style={{ color: 'var(--accent)' }}>
                    Create one?
                  </button>
                )}
              </p>
            )}

            <button
              onClick={mode === 'signup' ? handleSignup : handleSignin}
              disabled={loading || !email || !password}
              className="w-full py-3.5 rounded-full font-sans font-bold text-sm text-[#0a1a00] flex items-center justify-center gap-2 active:scale-[0.97] disabled:opacity-40 transition-[opacity,transform] duration-200"
              style={{ background: 'var(--accent)' }}
            >
              {loading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-4 h-4 border-2 rounded-full" style={{ borderColor: '#0a1a00', borderTopColor: 'transparent' }} />
              ) : (
                <>
                  {mode === 'signup' ? 'Create my account' : 'Sign in'} <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <p className="font-sans text-[10px] text-white/15 text-center mt-4">
            No spam. No financial advice. No fees to sign up.
          </p>
        </motion.div>
      </AnimatePresence>

      <p className="font-sans text-[10px] text-white/20 mt-4">
        {mode === 'signup' ? (
          <>Already have an account? <button onClick={() => { setMode('signin'); setError('') }} className="underline" style={{ color: 'var(--accent)' }}>Sign in →</button></>
        ) : (
          <>Need an account? <button onClick={() => { setMode('signup'); setError('') }} className="underline" style={{ color: 'var(--accent)' }}>Create one →</button></>
        )}
      </p>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// STATE 2 — SIGNED UP, NO PORTFOLIO
// ═══════════════════════════════════════════════════════════════════════════

function SetupState() {
  const rawName = useAppStore(s => s.userName)
  const userName = rawName && rawName !== 'Explorer' ? rawName.split(' ')[0] : ''
  const monthlyAmount = useAppStore(s => s.monthlyAmount)
  const setMonthlyAmount = useAppStore(s => s.setMonthlyAmount)
  const setSelectedFund = useAppStore(s => s.setSelectedFund)
  const setSipDate = useAppStore(s => s.setSipDate)
  const setPortfolioSetup = useAppStore(s => s.setPortfolioSetup)
  const setPortfolioSetupDate = useAppStore(s => s.setPortfolioSetupDate)

  const [flowOpen, setFlowOpen] = useState(false)
  const [step, setStep] = useState(0)
  const [fund, setFund] = useState('')
  const [amount, setAmount] = useState(monthlyAmount || 500)
  const [date, setDate] = useState(5)
  const [confirmed, setConfirmed] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const firstName = userName || 'your'

  const handleConfirm = () => {
    setConfirming(true)
    setTimeout(() => {
      setConfirming(false)
      setConfirmed(true)
    }, 2000)
  }

  const handleDismissConfirmation = () => {
    setSelectedFund(fund)
    setMonthlyAmount(amount)
    setSipDate(date)
    setPortfolioSetup(true)
    setPortfolioSetupDate(new Date().toISOString())
  }

  const p5 = Math.round(projectedValue(amount, 5))
  const p10 = Math.round(projectedValue(amount, 10))
  const p20 = Math.round(projectedValue(amount, 20))

  const nextMonth = new Date()
  nextMonth.setMonth(nextMonth.getMonth() + 1)
  const sipDateStr = `${date}${date === 1 ? 'st' : date === 2 ? 'nd' : date === 3 ? 'rd' : 'th'} ${nextMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}`

  return (
    <motion.div {...PAGE_TRANSITION} key="setup" className="max-w-2xl mx-auto py-8">
      <h1 className="font-display font-semibold text-3xl text-white tracking-tight mb-2">{userName ? `Welcome, ${userName}.` : 'Welcome.'}</h1>

      {/* overlay blur when flow is open */}
      {flowOpen && !confirmed && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[4px]"
          onClick={() => setFlowOpen(false)} />
      )}

      {/* Start Investing card / flow */}
      <AnimatePresence mode="wait">
        {!flowOpen ? (
          <motion.div key="cta" {...PAGE_TRANSITION}
            className="rounded-3xl p-8 border mt-6"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', borderLeft: '4px solid var(--accent)' }}>
            <h2 className="font-display font-semibold text-xl text-white mb-2">Set up your first SIP</h2>
            <p className="font-sans text-sm text-white/40 mb-6 leading-relaxed">
              It takes 3 minutes. No real money moves until you confirm with a real brokerage. This is your practice run.
            </p>

            <div className="grid grid-cols-3 gap-4 mb-8">
              {[
                { value: '₹500', label: 'minimum to start' },
                { value: '14%', label: 'Nifty 50 historical CAGR' },
                { value: '3 min', label: 'to set up' },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.15 }}
                  className="text-center">
                  <p className="font-display font-bold text-2xl" style={{ color: 'var(--accent)' }}>{s.value}</p>
                  <p className="font-sans text-[10px] text-white/25 mt-1">{s.label}</p>
                </motion.div>
              ))}
            </div>

            <button onClick={() => setFlowOpen(true)}
              className="w-full py-4 rounded-full font-sans font-bold text-sm text-[#0a1a00] box-glow active:scale-[0.97] transition-transform duration-200 flex items-center justify-center gap-2"
              style={{ background: 'var(--accent)' }}>
              Start Investing <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        ) : confirmed ? (
          /* Confirmation screen */
          <motion.div key="confirmed" {...PAGE_TRANSITION}
            className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="max-w-md w-full rounded-3xl p-8 border text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="w-14 h-14 rounded-full mx-auto mb-6 flex items-center justify-center"
                style={{ background: 'rgba(29,158,117,0.1)', border: '1px solid rgba(29,158,117,0.2)' }}>
                <Check className="w-6 h-6" style={{ color: 'var(--teal)' }} />
              </div>
              <h2 className="font-display font-bold text-2xl text-white mb-2">You just did something most people never do.</h2>
              <p className="font-sans text-sm text-white/40 mb-8 leading-relaxed">
                You turned intention into action. Your SIP is set. Your portfolio is live.
              </p>
              <button onClick={handleDismissConfirmation}
                className="w-full py-3.5 rounded-full font-sans font-bold text-sm text-[#0a1a00] active:scale-[0.97] transition-transform duration-200"
                style={{ background: 'var(--accent)' }}>
                View my portfolio →
              </button>
            </div>
          </motion.div>
        ) : (
          /* 4-step flow */
          <motion.div key="flow" {...PAGE_TRANSITION}
            className="fixed inset-4 md:inset-8 z-50 rounded-3xl border overflow-y-auto"
            style={{ background: 'var(--bg)', borderColor: 'var(--border)' }}>
            <div className="max-w-lg mx-auto p-6 md:p-10">
              {/* Step indicator */}
              <div className="flex items-center gap-2 mb-8">
                {[0, 1, 2, 3].map(i => (
                  <div key={i} className="h-1.5 flex-1 rounded-full transition-[background-color] duration-300"
                    style={{ background: i <= step ? 'var(--accent)' : 'rgba(255,255,255,0.06)' }} />
                ))}
              </div>

              <AnimatePresence mode="wait">
                {/* Step 1 — Choose fund */}
                {step === 0 && (
                  <motion.div key="s1" {...PAGE_TRANSITION} className="space-y-4">
                    <h2 className="font-display font-semibold text-xl text-white mb-6">What do you want to invest in?</h2>
                    {FUND_OPTIONS.map(f => (
                      <button key={f.id} onClick={() => setFund(f.name)}
                        className="w-full rounded-2xl p-5 border text-left transition-[border-color,background-color] duration-200"
                        style={{
                          background: fund === f.name ? 'rgba(192,241,142,0.04)' : 'var(--surface)',
                          borderColor: fund === f.name ? 'rgba(192,241,142,0.25)' : 'var(--border)',
                        }}>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-display font-medium text-sm text-white">{f.name}</p>
                          {f.recommended && (
                            <span className="text-[8px] font-sans font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                              style={{ background: 'rgba(192,241,142,0.1)', color: 'var(--accent)' }}>
                              Recommended
                            </span>
                          )}
                        </div>
                        <p className="font-sans text-xs text-white/35">{f.desc}</p>
                        <p className="font-mono text-[10px] text-white/20 mt-1">Expense ratio: {f.expense}</p>
                      </button>
                    ))}
                    <button onClick={() => fund && setStep(1)} disabled={!fund}
                      className="w-full py-3.5 rounded-full font-sans font-bold text-sm text-[#0a1a00] disabled:opacity-30 active:scale-[0.97] transition-[opacity,transform] duration-200 flex items-center justify-center gap-2 mt-4"
                      style={{ background: 'var(--accent)' }}>
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}

                {/* Step 2 — Choose amount */}
                {step === 1 && (
                  <motion.div key="s2" {...PAGE_TRANSITION} className="space-y-6">
                    <h2 className="font-display font-semibold text-xl text-white">How much each month?</h2>
                    <div className="text-center">
                      <p className="font-display font-bold text-4xl" style={{ color: 'var(--accent)' }}>₹{amount.toLocaleString('en-IN')}</p>
                      <p className="font-sans text-xs text-white/25 mt-1">per month</p>
                    </div>
                    <input type="range" min={100} max={50000} step={100} value={amount}
                      onChange={e => setAmount(Number(e.target.value))}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: '#c0f18e', background: 'rgba(255,255,255,0.06)' }} />
                    <div className="flex justify-between font-mono text-[9px] text-white/15">
                      <span>₹100</span><span>₹50,000</span>
                    </div>

                    {/* Projections */}
                    <div className="rounded-2xl p-5 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                      <p className="font-sans text-[10px] text-white/25 uppercase tracking-wider mb-3">Projected growth at 14% CAGR</p>
                      <div className="grid grid-cols-3 gap-4">
                        {[
                          { label: 'In 5 years', value: p5 },
                          { label: 'In 10 years', value: p10 },
                          { label: 'In 20 years', value: p20 },
                        ].map((p, i) => (
                          <div key={i} className="text-center">
                            <p className="font-display font-semibold text-sm text-white">{formatValue(p.value)}</p>
                            <p className="font-sans text-[9px] text-white/25 mt-0.5">{p.label}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <p className="font-sans text-[10px] text-white/20 text-center">You can change or pause this anytime.</p>
                    <button onClick={() => setStep(2)}
                      className="w-full py-3.5 rounded-full font-sans font-bold text-sm text-[#0a1a00] active:scale-[0.97] transition-transform duration-200 flex items-center justify-center gap-2"
                      style={{ background: 'var(--accent)' }}>
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}

                {/* Step 3 — Choose SIP date */}
                {step === 2 && (
                  <motion.div key="s3" {...PAGE_TRANSITION} className="space-y-6">
                    <h2 className="font-display font-semibold text-xl text-white">Which day of the month?</h2>
                    <div className="flex flex-wrap gap-2">
                      {Array.from({ length: 28 }, (_, i) => i + 1).map(d => (
                        <button key={d} onClick={() => setDate(d)}
                          className="w-10 h-10 rounded-xl font-mono text-sm border transition-[background-color,border-color,color] duration-200"
                          style={{
                            background: date === d ? 'rgba(192,241,142,0.08)' : 'transparent',
                            borderColor: date === d ? 'rgba(192,241,142,0.25)' : 'var(--border)',
                            color: date === d ? 'var(--accent)' : 'rgba(255,255,255,0.3)',
                          }}>
                          {d}
                        </button>
                      ))}
                    </div>

                    <div className="rounded-2xl p-5 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="font-sans text-xs text-white/30">Your first SIP</span>
                          <span className="font-sans text-xs text-white/70">{sipDateStr}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-sans text-xs text-white/30">Amount</span>
                          <span className="font-mono text-xs" style={{ color: 'var(--accent)' }}>₹{amount.toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-sans text-xs text-white/30">Fund</span>
                          <span className="font-sans text-xs text-white/60">{fund}</span>
                        </div>
                      </div>
                    </div>

                    <p className="font-sans text-[10px] text-white/20 text-center leading-relaxed">
                      On this date each month, ₹{amount.toLocaleString('en-IN')} will be set aside for your SIP. No money moves until you connect a real brokerage account.
                    </p>

                    <button onClick={() => setStep(3)}
                      className="w-full py-3.5 rounded-full font-sans font-bold text-sm text-[#0a1a00] active:scale-[0.97] transition-transform duration-200 flex items-center justify-center gap-2"
                      style={{ background: 'var(--accent)' }}>
                      Next <ChevronRight className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}

                {/* Step 4 — Confirm */}
                {step === 3 && (
                  <motion.div key="s4" {...PAGE_TRANSITION} className="space-y-6">
                    <h2 className="font-display font-semibold text-xl text-white">You're all set.</h2>
                    <div className="rounded-2xl p-6 border space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                      {[
                        { label: 'Fund', value: fund },
                        { label: 'Monthly SIP', value: `₹${amount.toLocaleString('en-IN')}` },
                        { label: 'SIP date', value: `${date}${date === 1 ? 'st' : date === 2 ? 'nd' : date === 3 ? 'rd' : 'th'} of every month` },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(29,158,117,0.1)' }}>
                            <Check className="w-3.5 h-3.5" style={{ color: 'var(--teal)' }} />
                          </div>
                          <div className="flex justify-between flex-1">
                            <span className="font-sans text-sm text-white/40">{item.label}</span>
                            <span className="font-sans text-sm text-white/70 font-medium">{item.value}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button onClick={handleConfirm} disabled={confirming}
                      className="w-full py-4 rounded-full font-sans font-bold text-sm text-[#0a1a00] box-glow active:scale-[0.97] disabled:opacity-60 transition-[opacity,transform] duration-200 flex items-center justify-center gap-2"
                      style={{ background: 'var(--accent)' }}>
                      {confirming ? (
                        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-5 h-5 border-2 rounded-full" style={{ borderColor: '#0a1a00', borderTopColor: 'transparent' }} />
                      ) : (
                        <>Start my SIP <ArrowRight className="w-4 h-4" /></>
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// STATE 3 — ACTIVE PORTFOLIO
// ═══════════════════════════════════════════════════════════════════════════

function ActivePortfolio() {
  const fearType = useAppStore(s => s.fearType) ?? 'loss'
  const rawName = useAppStore(s => s.userName)
  const userName = rawName && rawName !== 'Explorer' ? rawName.split(' ')[0] : ''
  const monthlyAmount = useAppStore(s => s.monthlyAmount)
  const selectedFund = useAppStore(s => s.selectedFund) || 'Nifty 50 Index Fund'
  const portfolioSetupDate = useAppStore(s => s.portfolioSetupDate)

  const [period, setPeriod] = useState<Period>('1Y')
  const [tooltip, setTooltip] = useState<{ date: string; value: string } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Area'> | null>(null)
  const newsItems = useAppStore(s => s.newsItems) || []

  // Dynamic AI portfolio insight
  const [portfolioInsight, setPortfolioInsight] = useState<string | null>(null)
  const [insightLoading, setInsightLoading] = useState(false)
  const insightFetchedRef = useRef(false)

  // Calculate months since portfolio setup — source: portfolioSetupDate from Zustand, set when user completes Start Investing flow
  const monthsSinceSetup = useMemo(() => {
    if (!portfolioSetupDate) return 0
    const setupDate = new Date(portfolioSetupDate)
    const now = new Date()
    return Math.max(0, (now.getFullYear() - setupDate.getFullYear()) * 12 + now.getMonth() - setupDate.getMonth())
  }, [portfolioSetupDate])

  // For brand new users: show just the monthly amount with 0% return
  const isNewPortfolio = monthsSinceSetup < 3

  // Generate simulated portfolio data — uses monthsSinceSetup to determine how many months of data to show
  const fullPath = useMemo(() => {
    if (monthsSinceSetup === 0) return [monthlyAmount]
    return generateSimulatedPath(monthsSinceSetup, monthlyAmount)
  }, [monthsSinceSetup, monthlyAmount])

  const currentValue = monthsSinceSetup === 0 ? monthlyAmount : (fullPath[fullPath.length - 1] || monthlyAmount)
  const totalInvested = monthsSinceSetup === 0 ? monthlyAmount : monthlyAmount * fullPath.length
  const returns = currentValue - totalInvested
  const returnsPct = totalInvested > 0 ? ((currentValue / totalInvested - 1) * 100) : 0
  const isPositive = returns >= 0

  // Get chart data for period
  const chartData = useMemo(() => {
    const periodDays: Record<Period, number> = { '1W': 7, '1M': 30, '3M': 90, '6M': 180, '1Y': 365, 'ALL': fullPath.length * 30 }
    const days = periodDays[period]
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Map monthly data to daily-ish points
    const pointCount = Math.min(Math.ceil(days / (period === '1W' ? 1 : period === '1M' ? 1 : 7)), fullPath.length)
    const startIdx = Math.max(0, fullPath.length - pointCount)
    const slice = fullPath.slice(startIdx)

    return slice.map((v, i) => {
      const d = new Date(startDate)
      d.setDate(d.getDate() + Math.floor((i / slice.length) * days))
      return { time: d.toISOString().split('T')[0], value: v }
    })
  }, [period, fullPath])

  const change = useMemo(() => {
    if (chartData.length < 2) return 0
    return ((chartData[chartData.length - 1].value - chartData[0].value) / chartData[0].value) * 100
  }, [chartData])

  // Get relevant news for portfolio holdings (hackathon stub logic)
  const relevantNews = useMemo(() => {
    if (!newsItems.length) return []
    // Simulating looking for 'banking' or 'energy' based on dummy holdings
    const sectors = ['banking', 'energy', 'technology', 'it', 'bank', 'oil', 'auto']
    const matches = newsItems.filter(n => {
      const txt = (n.title + ' ' + n.summary).toLowerCase()
      return sectors.some(s => txt.includes(s))
    })
    return matches.length > 0 ? matches.slice(0, 3) : newsItems.slice(0, 3)
  }, [newsItems])

  // Create chart
  useEffect(() => {
    if (!containerRef.current) return
    const chart = createChart(containerRef.current, {
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: 'rgba(255,255,255,0.3)', fontFamily: "'Inter', sans-serif", fontSize: 10 },
      grid: { vertLines: { color: 'rgba(255,255,255,0.03)' }, horzLines: { color: 'rgba(255,255,255,0.03)' } },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: { color: 'rgba(192,241,142,0.2)', width: 1, style: 2, labelBackgroundColor: '#0e2000' },
        horzLine: { color: 'rgba(192,241,142,0.2)', width: 1, style: 2, labelBackgroundColor: '#0e2000' },
      },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.04)', textColor: 'rgba(255,255,255,0.25)', scaleMargins: { top: 0.08, bottom: 0.05 } },
      timeScale: { borderColor: 'rgba(255,255,255,0.04)', timeVisible: true, secondsVisible: false, fixLeftEdge: true, fixRightEdge: true },
      handleScroll: { mouseWheel: false, pressedMouseMove: false },
      handleScale: { mouseWheel: false, pinch: false },
    })

    const series = chart.addSeries(AreaSeries, {
      lineColor: 'var(--accent)', topColor: 'rgba(192,241,142,0.15)', bottomColor: 'rgba(192,241,142,0)', lineWidth: 2,
      priceFormat: { type: 'custom', formatter: (p: number) => formatValue(p), minMove: 100 },
    })

    chartRef.current = chart
    seriesRef.current = series

    chart.subscribeCrosshairMove(param => {
      if (!param.time || !param.seriesData) { setTooltip(null); return }
      const d = param.seriesData.get(series) as { value: number } | undefined
      if (!d) { setTooltip(null); return }
      setTooltip({ date: String(param.time), value: formatValue(d.value) })
    })

    const ro = new ResizeObserver(() => { if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth }) })
    ro.observe(containerRef.current)
    return () => { ro.disconnect(); chart.remove(); chartRef.current = null; seriesRef.current = null }
  }, [])

  // Feed data
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current || chartData.length === 0) return
    seriesRef.current.setData(chartData as any)
    chartRef.current.timeScale().fitContent()
  }, [chartData])

  // Holdings — sorted by weight descending (highest allocation first)
  const holdings = useMemo(() => {
    const h = getHoldingsForFund(selectedFund)
    return h
      .map(holding => {
        const value = currentValue * (holding.weight / 100)
        const dayChange = (Math.random() - 0.4) * 3 // slight upward bias
        return { ...holding, value, dayChange }
      })
      .sort((a, b) => b.weight - a.weight)
  }, [selectedFund, currentValue])

  // Metrics — with NaN guards
  const safeReturnsPct = isNaN(returnsPct) || !isFinite(returnsPct) ? 0 : returnsPct
  const metrics = [
    { title: 'CURRENT VALUE', value: formatValue(currentValue), subtext: `${isPositive ? '+' : ''}${safeReturnsPct.toFixed(1)}% all time`, highlight: true },
    { title: 'TOTAL INVESTED', value: formatValue(totalInvested), subtext: `${fullPath.length} months`, highlight: false },
    { title: 'TOTAL RETURNS', value: `${isPositive ? '+' : ''}${formatValue(Math.abs(returns))}`, subtext: `${isPositive ? 'Profit' : 'Loss'}`, highlight: isPositive },
    { title: 'XIRR', value: `${safeReturnsPct > 0 ? '+' : ''}${(safeReturnsPct * 0.85).toFixed(1)}%`, subtext: 'annualised return', highlight: true },
  ]

  const displayInsight = portfolioInsight ?? FEAR_PORTFOLIO_INSIGHTS[fearType]

  // Fetch AI insight on mount
  useEffect(() => {
    if (insightFetchedRef.current) return
    insightFetchedRef.current = true
    setInsightLoading(true)
    const prompt = monthsSinceSetup > 0
      ? `Portfolio: ${selectedFund}, invested ₹${Math.round(totalInvested).toLocaleString('en-IN')}, current value ₹${Math.round(currentValue).toLocaleString('en-IN')}, returns ${returnsPct.toFixed(1)}%. Give a 2-sentence portfolio assessment for a ${fearType} investor.`
      : `New investor just set up their first SIP in ${selectedFund}. Give an encouraging 2-sentence message to start their investing journey for a ${fearType} investor.`
    generateKinuChat({
      message: prompt,
      fear_type: fearType,
      context: 'portfolio_review',
      conversation_history: [],
    })
    .then(d => { setPortfolioInsight(d.reply); setInsightLoading(false) })
    .catch(() => setInsightLoading(false))
  }, [fearType])

  return (
    <motion.div {...PAGE_TRANSITION} key="active" className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display font-semibold text-2xl text-white tracking-tight mb-1">{userName ? `${userName}'s Portfolio` : 'Your Portfolio'}</h1>
        <p className="font-sans text-xs text-white/30">Simulated performance · Based on {selectedFund} historical data</p>
      </div>

      {/* News Impact Card */}
      <NewsImpactCard context="portfolio" fearType={fearType} />

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {metrics.map((m, i) => (
          <motion.div key={m.title} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.4 }}
            className="rounded-2xl p-5 border" style={{ background: 'var(--surface)', borderColor: m.highlight ? 'rgba(192,241,142,0.15)' : 'var(--border)' }}>
            <p className="text-[8px] font-sans text-white/25 uppercase tracking-wider mb-2">{m.title}</p>
            <p className="font-display font-semibold text-lg text-white tracking-tight mb-1">{m.value}</p>
            <p className={`font-sans text-[10px] ${m.highlight ? 'text-[var(--accent)]' : 'text-white/30'}`}>
              {m.title === 'XIRR' && <Zap className="w-2.5 h-2.5 inline mr-1" />}
              {m.title === 'CURRENT VALUE' && (isPositive
                ? <TrendingUp className="w-2.5 h-2.5 inline mr-1" style={{ color: 'var(--teal)' }} />
                : <TrendingDown className="w-2.5 h-2.5 inline mr-1" style={{ color: 'var(--danger)' }} />
              )}
              {m.subtext}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Chart — or empty state for new portfolios */}
      {isNewPortfolio ? (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}
          className="rounded-3xl border p-8 text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="w-14 h-14 rounded-full mx-auto mb-5 flex items-center justify-center"
            style={{ background: 'rgba(192,241,142,0.06)', border: '1px solid rgba(192,241,142,0.12)' }}>
            <TrendingUp className="w-6 h-6" style={{ color: 'var(--accent)' }} />
          </div>
          <h3 className="font-display font-semibold text-xl text-white mb-2">Your portfolio starts here.</h3>
          <p className="font-display font-bold text-2xl mb-4" style={{ color: 'var(--accent)' }}>
            {formatValue(monthlyAmount)} invested today.
          </p>
          <p className="font-sans text-sm text-white/35 max-w-sm mx-auto mb-4 leading-relaxed">
            Check back in 3 months to see your first growth chart.
          </p>
          <p className="font-sans text-xs text-white/20 italic max-w-sm mx-auto mb-6 leading-relaxed">
            &ldquo;The best time to invest was 10 years ago.<br />The second best time is today.&rdquo;
          </p>
          <button
            onClick={() => useAppStore.getState().setDashboardSection('simulation')}
            className="font-sans text-[13px] font-medium transition-colors hover:opacity-80"
            style={{ color: 'var(--accent)' }}
          >
            Here is what your portfolio could look like in 10 years →
          </button>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.4 }}
          className="rounded-3xl border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-6 pt-5 pb-3">
            <div>
              <div className="flex items-center gap-3 mb-0.5">
                <BarChart3 className="w-4 h-4 text-white/25" />
                <h2 className="font-display text-base text-white font-medium tracking-tight">Performance</h2>
                {chartData.length > 0 && (
                  <span className={`text-xs font-mono font-bold ${change >= 0 ? 'text-[var(--teal)]' : 'text-[var(--danger)]'}`}>
                    {change >= 0 ? '+' : ''}{isNaN(change) || !isFinite(change) ? '0.00' : change.toFixed(2)}%
                  </span>
                )}
              </div>
              <p className="font-sans text-[10px] text-white/20">
                {tooltip ? <><span className="text-white/50 font-medium">{tooltip.value}</span> · {tooltip.date}</> : 'Hover the chart to explore'}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {PERIODS.map(p => (
                <button key={p} onClick={() => setPeriod(p)}
                  className="px-3 py-1.5 rounded-lg text-[10px] font-sans font-semibold tracking-wider transition-all duration-150"
                  style={{
                    background: p === period ? 'rgba(192,241,142,0.08)' : 'transparent',
                    color: p === period ? 'var(--accent)' : 'rgba(255,255,255,0.25)',
                    border: p === period ? '1px solid rgba(192,241,142,0.15)' : '1px solid transparent',
                  }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div ref={containerRef} className="w-full" style={{ height: '300px' }} />
          <div className="flex justify-between items-center px-6 py-2.5 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
            <span className="text-[9px] font-mono text-white/15 tracking-wider uppercase">Simulated · Based on Nifty 50 historical data</span>
            <span className="text-[9px] font-mono text-white/15">{chartData.length > 0 ? formatValue(chartData[chartData.length - 1].value) : '—'}</span>
          </div>
        </motion.div>
      )}

      {/* Holdings */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.4 }}
        className="rounded-3xl p-6 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2 mb-4">
          <Wallet className="w-4 h-4 text-white/25" />
          <h3 className="font-display font-medium text-base text-white tracking-tight">Holdings</h3>
          <span className="text-[9px] font-sans text-white/15">(approx.)</span>
        </div>
        <div className="space-y-2">
          {holdings.map((h, i) => (
            <div key={h.name} className="flex items-center justify-between py-3 border-b last:border-b-0" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-display font-bold text-[9px] text-white/25"
                  style={{ background: 'rgba(255,255,255,0.03)' }}>
                  {h.name.charAt(0)}
                </div>
                <div>
                  <p className="font-display font-medium text-sm text-white">{h.name}</p>
                  <p className="font-sans text-[10px] text-white/20">{h.sector}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-sm text-white">{formatValue(h.value)}</p>
                <p className="font-mono text-[10px] font-medium" style={{ color: h.dayChange >= 0 ? 'var(--teal)' : 'var(--danger)' }}>
                  {h.dayChange >= 0 ? '+' : ''}{h.dayChange.toFixed(2)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* KINU insight */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4, duration: 0.4 }} className="flex gap-3">
        <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(192,241,142,0.08)', border: '1px solid rgba(192,241,142,0.18)' }}>
          <Zap className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
        </div>
        <div className="rounded-2xl p-5 border flex-1" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <p className="font-sans text-[9px] text-white/20 uppercase tracking-wider mb-2">KINU on your portfolio</p>
          <p className={`font-sans text-sm text-white/50 leading-relaxed${insightLoading ? ' animate-pulse' : ''}`}>{displayInsight}</p>
        </div>
      </motion.div>

      {/* What's moving your portfolio - targeted news */}
      {relevantNews.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.4 }}
          className="rounded-3xl p-6 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <p className="font-sans text-[10px] text-white/20 uppercase tracking-wider mb-4">What's moving your portfolio</p>
          <div className="space-y-3">
            {relevantNews.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: item.sentiment === 'positive' ? 'var(--teal)' : item.sentiment === 'negative' ? 'var(--danger)' : 'rgba(255,255,255,0.25)' }} />
                <p className="font-sans text-xs text-white/60 truncate flex-1">{item.title}</p>
                <span className="font-sans text-[10px] text-white/20 shrink-0">{item.source} · {item.time}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN — STATE MACHINE
// ═══════════════════════════════════════════════════════════════════════════

export default function PortfolioPage() {
  const userEmail = useAppStore(s => s.userEmail)
  const userId = useAppStore(s => s.userId)
  const portfolioSetup = useAppStore(s => s.portfolioSetup)
  const isAuthenticated = useAppStore(s => s.isAuthenticated)

  // Determine state
  const state = useMemo(() => {
    if (!userEmail && !userId && !isAuthenticated) return 'guest'
    if ((userEmail || userId || isAuthenticated) && !portfolioSetup) return 'setup'
    return 'active'
  }, [userEmail, userId, portfolioSetup, isAuthenticated])

  return (
    <AnimatePresence mode="wait">
      {state === 'guest' && <GuestState key="guest" />}
      {state === 'setup' && <SetupState key="setup" />}
      {state === 'active' && <ActivePortfolio key="active" />}
    </AnimatePresence>
  )
}
