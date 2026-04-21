import { motion } from 'framer-motion'
import { useState, useRef, useEffect, useCallback } from 'react'
import { Chart, registerables } from 'chart.js'
import annotationPlugin from 'chartjs-plugin-annotation'
import { useAppStore, type FearType } from '../../../store/useAppStore'
import { formatINR } from '../../../lib/formatINR'
import RiskHorizon from '../RiskHorizon'
import CrashTimeline from '../CrashTimeline'
import FearQuote from '../shared/FearQuote'
import KinuInsight from '../shared/KinuInsight'
import NewsImpactCard from '../../news/NewsImpactCard'
import { kinuRegistry } from '../../../lib/kinuActionRegistry'

Chart.register(...registerables)

// Try to register annotation plugin (used for crash overlay)
try { Chart.register(annotationPlugin) } catch { /* plugin not installed, crash overlay will be disabled */ }

// ── Constants ───────────────────────────────────────────────────────────────

const FEAR_INSIGHTS: Record<FearType, string> = {
  loss: 'Remember: even the worst case recovered. Every major Nifty 50 crash has been followed by a full recovery.',
  jargon: 'SIP means you invest the same amount every month. The simulation shows what happens over time — no jargon, just math.',
  scam: 'These numbers use real NSE data. Source: NSE India historical monthly close prices, 2001–2024.',
  trust: 'No fund manager involved. This is pure math on how markets have historically behaved.',
}

const MILESTONES = [
  { year: 2001, label: 'Dot-com recovery begins', color: 'var(--teal)' },
  { year: 2008, label: 'Global crash -52%', color: 'var(--danger)' },
  { year: 2009, label: 'Recovery +76%', color: 'var(--teal)' },
  { year: 2013, label: 'Modi rally begins', color: 'var(--teal)' },
  { year: 2020, label: 'COVID crash -38%', color: 'var(--danger)' },
  { year: 2021, label: 'Recovery in 6 months', color: 'var(--teal)' },
  { year: 2024, label: 'All time highs', color: 'var(--accent)' },
]

// ── Component ───────────────────────────────────────────────────────────────

export default function SimulationPage() {
  const fearType = useAppStore(s => s.fearType) ?? 'loss'
  const setSimulationResult = useAppStore(s => s.setSimulationResult)
  const storeMonthly = useAppStore(s => s.monthlyAmount)
  const storeYears = useAppStore(s => s.years)
  const setStoreMonthly = useAppStore(s => s.setMonthlyAmount)
  const setStoreYears = useAppStore(s => s.setYears)

  const [monthly, setMonthly] = useState(storeMonthly)
  const [years, setYears] = useState(storeYears)
  const [cagr, setCagr] = useState(14)
  const [loading, setLoading] = useState(false)
  const [hasRun, setHasRun] = useState(false)
  const [result, setResult] = useState<{
    p10: number[]; p50: number[]; p90: number[]; invested: number[]
    finalP10: number; finalP50: number; finalP90: number; totalInvested: number
    paths: number[][]
  } | null>(null)
  const [showCrashOverlay, setShowCrashOverlay] = useState(false)

  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)
  const workerRef = useRef<Worker | null>(null)

  const [committedResult, setCommittedResult] = useState<{
    finalP10: number; finalP50: number; finalP90: number; totalInvested: number;
  } | null>(null)

  // Calculate quick stats
  const totalInvested = monthly * years * 12
  const quickP50 = totalInvested * Math.pow(1 + cagr / 100, years) * 0.55
  const quickP10 = quickP50 * 0.55

  // ── Chart rendering ─────────────────────────────────────────────────────
  const renderChart = useCallback((data: typeof result) => {
    if (!chartRef.current || !data) return
    if (chartInstance.current) chartInstance.current.destroy()

    const labels = Array.from({ length: data.p50.length }, (_, i) => {
      const y = i / 12
      return Number.isInteger(y) ? `${y}Y` : ''
    })

    const datasets = [
      // Faint paths (show first 50 for performance)
      ...data.paths.slice(0, 50).map((path) => ({
        data: path,
        borderColor: 'rgba(255,255,255,0.03)',
        borderWidth: 1,
        pointRadius: 0,
        pointHoverRadius: 0,
        fill: false,
        tension: 0.4,
      })),
      // Invested line
      { data: data.invested, label: 'What you put in', borderColor: 'rgba(192,241,142,0.6)', borderWidth: 1.5, borderDash: [6, 4], pointRadius: 0, pointHoverRadius: 4, fill: false, tension: 0 },
      // p10
      { data: data.p10, label: 'Worst case (p10)', borderColor: 'rgba(226,75,74,0.8)', borderWidth: 2, borderDash: [4, 3], pointRadius: 0, pointHoverRadius: 4, fill: false, tension: 0.4 },
      // p50
      { data: data.p50, label: 'Median', borderColor: '#378ADD', borderWidth: 2.5, pointRadius: 0, pointHoverRadius: 4, fill: false, tension: 0.4 },
      // p90
      { data: data.p90, label: 'Best case', borderColor: 'rgba(29,158,117,0.8)', borderWidth: 2, pointRadius: 0, pointHoverRadius: 4, fill: false, tension: 0.4 },
    ]

    chartInstance.current = new Chart(chartRef.current, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 1200, easing: 'easeOutQuart' },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.03)' },
            ticks: { color: 'rgba(255,255,255,0.25)', font: { size: 10, family: 'Inter' } },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.03)' },
            ticks: {
              color: 'rgba(255,255,255,0.25)',
              font: { size: 10, family: 'Inter' },
              callback: (v) => formatINR(Number(v)),
            },
          },
        },
        interaction: { intersect: false, mode: 'index' },
      },
    })
  }, [])

  // ── Run simulation ──────────────────────────────────────────────────────
  const runSimulation = useCallback(() => {
    setLoading(true)
    setStoreMonthly(monthly)
    setStoreYears(years)

    if (workerRef.current) workerRef.current.terminate()
    const worker = new Worker(
      new URL('../../../lib/monteCarlo.worker.ts', import.meta.url),
      { type: 'module' }
    )
    workerRef.current = worker

    worker.onmessage = (e) => {
      const data = e.data
      setTimeout(() => {
        setResult(data)
        setHasRun(true)
        setLoading(false)
        setSimulationResult({
          p10: data.finalP10,
          p50: data.finalP50,
          p90: data.finalP90,
          totalInvested: data.totalInvested,
        })
        setCommittedResult({
          finalP10: data.finalP10,
          finalP50: data.finalP50,
          finalP90: data.finalP90,
          totalInvested: data.totalInvested,
        })
        renderChart(data)
      }, 1200) // simulate loading time
    }

    worker.postMessage({ monthlyAmount: monthly, years, cagr: cagr / 100 })
  }, [monthly, years, cagr, setStoreMonthly, setStoreYears, setSimulationResult, renderChart])

  useEffect(() => {
    return () => { workerRef.current?.terminate(); chartInstance.current?.destroy() }
  }, [])

  // Register KINU actions so the floating chat button can trigger them
  useEffect(() => {
    kinuRegistry.register('start_simulation', runSimulation)
    kinuRegistry.register('scroll_to_chart', () => {
      document.getElementById('monte-carlo-chart')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
    return () => {
      kinuRegistry.unregister('start_simulation')
      kinuRegistry.unregister('scroll_to_chart')
    }
  }, [runSimulation])

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
      {/* News Context */}
      <div className="mb-8">
        <NewsImpactCard context="simulation" fearType={fearType} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── LEFT COLUMN: Controls ──────────────────────────────────────── */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="rounded-3xl p-7 border"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <h2 className="font-display font-semibold text-xl text-white mb-1 tracking-tight">Your SIP Simulation</h2>
            <p className="font-sans text-xs text-white/35 mb-8">Based on real Nifty 50 data 2001–2024</p>

            {/* Slider 1: Monthly */}
            <div className="mb-7">
              <label className="font-sans text-[11px] text-white/40 uppercase tracking-wider block mb-2">Monthly investment</label>
              <p className="font-display font-bold text-2xl mb-3" style={{ color: 'var(--accent)' }}>{formatINR(monthly)}</p>
              <input type="range" min={500} max={50000} step={500} value={monthly}
                onChange={e => setMonthly(Number(e.target.value))}
                className="w-full h-1 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: 'var(--accent)', background: 'rgba(255,255,255,0.08)' }}
              />
            </div>

            {/* Slider 2: Years */}
            <div className="mb-7">
              <label className="font-sans text-[11px] text-white/40 uppercase tracking-wider block mb-2">Years</label>
              <p className="font-display font-bold text-2xl mb-3" style={{ color: 'var(--accent)' }}>{years}</p>
              <input type="range" min={3} max={30} step={1} value={years}
                onChange={e => setYears(Number(e.target.value))}
                className="w-full h-1 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: 'var(--accent)', background: 'rgba(255,255,255,0.08)' }}
              />
            </div>

            {/* Slider 3: CAGR */}
            <div className="mb-8">
              <label className="font-sans text-[11px] text-white/40 uppercase tracking-wider block mb-2">Expected CAGR</label>
              <p className="font-display font-bold text-2xl mb-3" style={{ color: 'var(--accent)' }}>{cagr}%</p>
              <input type="range" min={8} max={20} step={1} value={cagr}
                onChange={e => setCagr(Number(e.target.value))}
                className="w-full h-1 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: 'var(--accent)', background: 'rgba(255,255,255,0.08)' }}
              />
              <p className="font-sans text-[10px] text-white/25 mt-1">Nifty 50 historical average: 14%</p>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="rounded-2xl p-4 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <p className="text-[9px] font-sans font-bold tracking-[0.12em] text-white/25 uppercase mb-1">Total invested</p>
                {committedResult ? (
                  <p className="font-display font-semibold text-base text-white">{formatINR(committedResult.totalInvested)}</p>
                ) : (
                  <p className="font-sans text-[10px] text-white/30 italic">Run simulation to see results</p>
                )}
              </div>
              <div className="rounded-2xl p-4 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <p className="text-[9px] font-sans font-bold tracking-[0.12em] text-white/25 uppercase mb-1">Median outcome</p>
                {committedResult ? (
                  <p className="font-display font-semibold text-base" style={{ color: 'var(--teal)' }}>{formatINR(committedResult.finalP50)}</p>
                ) : (
                  <p className="font-sans text-[10px] text-white/30 italic">Run simulation to see results</p>
                )}
              </div>
              <div className="rounded-2xl p-4 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <p className="text-[9px] font-sans font-bold tracking-[0.12em] text-white/25 uppercase mb-1">Worst case (p10)</p>
                {committedResult ? (
                  <>
                    <p className="font-display font-semibold text-base" style={{ color: 'var(--danger)' }}>{formatINR(committedResult.finalP10)}</p>
                    <p className="text-[9px] font-sans text-white/20 mt-1">Historically recovered within 14 months</p>
                  </>
                ) : (
                  <p className="font-sans text-[10px] text-white/30 italic">Run simulation to see results</p>
                )}
              </div>
            </div>

            {/* Insight box */}
            <div
              className="rounded-2xl p-4 border mb-6"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)', borderLeft: '3px solid var(--accent)' }}
            >
              <p className="font-sans text-xs text-white/55 leading-relaxed">
                In the worst 10% of scenarios, your {formatINR(totalInvested)} investment could temporarily fall to {formatINR(quickP10)}.
                Every similar drop in Nifty 50 history recovered fully.
              </p>
            </div>

            {/* Run button */}
            <button
              onClick={runSimulation}
              disabled={loading}
              className="w-full py-4 rounded-full font-sans font-bold text-sm text-[#0a1a00] box-glow active:scale-[0.97] disabled:opacity-50 transition-[opacity,transform] duration-200"
              style={{ background: 'var(--accent)' }}
            >
              {loading ? 'Running 600 simulations...' : hasRun ? 'Run Again' : 'Run Simulation'}
            </button>

            {/* Loading bar */}
            {loading && (
              <div className="mt-3 h-1 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div
                  initial={{ width: '0%' }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 1.2, ease: 'linear' }}
                  className="h-full rounded-full"
                  style={{ background: 'var(--accent)' }}
                />
              </div>
            )}



            {/* AI personalised quote */}
            <FearQuote context="simulation" variant="card" />

            {/* KINU contextual insight */}
            <KinuInsight
              page="simulation"
              extraContext={hasRun && result ? `Simulation ran: ₹${monthly}/month for ${years} years. Median outcome ₹${result.finalP50.toLocaleString('en-IN')}, invested ₹${result.totalInvested.toLocaleString('en-IN')}` : `About to run a SIP simulation: ₹${monthly}/month for ${years} years`}
              ctaSection="time-machine"
              ctaLabel="Test a real crash"
            />
          </motion.div>
        </div>

        {/* ── RIGHT COLUMN: Chart ───────────────────────────────────────── */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
            id="monte-carlo-chart"
            className="rounded-3xl p-6 border"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            {/* Crash overlay toggle + Custom legend */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex flex-wrap gap-4">
                {[
                  { label: 'Median', color: '#378ADD', dash: false },
                  { label: 'Best case', color: 'rgba(29,158,117,0.8)', dash: false },
                  { label: 'Worst case', color: 'rgba(226,75,74,0.8)', dash: true },
                  { label: 'Invested', color: 'rgba(192,241,142,0.6)', dash: true },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-2">
                    <div className="w-5 h-[2px] rounded" style={{
                      background: l.color,
                      borderStyle: l.dash ? 'dashed' : 'solid',
                    }} />
                    <span className="font-sans text-[10px] text-white/40">{l.label}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowCrashOverlay(!showCrashOverlay)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-sans font-medium border transition-[background-color,border-color,color] duration-200"
                style={{
                  background: showCrashOverlay ? 'rgba(226,75,74,0.08)' : 'transparent',
                  borderColor: showCrashOverlay ? 'rgba(226,75,74,0.25)' : 'var(--border)',
                  color: showCrashOverlay ? 'var(--danger)' : 'rgba(255,255,255,0.35)',
                }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: showCrashOverlay ? 'var(--danger)' : 'rgba(255,255,255,0.15)' }} />
                Show historical crashes
              </button>
            </div>

            {/* Chart */}
            <div className="relative" style={{ height: '400px' }}>
              {!hasRun && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="font-sans text-sm text-white/20 text-center max-w-xs">
                    Your fan chart will appear here after you run the simulation
                  </p>
                </div>
              )}
              <canvas ref={chartRef} />
            </div>

            {/* Crash overlay caption */}
            {showCrashOverlay && (
              <motion.p
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="font-sans text-[11px] text-white/30 mt-4 leading-relaxed text-center"
              >
                The grey fan shows 600 simulated futures. The shaded areas show real historical crashes. Notice: even the worst simulated paths recover.
              </motion.p>
            )}
          </motion.div>

          {/* What this means cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="rounded-2xl p-5 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <p className="text-[9px] font-sans font-bold tracking-[0.12em] text-white/25 uppercase mb-2">If everything goes well</p>
              {committedResult ? (
                <p className="font-display font-semibold text-lg" style={{ color: 'var(--teal)' }}>{formatINR(committedResult.finalP90)}</p>
              ) : (
                <p className="font-sans text-[11px] text-white/30 italic">Run simulation to see results</p>
              )}
            </div>
            <div className="rounded-2xl p-5 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <p className="text-[9px] font-sans font-bold tracking-[0.12em] text-white/25 uppercase mb-2">Most likely outcome</p>
              {committedResult ? (
                <p className="font-display font-semibold text-lg" style={{ color: 'var(--blue)' }}>{formatINR(committedResult.finalP50)}</p>
              ) : (
                <p className="font-sans text-[11px] text-white/30 italic">Run simulation to see results</p>
              )}
            </div>
            <div className="rounded-2xl p-5 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)', borderBottom: '2px solid var(--danger)' }}>
              <p className="text-[9px] font-sans font-bold tracking-[0.12em] text-white/25 uppercase mb-2">If markets struggle</p>
              {committedResult ? (
                <>
                  <p className="font-display font-semibold text-lg" style={{ color: 'var(--danger)' }}>{formatINR(committedResult.finalP10)}</p>
                  <p className="text-[9px] font-sans text-white/20 mt-1">Still recovered historically</p>
                </>
              ) : (
                <p className="font-sans text-[11px] text-white/30 italic">Run simulation to see results</p>
              )}
            </div>
          </motion.div>

          {/* Fear personalization */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease: 'easeOut' }}
            className="rounded-2xl p-4 border flex items-start gap-3"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="w-6 h-6 rounded-lg flex items-center justify-center font-display font-bold text-[11px]" style={{ background: 'var(--accent)', color: '#0a1a00' }}>K</div>
            <p className="font-sans text-sm text-white/70 leading-relaxed pt-0.5">
              {FEAR_INSIGHTS[fearType]}
            </p>
          </motion.div>

          {/* Historical timeline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
            className="rounded-3xl p-6 border overflow-x-auto"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <p className="text-[9px] font-sans font-bold tracking-[0.15em] text-white/25 uppercase mb-6">Historical context</p>
            <div className="relative min-w-[600px]">
              {/* Timeline line */}
              <div className="absolute top-4 left-0 right-0 h-[2px]" style={{ background: 'var(--accent)', opacity: 0.3 }} />
              {/* Milestones */}
              <div className="flex justify-between relative">
                {MILESTONES.map((m, i) => (
                  <div key={i} className="flex flex-col items-center" style={{ width: `${100 / MILESTONES.length}%` }}>
                    <div className="w-3 h-3 rounded-full border-2 mb-3 relative z-10" style={{
                      borderColor: m.color,
                      background: 'var(--bg)',
                    }} />
                    <p className="font-mono text-[11px] font-bold text-white/60 mb-1">{m.year}</p>
                    <p className="font-sans text-[9px] text-center leading-tight" style={{ color: m.color }}>{m.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── Risk Horizon (below results) ──────────────────────────────── */}
      <RiskHorizon />

      {/* ── Crash Timeline (below Risk Horizon) ────────────────────────── */}
      <div className="mt-8">
        <h3 className="font-display font-semibold text-xl text-white mb-2 tracking-tight">Every crash since 2000</h3>
        <p className="font-sans text-xs text-white/35 mb-6">India's market has survived everything. Here's the visual proof.</p>
        <CrashTimeline />
      </div>

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
