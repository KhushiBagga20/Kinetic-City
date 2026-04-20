import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { Chart, registerables } from 'chart.js'
import { formatINR } from '../../../lib/formatINR'
import { TrendingUp, Landmark, PiggyBank, ArrowRight, Info } from 'lucide-react'
import { generateKinuChat } from '../../../lib/kinuAI'
import { useAppStore } from '../../../store/useAppStore'

Chart.register(...registerables)

/* ── Financial formulas (exact spec) ─────────────────────────────────────── */

const NIFTY_CAGR = 0.14
const FD_NOMINAL = 0.07
const INFLATION = 0.06

/** SIP Future Value = P × [((1+r)^n − 1) / r] × (1+r) */
function sipFV(monthly: number, annualRate: number, years: number): number {
  const r = annualRate / 12
  const n = years * 12
  if (r === 0) return monthly * n
  return monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r)
}

/** Lumpsum FV = P × (1+r)^n */
function lumpsumFV(principal: number, annualRate: number, years: number): number {
  return principal * Math.pow(1 + annualRate, years)
}

/* ── Component ───────────────────────────────────────────────────────────── */

export default function ComparePage() {
  const fearType = useAppStore(s => s.fearType) ?? 'loss'
  const [monthly, setMonthly] = useState(5000)
  const [years, setYears] = useState(10)
  const [verdict, setVerdict] = useState<string | null>(null)
  const [verdictLoading, setVerdictLoading] = useState(false)
  const verdictDebounceRef = useRef<ReturnType<typeof setTimeout>>(null)

  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  /* ── Computed values ──────────────────────────────────────────────────── */
  const totalInvested = monthly * years * 12

  const niftySIP = useMemo(() => sipFV(monthly, NIFTY_CAGR, years), [monthly, years])
  const fdNominal = useMemo(() => sipFV(monthly, FD_NOMINAL, years), [monthly, years])
  const fdReal = useMemo(() => sipFV(monthly, FD_NOMINAL - INFLATION, years), [monthly, years])
  const lumpsumNifty = useMemo(() => lumpsumFV(totalInvested, NIFTY_CAGR, years), [totalInvested, years])

  /* ── Dynamic insight text ─────────────────────────────────────────────── */
  const insightText = useMemo(() => {
    const diff = niftySIP - fdNominal
    const multiplier = (niftySIP / totalInvested).toFixed(1)
    if (years <= 3) return `Short-term: equity is volatile. An FD may be safer for goals under 3 years. But even here, your SIP would have grown ${multiplier}× your investment.`
    if (years <= 7) return `Over ${years} years, your Nifty SIP beats FD by ${formatINR(diff)}. That's real compounding starting to kick in. Your money grew ${multiplier}× what you put in.`
    return `Over ${years} years, Nifty SIP creates ${formatINR(diff)} more than FD. Your ₹${monthly.toLocaleString('en-IN')}/month became ${multiplier}× what you invested. The FD? After inflation, it barely grew.`
  }, [niftySIP, fdNominal, totalInvested, monthly, years])

  /* ── Chart rendering ──────────────────────────────────────────────────── */
  const renderChart = useCallback(() => {
    if (!chartRef.current) return
    if (chartInstance.current) chartInstance.current.destroy()

    const labels: string[] = []
    const niftyData: number[] = []
    const fdNomData: number[] = []
    const fdRealData: number[] = []
    const investedData: number[] = []

    for (let y = 0; y <= years; y++) {
      labels.push(y === 0 ? 'Start' : `${y}Y`)
      niftyData.push(sipFV(monthly, NIFTY_CAGR, y))
      fdNomData.push(sipFV(monthly, FD_NOMINAL, y))
      fdRealData.push(sipFV(monthly, FD_NOMINAL - INFLATION, y))
      investedData.push(monthly * y * 12)
    }

    chartInstance.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { data: niftyData, label: 'Nifty SIP (14% CAGR)', borderColor: '#378ADD', borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, fill: false, tension: 0.4 },
          { data: fdNomData, label: 'FD Nominal (7%)', borderColor: '#EF9F27', borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, fill: false, tension: 0.4 },
          { data: fdRealData, label: 'FD Real (after inflation)', borderColor: '#E24B4A', borderWidth: 2, borderDash: [4, 3], pointRadius: 0, pointHoverRadius: 4, fill: false, tension: 0.4 },
          { data: investedData, label: 'Total Invested', borderColor: 'rgba(192,241,142,0.5)', borderWidth: 1.5, borderDash: [6, 4], pointRadius: 0, pointHoverRadius: 4, fill: false, tension: 0 },
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
            titleFont: { size: 11, family: 'Inter, sans-serif' }, bodyFont: { size: 11, family: 'Inter, sans-serif' },
            titleColor: 'rgba(255,255,255,0.5)', bodyColor: 'rgba(255,255,255,0.7)',
            callbacks: { label: (ctx: any) => `${ctx.dataset.label}: ${formatINR(ctx.parsed.y)}` },
          },
        },
        scales: {
          x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: 'rgba(255,255,255,0.25)', font: { size: 10 } } },
          y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: 'rgba(255,255,255,0.25)', font: { size: 10 }, callback: (v: any) => formatINR(v) } },
        },
      },
    })
  }, [monthly, years])

  useEffect(() => { renderChart() }, [renderChart])
  useEffect(() => { return () => { chartInstance.current?.destroy() } }, [])

  // Debounced KINU verdict
  const niftySIPReal = useMemo(() => sipFV(monthly, NIFTY_CAGR - INFLATION, years), [monthly, years])
  
  useEffect(() => {
    if (verdictDebounceRef.current) clearTimeout(verdictDebounceRef.current)
    verdictDebounceRef.current = setTimeout(async () => {
      setVerdictLoading(true)
      try {
        const prompt = `Compare page results: ₹${monthly.toLocaleString('en-IN')}/month SIP for ${years} years. Nifty SIP corpus: ₹${Math.round(niftySIP).toLocaleString('en-IN')}. FD corpus: ₹${Math.round(fdNominal).toLocaleString('en-IN')}. Real value after inflation - SIP: ₹${Math.round(niftySIPReal).toLocaleString('en-IN')}, FD: ₹${Math.round(fdReal).toLocaleString('en-IN')}. Gap: ₹${Math.round(niftySIP - fdNominal).toLocaleString('en-IN')} more with SIP. Give a 2-sentence verdict tailored to a ${fearType} investor.`
        const data = await generateKinuChat({
          message: prompt,
          fear_type: fearType,
          context: 'compare_calculator',
          conversation_history: [],
        })
        setVerdict(data.reply)
      } catch {
        setVerdict(null)
      } finally {
        setVerdictLoading(false)
      }
    }, 1500)
    return () => { if (verdictDebounceRef.current) clearTimeout(verdictDebounceRef.current) }
  }, [monthly, years, fearType, niftySIP, fdNominal, fdReal, niftySIPReal])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto"
    >
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10">
        <h1 className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight mb-3">
          SIP vs FD vs Lump Sum
        </h1>
        <p className="font-sans text-sm text-white/40 max-w-lg leading-relaxed">
          Same money. Different vehicles. Drag the sliders and watch what 14% CAGR actually does versus a fixed deposit.
        </p>
      </motion.div>

      {/* Sliders */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8"
      >
        <div className="rounded-3xl p-6 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="font-sans text-xs text-white/40 uppercase tracking-wider">Monthly SIP</p>
            <p className="font-mono text-lg text-white font-medium">₹{monthly.toLocaleString('en-IN')}</p>
          </div>
          <input type="range" min={100} max={50000} step={100} value={monthly}
            onChange={e => setMonthly(Number(e.target.value))}
            className="w-full accent-[var(--accent)] cursor-pointer" />
          <div className="flex justify-between mt-1.5">
            <span className="font-sans text-[10px] text-white/20">₹100</span>
            <span className="font-sans text-[10px] text-white/20">₹50,000</span>
          </div>
        </div>

        <div className="rounded-3xl p-6 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="font-sans text-xs text-white/40 uppercase tracking-wider">Years</p>
            <p className="font-mono text-lg text-white font-medium">{years} years</p>
          </div>
          <input type="range" min={1} max={30} step={1} value={years}
            onChange={e => setYears(Number(e.target.value))}
            className="w-full accent-[var(--accent)] cursor-pointer" />
          <div className="flex justify-between mt-1.5">
            <span className="font-sans text-[10px] text-white/20">1 year</span>
            <span className="font-sans text-[10px] text-white/20">30 years</span>
          </div>
        </div>
      </motion.div>

      {/* Result cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.15 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
      >
        <div className="rounded-3xl p-6 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)', borderLeft: '3px solid #378ADD' }}>
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4" style={{ color: '#378ADD' }} />
            <p className="font-sans text-xs text-white/40">Nifty SIP (14% CAGR)</p>
          </div>
          <p className="font-display font-bold text-2xl text-white mb-1">{formatINR(niftySIP)}</p>
          <p className="font-sans text-xs text-white/30">Invested: {formatINR(totalInvested)}</p>
        </div>

        <div className="rounded-3xl p-6 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)', borderLeft: '3px solid #EF9F27' }}>
          <div className="flex items-center gap-2 mb-3">
            <Landmark className="w-4 h-4" style={{ color: '#EF9F27' }} />
            <p className="font-sans text-xs text-white/40">FD Nominal (7%)</p>
          </div>
          <p className="font-display font-bold text-2xl text-white mb-1">{formatINR(fdNominal)}</p>
          <p className="font-sans text-xs" style={{ color: '#E24B4A' }}>Real value: {formatINR(fdReal)}</p>
        </div>

        <div className="rounded-3xl p-6 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)', borderLeft: '3px solid var(--accent)' }}>
          <div className="flex items-center gap-2 mb-3">
            <PiggyBank className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <p className="font-sans text-xs text-white/40">Lump Sum Nifty</p>
          </div>
          <p className="font-display font-bold text-2xl text-white mb-1">{formatINR(lumpsumNifty)}</p>
          <p className="font-sans text-xs text-white/30">All {formatINR(totalInvested)} at once</p>
        </div>
      </motion.div>

      {/* Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
        className="rounded-3xl p-6 border mb-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div style={{ height: 320 }}>
          <canvas ref={chartRef} />
        </div>
      </motion.div>

      {/* Dynamic insight card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${monthly}-${years}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="rounded-3xl p-6 border mb-6"
          style={{ background: 'rgba(55,138,221,0.04)', borderColor: 'rgba(55,138,221,0.15)' }}
        >
          <div className="flex items-start gap-3">
            <Info className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#378ADD' }} />
            <p className="font-sans text-sm text-white/60 leading-relaxed">{insightText}</p>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* KINU verdict card */}
      <div className="rounded-3xl p-5 border mb-6" style={{ background: 'rgba(192,241,142,0.03)', borderColor: 'rgba(192,241,142,0.1)' }}>
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(192,241,142,0.12)' }}>
            <span className="font-display font-bold text-[11px]" style={{ color: 'var(--accent)' }}>K</span>
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-sans text-white/25 uppercase tracking-wider mb-2">KINU's verdict</p>
            {verdictLoading ? (
              <div className="space-y-2 py-0.5">
                <div className="h-3 w-full rounded-md animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <div className="h-2.5 w-3/4 rounded-md animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
              </div>
            ) : (
              <p className="font-sans text-sm text-white/50 leading-relaxed">
                {verdict ?? insightText}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="font-sans text-[10px] text-white/20 text-center">
        Nifty 50 CAGR = 14% (2001–2024 historical average). FD = 7% pre-tax nominal. Inflation = 6%. Past performance does not guarantee future results. This is an educational tool, not financial advice.
      </p>
    </motion.div>
  )
}
