import { motion } from 'framer-motion'
import { useState, useMemo } from 'react'
import { formatINR } from '../../lib/formatINR'
import { FY_ANNUAL_RETURNS, FY_ARJUN_INSIGHTS, getAllFYKeys, getFYHumanLabel } from '../../lib/sandboxData'
import { Zap } from 'lucide-react'

const FD_RATE = 6.8
const INFLATION_RATE = 6.0
const NIFTY_HISTORICAL_CAGR = 12.0

export default function FYComparison() {
  const [selectedFY, setSelectedFY] = useState('FY20')
  const [showLongTerm, setShowLongTerm] = useState(false)
  const fyKeys = getAllFYKeys()

  // ── Single-year comparison ────────────────────────────────────────────────
  const results = useMemo(() => {
    const annual = FY_ANNUAL_RETURNS[selectedFY]
    if (!annual) return null
    const base = 10000
    return {
      nifty: { value: base * (1 + annual.nifty / 100), pct: annual.nifty },
      midcap: { value: base * (1 + annual.midcap / 100), pct: annual.midcap },
      smallcap: { value: base * (1 + annual.smallcap / 100), pct: annual.smallcap },
      fd: { value: base * (1 + FD_RATE / 100), pct: FD_RATE },
    }
  }, [selectedFY])

  // ── Multi-year compound chart data ─────────────────────────────────────────
  const longTermData = useMemo(() => {
    const years = [1, 3, 5, 7, 10, 15, 20]
    const base = 100000 // ₹1 Lakh

    return years.map(y => ({
      year: y,
      nifty: Math.round(base * Math.pow(1 + NIFTY_HISTORICAL_CAGR / 100, y)),
      fdNominal: Math.round(base * Math.pow(1 + FD_RATE / 100, y)),
      fdReal: Math.round(base * Math.pow(1 + (FD_RATE - INFLATION_RATE) / 100, y)),
      baseline: base,
    }))
  }, [])

  if (!results) return null

  // Bar widths
  const allValues = [results.nifty.value, results.midcap.value, results.smallcap.value, results.fd.value]
  const maxValue = Math.max(...allValues)
  const minValue = Math.min(...allValues)
  const range = maxValue - minValue || 1

  const bars = [
    { name: 'Nifty 50', ...results.nifty, color: results.nifty.pct >= 0 ? 'var(--teal)' : 'var(--danger)' },
    { name: 'Midcap', ...results.midcap, color: results.midcap.pct >= 0 ? 'var(--teal)' : 'var(--danger)' },
    { name: 'Smallcap', ...results.smallcap, color: results.smallcap.pct >= 0 ? 'var(--teal)' : 'var(--danger)' },
    { name: 'FD (6.8%)', ...results.fd, color: 'rgba(255,255,255,0.35)' },
  ]

  const insight = FY_ARJUN_INSIGHTS[selectedFY] || ''

  // ── Long-term SVG chart ────────────────────────────────────────────────────
  const chartW = 380
  const chartH = 180
  const ltMax = Math.max(...longTermData.map(d => Math.max(d.nifty, d.fdNominal)))
  const ltMin = longTermData[0].baseline * 0.95

  function ltPath(accessor: (d: typeof longTermData[0]) => number, color: string, dashStyle?: string) {
    const pts = longTermData.map((d, i) => ({
      x: (i / (longTermData.length - 1)) * chartW,
      y: chartH - ((accessor(d) - ltMin) / (ltMax - ltMin)) * (chartH - 20) - 10,
    }))
    let path = `M ${pts[0].x},${pts[0].y}`
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i - 1]
      const c = pts[i]
      const cx1 = p.x + (c.x - p.x) * 0.4
      const cx2 = p.x + (c.x - p.x) * 0.6
      path += ` C ${cx1},${p.y} ${cx2},${c.y} ${c.x},${c.y}`
    }
    return (
      <path
        key={color + (dashStyle || '')}
        d={path}
        fill="none"
        stroke={color}
        strokeWidth={dashStyle ? 1.5 : 2.5}
        strokeLinecap="round"
        strokeDasharray={dashStyle || 'none'}
      />
    )
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="rounded-3xl p-7 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>

      <h3 className="font-display font-medium text-base text-white mb-1">What ₹10,000 would have become</h3>
      <p className="font-sans text-xs text-white/30 mb-5">Pick any financial year and see how each asset class performed.</p>

      {/* Year pills */}
      <div className="overflow-x-auto pb-2 mb-6 -mx-2">
        <div className="flex gap-2 px-2 min-w-max">
          {fyKeys.map(fy => {
            const isActive = selectedFY === fy
            return (
              <button key={fy} onClick={() => setSelectedFY(fy)}
                className="group relative px-3 py-1.5 rounded-xl font-mono text-[11px] border transition-[background-color,border-color,color] duration-200 shrink-0"
                style={{
                  background: isActive ? 'rgba(192,241,142,0.08)' : 'transparent',
                  borderColor: isActive ? 'var(--accent)' : 'var(--border)',
                  color: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.35)',
                }}>
                {getFYHumanLabel(fy)}
              </button>
            )
          })}
        </div>
      </div>

      {/* Bars */}
      <div className="space-y-4 mb-6">
        {bars.map((bar, i) => (
          <div key={bar.name}>
            <div className="flex items-center justify-between mb-1.5">
              <p className="font-sans text-sm text-white/60">{bar.name}</p>
              <div className="flex items-center gap-2">
                <p className="font-mono text-sm font-medium text-white">{formatINR(bar.value)}</p>
                <p className="font-mono text-[10px]" style={{ color: bar.color }}>
                  ({bar.pct > 0 ? '+' : ''}{bar.pct.toFixed(1)}%)
                </p>
              </div>
            </div>
            <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(((bar.value - Math.min(minValue, 9000)) / (maxValue - Math.min(minValue, 9000))) * 100, 3)}%` }}
                transition={{ duration: 0.8, delay: i * 0.15, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: bar.color }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* KINU insight */}
      {insight && (
        <div className="rounded-2xl p-4 border mb-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)', borderLeft: '3px solid var(--accent)' }}>
          <div className="flex items-start gap-2">
            <Zap className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: 'var(--accent)' }} />
            <p className="font-sans text-xs text-white/50 leading-relaxed">{insight}</p>
          </div>
        </div>
      )}

      {/* Toggle long-term view */}
      <button
        onClick={() => setShowLongTerm(!showLongTerm)}
        className="font-sans text-[11px] font-medium transition-[color] duration-200 mb-4"
        style={{ color: 'var(--accent)' }}
      >
        {showLongTerm ? '← Back to single-year' : 'See long-term compound comparison →'}
      </button>

      {/* Long-term compound chart */}
      {showLongTerm && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
          <h4 className="font-display font-medium text-sm text-white mb-1">₹1 Lakh over time — Nifty vs FD</h4>
          <p className="font-sans text-[11px] text-white/25 mb-4">Nifty at 12% CAGR · FD at 6.8% · Inflation at 6%</p>

          {/* SVG Chart */}
          <div className="overflow-x-auto mb-4">
            <svg width={chartW} height={chartH + 30} viewBox={`0 0 ${chartW} ${chartH + 30}`} className="w-full">
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map(pct => {
                const y = chartH - pct * (chartH - 20) - 10
                return <line key={pct} x1={0} y1={y} x2={chartW} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth={1} />
              })}

              {/* Lines */}
              {ltPath(d => d.nifty, 'var(--teal)')}
              {ltPath(d => d.fdNominal, 'rgba(255,255,255,0.4)', undefined)}
              {ltPath(d => d.fdReal, 'var(--danger)', '6 4')}
              {ltPath(d => d.baseline, 'rgba(255,255,255,0.12)', '4 4')}

              {/* Year labels */}
              {longTermData.map((d, i) => (
                <text key={d.year} x={(i / (longTermData.length - 1)) * chartW} y={chartH + 20} fill="rgba(255,255,255,0.2)" fontSize={10} textAnchor="middle" fontFamily="var(--font-mono)">
                  {d.year}Y
                </text>
              ))}
            </svg>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-[2.5px] rounded-full" style={{ background: 'var(--teal)' }} />
              <span className="font-sans text-[11px] text-white/40">Nifty 50 (12% CAGR)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-[1.5px]" style={{ background: 'rgba(255,255,255,0.4)' }} />
              <span className="font-sans text-[11px] text-white/40">FD nominal (6.8%)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-[1.5px]" style={{ background: 'var(--danger)', borderBottom: '1.5px dashed var(--danger)' }} />
              <span className="font-sans text-[11px] text-white/40">FD real (after inflation)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-[1px]" style={{ borderBottom: '1px dotted rgba(255,255,255,0.12)' }} />
              <span className="font-sans text-[11px] text-white/40">₹1L baseline</span>
            </div>
          </div>

          {/* Values table */}
          <div className="grid grid-cols-4 gap-x-4 gap-y-2 mb-4">
            <span className="font-sans text-[10px] text-white/20 font-medium">Year</span>
            <span className="font-sans text-[10px] text-white/20 font-medium">Nifty</span>
            <span className="font-sans text-[10px] text-white/20 font-medium">FD</span>
            <span className="font-sans text-[10px] text-white/20 font-medium">FD (real)</span>
            {longTermData.map(d => (
              <div key={d.year} className="contents">
                <span className="font-mono text-[11px] text-white/30">{d.year}Y</span>
                <span className="font-mono text-[11px]" style={{ color: 'var(--teal)' }}>{formatINR(d.nifty)}</span>
                <span className="font-mono text-[11px] text-white/40">{formatINR(d.fdNominal)}</span>
                <span className="font-mono text-[11px]" style={{ color: d.fdReal < d.baseline ? 'var(--danger)' : 'rgba(255,255,255,0.3)' }}>{formatINR(d.fdReal)}</span>
              </div>
            ))}
          </div>

          {/* Key annotation */}
          <p className="font-sans text-xs italic leading-relaxed" style={{ color: 'var(--danger)', opacity: 0.7 }}>
            The red dashed line is what your FD is actually worth after inflation. Below ₹1L means you're losing money in real terms.
          </p>
        </motion.div>
      )}

      {/* Key insight */}
      {!showLongTerm && (
        <p className="font-sans text-sm font-medium text-center mt-2" style={{ color: 'var(--accent)' }}>
          FD may feel safe, but inflation quietly erodes it. Over 10+ years, equity wins every time.
        </p>
      )}
    </motion.div>
  )
}
