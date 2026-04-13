import { motion, AnimatePresence, useMotionValue, animate as fmAnimate } from 'framer-motion'
import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useAppStore } from '../../../store/useAppStore'
import { formatINR } from '../../../lib/formatINR'
import { getNiftyFromYear } from '../../../lib/niftyData'
import { postInstinctDebrief } from '../../../lib/api'
import { CRASH_HISTORY, type CrashEvent } from '../../../lib/crashData'
import {
  ArrowRight, Clock, TrendingDown, TrendingUp,
  RotateCcw, Zap, Shield, AlertTriangle,
} from 'lucide-react'

/* ── Types ─────────────────────────────────────────────────────────────────── */

type Phase = 'input' | 'running' | 'crash-pause' | 'result'

interface CrashDetection {
  crash: CrashEvent
  portfolioAtPause: number
  peakBeforeCrash: number
}

/* ── Constants ─────────────────────────────────────────────────────────────── */

const MONTH_NAMES_SHORT = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

const START_PRESETS = [
  { year: 2010, label: 'April 2010', sub: 'Post-crash recovery' },
  { year: 2015, label: 'April 2015', sub: 'Pre-bull run' },
  { year: 2018, label: 'April 2018', sub: 'Pre-correction' },
  { year: 2019, label: 'April 2019', sub: 'Pre-COVID' },
]

const SPEEDS = [1, 2, 5, 20]

/* ── Detect crashes from crashData for any time range ──────────────────── */

function detectCrashesInRange(startYear: number): CrashEvent[] {
  return CRASH_HISTORY.filter(c => {
    const parts = c.startDate.split('-')
    const crashYear = parseInt(parts[1], 10)
    return crashYear >= startYear && crashYear <= 2024
  })
}

/* ── SVG Chart Component ───────────────────────────────────────────────── */

function LiveChart({
  portfolioHistory,
  investedHistory,
  ghostHistory,
  crashRanges,
  breakEvenIndex,
  width = 280,
  height = 260,
}: {
  portfolioHistory: number[]
  investedHistory: number[]
  ghostHistory: number[]
  crashRanges: { start: number; end: number }[]
  breakEvenIndex: number | null
  width?: number
  height?: number
}) {
  if (portfolioHistory.length < 2) return null

  const allVals = [...portfolioHistory, ...investedHistory, ...ghostHistory].filter(v => v > 0)
  const minY = Math.min(...allVals) * 0.95
  const maxY = Math.max(...allVals) * 1.05
  const rangeY = maxY - minY || 1
  const total = portfolioHistory.length
  const pad = { top: 12, bottom: 24, left: 4, right: 4 }
  const cw = width - pad.left - pad.right
  const ch = height - pad.top - pad.bottom

  const toX = (i: number) => pad.left + (i / Math.max(total - 1, 1)) * cw
  const toY = (v: number) => pad.top + ch - ((v - minY) / rangeY) * ch

  const portfolioPath = portfolioHistory.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ')
  const investedPath = investedHistory.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ')
  const ghostPath = ghostHistory.length > 0
    ? ghostHistory.map((v, i) => `${i === 0 ? 'M' : 'L'}${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ')
    : ''

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      {/* Crash bands */}
      {crashRanges.map((r, i) => (
        <rect key={i} x={toX(r.start)} y={pad.top} width={Math.max(toX(r.end) - toX(r.start), 2)} height={ch}
          fill="rgba(226,75,74,0.08)" />
      ))}

      {/* Invested line (dashed) */}
      <path d={investedPath} fill="none" stroke="var(--accent)" strokeWidth="1" strokeDasharray="4 3" opacity="0.4" />

      {/* Ghost line (if withdrew) */}
      {ghostPath && (
        <path d={ghostPath} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeDasharray="4 4" />
      )}

      {/* Portfolio line */}
      <path d={portfolioPath} fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinejoin="round" />

      {/* Breakeven dot */}
      {breakEvenIndex !== null && breakEvenIndex < total && (
        <circle cx={toX(breakEvenIndex)} cy={toY(portfolioHistory[breakEvenIndex])} r="4" fill="var(--teal)" opacity="0.7">
          <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
        </circle>
      )}
    </svg>
  )
}

/* ── Main Component ────────────────────────────────────────────────────── */

export default function TimeMachinePage() {
  const rawName = useAppStore(s => s.userName)
  const userName = rawName && rawName !== 'Explorer' ? rawName.split(' ')[0] : ''
  const setTimeMachineResult = useAppStore(s => s.setTimeMachineResult)
  const setDashboardSection = useAppStore(s => s.setDashboardSection)

  // Setup state
  const [monthlyAmount, setMonthlyAmount] = useState(500)
  const [startYear, setStartYear] = useState(2015)
  const [panicMode, setPanicMode] = useState(true)
  const [phase, setPhase] = useState<Phase>('input')

  // Playback state
  const [speed, setSpeed] = useState(1)
  const [, setIsPaused] = useState(false)
  const [currentDate, setCurrentDate] = useState('')
  const [investedSoFar, setInvestedSoFar] = useState(0)
  const [returnPct, setReturnPct] = useState(0)
  const [progress, setProgress] = useState(0)

  // Chart data
  const [portfolioHistory, setPortfolioHistory] = useState<number[]>([0])
  const [investedHistory, setInvestedHistory] = useState<number[]>([0])
  const [ghostHistory, setGhostHistory] = useState<number[]>([])
  const [crashBands, setCrashBands] = useState<{ start: number; end: number }[]>([])
  const [breakEvenIdx, setBreakEvenIdx] = useState<number | null>(null)

  // Crash detection
  const [activeCrash, setActiveCrash] = useState<CrashDetection | null>(null)

  // Result state
  const [finalValue, setFinalValue] = useState(0)
  const [totalInvested, setTotalInvested] = useState(0)
  const [didWithdraw, setDidWithdraw] = useState(false)
  const [stayedValue, setStayedValue] = useState(0)
  const [withdrawnValue, setWithdrawnValue] = useState(0)
  const [withdrawDate, setWithdrawDate] = useState('')
  const [crashesSurvived, setCrashesSurvived] = useState<string[]>([])
  const [, setTotalUnits] = useState(0)
  const [bestMonth, setBestMonth] = useState(0)
  const [worstMonth, setWorstMonth] = useState(0)
  const [monthsElapsed, setMonthsElapsed] = useState(0)

  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

  // Counter animation
  const counterMotion = useMotionValue(0)
  const [counterDisplay, setCounterDisplay] = useState('₹0')
  useEffect(() => {
    const unsub = counterMotion.on('change', v => setCounterDisplay(formatINR(Math.max(0, v))))
    return unsub
  }, [counterMotion])

  const cleanup = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
  }, [])
  useEffect(() => cleanup, [cleanup])

  // Detect relevant crashes for the selected start year
  const relevantCrashes = useMemo(() => detectCrashesInRange(startYear), [startYear])

  // Data info
  const niftyData = useMemo(() => getNiftyFromYear(startYear), [startYear])
  const totalSimMonths = niftyData.length
  const totalYears = Math.round(totalSimMonths / 12)
  const simEndYear = niftyData.length > 0 ? niftyData[niftyData.length - 1].year : 2024

  /* ── Simulation ────────────────────────────────────────────────────── */

  const runSimulation = useCallback((
    resumeFromIdx = 0,
    existingUnits = 0,
    existingInvested = 0,
    existingPeak = 0,
    withdrew = false,
    withdrawValue = 0,
    withdrawDateStr = '',
    existingPortfolioHist: number[] = [0],
    existingInvestedHist: number[] = [0],
    existingCrashBands: { start: number; end: number }[] = [],
    survivedCrashes: string[] = [],
  ) => {
    const data = niftyData
    if (data.length < 2) return

    if (withdrew) {
      // User chose to withdraw — compute ghost "stayed" value
      setPhase('result')
      setDidWithdraw(true)
      setWithdrawnValue(withdrawValue)
      setWithdrawDate(withdrawDateStr)

      let ghostUnits = existingUnits
      let ghostInvested = existingInvested
      const ghost: number[] = [...existingPortfolioHist]

      for (let i = resumeFromIdx; i < data.length; i++) {
        ghostUnits += monthlyAmount / data[i].close
        ghostInvested += monthlyAmount
        ghost.push(ghostUnits * data[i].close)
      }

      setGhostHistory(ghost)
      setStayedValue(ghostUnits * data[data.length - 1].close)
      setTotalInvested(ghostInvested)
      setFinalValue(withdrawValue)
      setTotalUnits(ghostUnits)
      setTimeMachineResult({ finalValue: withdrawValue, totalInvested: ghostInvested, didWithdraw: true })
      setCrashesSurvived(survivedCrashes)
      return
    }

    setPhase('running')
    setIsPaused(false)
    setActiveCrash(null)

    let currentMonth = resumeFromIdx
    let units = existingUnits
    let invested = existingInvested
    let peak = existingPeak
    let portHist = [...existingPortfolioHist]
    let invHist = [...existingInvestedHist]
    let bands = [...existingCrashBands]
    let survived = [...survivedCrashes]
    let bMonth = 0
    let wMonth = 0
    let breakEven: number | null = null
    let prevValue = existingUnits > 0 ? existingUnits * data[Math.max(0, currentMonth - 1)].close : 0
    // Track which crashes we've already paused for
    const pausedCrashes = new Set(survived)

    const step = () => {
      if (currentMonth >= data.length) {
        const finalVal = units * data[data.length - 1].close
        setPhase('result')
        setFinalValue(finalVal)
        setTotalInvested(invested)
        setDidWithdraw(false)
        setTotalUnits(units)
        setCrashesSurvived(survived)
        fmAnimate(counterMotion, finalVal, { duration: 0.6 })
        setTimeMachineResult({ finalValue: finalVal, totalInvested: invested, didWithdraw: false })
        return
      }

      const d = data[currentMonth]
      const nav = d.close
      units += monthlyAmount / nav
      invested += monthlyAmount
      const value = units * nav
      if (value > peak) peak = value

      // Track best/worst monthly returns
      if (prevValue > 0) {
        const monthReturn = ((value - monthlyAmount - prevValue) / prevValue) * 100
        if (monthReturn > bMonth) bMonth = monthReturn
        if (monthReturn < wMonth) wMonth = monthReturn
      }
      prevValue = value

      portHist.push(value)
      invHist.push(invested)

      // Breakeven detection
      if (breakEven === null && portHist.length > 3 && value > invested) {
        breakEven = portHist.length - 1
        setBreakEvenIdx(breakEven)
      }

      setCurrentDate(`${MONTH_NAMES_SHORT[d.month - 1]}  ${d.year}`)
      setInvestedSoFar(invested)
      setReturnPct(invested > 0 ? ((value - invested) / invested) * 100 : 0)
      setProgress((currentMonth / (data.length - 1)) * 100)
      setMonthsElapsed(currentMonth + 1)
      setBestMonth(bMonth)
      setWorstMonth(wMonth)
      setPortfolioHistory([...portHist])
      setInvestedHistory([...invHist])
      fmAnimate(counterMotion, value, { duration: 0.05 })

      // Crash detection — check all relevant crashes
      if (panicMode) {
        for (const crash of relevantCrashes) {
          if (pausedCrashes.has(crash.name)) continue
          const parts = crash.bottomDate.split('-')
          const crashMonth = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(parts[0]) + 1
          const crashYear = parseInt(parts[1], 10)
          if (d.year === crashYear && d.month === crashMonth) {
            pausedCrashes.add(crash.name)
            // Add crash band
            const crashStartParts = crash.startDate.split('-')
            const csMonth = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].indexOf(crashStartParts[0]) + 1
            const csYear = parseInt(crashStartParts[1], 10)
            const startIdx = data.findIndex(dd => dd.year === csYear && dd.month === csMonth)
            if (startIdx >= 0) {
              bands.push({ start: startIdx, end: currentMonth })
              setCrashBands([...bands])
            }

            setActiveCrash({ crash, portfolioAtPause: value, peakBeforeCrash: peak })
            setPhase('crash-pause')
            // Store resume state in closure for the decision buttons
            ;(window as any).__tmResume = {
              idx: currentMonth + 1, units, invested, peak,
              portHist: [...portHist], invHist: [...invHist],
              bands: [...bands], survived: [...survived, crash.name],
            }
            return
          }
        }
      }

      const isLast3 = currentMonth >= data.length - 3
      currentMonth++
      const delay = speed === 20 ? 25 : speed === 5 ? 80 : speed === 2 ? 200 : 400
      timerRef.current = setTimeout(step, isLast3 ? 300 : delay)
    }

    step()
  }, [niftyData, monthlyAmount, speed, counterMotion, setTimeMachineResult, relevantCrashes, panicMode])

  const handleStart = () => {
    setPortfolioHistory([0])
    setInvestedHistory([0])
    setGhostHistory([])
    setCrashBands([])
    setBreakEvenIdx(null)
    setCrashesSurvived([])
    setBestMonth(0)
    setWorstMonth(0)
    runSimulation()
  }

  const handleCrashDecision = (stayOrWithdraw: 'stay' | 'withdraw') => {
    const resume = (window as any).__tmResume
    if (!resume) return

    if (stayOrWithdraw === 'withdraw') {
      runSimulation(
        resume.idx, resume.units, resume.invested, resume.peak,
        true, activeCrash?.portfolioAtPause ?? 0,
        currentDate,
        resume.portHist, resume.invHist, resume.bands, resume.survived,
      )
    } else {
      runSimulation(
        resume.idx, resume.units, resume.invested, resume.peak,
        false, 0, '',
        resume.portHist, resume.invHist, resume.bands, resume.survived,
      )
    }
  }

  const handleReset = () => {
    cleanup()
    setPhase('input')
    setActiveCrash(null)
    setPortfolioHistory([0])
    setInvestedHistory([0])
    setGhostHistory([])
    setCrashBands([])
    setBreakEvenIdx(null)
  }

  /* ── Render ────────────────────────────────────────────────────────── */

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
      <AnimatePresence mode="wait">

        {/* ═══ INPUT PHASE ═══ */}
        {phase === 'input' && (
          <motion.div key="input" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-5xl mx-auto space-y-8">
            {/* Hero */}
            <div className="text-center mb-2">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: 'spring' }}>
                <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center" style={{ background: 'rgba(192,241,142,0.06)', border: '1px solid rgba(192,241,142,0.12)' }}>
                  <Clock className="w-7 h-7" style={{ color: 'var(--accent)' }} />
                </div>
              </motion.div>
              <h1 className="font-display font-semibold text-3xl md:text-4xl text-white mb-3 tracking-tight">
                The ₹{monthlyAmount.toLocaleString('en-IN')} Time Machine
              </h1>
              <p className="font-sans text-sm text-white/35 max-w-md mx-auto">
                Travel through real Nifty 50 history. Face the same crashes real investors did. See what patience builds.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Start Year */}
              <div className="rounded-3xl p-6 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <p className="font-sans text-[10px] text-white/25 uppercase tracking-[0.15em] mb-4 font-bold">Start investing</p>
                <div className="space-y-2">
                  {START_PRESETS.map(p => {
                    const isActive = startYear === p.year
                    return (
                      <button key={p.year} onClick={() => setStartYear(p.year)}
                        className="w-full text-left rounded-2xl px-4 py-3 border transition-[background-color,border-color] duration-200"
                        style={{
                          background: isActive ? 'rgba(192,241,142,0.06)' : 'transparent',
                          borderColor: isActive ? 'rgba(192,241,142,0.2)' : 'var(--border)',
                        }}>
                        <p className="font-mono text-sm" style={{ color: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.5)' }}>{p.label}</p>
                        <p className="font-sans text-[10px] text-white/25 mt-0.5">{p.sub}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Right: Amount + Toggle */}
              <div className="space-y-5">
                <div className="rounded-3xl p-6 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <p className="font-sans text-[10px] text-white/25 uppercase tracking-[0.15em] mb-3 font-bold">Monthly SIP</p>
                  <p className="font-display font-bold text-2xl mb-4" style={{ color: 'var(--accent)' }}>
                    ₹{monthlyAmount.toLocaleString('en-IN')}
                  </p>
                  <input type="range" min={100} max={10000} step={100} value={monthlyAmount}
                    onChange={e => setMonthlyAmount(Number(e.target.value))}
                    className="w-full h-1 rounded-full appearance-none cursor-pointer"
                    style={{ accentColor: 'var(--accent)', background: 'rgba(255,255,255,0.08)' }}
                  />
                  <div className="flex justify-between mt-1">
                    <span className="font-mono text-[9px] text-white/15">₹100</span>
                    <span className="font-mono text-[9px] text-white/15">₹10,000</span>
                  </div>
                </div>

                <div className="rounded-3xl p-5 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-sans text-[10px] text-white/25 uppercase tracking-[0.15em] font-bold">Behavioral stress test</p>
                      <p className="font-sans text-[10px] text-white/20 mt-1">If enabled, the simulation will pause during historic market crashes.</p>
                    </div>
                    <button onClick={() => setPanicMode(!panicMode)}
                      className="w-11 h-6 rounded-full relative transition-[background-color] duration-200"
                      style={{ background: panicMode ? 'rgba(192,241,142,0.25)' : 'rgba(255,255,255,0.08)' }}>
                      <motion.div
                        className="w-4 h-4 rounded-full absolute top-1"
                        animate={{ left: panicMode ? 24 : 4 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                        style={{ background: panicMode ? 'var(--accent)' : 'rgba(255,255,255,0.25)' }}
                      />
                    </button>
                  </div>
                </div>

                {/* Preview */}
                <div className="rounded-2xl p-4 border" style={{ background: 'rgba(192,241,142,0.02)', borderColor: 'rgba(192,241,142,0.06)' }}>
                  <p className="font-sans text-xs text-white/35">
                    <span style={{ color: 'var(--accent)' }}>₹{monthlyAmount.toLocaleString('en-IN')}/mo</span> from{' '}
                    <span className="text-white/50">{startYear}</span> to <span className="text-white/50">{simEndYear}</span> ·{' '}
                    <span className="text-white/50">{totalYears} years</span> ·{' '}
                    Total: <span className="text-white">{formatINR(monthlyAmount * totalSimMonths)}</span>
                  </p>
                </div>
              </div>
            </div>

            <button onClick={handleStart}
              className="w-full py-4 rounded-full font-sans font-bold text-sm text-[#0a1a00] box-glow active:scale-[0.97] transition-transform duration-200 flex items-center justify-center gap-3"
              style={{ background: 'var(--accent)' }}>
              Start Time Machine <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* ═══ RUNNING + CRASH-PAUSE PHASES ═══ */}
        {(phase === 'running' || phase === 'crash-pause') && (
          <motion.div key="running" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] gap-5">

              {/* ── LEFT COLUMN: Controls ── */}
              <div className="order-3 lg:order-1 space-y-4">
                {/* Speed selector */}
                <div className="rounded-2xl p-4 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <p className="font-sans text-[9px] text-white/20 uppercase tracking-wider mb-3">Speed</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {SPEEDS.map(s => (
                      <button key={s} onClick={() => setSpeed(s)}
                        className="py-2 rounded-xl font-mono text-xs transition-[background-color,border-color,color] duration-200 border"
                        style={{
                          background: speed === s ? 'rgba(192,241,142,0.08)' : 'transparent',
                          borderColor: speed === s ? 'rgba(192,241,142,0.2)' : 'var(--border)',
                          color: speed === s ? 'var(--accent)' : 'rgba(255,255,255,0.3)',
                        }}>
                        {s}×
                      </button>
                    ))}
                  </div>
                </div>

                {/* Session stats */}
                <div className="rounded-2xl p-4 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <p className="font-sans text-[9px] text-white/20 uppercase tracking-wider mb-3">Session</p>
                  <div className="space-y-2.5">
                    <div className="flex justify-between">
                      <span className="font-sans text-[11px] text-white/30">Elapsed</span>
                      <span className="font-mono text-[11px] text-white/50">{Math.floor(monthsElapsed / 12)}y {monthsElapsed % 12}m</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-[11px] text-white/30">Return</span>
                      <span className="font-mono text-[11px]" style={{ color: returnPct >= 0 ? 'var(--teal)' : 'var(--danger)' }}>
                        {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-[11px] text-white/30">Best month</span>
                      <span className="font-mono text-[11px]" style={{ color: 'var(--teal)' }}>+{bestMonth.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-sans text-[11px] text-white/30">Worst month</span>
                      <span className="font-mono text-[11px]" style={{ color: 'var(--danger)' }}>{worstMonth.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── CENTRE COLUMN: Counter + Timeline ── */}
              <div className="order-1 lg:order-2 space-y-4">

                {/* Crash Banner — slides in above the counter */}
                <AnimatePresence>
                  {phase === 'crash-pause' && activeCrash && (
                    <motion.div
                      initial={{ opacity: 0, y: -40 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -40 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                      className="rounded-2xl border overflow-hidden"
                      style={{ borderColor: 'rgba(226,75,74,0.2)' }}
                    >
                      {/* Top half: crash info */}
                      <div className="p-5" style={{ background: 'rgba(226,75,74,0.04)' }}>
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--danger)' }} />
                          <div>
                            <p className="font-display font-semibold text-base" style={{ color: 'var(--danger)' }}>
                              {activeCrash.crash.name}
                            </p>
                            <p className="font-sans text-xs text-white/40 mt-1 leading-relaxed">{activeCrash.crash.cause}</p>
                            <p className="font-mono font-bold text-2xl mt-2" style={{ color: 'var(--danger)' }}>
                              {activeCrash.crash.niftyPeakToDrop}%
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* Divider */}
                      <div className="h-px" style={{ background: 'rgba(255,255,255,0.06)' }} />
                      {/* Bottom half: recovery context */}
                      <div className="p-5" style={{ background: 'rgba(29,158,117,0.03)' }}>
                        <p className="font-sans text-[10px] text-white/25 uppercase tracking-wider mb-2">Historical recovery</p>
                        <div className="flex items-baseline gap-4">
                          <div>
                            <p className="font-mono text-sm" style={{ color: 'var(--teal)' }}>{activeCrash.crash.recoveryMonths} months</p>
                            <p className="font-sans text-[10px] text-white/25">to recover</p>
                          </div>
                          <div>
                            <p className="font-mono text-sm" style={{ color: 'var(--teal)' }}>+{activeCrash.crash.nextYearReturn}%</p>
                            <p className="font-sans text-[10px] text-white/25">the following year</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Decision Buttons (outside banner) */}
                <AnimatePresence>
                  {phase === 'crash-pause' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      className="flex flex-col gap-3">
                      <button onClick={() => handleCrashDecision('stay')}
                        className="w-full py-4 rounded-2xl font-sans font-bold text-sm text-[#0a1a00] active:scale-[0.97] transition-transform duration-200"
                        style={{ background: 'var(--accent)' }}>
                        <Shield className="w-4 h-4 inline mr-2" />
                        Stay invested
                      </button>
                      <button onClick={() => handleCrashDecision('withdraw')}
                        className="w-full py-4 rounded-2xl font-sans font-bold text-sm border active:scale-[0.97] transition-transform duration-200"
                        style={{ borderColor: 'rgba(226,75,74,0.3)', color: 'var(--danger)', background: 'transparent' }}>
                        <TrendingDown className="w-4 h-4 inline mr-2" />
                        Withdraw now
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Date */}
                <div className="text-center">
                  <p className="font-mono text-base tracking-[0.3em] text-white/30">{currentDate}</p>
                </div>

                {/* Big Counter */}
                <div className="text-center relative py-2">
                  <motion.p
                    className="font-mono font-bold leading-none"
                    style={{
                      fontSize: 'clamp(48px, 8vw, 88px)',
                      color: phase === 'crash-pause'
                        ? 'var(--danger)'
                        : returnPct >= 0 ? 'var(--teal)' : 'var(--danger)',
                    }}
                  >
                    {counterDisplay}
                  </motion.p>
                </div>

                {/* Invested + Return */}
                <div className="flex justify-center gap-6">
                  <div className="text-center">
                    <p className="font-sans text-[10px] text-white/20 uppercase tracking-wider">Invested</p>
                    <p className="font-mono text-sm text-white/50">{formatINR(investedSoFar)}</p>
                  </div>
                  <div className="text-center">
                    <p className="font-sans text-[10px] text-white/20 uppercase tracking-wider">Return</p>
                    <div className="flex items-center justify-center gap-1">
                      {returnPct >= 0
                        ? <TrendingUp className="w-3 h-3" style={{ color: 'var(--teal)' }} />
                        : <TrendingDown className="w-3 h-3" style={{ color: 'var(--danger)' }} />}
                      <p className="font-mono text-sm" style={{ color: returnPct >= 0 ? 'var(--teal)' : 'var(--danger)' }}>
                        {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Timeline Scrubber */}
                <div className="relative px-2">
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                    <motion.div className="h-full rounded-full" style={{ background: 'var(--accent)', width: `${progress}%` }}
                      transition={{ duration: 0.05 }} />
                  </div>
                  {/* Playhead marker */}
                  <motion.div
                    className="absolute top-[-3px] w-2.5 h-2.5 rounded-sm"
                    style={{
                      background: 'var(--accent)',
                      left: `${progress}%`,
                      transform: 'translateX(-50%)',
                      boxShadow: '0 0 8px rgba(192,241,142,0.4)',
                    }}
                  />
                  <div className="flex justify-between mt-2">
                    <span className="font-mono text-[8px] text-white/15">{startYear}</span>
                    <span className="font-mono text-[8px] text-white/15">{simEndYear}</span>
                  </div>
                </div>
              </div>

              {/* ── RIGHT COLUMN: Live Chart ── */}
              <div className="order-2 lg:order-3">
                <div className="rounded-2xl p-3 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <p className="font-sans text-[9px] text-white/20 uppercase tracking-wider mb-2">Portfolio growth</p>
                  <LiveChart
                    portfolioHistory={portfolioHistory}
                    investedHistory={investedHistory}
                    ghostHistory={ghostHistory}
                    crashRanges={crashBands}
                    breakEvenIndex={breakEvenIdx}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══ RESULT PHASE ═══ */}
        {phase === 'result' && (
          <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-5xl mx-auto space-y-6">

            {/* Headline */}
            <div className="text-center py-4">
              <motion.h2
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="font-display font-bold text-2xl md:text-3xl tracking-tight"
                style={{
                  color: didWithdraw
                    ? 'var(--accent)'
                    : finalValue > totalInvested ? 'var(--teal)' : 'var(--text-secondary)',
                }}
              >
                {didWithdraw
                  ? 'Staying invested would have been worth it.'
                  : finalValue > totalInvested
                    ? (userName ? `${userName}, you came out ahead.` : 'You came out ahead.')
                    : 'The market tested you.'}
              </motion.h2>
            </div>

            {/* 2×2 Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Total invested', value: formatINR(totalInvested), color: 'text-white' },
                { label: 'Final value', value: didWithdraw ? formatINR(withdrawnValue) : formatINR(finalValue), color: '', style: { color: (didWithdraw ? withdrawnValue : finalValue) >= totalInvested ? 'var(--teal)' : 'var(--danger)' } },
                { label: 'Total return', value: `${((didWithdraw ? withdrawnValue : finalValue) / totalInvested * 100 - 100).toFixed(1)}%`, color: '', style: { color: (didWithdraw ? withdrawnValue : finalValue) >= totalInvested ? 'var(--teal)' : 'var(--danger)' } },
                { label: 'Time in market', value: `${Math.floor(niftyData.length / 12)}y ${niftyData.length % 12}m`, color: 'text-white' },
              ].map((stat, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }}
                  className="rounded-2xl p-4 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <p className="font-sans text-[9px] text-white/20 uppercase tracking-wider mb-2">{stat.label}</p>
                  <p className={`font-display font-semibold text-lg ${stat.color}`} style={stat.style}>{stat.value}</p>
                </motion.div>
              ))}
            </div>

            {/* Comparison Panel (withdrew) */}
            {didWithdraw && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                className="rounded-3xl border overflow-hidden" style={{ borderColor: 'var(--border)' }}>
                <div className="grid grid-cols-1 md:grid-cols-2">
                  <div className="p-6 text-center" style={{ background: 'rgba(226,75,74,0.03)' }}>
                    <TrendingDown className="w-5 h-5 mx-auto mb-2" style={{ color: 'var(--danger)' }} />
                    <p className="font-sans text-[9px] text-white/25 uppercase mb-2">You withdrew in {withdrawDate}</p>
                    <p className="font-display font-bold text-2xl" style={{ color: 'var(--danger)' }}>{formatINR(withdrawnValue)}</p>
                  </div>
                  <div className="p-6 text-center border-t md:border-t-0 md:border-l" style={{ background: 'rgba(29,158,117,0.03)', borderColor: 'var(--border)' }}>
                    <TrendingUp className="w-5 h-5 mx-auto mb-2" style={{ color: 'var(--teal)' }} />
                    <p className="font-sans text-[9px] text-white/25 uppercase mb-2">If you had stayed</p>
                    <p className="font-display font-bold text-2xl" style={{ color: 'var(--teal)' }}>{formatINR(stayedValue)}</p>
                  </div>
                </div>
                <div className="p-4 text-center border-t" style={{ borderColor: 'var(--border)', background: 'rgba(192,241,142,0.02)' }}>
                  <p className="font-display font-bold text-lg" style={{ color: 'var(--accent)' }}>
                    +{formatINR(stayedValue - withdrawnValue)} by staying
                  </p>
                </div>
              </motion.div>
            )}

            {/* Held Through Panel */}
            {!didWithdraw && crashesSurvived.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                className="rounded-2xl p-5 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <p className="font-sans text-sm text-white/50">
                  You held through {crashesSurvived.length === 1 ? 'one crash' : `${crashesSurvived.length} crashes`}. That's what patience looks like.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {crashesSurvived.map(name => (
                    <span key={name} className="px-3 py-1 rounded-full font-sans text-[10px] font-medium" style={{ background: 'rgba(29,158,117,0.08)', color: 'var(--teal)', border: '1px solid rgba(29,158,117,0.15)' }}>
                      {name}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Final Chart */}
            <div className="rounded-2xl p-4 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <LiveChart
                portfolioHistory={portfolioHistory}
                investedHistory={investedHistory}
                ghostHistory={ghostHistory}
                crashRanges={crashBands}
                breakEvenIndex={breakEvenIdx}
                width={800}
                height={200}
              />
            </div>

            {/* KINU Debrief */}
            <InstinctDebrief startYear={startYear} monthlyAmount={monthlyAmount} finalValue={finalValue} totalInvested={totalInvested} didWithdraw={didWithdraw} withdrawMonth={null} />

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={() => setDashboardSection('my-card')}
                className="flex-1 py-3.5 rounded-full font-sans font-bold text-sm text-[#0a1a00] active:scale-[0.97] transition-transform duration-200 flex items-center justify-center gap-2"
                style={{ background: 'var(--accent)' }}>
                Add to my Fear Fingerprint <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={handleReset}
                className="flex-1 py-3.5 rounded-full font-sans font-bold text-sm border active:scale-[0.97] transition-transform duration-200 flex items-center justify-center gap-2"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                <RotateCcw className="w-3.5 h-3.5" /> Run again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* ── Instinct Debrief sub-component ──────────────────────────────────────── */

function InstinctDebrief({ startYear, monthlyAmount, finalValue, totalInvested, didWithdraw, withdrawMonth }: {
  startYear: number; monthlyAmount: number; finalValue: number; totalInvested: number; didWithdraw: boolean; withdrawMonth: number | null
}) {
  const fearType = useAppStore(s => s.fearType) ?? 'loss'
  const [debrief, setDebrief] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    postInstinctDebrief({
      start_year: startYear,
      monthly_amount: monthlyAmount,
      did_withdraw: didWithdraw,
      withdraw_month: withdrawMonth,
      fear_type: fearType,
      final_value: finalValue,
      total_invested: totalInvested,
    })
      .then(r => setDebrief(r.debrief))
      .catch(() => setDebrief('Your instinct in that moment was real. Now you have data to make a better decision next time.'))
      .finally(() => setLoading(false))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex gap-4">
      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(192,241,142,0.08)', border: '1px solid rgba(192,241,142,0.18)' }}>
        <Zap className="w-4 h-4" style={{ color: 'var(--accent)' }} />
      </div>
      <div className="rounded-3xl p-5 border flex-1" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <p className="font-sans text-[10px] text-white/25 uppercase tracking-wider mb-3">KINU's instinct debrief</p>
        {loading ? (
          <div className="flex items-center gap-2">
            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
            <p className="font-sans text-sm text-white/30">KINU is thinking...</p>
          </div>
        ) : (
          <p className="font-sans text-sm text-white/60 leading-relaxed">{debrief}</p>
        )}
      </div>
    </div>
  )
}
