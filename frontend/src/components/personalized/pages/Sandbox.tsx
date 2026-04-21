import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef, useCallback, useMemo, Component, type ErrorInfo, type ReactNode } from 'react'
import { useAppStore } from '../../../store/useAppStore'
import { formatINR } from '../../../lib/formatINR'
import { generateSandboxDebrief, generateSandboxAdvice, generateHistoricalNews } from '../../../lib/simulateAI'
import {
  getAllFYKeys, getFYLabel, getFYHumanLabel, getFYMonthYear, getFYEvent,
  simulateFY, type FYAssetReturns,
  getWhispers, type Whisper,
  FY_KINU_CONTEXT, FY_OPTIMAL_ALLOCATION, FY_CRASH_RECOVERY,
  getRecoveryContext, hasCryptoData,
} from '../../../lib/sandboxData'
import { getActiveCrash, getCrashForFYMonth, type CrashEvent } from '../../../lib/crashData'
import { Play, Pause, RotateCcw, ChevronRight, Zap, Lock, Eye, AlertTriangle } from 'lucide-react'

/* ── ErrorBoundary — catches render errors in Sandbox ─────────────────────── */
class SandboxErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Sandbox] Render error:', error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="w-14 h-14 rounded-full mb-5 flex items-center justify-center"
            style={{ background: 'rgba(226,75,74,0.06)', border: '1px solid rgba(226,75,74,0.15)' }}>
            <AlertTriangle className="w-6 h-6" style={{ color: 'var(--danger)' }} />
          </div>
          <h3 className="font-display font-semibold text-lg text-white mb-2">Something went wrong</h3>
          <p className="font-sans text-sm text-white/35 mb-6 max-w-sm">
            The sandbox simulation encountered an error. Please try again.
          </p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="px-6 py-3 rounded-full font-sans text-sm font-medium border transition-colors"
            style={{ borderColor: 'var(--border)', color: 'var(--accent)' }}
          >
            <RotateCcw className="w-3.5 h-3.5 inline mr-2" /> Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

type Phase = 'setup' | 'playback' | 'crash-decision' | 'debrief'

const ASSET_CLASSES: { key: keyof FYAssetReturns; name: string; desc: string; color: string }[] = [
  { key: 'nifty', name: 'Nifty 50 Index Fund', desc: 'Copies India\'s top 50 companies', color: '#1D9E75' },
  { key: 'midcap', name: 'Midcap Fund', desc: 'Mid-sized companies, higher growth potential', color: '#c0f18e' },
  { key: 'smallcap', name: 'Smallcap Fund', desc: 'Small companies, highest risk and reward', color: '#378ADD' },
  { key: 'debt', name: 'Debt Fund', desc: 'Bonds and fixed income, stable but slow', color: 'rgba(255,255,255,0.25)' },
]

const CRYPTO_ASSET = { key: 'crypto' as const, name: 'Crypto (BTC Proxy)', desc: 'Bitcoin — speculative, education only', color: '#EF9F27' }

const BUDGET = 50000

function SandboxInner() {
  const fearType = useAppStore(s => s.fearType) ?? 'loss'
  const userAge = useAppStore(s => s.userAge)
  const setSandboxResult = useAppStore(s => s.setSandboxResult)
  const setDashboardSection = useAppStore(s => s.setDashboardSection)
  const cryptoEnabled = useAppStore(s => s.cryptoEnabled)
  const setCryptoEnabled = useAppStore(s => s.setCryptoEnabled)

  const [phase, setPhase] = useState<Phase>('setup')
  const [selectedFY, setSelectedFY] = useState('FY20')
  const [alloc, setAlloc] = useState({ nifty: 50, midcap: 20, smallcap: 20, debt: 10, crypto: 0 })

  const cryptoAvailable = hasCryptoData(selectedFY)
  const activeAssets = cryptoEnabled && cryptoAvailable
    ? [...ASSET_CLASSES, CRYPTO_ASSET]
    : ASSET_CLASSES

  // Playback state
  const [currentMonth, setCurrentMonth] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const [pulledOut, setPulledOut] = useState(false)
  const [pullOutMonth, setPullOutMonth] = useState<number | null>(null)
  const [pullOutValues, setPullOutValues] = useState<{ nifty: number; midcap: number; smallcap: number; debt: number } | null>(null)
  const [flashEvent, setFlashEvent] = useState<{ headline: string; description: string; severity: string } | null>(null)
  const [activeWhispers, setActiveWhispers] = useState<Whisper[]>([])
  const [crashDecisionMade, setCrashDecisionMade] = useState(false)
  const [showRecoveryPanel, setShowRecoveryPanel] = useState(false)
  const [activeCrashInfo, setActiveCrashInfo] = useState<{ crash: CrashEvent; monthsIn: number } | null>(null)
  const [breakthroughTriggered, setBreakthroughTriggered] = useState(false)
  const [wasBelowBudget, setWasBelowBudget] = useState(false)
  const [aiNewsLoading, setAiNewsLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Ref that always holds the latest currentMonth — lets tickMonth read it
  // without being recreated on every tick (avoids timer double-fires at 2x/5x)
  const currentMonthRef = useRef(currentMonth)
  currentMonthRef.current = currentMonth

  // Debrief state
  const [debriefStep, setDebriefStep] = useState(0) // 0=context, 1=instinct, 2=advice
  const [debriefInstinct, setDebriefInstinct] = useState('')
  const [debriefAdvice, setDebriefAdvice] = useState('')
  const [debriefInstinctLoading, setDebriefInstinctLoading] = useState(false)
  const [debriefAdviceLoading, setDebriefAdviceLoading] = useState(false)

  const fyKeys = getAllFYKeys()
  const totalAlloc = alloc.nifty + alloc.midcap + alloc.smallcap + alloc.debt + (cryptoEnabled && cryptoAvailable ? alloc.crypto : 0)
  const remaining = 100 - totalAlloc

  // Simulation data
  const simData = useMemo(() => simulateFY(selectedFY, alloc, BUDGET), [selectedFY, alloc])
  const optimal = FY_OPTIMAL_ALLOCATION[selectedFY]
  const crashRecovery = FY_CRASH_RECOVERY[selectedFY]
  const recoveryCtx = getRecoveryContext(selectedFY)

  // Age-based allocation
  const ageAlloc = useMemo(() => {
    const age = userAge || 22
    const equity = 100 - age
    return {
      nifty: Math.round(equity * 0.5),
      midcap: Math.round(equity * 0.3),
      smallcap: Math.round(equity * 0.2),
      debt: age,
    }
  }, [userAge])
  const ageSimData = useMemo(() => simulateFY(selectedFY, ageAlloc, BUDGET), [selectedFY, ageAlloc])

  // Current month values
  const currentValues = simData.monthlyValues[Math.min(currentMonth + 1, simData.monthlyValues.length - 1)] || simData.monthlyValues[0]
  const totalValue = pulledOut && pullOutValues
    ? pullOutValues.nifty + pullOutValues.midcap + pullOutValues.smallcap + pullOutValues.debt
    : currentValues.total

  // Track peak for "loss from peak"
  const peakValue = useMemo(() => {
    let peak = BUDGET
    for (let i = 0; i <= Math.min(currentMonth + 1, simData.monthlyValues.length - 1); i++) {
      if (simData.monthlyValues[i].total > peak) peak = simData.monthlyValues[i].total
    }
    return peak
  }, [currentMonth, simData])

  // ── Breakthrough detection (portfolio crosses back above invested after dip)
  useEffect(() => {
    if (phase !== 'playback' || pulledOut) return
    if (totalValue < BUDGET) {
      setWasBelowBudget(true)
    } else if (wasBelowBudget && totalValue >= BUDGET) {
      setBreakthroughTriggered(true)
      setTimeout(() => setBreakthroughTriggered(false), 3000)
      setWasBelowBudget(false)
    }
  }, [totalValue, wasBelowBudget, phase, pulledOut])

  // ── Allocation helpers ──────────────────────────────────────────────────
  const setAllocField = (key: keyof typeof alloc, value: number) => {
    setAlloc(prev => ({ ...prev, [key]: value }))
  }

  const allocateAll = () => {
    if (remaining > 0) {
      setAlloc(prev => ({ ...prev, nifty: prev.nifty + remaining }))
    }
  }

  // ── Playback logic ────────────────────────────────────────────────────
  const startPlayback = () => {
    setPhase('playback')
    setCurrentMonth(0)
    setIsPlaying(true)
    setPulledOut(false)
    setPullOutMonth(null)
    setPullOutValues(null)
    setCrashDecisionMade(false)
    setShowRecoveryPanel(false)
    setActiveCrashInfo(null)
    setBreakthroughTriggered(false)
    setWasBelowBudget(false)
  }

  const tickMonth = useCallback(() => {
    // Read from ref — always the latest value without stale closure
    const next = currentMonthRef.current + 1

    if (next >= 12) {
      setCurrentMonth(12)
      setIsPlaying(false)
      setTimeout(() => setPhase('debrief'), 800)
      return
    }

    // Check for whispers (asset drops >5%)
    const whispers = getWhispers(selectedFY, next)
    if (whispers.length > 0) {
      setActiveWhispers(whispers)
      setTimeout(() => setActiveWhispers([]), 4000)
    }

    // Check for crash history integration
    const crashStart = getCrashForFYMonth(selectedFY, next)
    if (crashStart && !pulledOut) {
      setActiveCrashInfo({ crash: crashStart, monthsIn: 1 })
    }

    // Update active crash state (persistent banner)
    const activeInfo = getActiveCrash(selectedFY, next)
    if (activeInfo) {
      setActiveCrashInfo(activeInfo)
    } else {
      setActiveCrashInfo(null)
    }

    // Check for special events — set flashEvent BEFORE phase change so
    // AnimatePresence never sees crash-decision without a flashEvent
    const event = getFYEvent(selectedFY, next)
    if (event) {
      const eventObj = { headline: event.headline, description: event.description, severity: event.severity }
      if (event.severity === 'danger' && !pulledOut) {
        setFlashEvent(eventObj)
        setIsPlaying(false)
        setPhase('crash-decision')
        setCrashDecisionMade(false)
        setShowRecoveryPanel(false)
      } else {
        setFlashEvent(eventObj)
        setTimeout(() => setFlashEvent(null), 3000)
      }
    }

    // Advance month last
    setCurrentMonth(next)
  // currentMonth intentionally excluded — read via ref to keep callback stable
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFY, pulledOut])

  useEffect(() => {
    if (!isPlaying || (phase !== 'playback')) return
    if (currentMonth >= 12) return
    const delay = speed === 5 ? 200 : speed === 2 ? 500 : 1000
    timerRef.current = setTimeout(tickMonth, delay)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [isPlaying, currentMonth, speed, phase, tickMonth])

  // ── Decision handlers ──────────────────────────────────────────────────
  const handleHold = () => {
    setCrashDecisionMade(true)
    setShowRecoveryPanel(true)
  }

  const handlePullOut = () => {
    setPulledOut(true)
    setPullOutMonth(currentMonth)
    setPullOutValues({
      nifty: currentValues.nifty,
      midcap: currentValues.midcap,
      smallcap: currentValues.smallcap,
      debt: currentValues.debt,
    })
    setCrashDecisionMade(true)
    setShowRecoveryPanel(true)
  }

  const resumeAfterDecision = () => {
    setFlashEvent(null)
    setPhase('playback')
    setIsPlaying(true)
  }

  // ── AI News Generation for Crash Decision ────────────────────────────
  useEffect(() => {
    if (phase === 'crash-decision' && flashEvent && flashEvent.severity === 'danger') {
      const generateNews = async () => {
        setAiNewsLoading(true);
        try {
          const dateStr = getFYMonthYear(selectedFY, currentMonth);
          const news = await generateHistoricalNews({
            date: dateStr,
            eventName: flashEvent.headline,
            severity: flashEvent.severity
          });
          setFlashEvent(prev => prev ? { ...prev, headline: news.headline, description: news.snippet } : null);
        } catch (e) {
          console.error("Failed to generate AI news", e);
        } finally {
          setAiNewsLoading(false);
        }
      };
      generateNews();
    }
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Debrief ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'debrief') return
    setDebriefStep(0)

    // After 800ms, show message 1 (already hardcoded), then fire API calls
    const t1 = setTimeout(() => {
      setDebriefStep(1)
      setDebriefInstinctLoading(true)

      const finalVals = pulledOut && pullOutValues ? pullOutValues : simData.finalValues

      generateSandboxDebrief({
        year: selectedFY,
        allocation: alloc,
        final_values: finalVals,
        did_pull_out: pulledOut,
        pulled_out_month: pullOutMonth,
        fear_type: fearType,
      })
        .then(r => setDebriefInstinct(r.debrief))
        .catch(() => setDebriefInstinct('Your allocation showed thought. Every year teaches something different about markets and about yourself.'))
        .finally(() => setDebriefInstinctLoading(false))
    }, 800)

    const t2 = setTimeout(() => {
      setDebriefStep(2)
      setDebriefAdviceLoading(true)

      generateSandboxAdvice({
        year: selectedFY,
        user_allocation: alloc,
        optimal_allocation: optimal ? { nifty: optimal.nifty, midcap: optimal.midcap, smallcap: optimal.smallcap, debt: optimal.debt } : alloc,
        user_result: totalValue,
        optimal_result: optimal?.result || totalValue,
        total_invested: BUDGET,
        fear_type: fearType,
        did_pull_out: pulledOut,
      })
        .then(r => setDebriefAdvice(r.advice))
        .catch(() => setDebriefAdvice('The principle from every year: no one predicts the future. The goal isn\'t to time the market — it\'s to stay in it long enough that time works for you.'))
        .finally(() => setDebriefAdviceLoading(false))
    }, 1600)

    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const saveResult = () => {
    setSandboxResult({
      year: selectedFY,
      allocation: alloc,
      finalValue: totalValue,
      totalInvested: BUDGET,
      kinuDebrief: debriefInstinct + '\n\n' + debriefAdvice,
      didPullOut: pulledOut,
    })
  }

  const resetToSetup = () => {
    setPhase('setup')
    setCurrentMonth(0)
    setIsPlaying(false)
    setPulledOut(false)
    setDebriefInstinct('')
    setDebriefAdvice('')
    setDebriefStep(0)
  }

  // ── Sparkline renderer ────────────────────────────────────────────────
  const renderSparkline = (values: number[], color: string) => {
    if (values.length < 2) return null
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1
    const w = 80
    const h = 24
    const points = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ')
    return (
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
        <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
      </svg>
    )
  }

  // ── Donut chart ───────────────────────────────────────────────────────
  const donutRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = donutRef.current
    if (!canvas || phase !== 'setup') return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const size = canvas.width
    const cx = size / 2
    const cy = size / 2
    const radius = size / 2 - 8
    const innerRadius = radius * 0.65
    ctx.clearRect(0, 0, size, size)
    const segments = [
      { pct: alloc.nifty, color: '#1D9E75' },
      { pct: alloc.midcap, color: '#c0f18e' },
      { pct: alloc.smallcap, color: '#378ADD' },
      { pct: alloc.debt, color: 'rgba(255,255,255,0.25)' },
    ]
    let startAngle = -Math.PI / 2
    for (const seg of segments) {
      if (seg.pct <= 0) continue
      const sweep = (seg.pct / 100) * Math.PI * 2
      ctx.beginPath()
      ctx.arc(cx, cy, radius, startAngle, startAngle + sweep)
      ctx.arc(cx, cy, innerRadius, startAngle + sweep, startAngle, true)
      ctx.closePath()
      ctx.fillStyle = seg.color
      ctx.fill()
      startAngle += sweep
    }
    if (remaining > 0) {
      const sweep = (remaining / 100) * Math.PI * 2
      ctx.beginPath()
      ctx.arc(cx, cy, radius, startAngle, startAngle + sweep)
      ctx.arc(cx, cy, innerRadius, startAngle + sweep, startAngle, true)
      ctx.closePath()
      ctx.fillStyle = 'rgba(255,255,255,0.06)'
      ctx.fill()
    }
  }, [alloc, remaining, phase])

  // ── Recovery context line helper ──────────────────────────────────────
  const RecoveryLine = ({ value, invested, fy }: { value: number; invested: number; fy: string }) => {
    if (value >= invested) return null
    const ctx = getRecoveryContext(fy)
    if (!ctx) return null
    return (
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        className="font-sans text-[10px] text-white/30 italic mt-1 leading-relaxed"
      >{ctx}</motion.p>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
      <AnimatePresence>

        {/* ═══ PHASE 1: SETUP ═══════════════════════════════════════════ */}
        {phase === 'setup' && (
          <motion.div key="setup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-4xl mx-auto space-y-8">

            {/* Headline */}
            <div className="text-center">
              <h1 className="font-display font-semibold text-3xl md:text-5xl text-white mb-3 tracking-tight">Play any year. Learn from history.</h1>
              <p className="font-sans text-base text-white/40 max-w-lg mx-auto">Pick a financial year and allocate your ₹50,000 budget. See what actually happened.</p>
            </div>

            {/* Year Pills */}
            <div className="overflow-x-auto pb-2 -mx-2">
              <div className="flex gap-2 px-2 min-w-max">
                {fyKeys.map(fy => {
                  const isActive = selectedFY === fy
                  return (
                    <button
                      key={fy} onClick={() => setSelectedFY(fy)}
                      className="group relative px-3.5 py-2 rounded-xl font-mono text-sm border transition-[background-color,border-color,color] duration-200 shrink-0"
                      style={{
                        background: isActive ? 'rgba(192,241,142,0.08)' : 'transparent',
                        borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                        color: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.4)',
                      }}
                    >
                      {getFYHumanLabel(fy)}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 rounded-lg font-sans text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10"
                        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}>
                        {getFYLabel(fy)}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Crypto Toggle */}
            <div className="rounded-2xl p-4 border flex items-center justify-between" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(239,159,39,0.08)' }}>
                  <span className="text-sm">₿</span>
                </div>
                <div>
                  <p className="font-sans text-sm text-white/70 font-medium">Include Crypto</p>
                  <p className="font-sans text-[10px] text-white/25">{cryptoAvailable ? 'BTC data available for this year' : 'Not available before 2014–15'}</p>
                </div>
              </div>
                <button
                onClick={() => setCryptoEnabled(!cryptoEnabled)}
                disabled={!cryptoAvailable}
                data-toggle
                className="relative w-11 h-6 rounded-full transition-[background-color] duration-200"
                style={{
                  background: cryptoEnabled && cryptoAvailable ? 'rgba(239,159,39,0.3)' : 'rgba(255,255,255,0.06)',
                  opacity: cryptoAvailable ? 1 : 0.3,
                  cursor: cryptoAvailable ? 'pointer' : 'not-allowed',
                }}
              >
                <div className="absolute top-1 w-4 h-4 rounded-full transition-[left] duration-200" style={{
                  background: cryptoEnabled && cryptoAvailable ? '#EF9F27' : 'rgba(255,255,255,0.2)',
                  left: cryptoEnabled && cryptoAvailable ? '24px' : '4px',
                }} />
              </button>
            </div>

            {/* Crypto Warning */}
            {cryptoEnabled && cryptoAvailable && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="rounded-2xl p-4 border flex items-start gap-3"
                style={{ background: 'rgba(239,159,39,0.04)', borderColor: 'rgba(239,159,39,0.15)' }}>
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#EF9F27' }} />
                <p className="font-sans text-[11px] text-white/40 leading-relaxed">
                  <strong className="text-white/60">Education only.</strong> Crypto is speculative and unregulated in India. This data uses BTC/INR price history for learning purposes. Kinetic does not recommend crypto as a portfolio component.
                </p>
              </motion.div>
            )}

            {/* Allocation Card */}
            <div className="rounded-3xl p-7 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h3 className="font-display font-medium text-base text-white mb-6">Allocate your ₹50,000</h3>

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-8">
                {/* Sliders */}
                <div className="space-y-5">
                  {activeAssets.map(ac => (
                    <div key={ac.key}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div>
                          <p className="font-sans text-sm text-white/70 font-medium">{ac.name}</p>
                          <p className="font-sans text-[10px] text-white/25">{ac.desc}</p>
                        </div>
                        <p className="font-mono text-sm" style={{ color: 'var(--accent)' }}>
                          {formatINR(BUDGET * alloc[ac.key] / 100)}
                        </p>
                      </div>
                      <input
                        type="range" min={0} max={100} step={5}
                        value={alloc[ac.key]}
                        onChange={e => setAllocField(ac.key, Number(e.target.value))}
                        className="w-full h-1 rounded-full appearance-none cursor-pointer"
                        style={{ accentColor: 'var(--accent)', background: 'rgba(255,255,255,0.08)' }}
                      />
                      <div className="flex justify-between mt-0.5">
                        <span className="font-mono text-[9px] text-white/15">0%</span>
                        <span className="font-mono text-[10px] text-white/40">{alloc[ac.key]}%</span>
                        <span className="font-mono text-[9px] text-white/15">100%</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Donut chart */}
                <div className="flex flex-col items-center justify-center">
                  <canvas ref={donutRef} width={160} height={160} />
                  <p className="font-sans text-xs text-white/40 mt-3">
                    Allocated: <span className={totalAlloc === 100 ? 'text-white font-medium' : ''} style={totalAlloc > 100 ? { color: 'var(--danger)' } : undefined}>
                      {formatINR(BUDGET * Math.min(totalAlloc, 100) / 100)}
                    </span> of {formatINR(BUDGET)}
                  </p>
                  {totalAlloc > 100 && (
                    <p className="font-sans text-[10px] mt-1" style={{ color: 'var(--danger)' }}>You've over-allocated</p>
                  )}
                  {remaining > 0 && totalAlloc < 100 && (
                    <p className="font-sans text-[10px] text-white/20 mt-1">{formatINR(BUDGET * remaining / 100)} unallocated — this earns 0%</p>
                  )}
                </div>
              </div>

              {/* Allocate all + Invest */}
              <div className="mt-6 space-y-3">
                {remaining > 0 && (
                  <button onClick={allocateAll}
                    className="w-full py-2.5 rounded-xl font-sans text-sm border transition-[background-color] duration-200 hover:bg-[rgba(255,255,255,0.03)]"
                    style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                    Allocate remaining {remaining}% to Nifty 50
                  </button>
                )}
                <button onClick={startPlayback}
                  disabled={totalAlloc !== 100}
                  className="w-full py-4 rounded-full font-sans font-bold text-sm text-[#0a1a00] box-glow active:scale-[0.97] disabled:opacity-30 transition-[opacity,transform] duration-200 flex items-center justify-center gap-2"
                  style={{ background: 'var(--accent)' }}>
                  Invest Now <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══ PHASE 2: PLAYBACK ═══════════════════════════════════════ */}
        {phase === 'playback' && (
          <motion.div key="playback" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-4xl mx-auto space-y-6">

            {/* Top Bar */}
            <div className="flex items-center justify-between rounded-2xl px-5 py-3 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-4">
                <span className="font-mono text-sm text-white/40">{getFYHumanLabel(selectedFY)}</span>
                <span className="font-sans text-sm text-white/70 font-medium">{getFYMonthYear(selectedFY, Math.min(currentMonth, 11))}</span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setIsPlaying(!isPlaying)} className="w-8 h-8 rounded-full flex items-center justify-center border" style={{ borderColor: 'var(--border)' }}>
                  {isPlaying ? <Pause className="w-3.5 h-3.5 text-white/60" /> : <Play className="w-3.5 h-3.5 text-white/60" />}
                </button>
                {[1, 2, 5].map(s => (
                  <button key={s} onClick={() => setSpeed(s)}
                    className="px-2 py-1 rounded-lg font-mono text-[10px] transition-[background-color,color] duration-200"
                    style={{ background: speed === s ? 'rgba(192,241,142,0.08)' : 'transparent', color: speed === s ? 'var(--accent)' : 'var(--text-secondary)' }}>
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* 2×2 Portfolio Cards with Whispers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {ASSET_CLASSES.map(ac => {
                const invested = BUDGET * alloc[ac.key] / 100
                const current = pulledOut && pullOutValues ? pullOutValues[ac.key] : currentValues[ac.key]
                const returnPct = invested > 0 ? ((current - invested) / invested) * 100 : 0
                const isPositive = returnPct >= 0
                const sparkData = simData.monthlyValues.slice(0, Math.min(currentMonth + 2, simData.monthlyValues.length)).map(v => v[ac.key])
                const whisper = activeWhispers.find(w => w.asset === ac.key)

                return (
                  <motion.div key={ac.key} layout className="rounded-2xl p-5 border relative" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>

                    {/* Whisper card */}
                    <AnimatePresence>
                      {whisper && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                          className="absolute -top-2 left-4 right-4 rounded-xl p-3 border z-20"
                          style={{ background: 'rgba(29,158,117,0.12)', borderColor: 'rgba(29,158,117,0.25)', backdropFilter: 'blur(8px)' }}>
                          <p className="font-sans text-[10px] text-white/70 leading-relaxed">{whisper.whisper}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-sans text-sm text-white/60 font-medium">{ac.name}</p>
                        <p className="font-mono text-[10px] text-white/25 mt-0.5">Invested: {formatINR(invested)}</p>
                      </div>
                      {renderSparkline(sparkData, isPositive ? '#1D9E75' : '#E24B4A')}
                    </div>
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="font-display font-semibold text-lg text-white">{formatINR(current)}</p>
                        {/* Golden rule: loss context */}
                        {!isPositive && invested > 0 && recoveryCtx && (
                          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                            className="font-sans text-[9px] text-white/25 italic mt-0.5 max-w-[200px] leading-relaxed"
                          >Recovery always followed</motion.p>
                        )}
                      </div>
                      <p className="font-mono text-sm" style={{ color: isPositive ? 'var(--teal)' : 'var(--danger)' }}>
                        {isPositive ? '+' : ''}{returnPct.toFixed(1)}%
                      </p>
                    </div>
                  </motion.div>
                )
              })}
            </div>

            {/* Total */}
            <div className="text-center py-4">
              <p className="font-sans text-xs text-white/25 uppercase tracking-wider mb-1">Total portfolio value</p>
              <motion.p
                className="font-display font-bold text-4xl"
                style={{ color: totalValue >= BUDGET ? 'var(--teal)' : 'var(--danger)' }}
                animate={breakthroughTriggered ? { scale: [1, 1.05, 1] } : {}}
                transition={{ duration: 0.5 }}
              >
                {formatINR(totalValue)}
              </motion.p>
              {totalValue < BUDGET && recoveryCtx && (
                <RecoveryLine value={totalValue} invested={BUDGET} fy={selectedFY} />
              )}
              {/* Breakthrough toast */}
              <AnimatePresence>
                {breakthroughTriggered && (
                  <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="font-sans text-xs font-medium mt-2"
                    style={{ color: 'var(--teal)' }}
                  >
                    ✓ Back in profit.
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* Active crash mini-banner */}
            <AnimatePresence>
              {activeCrashInfo && !pulledOut && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div
                    className="flex items-center justify-between rounded-xl px-4 py-2 border"
                    style={{
                      background: totalValue < BUDGET ? 'rgba(226,75,74,0.06)' : 'rgba(29,158,117,0.06)',
                      borderColor: totalValue < BUDGET ? 'rgba(226,75,74,0.15)' : 'rgba(29,158,117,0.15)',
                    }}
                  >
                    <p className="font-sans text-[10px] text-white/50">
                      <span className="font-medium" style={{ color: totalValue < BUDGET ? 'var(--danger)' : 'var(--teal)' }}>
                        {activeCrashInfo.crash.name}
                      </span>
                      {' — '}
                      {totalValue < BUDGET
                        ? `Month ${activeCrashInfo.monthsIn} of recovery`
                        : 'Recovery complete'
                      }
                    </p>
                    <p className="font-mono text-[9px]" style={{ color: totalValue < BUDGET ? 'var(--danger)' : 'var(--teal)' }}>
                      {totalValue < BUDGET
                        ? `${((totalValue - BUDGET) / BUDGET * 100).toFixed(1)}%`
                        : `+${((totalValue - BUDGET) / BUDGET * 100).toFixed(1)}%`
                      }
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Timeline progress */}
            <div className="w-full">
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div className="h-full rounded-full" style={{
                  background: totalValue >= BUDGET ? 'var(--accent)' : 'var(--danger)',
                  width: `${(Math.min(currentMonth, 11) / 11) * 100}%`,
                }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="font-mono text-[9px] text-white/15">Apr</span>
                <span className="font-mono text-[9px] text-white/15">Mar</span>
              </div>
            </div>

            {/* Non-danger flash events */}
            <AnimatePresence>
              {flashEvent && flashEvent.severity !== 'danger' && (
                <motion.div initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                  className="fixed top-20 right-6 max-w-sm rounded-2xl p-5 border-2 z-50"
                  style={{
                    background: 'var(--bg)',
                    borderColor: flashEvent.severity === 'warning' ? 'var(--accent)' : 'var(--teal)',
                  }}>
                  <p className="font-display font-semibold text-sm text-white mb-1">{flashEvent.headline}</p>
                  <p className="font-sans text-xs text-white/40">{flashEvent.description}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ═══ CRASH DECISION SCREEN — 3 panels ═══════════════════════ */}
        {phase === 'crash-decision' && flashEvent && (
          <motion.div key="crash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-5xl mx-auto space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* LEFT: What just happened */}
              <div className="rounded-3xl p-6 border-2 relative overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--danger)' }}>
                <p className="font-sans text-[10px] text-white/25 uppercase tracking-wider mb-4 flex items-center gap-2">
                  What just happened
                  {aiNewsLoading && (
                    <span className="flex gap-1 items-center bg-white/5 px-2 py-0.5 rounded-full">
                      <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5 }} className="w-1 h-1 rounded-full bg-[var(--accent)]" />
                      <span className="text-[8px] text-[var(--accent)] font-medium tracking-widest">AI GENERATING NEWS</span>
                    </span>
                  )}
                </p>
                <motion.div
                  initial={false}
                  animate={{ opacity: aiNewsLoading ? 0.5 : 1, filter: aiNewsLoading ? 'blur(2px)' : 'blur(0px)' }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="font-display font-bold text-xl text-white mb-3 leading-tight">{flashEvent.headline}</h2>
                  <p className="font-sans text-sm text-white/50 leading-relaxed">
                    {aiNewsLoading ? "Synthesizing period-accurate market context..." : (crashRecovery?.explanation || flashEvent.description)}
                  </p>
                </motion.div>
              </div>

              {/* CENTER: Your portfolio right now */}
              <div className="rounded-3xl p-6 border-2 flex flex-col" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <p className="font-sans text-[10px] text-white/25 uppercase tracking-wider mb-4">Your portfolio right now</p>
                <p className="font-display font-bold text-3xl text-center mb-2" style={{ color: totalValue >= BUDGET ? 'var(--teal)' : 'var(--danger)' }}>
                  {formatINR(totalValue)}
                </p>
                {totalValue < peakValue && (
                  <p className="font-sans text-xs text-center mb-4" style={{ color: 'var(--danger)' }}>
                    {formatINR(totalValue - peakValue)} from peak
                  </p>
                )}
                <div className="mt-auto space-y-3">
                  {!crashDecisionMade ? (
                    <>
                      <button onClick={handleHold}
                        className="w-full py-3.5 rounded-full font-sans font-bold text-sm text-[#0a1a00] active:scale-[0.97] transition-transform duration-200"
                        style={{ background: 'var(--accent)' }}>
                        💎 Hold my position
                      </button>
                      <button onClick={handlePullOut}
                        className="w-full py-3.5 rounded-full font-sans font-bold text-sm border active:scale-[0.97] transition-transform duration-200"
                        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                        I'm pulling out
                      </button>
                    </>
                  ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                      <p className="font-sans text-sm text-white/50 mb-3">
                        {pulledOut ? "Here's what you missed." : "You made the same choice as the winners. Let's see how it plays out."}
                      </p>
                      <button onClick={resumeAfterDecision}
                        className="w-full py-3.5 rounded-full font-sans font-bold text-sm text-[#0a1a00] active:scale-[0.97] transition-transform duration-200 flex items-center justify-center gap-2"
                        style={{ background: 'var(--accent)' }}>
                        Continue <ChevronRight className="w-4 h-4" />
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* RIGHT: History (blurred until decision) */}
              <div className="rounded-3xl p-6 border-2 relative overflow-hidden" style={{ background: 'var(--surface)', borderColor: showRecoveryPanel ? 'var(--teal)' : 'var(--border)' }}>
                <p className="font-sans text-[10px] text-white/25 uppercase tracking-wider mb-4">What history says</p>

                {!showRecoveryPanel && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center z-10" style={{ backdropFilter: 'blur(10px)', background: 'rgba(10,15,8,0.7)' }}>
                    <Lock className="w-6 h-6 text-white/20 mb-2" />
                    <p className="font-sans text-sm text-white/30">Unlock after you decide</p>
                  </div>
                )}

                <div className={showRecoveryPanel ? '' : 'opacity-0'}>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={showRecoveryPanel ? { opacity: 1, y: 0 } : {}} transition={{ delay: 0.2 }}>
                    {crashRecovery ? (
                      <div className="space-y-4">
                        <p className="font-sans text-sm text-white/60">
                          Investors who held through <span className="text-white font-medium">{crashRecovery.eventName}</span>:
                        </p>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="font-sans text-xs text-white/40">Time to recovery</span>
                            <span className="font-display font-semibold text-sm" style={{ color: 'var(--teal)' }}>{crashRecovery.timeToRecovery}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-sans text-xs text-white/40">1 year after crash</span>
                            <span className="font-display font-semibold text-sm" style={{ color: 'var(--accent)' }}>{crashRecovery.oneYearAfter}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-sans text-xs text-white/40">3 years after crash</span>
                            <span className="font-display font-semibold text-sm" style={{ color: 'var(--accent)' }}>{crashRecovery.threeYearsAfter}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="font-sans text-sm text-white/50">Historical data shows that markets have always recovered from events like this. The recovery time varies, but it always comes.</p>
                    )}
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══ PHASE 3: DEBRIEF ════════════════════════════════════════ */}
        {phase === 'debrief' && (
          <motion.div key="debrief" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-8">

            {/* ── THREE SCENARIO DISPLAY ──────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* Column 1: Your result */}
              <div className="rounded-3xl p-6 border-2" style={{ background: 'var(--surface)', borderColor: totalValue >= BUDGET ? 'var(--teal)' : 'var(--danger)', }}>
                <p className="font-sans text-[10px] text-white/25 uppercase tracking-wider mb-3">Your result</p>
                <p className="font-display font-bold text-2xl mb-1" style={{ color: totalValue >= BUDGET ? 'var(--teal)' : 'var(--danger)' }}>
                  {formatINR(totalValue)}
                </p>
                <p className="font-sans text-xs text-white/40 mb-2">
                  {totalValue >= BUDGET ? '+' : ''}{formatINR(totalValue - BUDGET)} ({((totalValue / BUDGET - 1) * 100).toFixed(1)}%)
                </p>
                {totalValue < BUDGET && recoveryCtx && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                    className="rounded-xl p-3 border mt-3" style={{ background: 'rgba(226,75,74,0.04)', borderColor: 'rgba(226,75,74,0.12)' }}>
                    <p className="font-sans text-[10px] text-white/40 italic leading-relaxed">{recoveryCtx}</p>
                  </motion.div>
                )}
                {pulledOut && pullOutMonth !== null && (
                  <div className="rounded-xl p-3 border mt-3" style={{ background: 'rgba(226,75,74,0.04)', borderColor: 'rgba(226,75,74,0.12)' }}>
                    <p className="font-sans text-[10px] text-white/40">
                      You pulled out in month {pullOutMonth + 1}. Stayed value:{' '}
                      <span style={{ color: 'var(--teal)' }}>{formatINR(simData.monthlyValues[12]?.total || 0)}</span>
                    </p>
                  </div>
                )}
              </div>

              {/* Column 2: Age-based allocation */}
              <div className="rounded-3xl p-6 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <p className="font-sans text-[10px] text-white/25 uppercase tracking-wider mb-3">Age-based allocation</p>
                <p className="font-display font-bold text-2xl mb-1 text-white">
                  {formatINR(ageSimData.monthlyValues[12]?.total || BUDGET)}
                </p>
                {(() => {
                  const ageResult = ageSimData.monthlyValues[12]?.total || BUDGET
                  const diff = ageResult - totalValue
                  const userBetter = diff < 0
                  return (
                    <>
                      <p className="font-sans text-xs mb-2" style={{ color: userBetter ? 'var(--accent)' : 'var(--teal)' }}>
                        {userBetter ? `You beat this by ${formatINR(Math.abs(diff))} 🎉` : `${formatINR(diff)} better than your pick`}
                      </p>
                      <div className="space-y-1 mt-3">
                        <p className="font-mono text-[9px] text-white/25">Nifty {ageAlloc.nifty}% · Midcap {ageAlloc.midcap}% · Smallcap {ageAlloc.smallcap}% · Debt {ageAlloc.debt}%</p>
                        <p className="font-sans text-[10px] text-white/30 italic">Based on 100-minus-age rule (age {userAge || 22})</p>
                      </div>
                    </>
                  )
                })()}
              </div>

              {/* Column 3: Optimal allocation */}
              <div className="rounded-3xl p-6 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <p className="font-sans text-[10px] text-white/25 uppercase tracking-wider mb-3 flex items-center gap-1">
                  <Eye className="w-3 h-3" /> Hindsight optimal
                </p>
                {optimal ? (
                  <>
                    <p className="font-display font-bold text-2xl mb-1" style={{ color: 'var(--accent)' }}>
                      {formatINR(optimal.result)}
                    </p>
                    <p className="font-sans text-xs text-white/40 mb-2">
                      +{((optimal.result / BUDGET - 1) * 100).toFixed(1)}% return
                    </p>
                    <div className="space-y-1 mt-3">
                      <p className="font-mono text-[9px] text-white/25">
                        Nifty {optimal.nifty}% · Midcap {optimal.midcap}% · Smallcap {optimal.smallcap}% · Debt {optimal.debt}%
                      </p>
                    </div>
                  </>
                ) : (
                  <p className="font-sans text-sm text-white/40">Data not available for this year</p>
                )}
              </div>
            </div>

            {/* Hindsight framing */}
            <div className="text-center px-4">
              <p className="font-sans text-sm text-white/30 italic max-w-lg mx-auto">
                Hindsight is always 20/20. No one knew in advance. The goal isn't to time the market — it's to stay in it long enough that time works for you.
              </p>
            </div>

            {/* ── THREE-MESSAGE ARJUN DEBRIEF ─────────────────────────── */}
            <div className="space-y-4">

              {/* Message 1: Context (hardcoded, instant) */}
              <AnimatePresence>
                {debriefStep >= 0 && (
                  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(192,241,142,0.08)', border: '1px solid rgba(192,241,142,0.18)' }}>
                      <Zap className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                    </div>
                    <div className="rounded-3xl p-5 border flex-1" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                      <p className="font-sans text-[10px] text-white/20 uppercase tracking-wider mb-2">What happened this year</p>
                      <p className="font-sans text-sm text-white/60 leading-relaxed">{FY_KINU_CONTEXT[selectedFY] || 'Market conditions varied throughout this year.'}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Message 2: Instinct (API) */}
              <AnimatePresence>
                {debriefStep >= 1 && (
                  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(192,241,142,0.08)', border: '1px solid rgba(192,241,142,0.18)' }}>
                      <Zap className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                    </div>
                    <div className="rounded-3xl p-5 border flex-1" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                      <p className="font-sans text-[10px] text-white/20 uppercase tracking-wider mb-2">Where your instincts were right</p>
                      {debriefInstinctLoading ? (
                        <div className="flex items-center gap-2">
                          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                          <p className="font-sans text-sm text-white/30">KINU is thinking...</p>
                        </div>
                      ) : (
                        <p className="font-sans text-sm text-white/60 leading-relaxed">{debriefInstinct}</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Message 3: Advice (API) */}
              <AnimatePresence>
                {debriefStep >= 2 && (
                  <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(192,241,142,0.08)', border: '1px solid rgba(192,241,142,0.18)' }}>
                      <Zap className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                    </div>
                    <div className="rounded-3xl p-5 border flex-1" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                      <p className="font-sans text-[10px] text-white/20 uppercase tracking-wider mb-2">What to do differently next time</p>
                      {debriefAdviceLoading ? (
                        <div className="flex items-center gap-2">
                          <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
                          <p className="font-sans text-sm text-white/30">KINU is thinking...</p>
                        </div>
                      ) : (
                        <p className="font-sans text-sm text-white/60 leading-relaxed">{debriefAdvice}</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={resetToSetup}
                className="flex-1 py-3.5 rounded-full font-sans font-bold text-sm border active:scale-[0.97] transition-transform duration-200 flex items-center justify-center gap-2"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                <RotateCcw className="w-3.5 h-3.5" /> Try another year
              </button>
              <button onClick={() => { saveResult(); setDashboardSection('my-card') }}
                className="flex-1 py-3.5 rounded-full font-sans font-bold text-sm text-[#0a1a00] active:scale-[0.97] transition-transform duration-200 flex items-center justify-center gap-2"
                style={{ background: 'var(--accent)' }}>
                Save to my card <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>

      {/* Disclaimer */}
      <p className="font-sans text-[10px] text-center mt-8 pb-2"
         style={{ color: 'rgba(255,255,255,0.18)' }}>
        Simulated for educational purposes only. Past performance does not
        guarantee future results. Not financial advice.
        Data sourced from NSE India historical records.
      </p>
    </motion.div>
  )
}

/* ── Public export — wrapped in ErrorBoundary ────────────────────────────── */
export default function Sandbox() {
  return (
    <SandboxErrorBoundary>
      <SandboxInner />
    </SandboxErrorBoundary>
  )
}
