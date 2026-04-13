import { motion } from 'framer-motion'
import { useRef, useEffect } from 'react'
import { Chart, registerables } from 'chart.js'
import { useAppStore } from '../../store/useAppStore'
import { formatINR } from '../../lib/formatINR'

Chart.register(...registerables)

// Cumulative growth from ₹1,00,000 in 2001
// Nifty ~14% CAGR, FD ~6.8%, Inflation ~5.8%
function buildSeries(cagr: number, years: number): number[] {
  const base = 100000
  return Array.from({ length: years + 1 }, (_, i) => base * Math.pow(1 + cagr / 100, i))
}

const YEARS = 23
const LABELS = Array.from({ length: YEARS + 1 }, (_, i) => `${2001 + i}`)
const NIFTY_DATA = buildSeries(14, YEARS)
const FD_DATA = buildSeries(6.8, YEARS)
const INFLATION_DATA = buildSeries(5.8, YEARS)

export default function CopyTheMarket() {
  const setDashboardSection = useAppStore(s => s.setDashboardSection)
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)

  useEffect(() => {
    if (!chartRef.current) return
    if (chartInstance.current) chartInstance.current.destroy()

    chartInstance.current = new Chart(chartRef.current, {
      type: 'line',
      data: {
        labels: LABELS,
        datasets: [
          {
            data: NIFTY_DATA,
            label: 'Nifty 50',
            borderColor: '#1D9E75',
            borderWidth: 2.5,
            pointRadius: 0, pointHoverRadius: 4,
            fill: false,
            tension: 0.4,
          },
          {
            data: FD_DATA,
            label: 'FD (6.8%)',
            borderColor: '#c0f18e',
            borderWidth: 2,
            borderDash: [6, 4],
            pointRadius: 0, pointHoverRadius: 4,
            fill: false,
            tension: 0.4,
          },
          {
            data: INFLATION_DATA,
            label: 'Inflation',
            borderColor: 'rgba(226,75,74,0.6)',
            borderWidth: 1.5,
            borderDash: [4, 3],
            pointRadius: 0, pointHoverRadius: 4,
            fill: false,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 1200, easing: 'easeOutQuart' },
        plugins: { legend: { display: false }, tooltip: { enabled: false } },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.03)' },
            ticks: { color: 'rgba(255,255,255,0.25)', font: { size: 9, family: 'Inter' }, maxTicksLimit: 8 },
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.03)' },
            ticks: {
              color: 'rgba(255,255,255,0.25)',
              font: { size: 9, family: 'Inter' },
              callback: (v) => formatINR(Number(v)),
            },
          },
        },
        interaction: { intersect: false, mode: 'index' },
      },
    })

    return () => { chartInstance.current?.destroy() }
  }, [])

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="rounded-3xl p-7 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>

      <h3 className="font-display font-semibold text-xl text-white mb-1 tracking-tight">Copy the market and you'll win.</h3>
      <p className="font-sans text-sm text-white/40 mb-6">No stock picking. No fund manager. No timing. Just copy.</p>

      {/* Custom legend */}
      <div className="flex flex-wrap gap-4 mb-4">
        {[
          { label: 'Nifty 50', color: '#1D9E75', dash: false },
          { label: 'FD (6.8%)', color: '#c0f18e', dash: true },
          { label: 'Inflation', color: 'rgba(226,75,74,0.6)', dash: true },
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

      {/* Chart */}
      <div style={{ height: '280px' }} className="mb-6">
        <canvas ref={chartRef} />
      </div>

      {/* Takeaway pills */}
      <div className="flex flex-wrap gap-3 mb-4">
        {[
          { label: 'Nifty: ~14% CAGR', color: 'var(--teal)' },
          { label: 'FD: ~7% CAGR', color: 'var(--accent)' },
          { label: 'Inflation: ~5.8% CAGR', color: 'var(--danger)' },
        ].map(p => (
          <div key={p.label} className="px-3 py-1.5 rounded-full border font-mono text-[11px]"
            style={{ borderColor: 'var(--border)', color: p.color }}>
            {p.label}
          </div>
        ))}
      </div>

      {/* Real returns */}
      <p className="font-sans text-sm text-white/50 mb-6">
        Real FD return after inflation: ~1.2% per year.{' '}
        Real Nifty return after inflation: ~8.2% per year.
      </p>

      {/* CTA */}
      <button onClick={() => setDashboardSection('simulation')}
        className="px-6 py-3 rounded-full font-sans font-bold text-sm text-[#0a1a00] active:scale-[0.97] transition-transform duration-200"
        style={{ background: 'var(--accent)' }}>
        See this in your personal simulation →
      </button>
    </motion.div>
  )
}
