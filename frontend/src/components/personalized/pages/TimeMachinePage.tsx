import { motion, AnimatePresence, useMotionValue, animate as fmAnimate } from 'framer-motion'
import { useState, useRef, useCallback, useEffect } from 'react'
import { useAppStore } from '../../../store/useAppStore'
import { formatINR } from '../../../lib/formatINR'
import { NIFTY_MONTHLY, getMonthNameFull, getNiftyFromYear } from '../../../lib/niftyData'
import { postInstinctDebrief } from '../../../lib/api'
import { getCrashByYear, type CrashEvent } from '../../../lib/crashData'
import { ArrowRight, Clock, TrendingDown, TrendingUp, Play, RotateCcw, Zap } from 'lucide-react'

type Phase = 'input' | 'running' | 'covid-pause' | 'result'

interface SpecialEvent {
  year: number; month: number; label: string; color: string; emoji: string
}

const SPECIALS: SpecialEvent[] = [
  { year: 2015, month: 1, label: 'Your journey begins', color: 'var(--accent)', emoji: '🚀' },
  { year: 2017, month: 7, label: 'Nifty crosses 10,000!', color: 'var(--teal)', emoji: '📈' },
  { year: 2018, month: 1, label: 'Bull run peak — 11,000', color: 'var(--teal)', emoji: '🐂' },
  { year: 2018, month: 10, label: 'IL&FS crisis dip', color: 'var(--danger)', emoji: '📉' },
  { year: 2020, month: 1, label: 'COVID-19 begins spreading', color: 'var(--accent)', emoji: '⚠️' },
  { year: 2020, month: 9, label: 'Recovery begins', color: 'var(--teal)', emoji: '🌱' },
  { year: 2021, month: 8, label: 'Nifty crosses 17,000!', color: 'var(--teal)', emoji: '🎉' },
  { year: 2024, month: 9, label: 'All-time high: 25,800', color: 'var(--accent)', emoji: '🏆' },
]

export default function TimeMachinePage() {
  const rawName = useAppStore(s => s.userName)
  const userName = rawName && rawName !== 'Explorer' ? rawName.split(' ')[0] : ''
  const setTimeMachineResult = useAppStore(s => s.setTimeMachineResult)
  const setDashboardSection = useAppStore(s => s.setDashboardSection)

  const [monthlyAmount, setMonthlyAmount] = useState(500)
  const [startYear, setStartYear] = useState(2015)
  const [phase, setPhase] = useState<Phase>('input')
  const [crashPreset, setCrashPreset] = useState<CrashEvent | null>(null)

  const [currentDate, setCurrentDate] = useState('')
  const [investedSoFar, setInvestedSoFar] = useState(0)
  const [returnPct, setReturnPct] = useState(0)
  const [progress, setProgress] = useState(0)
  const [flashEvent, setFlashEvent] = useState<SpecialEvent | null>(null)
  const [niftyPrice, setNiftyPrice] = useState(0)

  const [covidPortfolio, setCovidPortfolio] = useState(0)
  const [preCrashPeak, setPreCrashPeak] = useState(0)

  const [finalValue, setFinalValue] = useState(0)
  const [totalInvested, setTotalInvested] = useState(0)
  const [didWithdraw, setDidWithdraw] = useState(false)
  const [stayedValue, setStayedValue] = useState(0)
  const [withdrawnValue, setWithdrawnValue] = useState(0)
  const [totalUnits, setTotalUnits] = useState(0)

  const timerRef = useRef<ReturnType<typeof setTimeout>>(null)

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

  const runSimulation = useCallback((resumeFromCovid = false, withdrew = false) => {
    const data = getNiftyFromYear(startYear)
    if (data.length < 2) return
    const endData = NIFTY_MONTHLY[NIFTY_MONTHLY.length - 1]
    const totalMonths = data.length
    let currentMonth = resumeFromCovid ? data.findIndex(d => d.year === 2020 && d.month === 3) : 0
    if (currentMonth < 0) currentMonth = 0
    if (resumeFromCovid && currentMonth > 0) currentMonth++

    let units = resumeFromCovid ? (covidPortfolio / (data[currentMonth - 1]?.close || 1)) : 0
    let invested = resumeFromCovid ? investedSoFar : 0
    let peak = resumeFromCovid ? preCrashPeak : 0

    if (withdrew) {
      setPhase('result'); setDidWithdraw(true); setWithdrawnValue(covidPortfolio)
      let stayUnits = covidPortfolio / (data.find(d => d.year === 2020 && d.month === 3)?.close || 8598)
      let stayInvested = invested
      for (let i = data.findIndex(d => d.year === 2020 && d.month === 3) + 1; i < totalMonths; i++) { stayUnits += monthlyAmount / data[i].close; stayInvested += monthlyAmount }
      const stayFinal = stayUnits * endData.close
      setStayedValue(stayFinal); setTotalInvested(stayInvested); setFinalValue(covidPortfolio); setTotalUnits(stayUnits)
      setTimeMachineResult({ finalValue: covidPortfolio, totalInvested: stayInvested, didWithdraw: true })
      return
    }

    setPhase('running')
    const step = () => {
      if (currentMonth >= totalMonths) {
        const finalVal = units * data[totalMonths - 1].close
        setPhase('result'); setFinalValue(finalVal); setTotalInvested(invested); setDidWithdraw(false); setTotalUnits(units)
        fmAnimate(counterMotion, finalVal, { duration: 0.6 })
        setTimeMachineResult({ finalValue: finalVal, totalInvested: invested, didWithdraw: false })
        return
      }
      const d = data[currentMonth]; const nav = d.close
      units += monthlyAmount / nav; invested += monthlyAmount; const value = units * nav
      if (value > peak) peak = value

      setCurrentDate(`${getMonthNameFull(d.month)} ${d.year}`); setInvestedSoFar(invested)
      setReturnPct(invested > 0 ? ((value - invested) / invested) * 100 : 0)
      setProgress((currentMonth / totalMonths) * 100); setNiftyPrice(nav)
      fmAnimate(counterMotion, value, { duration: 0.05 })

      if (d.year === 2020 && d.month === 3 && !resumeFromCovid) {
        setCovidPortfolio(value); setPreCrashPeak(peak); setPhase('covid-pause'); return
      }

      const special = SPECIALS.find(s => s.year === d.year && s.month === d.month)
      if (special) { setFlashEvent(special); setTimeout(() => setFlashEvent(null), 2000) }

      const isLast3 = currentMonth >= totalMonths - 3
      currentMonth++
      timerRef.current = setTimeout(step, isLast3 ? 200 : 50)
    }
    step()
  }, [startYear, monthlyAmount, counterMotion, covidPortfolio, investedSoFar, preCrashPeak, setTimeMachineResult])

  const lossAmount = preCrashPeak > 0 ? ((covidPortfolio - preCrashPeak) / preCrashPeak * 100).toFixed(0) : '-38'

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
      <div className="max-w-3xl mx-auto">
        <AnimatePresence mode="wait">

          {/* ── INPUT ──────────────────────────────────────────────────── */}
          {phase === 'input' && (
            <motion.div key="input" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
              {/* Hero */}
              <div className="text-center mb-4">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.1, type: 'spring' }}>
                  <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center" style={{ background: 'rgba(192,241,142,0.08)', border: '2px solid rgba(192,241,142,0.18)' }}>
                    <Clock className="w-8 h-8" style={{ color: 'var(--accent)' }} />
                  </div>
                </motion.div>
                <h1 className="font-display font-semibold text-3xl md:text-5xl text-white mb-4 tracking-tight">
                  The ₹{monthlyAmount.toLocaleString('en-IN')} Time Machine
                </h1>
                <p className="font-sans text-base text-white/40 max-w-lg mx-auto leading-relaxed">
                  Travel through real market history. Experience every crash. Make real-time decisions.
                </p>
              </div>

              {/* Config */}
              <div className="rounded-3xl p-7 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="font-sans text-[11px] text-white/40 uppercase tracking-wider block mb-3">Monthly SIP amount</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[100, 500, 1000, 2000, 5000, 10000].map(v => (
                        <button key={v} onClick={() => setMonthlyAmount(v)}
                          className="py-2.5 rounded-xl font-mono text-sm border transition-[background-color,border-color,color] duration-200"
                          style={{
                            background: monthlyAmount === v ? 'rgba(192,241,142,0.08)' : 'transparent',
                            borderColor: monthlyAmount === v ? 'rgba(192,241,142,0.25)' : 'var(--border)',
                            color: monthlyAmount === v ? 'var(--accent)' : 'rgba(255,255,255,0.4)',
                          }}
                        >₹{v >= 1000 ? `${v / 1000}K` : v}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="font-sans text-[11px] text-white/40 uppercase tracking-wider block mb-3">Start your journey in</label>

                    {/* Crash presets */}
                    <p className="font-sans text-[10px] text-white/25 mb-2">Start during a crash:</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {[
                        { year: 2008, label: '2008 GFC' },
                        { year: 2016, label: '2016 Demo' },
                        { year: 2020, label: '2020 COVID' },
                        { year: 2022, label: '2022 Rates' },
                      ].map(p => {
                        const isActive = startYear === p.year && crashPreset !== null
                        return (
                          <button
                            key={p.year}
                            onClick={() => {
                              setStartYear(p.year)
                              setMonthlyAmount(500)
                              const crash = getCrashByYear(p.year)
                              setCrashPreset(crash)
                            }}
                            className="px-3 py-1.5 rounded-full text-[10px] font-sans font-medium border transition-[background-color,border-color,color] duration-200"
                            style={{
                              background: isActive ? 'rgba(226,75,74,0.08)' : 'transparent',
                              borderColor: isActive ? 'rgba(226,75,74,0.25)' : 'var(--border)',
                              color: isActive ? 'var(--danger)' : 'rgba(255,255,255,0.35)',
                            }}
                          >
                            {p.label}
                          </button>
                        )
                      })}
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {[2010, 2012, 2014, 2015, 2017, 2019].map(y => (
                        <button key={y} onClick={() => { setStartYear(y); setCrashPreset(null) }}
                          className="py-2.5 rounded-xl font-mono text-sm border transition-[background-color,border-color,color] duration-200"
                          style={{
                            background: startYear === y ? 'rgba(192,241,142,0.08)' : 'transparent',
                            borderColor: startYear === y ? 'rgba(192,241,142,0.25)' : 'var(--border)',
                            color: startYear === y ? 'var(--accent)' : 'rgba(255,255,255,0.4)',
                          }}
                        >{y}</button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Crash preset banner */}
                <AnimatePresence>
                  {crashPreset && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-2xl p-4 border-2 mt-4" style={{ background: 'rgba(226,75,74,0.04)', borderColor: 'rgba(226,75,74,0.2)' }}>
                        <p className="font-sans text-sm text-white/60 leading-relaxed">
                          You're starting your SIP right as <span style={{ color: 'var(--danger)' }} className="font-medium">{crashPreset.name}</span> begins.
                          This is the worst possible timing. <span style={{ color: 'var(--teal)' }}>Watch what happens.</span>
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Preview */}
                <div className="mt-6 rounded-2xl p-4 border" style={{ background: 'rgba(192,241,142,0.03)', borderColor: 'rgba(192,241,142,0.08)' }}>
                  <p className="font-sans text-xs text-white/40">
                    You'll invest <span style={{ color: 'var(--accent)' }}>₹{monthlyAmount.toLocaleString('en-IN')}/month</span> starting <span style={{ color: 'var(--accent)' }}>{startYear}</span> through the COVID crash and beyond. Total:  <span className="text-white">{formatINR(monthlyAmount * getNiftyFromYear(startYear).length)}</span> invested over <span className="text-white">{Math.round(getNiftyFromYear(startYear).length / 12)}</span> years.
                  </p>
                </div>
              </div>

              <button onClick={() => runSimulation()}
                className="w-full py-4 rounded-full font-sans font-bold text-sm text-[#0a1a00] box-glow active:scale-[0.97] transition-transform duration-200 flex items-center justify-center gap-3"
                style={{ background: 'var(--accent)' }}
              >
                <Play className="w-4 h-4" /> Start the Time Machine
              </button>
            </motion.div>
          )}

          {/* ── RUNNING ───────────────────────────────────────────────── */}
          {phase === 'running' && (
            <motion.div key="running" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-8 space-y-6">
              {/* Date */}
              <motion.p animate={{ opacity: [0.5, 1] }} transition={{ duration: 0.3 }}
                className="font-mono text-lg text-white/40">{currentDate}</motion.p>

              {/* Big counter */}
              <div className="relative">
                <motion.p className="font-mono font-bold text-5xl md:text-7xl leading-none" style={{ color: returnPct >= 0 ? 'var(--accent)' : 'var(--danger)' }}>
                  {counterDisplay}
                </motion.p>
                {/* Glow effect behind counter */}
                <div className="absolute inset-0 blur-3xl opacity-20 pointer-events-none" style={{ background: returnPct >= 0 ? 'var(--accent)' : 'var(--danger)' }} />
              </div>

              {/* Live stats */}
              <div className="flex justify-center gap-8">
                <div className="rounded-2xl px-5 py-3 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <p className="font-sans text-[9px] text-white/25 uppercase mb-1">Invested</p>
                  <p className="font-mono text-sm text-white/60">{formatINR(investedSoFar)}</p>
                </div>
                <div className="rounded-2xl px-5 py-3 border" style={{ background: 'var(--surface)', borderColor: returnPct >= 0 ? 'rgba(29,158,117,0.15)' : 'rgba(226,75,74,0.15)' }}>
                  <p className="font-sans text-[9px] text-white/25 uppercase mb-1">Return</p>
                  <div className="flex items-center gap-1">
                    {returnPct >= 0 ? <TrendingUp className="w-3 h-3" style={{ color: 'var(--teal)' }} /> : <TrendingDown className="w-3 h-3" style={{ color: 'var(--danger)' }} />}
                    <p className="font-mono text-sm" style={{ color: returnPct >= 0 ? 'var(--teal)' : 'var(--danger)' }}>
                      {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(1)}%
                    </p>
                  </div>
                </div>
                <div className="rounded-2xl px-5 py-3 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <p className="font-sans text-[9px] text-white/25 uppercase mb-1">Nifty 50</p>
                  <p className="font-mono text-sm text-white/60">{niftyPrice.toLocaleString('en-IN')}</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full max-w-lg mx-auto">
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <motion.div className="h-full rounded-full" style={{ background: returnPct >= 0 ? 'var(--accent)' : 'var(--danger)', width: `${progress}%` }}
                    transition={{ duration: 0.05 }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="font-mono text-[9px] text-white/15">{startYear}</span>
                  <span className="font-mono text-[9px] text-white/15">2024</span>
                </div>
              </div>

              {/* Flash events */}
              <AnimatePresence>
                {flashEvent && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="rounded-2xl p-5 border mx-auto max-w-sm"
                    style={{ background: 'var(--surface)', borderColor: flashEvent.color, borderWidth: '2px' }}
                  >
                    <p className="text-2xl mb-1">{flashEvent.emoji}</p>
                    <p className="font-sans text-sm font-medium" style={{ color: flashEvent.color }}>{flashEvent.label}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* ── COVID PAUSE ───────────────────────────────────────────── */}
          {phase === 'covid-pause' && (
            <motion.div key="covid" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center py-8 space-y-8">
              {/* Danger border glow */}
              <motion.div
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="relative rounded-3xl p-8 border-2 mx-auto max-w-lg overflow-hidden"
                style={{ background: 'var(--surface)', borderColor: 'var(--danger)' }}
              >
                {/* Red glow */}
                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 30%, rgba(226,75,74,0.4), transparent 70%)' }} />

                <div className="relative">
                  <p className="text-4xl mb-4">🦠</p>
                  <h2 className="font-display font-bold text-3xl text-white mb-2">March 2020</h2>
                  <p className="font-sans text-sm text-white/40 mb-6">COVID-19 crashed global markets in weeks.</p>

                  <motion.p
                    initial={{ scale: 0.8 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                    className="font-mono font-bold text-4xl mb-2" style={{ color: 'var(--danger)' }}
                  >
                    {formatINR(covidPortfolio)}
                  </motion.p>
                  <p className="font-sans text-sm text-white/40 mb-8">
                    Drop from peak: <span className="font-mono font-bold" style={{ color: 'var(--danger)' }}>{lossAmount}%</span>
                  </p>

                  <p className="font-display font-medium text-lg text-white mb-6">What do you do?</p>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button onClick={() => runSimulation(false, true)}
                      className="flex-1 py-4 rounded-2xl font-sans font-bold text-sm border-2 active:scale-[0.97] transition-[transform,background-color] duration-200 hover:bg-[rgba(226,75,74,0.08)]"
                      style={{ borderColor: 'var(--danger)', color: 'var(--danger)', background: 'transparent' }}
                    >
                      <TrendingDown className="w-4 h-4 inline mr-2" />
                      Withdraw everything
                    </button>
                    <button onClick={() => runSimulation(true)}
                      className="flex-1 py-4 rounded-2xl font-sans font-bold text-sm text-[#0a1a00] active:scale-[0.97] transition-transform duration-200"
                      style={{ background: 'var(--accent)' }}
                    >
                      <TrendingUp className="w-4 h-4 inline mr-2" />
                      Stay invested
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}

          {/* ── RESULT ────────────────────────────────────────────────── */}
          {phase === 'result' && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
              {didWithdraw ? (
                <div className="rounded-3xl p-8 border overflow-hidden relative" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                  <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ background: 'radial-gradient(circle at 30% 50%, rgba(226,75,74,0.5), transparent 60%), radial-gradient(circle at 70% 50%, rgba(29,158,117,0.5), transparent 60%)' }} />
                  <div className="relative">
                    <h2 className="font-display font-semibold text-xl text-white mb-2">The cost of panic.</h2>
                    <p className="font-sans text-sm text-white/40 mb-6">Here's what would have happened if you stayed.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                        className="rounded-2xl p-6 border text-center" style={{ borderColor: 'var(--danger)', background: 'rgba(226,75,74,0.04)' }}>
                        <TrendingDown className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--danger)' }} />
                        <p className="text-[9px] font-sans font-bold tracking-wider text-white/25 uppercase mb-2">You withdrew</p>
                        <p className="font-display font-bold text-2xl" style={{ color: 'var(--danger)' }}>{formatINR(withdrawnValue)}</p>
                      </motion.div>
                      <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.4 }}
                        className="rounded-2xl p-6 border text-center" style={{ borderColor: 'var(--teal)', background: 'rgba(29,158,117,0.04)' }}>
                        <TrendingUp className="w-6 h-6 mx-auto mb-2" style={{ color: 'var(--teal)' }} />
                        <p className="text-[9px] font-sans font-bold tracking-wider text-white/25 uppercase mb-2">If you stayed</p>
                        <p className="font-display font-bold text-2xl" style={{ color: 'var(--teal)' }}>{formatINR(stayedValue)}</p>
                      </motion.div>
                    </div>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                      className="rounded-2xl p-4 border text-center" style={{ borderColor: 'var(--accent)', background: 'rgba(192,241,142,0.04)' }}>
                      <p className="font-display font-bold text-xl" style={{ color: 'var(--accent)' }}>
                        Staying = {formatINR(stayedValue - withdrawnValue)} more
                      </p>
                    </motion.div>
                  </div>
                </div>
              ) : (
                <div className="rounded-3xl p-8 border overflow-hidden relative" style={{ background: 'var(--surface)', borderColor: 'var(--teal)', borderWidth: '2px' }}>
                  <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 30%, rgba(29,158,117,0.5), transparent 60%)' }} />
                  <div className="relative text-center">
                    <p className="text-4xl mb-4">🏆</p>
                    <h2 className="font-display font-bold text-2xl text-white mb-2">{userName ? `${userName}, you survived every crash.` : 'You survived every crash.'}</h2>
                    <p className="font-sans text-sm text-white/40 mb-6">You invested {formatINR(totalInvested)} over {Math.round(getNiftyFromYear(startYear).length / 12)} years.</p>
                    <motion.p
                      initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                      className="font-display font-bold text-4xl md:text-6xl mb-6" style={{ color: 'var(--teal)' }}
                    >
                      {formatINR(finalValue)}
                    </motion.p>
                    <div className="flex justify-center gap-8 mb-6">
                      <div><p className="text-[9px] font-sans text-white/25 uppercase mb-1">Profit</p><p className="font-display font-semibold text-lg" style={{ color: 'var(--accent)' }}>{formatINR(finalValue - totalInvested)}</p></div>
                      <div><p className="text-[9px] font-sans text-white/25 uppercase mb-1">Units owned</p><p className="font-display font-semibold text-lg text-white">{totalUnits.toFixed(1)}</p></div>
                      <div><p className="text-[9px] font-sans text-white/25 uppercase mb-1">Return</p><p className="font-display font-semibold text-lg" style={{ color: 'var(--teal)' }}>+{((finalValue / totalInvested - 1) * 100).toFixed(0)}%</p></div>
                    </div>
                    <p className="font-sans text-sm text-white/40 italic">Patience is the only strategy that always works.</p>
                  </div>
                </div>
              )}

              {/* Cinematic crash preset end card */}
              {crashPreset && finalValue > totalInvested && !didWithdraw && (
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8, duration: 0.8, ease: 'easeOut' }}
                  className="rounded-3xl p-8 md:p-12 border-2 text-center relative overflow-hidden"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'rgba(29,158,117,0.3)',
                  }}
                >
                  {/* Teal glow */}
                  <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at center, rgba(29,158,117,0.08), transparent 70%)' }} />

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.6 }}
                    className="font-sans text-sm text-white/40 mb-4 tracking-wide uppercase"
                  >
                    You started at the worst possible moment.
                  </motion.p>

                  <motion.p
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1.8, duration: 0.6, type: 'spring' }}
                    className="font-display font-bold text-3xl md:text-5xl mb-4"
                    style={{ color: 'var(--teal)' }}
                  >
                    {formatINR(finalValue)}
                  </motion.p>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.4, duration: 0.6 }}
                    className="font-display font-semibold text-xl text-white"
                  >
                    And you still came out ahead.
                  </motion.p>

                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 3.0, duration: 0.6 }}
                    className="font-sans text-xs text-white/30 mt-4"
                  >
                    Started during {crashPreset.name} ({crashPreset.niftyPeakToDrop}% crash) | Invested {formatINR(totalInvested)} | Profit: {formatINR(finalValue - totalInvested)}
                  </motion.p>
                </motion.div>
              )}

              {/* ── Instinct Debrief (Arjun) ────────────────────────────── */}
              <InstinctDebrief startYear={startYear} monthlyAmount={monthlyAmount} finalValue={finalValue} totalInvested={totalInvested} didWithdraw={didWithdraw} withdrawMonth={null} />

              <div className="flex flex-col sm:flex-row gap-3">
                <button onClick={() => setDashboardSection('my-card')}
                  className="flex-1 py-3.5 rounded-full font-sans font-bold text-sm text-[#0a1a00] active:scale-[0.97] transition-transform duration-200 flex items-center justify-center gap-2"
                  style={{ background: 'var(--accent)' }}
                >
                  Add to my Fear Fingerprint <ArrowRight className="w-4 h-4" />
                </button>
                <button onClick={() => { cleanup(); setPhase('input') }}
                  className="flex-1 py-3.5 rounded-full font-sans font-bold text-sm border active:scale-[0.97] transition-transform duration-200 flex items-center justify-center gap-2"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Run again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ── Instinct Debrief sub-component ─────────────────────────────────────────
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
    <div className="flex gap-4 mt-6">
      <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(192,241,142,0.08)', border: '1px solid rgba(192,241,142,0.18)' }}>
        <Zap className="w-4 h-4" style={{ color: 'var(--accent)' }} />
      </div>
      <div className="rounded-3xl p-6 border flex-1" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <p className="font-sans text-[10px] text-white/25 uppercase tracking-wider mb-3">Arjun’s instinct debrief</p>
        {loading ? (
          <div className="flex items-center gap-2">
            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
            <p className="font-sans text-sm text-white/30">Arjun is thinking...</p>
          </div>
        ) : (
          <p className="font-sans text-sm text-white/60 leading-relaxed">{debrief}</p>
        )}
      </div>
    </div>
  )
}
