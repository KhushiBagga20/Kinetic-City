import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Chart, registerables } from 'chart.js'
import { formatINR } from '../../../lib/formatINR'
import { Calculator, TrendingDown, ArrowRight, Zap } from 'lucide-react'
import { generateKinuChat } from '../../../lib/kinuAI'
import { useAppStore } from '../../../store/useAppStore'

Chart.register(...registerables)

/* ── Financial formulas ──────────────────────────────────────────────────── */

const NIFTY_CAGR = 0.14

/** SIP FV = P × [((1+r)^n − 1) / r] × (1+r) */
function sipFV(monthly: number, annualRate: number, years: number): number {
  const r = annualRate / 12
  const n = years * 12
  if (r === 0) return monthly * n
  return monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r)
}

/** Step-up SIP: increase monthly by stepUp% each year */
function stepUpSipFV(monthly: number, annualRate: number, years: number, stepUpPct: number): number {
  let total = 0
  let currentMonthly = monthly
  const r = annualRate / 12
  for (let y = 0; y < years; y++) {
    // Each year's SIP runs for 12 months, then steps up
    for (let m = 0; m < 12; m++) {
      total += currentMonthly
      total *= (1 + r)
    }
    currentMonthly *= (1 + stepUpPct / 100)
  }
  return total
}

/** SWP: starting corpus, withdraw monthly, earn annualRate. Returns months until depletion (or Infinity). */
function swpMonths(corpus: number, monthlyWithdraw: number, annualRate: number): number {
  const r = annualRate / 12
  let balance = corpus
  let months = 0
  const MAX = 600 // 50 years
  while (balance > 0 && months < MAX) {
    balance = balance * (1 + r) - monthlyWithdraw
    months++
  }
  return balance > 0 ? Infinity : months
}

/** SWP breakeven rate: the annual return at which corpus lasts forever */
function swpBreakevenRate(monthlyWithdraw: number, corpus: number): number {
  // If monthlyWithdraw/corpus > monthly rate => depleting. Breakeven: annual = (monthly/corpus)*12
  return (monthlyWithdraw / corpus) * 12
}

/* ── Tabs ─────────────────────────────────────────────────────────────────── */

type Tab = 'sip' | 'swp'

export default function CalculatorsPage() {
  const [tab, setTab] = useState<Tab>('sip')

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto"
    >
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
        <h1 className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight mb-3">Calculators</h1>
        <p className="font-sans text-sm text-white/40 max-w-lg leading-relaxed">
          Plan your wealth building and withdrawal strategy with real math.
        </p>
      </motion.div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-8">
        {(['sip', 'swp'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-5 py-2.5 rounded-full font-sans font-bold text-sm transition-all duration-200"
            style={{
              background: tab === t ? 'var(--accent)' : 'rgba(255,255,255,0.03)',
              color: tab === t ? '#0a1a00' : 'rgba(255,255,255,0.4)',
              border: `1px solid ${tab === t ? 'var(--accent)' : 'var(--border)'}`,
            }}
          >
            {t === 'sip' ? '📈 SIP Calculator' : '📉 SWP Planner'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {tab === 'sip' ? <SIPTab key="sip" /> : <SWPTab key="swp" />}
      </AnimatePresence>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   SIP TAB
   ══════════════════════════════════════════════════════════════════════════════ */

function SIPTab() {
  const fearType = useAppStore(s => s.fearType) ?? 'loss'
  const [monthly, setMonthly] = useState(5000)
  const [years, setYears] = useState(10)
  const [cagr, setCagr] = useState(14)
  const [stepUp, setStepUp] = useState(0)
  const [stepUpEnabled, setStepUpEnabled] = useState(false)
  const [kinuInsight, setKinuInsight] = useState<string | null>(null)
  const [kinuLoading, setKinuLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  const totalInvested = useMemo(() => {
    if (!stepUpEnabled || stepUp === 0) return monthly * years * 12
    let total = 0, cur = monthly
    for (let y = 0; y < years; y++) { total += cur * 12; cur *= (1 + stepUp / 100) }
    return total
  }, [monthly, years, stepUp, stepUpEnabled])

  const finalValue = useMemo(() => {
    if (stepUpEnabled && stepUp > 0) return stepUpSipFV(monthly, cagr / 100, years, stepUp)
    return sipFV(monthly, cagr / 100, years)
  }, [monthly, years, cagr, stepUp, stepUpEnabled])

  const wealth = finalValue - totalInvested
  const multiplier = totalInvested > 0 ? (finalValue / totalInvested).toFixed(1) : '0'

  const renderChart = useCallback(() => {
    if (!chartRef.current) return
    if (chartInstance.current) chartInstance.current.destroy()

    const labels: string[] = []
    const values: number[] = []
    const invested: number[] = []
    for (let y = 0; y <= years; y++) {
      labels.push(y === 0 ? 'Start' : `${y}Y`)
      values.push(stepUpEnabled && stepUp > 0 ? stepUpSipFV(monthly, cagr / 100, y, stepUp) : sipFV(monthly, cagr / 100, y))
      let inv = 0, cur = monthly
      for (let yr = 0; yr < y; yr++) { inv += cur * 12; cur *= (1 + (stepUpEnabled ? stepUp : 0) / 100) }
      invested.push(inv)
    }

    chartInstance.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { data: values, label: 'Portfolio Value', borderColor: '#378ADD', borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, fill: false, tension: 0.4 },
          { data: invested, label: 'Total Invested', borderColor: 'rgba(192,241,142,0.5)', borderWidth: 1.5, borderDash: [6, 4], pointRadius: 0, pointHoverRadius: 4, fill: false, tension: 0 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600, easing: 'easeOutCubic' },
        plugins: {
          legend: { display: true, position: 'top', labels: { color: 'rgba(255,255,255,0.4)', font: { size: 10, family: 'Inter, sans-serif' }, padding: 16, usePointStyle: true, pointStyleWidth: 8 } },
          tooltip: {
            backgroundColor: 'rgba(10,10,15,0.95)', borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1,
            callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${formatINR(ctx.parsed.y)}` },
          },
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: 'rgba(255,255,255,0.25)', font: { size: 10 } } },
          y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: 'rgba(255,255,255,0.25)', font: { size: 10 }, callback: (v: any) => formatINR(v) } },
        },
      },
    })
  }, [monthly, years, cagr, stepUp, stepUpEnabled])

  useEffect(() => { renderChart() }, [renderChart])
  useEffect(() => { return () => { chartInstance.current?.destroy() } }, [])

  // Debounced KINU AI insight
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setKinuLoading(true)
      try {
        const corpus = stepUpEnabled
          ? stepUpSipFV(monthly, 0.14, years, stepUp)
          : sipFV(monthly, 0.14, years)
        const invested = stepUpEnabled
          ? (() => { let t = 0; let m = monthly; for(let y=0;y<years;y++){t+=m*12;m*=(1+stepUp/100)} return t })()
          : monthly * years * 12
        const data = await generateKinuChat({
          message: `SIP of ₹${monthly.toLocaleString('en-IN')}/month for ${years} years${stepUpEnabled ? ` with ${stepUp}% annual step-up` : ''}. Corpus: ₹${Math.round(corpus).toLocaleString('en-IN')}. Invested: ₹${Math.round(invested).toLocaleString('en-IN')}.`,
          fear_type: fearType,
          context: 'sip_calculator',
          conversation_history: [],
        })
        setKinuInsight(data.reply)
      } catch {
        setKinuInsight(null)
      } finally {
        setKinuLoading(false)
      }
    }, 1500)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [monthly, years, stepUp, stepUpEnabled, fearType])

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      {/* Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <SliderCard label="Monthly SIP" value={`₹${monthly.toLocaleString('en-IN')}`} min={100} max={100000} step={100} current={monthly} onChange={setMonthly} minLabel="₹100" maxLabel="₹1,00,000" />
        <SliderCard label="Years" value={`${years} years`} min={1} max={40} step={1} current={years} onChange={setYears} minLabel="1" maxLabel="40" />
        <SliderCard label="Expected CAGR" value={`${cagr}%`} min={6} max={25} step={0.5} current={cagr} onChange={setCagr} minLabel="6%" maxLabel="25%" />
        <div className="rounded-3xl p-6 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="font-sans text-xs text-white/40 uppercase tracking-wider">Annual Step-Up</p>
            <div className="flex items-center gap-3">
              <p className="font-mono text-lg text-white font-medium">{stepUpEnabled ? `${stepUp}%` : 'Off'}</p>
              <button onClick={() => setStepUpEnabled(!stepUpEnabled)}
                className="w-10 h-5 rounded-full relative transition-colors duration-200"
                style={{ background: stepUpEnabled ? 'var(--accent)' : 'rgba(255,255,255,0.1)' }}>
                <div className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200"
                  style={{ left: stepUpEnabled ? 22 : 2 }} />
              </button>
            </div>
          </div>
          {stepUpEnabled && (
            <input type="range" min={5} max={25} step={1} value={stepUp}
              onChange={e => setStepUp(Number(e.target.value))}
              className="w-full accent-[var(--accent)] cursor-pointer" />
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Final Value" value={formatINR(finalValue)} color="#378ADD" />
        <StatCard label="Total Invested" value={formatINR(totalInvested)} color="var(--accent)" />
        <StatCard label="Wealth Created" value={formatINR(wealth)} color="#1D9E75" />
        <StatCard label="Multiplier" value={`${multiplier}×`} color="#EF9F27" />
      </div>

      {/* Chart */}
      <div className="rounded-3xl p-6 border mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div style={{ height: 280 }}><canvas ref={chartRef} /></div>
      </div>

      {/* KINU insight */}
      <div className="rounded-3xl p-5 border mb-6" style={{ background: 'rgba(192,241,142,0.03)', borderColor: 'rgba(192,241,142,0.12)' }}>
        <div className="flex items-start gap-3">
          <Zap className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
          {kinuLoading ? (
            <div className="flex-1 space-y-2 py-0.5">
              <div className="h-3 w-full rounded-md animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <div className="h-2.5 w-3/4 rounded-md animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
            </div>
          ) : (
            <p className="font-sans text-sm text-white/50 leading-relaxed">
              {kinuInsight
                ?? (stepUpEnabled && stepUp > 0
                  ? `With a ${stepUp}% annual step-up, your SIP ends at ₹${Math.round(monthly * Math.pow(1 + stepUp / 100, years - 1)).toLocaleString('en-IN')}/month by year ${years}. That's the power of incremental discipline.`
                  : `₹${monthly.toLocaleString('en-IN')}/month for ${years} years. Total invested: ${formatINR(totalInvested)}. Your money worked ${multiplier}× harder than a savings account.`
                )}
            </p>
          )}
        </div>
      </div>

      <p className="font-sans text-[10px] text-white/20 text-center">
        Past performance does not guarantee future results. This is an educational tool, not financial advice.
      </p>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   SWP TAB
   ══════════════════════════════════════════════════════════════════════════════ */

function SWPTab() {
  const fearType = useAppStore(s => s.fearType) ?? 'loss'
  const [corpus, setCorpus] = useState(5000000)
  const [monthlyWithdraw, setMonthlyWithdraw] = useState(25000)
  const [returnRate, setReturnRate] = useState(10)
  const [kinuInsight, setKinuInsight] = useState<string | null>(null)
  const [kinuLoading, setKinuLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  const months = useMemo(() => swpMonths(corpus, monthlyWithdraw, returnRate / 100), [corpus, monthlyWithdraw, returnRate])
  const isInfinite = months === Infinity || months >= 600
  const yearsLast = isInfinite ? '∞' : `${(months / 12).toFixed(1)}`
  const breakeven = swpBreakevenRate(monthlyWithdraw, corpus) * 100

  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  const renderChart = useCallback(() => {
    if (!chartRef.current) return
    if (chartInstance.current) chartInstance.current.destroy()

    const r = returnRate / 100 / 12
    const maxMonths = isInfinite ? 360 : Math.min(months + 12, 600)
    const labels: string[] = []
    const balances: number[] = []
    let bal = corpus

    for (let m = 0; m <= maxMonths; m += 3) {
      labels.push(m === 0 ? 'Start' : `${(m / 12).toFixed(0)}Y`)
      balances.push(Math.max(0, bal))
      // Advance 3 months
      for (let s = 0; s < 3 && m + s < maxMonths; s++) {
        bal = bal * (1 + r) - monthlyWithdraw
      }
    }

    chartInstance.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            data: balances, label: 'Remaining Corpus',
            borderColor: isInfinite ? '#1D9E75' : '#E24B4A',
            borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, fill: true,
            backgroundColor: isInfinite ? 'rgba(29,158,117,0.06)' : 'rgba(226,75,74,0.06)',
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600 },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(10,10,15,0.95)',
            callbacks: { label: (ctx: any) => `Balance: ${formatINR(ctx.parsed.y)}` },
          },
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: 'rgba(255,255,255,0.25)', font: { size: 10 }, maxTicksLimit: 10 } },
          y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: 'rgba(255,255,255,0.25)', font: { size: 10 }, callback: (v: any) => formatINR(v) } },
        },
      },
    })
  }, [corpus, monthlyWithdraw, returnRate, months, isInfinite])

  useEffect(() => { renderChart() }, [renderChart])
  useEffect(() => { return () => { chartInstance.current?.destroy() } }, [])

  // Debounced KINU AI insight for SWP
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      setKinuLoading(true)
      try {
        const durText = isInfinite ? 'forever' : `${yearsLast} years`
        const data = await generateKinuChat({
          message: `SWP plan: ₹${corpus.toLocaleString('en-IN')} corpus, withdrawing ₹${monthlyWithdraw.toLocaleString('en-IN')}/month at ${returnRate}% return. Lasts: ${durText}. Breakeven rate: ${breakeven.toFixed(1)}%.`,
          fear_type: fearType,
          context: 'swp_calculator',
          conversation_history: [],
        })
        setKinuInsight(data.reply)
      } catch {
        setKinuInsight(null)
      } finally {
        setKinuLoading(false)
      }
    }, 1500)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [corpus, monthlyWithdraw, returnRate, fearType])

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}>
      {/* Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <SliderCard label="Starting Corpus" value={formatINR(corpus)} min={500000} max={50000000} step={100000} current={corpus} onChange={setCorpus} minLabel="₹5L" maxLabel="₹5Cr" />
        <SliderCard label="Monthly Withdrawal" value={`₹${monthlyWithdraw.toLocaleString('en-IN')}`} min={5000} max={500000} step={1000} current={monthlyWithdraw} onChange={setMonthlyWithdraw} minLabel="₹5K" maxLabel="₹5L" />
        <SliderCard label="Expected Return" value={`${returnRate}%`} min={4} max={18} step={0.5} current={returnRate} onChange={setReturnRate} minLabel="4%" maxLabel="18%" />
      </div>

      {/* Primary result */}
      <div className="rounded-3xl p-7 border mb-6" style={{
        background: isInfinite ? 'rgba(29,158,117,0.04)' : 'rgba(226,75,74,0.04)',
        borderColor: isInfinite ? 'rgba(29,158,117,0.2)' : 'rgba(226,75,74,0.2)',
      }}>
        <p className="font-sans text-xs text-white/40 uppercase tracking-wider mb-2">Your corpus lasts</p>
        <p className="font-display font-bold text-4xl md:text-5xl mb-2" style={{ color: isInfinite ? '#1D9E75' : '#E24B4A' }}>
          {isInfinite ? '♾️ Forever' : `${yearsLast} years`}
        </p>
        <p className="font-sans text-sm text-white/50 leading-relaxed">
          {isInfinite
            ? `At ${returnRate}% annual return, your corpus generates more than ₹${monthlyWithdraw.toLocaleString('en-IN')}/month in returns. You never touch the principal.`
            : `At ${returnRate}% return, withdrawing ₹${monthlyWithdraw.toLocaleString('en-IN')}/month depletes your corpus in ${yearsLast} years. Breakeven rate: ${breakeven.toFixed(1)}%.`
          }
        </p>
      </div>

      {/* Chart */}
      <div className="rounded-3xl p-6 border mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div style={{ height: 250 }}><canvas ref={chartRef} /></div>
      </div>

      {/* Breakeven card */}
      <div className="rounded-3xl p-5 border mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3 mb-3">
          <TrendingDown className="w-4 h-4" style={{ color: '#EF9F27' }} />
          <p className="font-sans text-sm font-medium text-white/70">Breakeven Return Rate</p>
        </div>
        <p className="font-display font-bold text-2xl text-white mb-1">{breakeven.toFixed(1)}%</p>
        <p className="font-sans text-xs text-white/40">
          Any annual return above {breakeven.toFixed(1)}% means your corpus lasts forever. Below it, you're drawing down principal.
        </p>
      </div>

      {/* KINU insight for SWP */}
      <div className="rounded-3xl p-5 border mb-6" style={{ background: 'rgba(192,241,142,0.03)', borderColor: 'rgba(192,241,142,0.12)' }}>
        <div className="flex items-start gap-3">
          <Zap className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
          {kinuLoading ? (
            <div className="flex-1 space-y-2 py-0.5">
              <div className="h-3 w-full rounded-md animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
              <div className="h-2.5 w-3/4 rounded-md animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
            </div>
          ) : (
            <p className="font-sans text-sm text-white/50 leading-relaxed">
              {kinuInsight
                ?? (isInfinite
                  ? `Your withdrawal rate is sustainable — your corpus generates enough returns to fund ₹${monthlyWithdraw.toLocaleString('en-IN')}/month indefinitely. This is the dream.`
                  : `At ${returnRate}% return, your corpus runs out in ${yearsLast} years. Consider either reducing monthly withdrawal or targeting a higher return.`
                )}
            </p>
          )}
        </div>
      </div>

      <p className="font-sans text-[10px] text-white/20 text-center">
        This is an educational projection. Actual returns vary. Not financial advice.
      </p>
    </motion.div>
  )
}

/* ── Shared UI components ────────────────────────────────────────────────── */

function SliderCard({ label, value, min, max, step, current, onChange, minLabel, maxLabel }: {
  label: string; value: string; min: number; max: number; step: number; current: number; onChange: (v: number) => void; minLabel: string; maxLabel: string
}) {
  return (
    <div className="rounded-3xl p-6 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className="flex items-center justify-between mb-4">
        <p className="font-sans text-xs text-white/40 uppercase tracking-wider">{label}</p>
        <p className="font-mono text-lg text-white font-medium">{value}</p>
      </div>
      <input type="range" min={min} max={max} step={step} value={current}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-[var(--accent)] cursor-pointer" />
      <div className="flex justify-between mt-1.5">
        <span className="font-sans text-[10px] text-white/20">{minLabel}</span>
        <span className="font-sans text-[10px] text-white/20">{maxLabel}</span>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-2xl p-5 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <p className="font-sans text-[10px] text-white/30 uppercase tracking-wider mb-2">{label}</p>
      <p className="font-display font-bold text-xl" style={{ color }}>{value}</p>
    </div>
  )
}
