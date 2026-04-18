import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useAppStore } from '../../../store/useAppStore'
import { formatINR } from '../../../lib/formatINR'
import { generateHarvestDebrief } from '../../../lib/simulateAI'
import {
  simulateFY,
} from '../../../lib/sandboxData'
import { Play, Pause, ChevronRight, Zap, RotateCcw, Sprout, Leaf, TreeDeciduous } from 'lucide-react'

// ── Types & Data ────────────────────────────────────────────────────────────

type Phase = 'setup' | 'playback' | 'report'
type InvestStyle = 'lumpsum' | 'sip'

interface Era {
  id: string
  label: string
  fyKeys: string[]
  description: string
  icon: typeof Sprout
}

const ERAS: Era[] = [
  { id: 'dotcom', label: '2001\u201305', fyKeys: ['FY01', 'FY02', 'FY03', 'FY04', 'FY05'], description: 'Dot-com crash \u2192 Bull run', icon: Sprout },
  { id: 'golden', label: '2005\u201310', fyKeys: ['FY06', 'FY07', 'FY08', 'FY09', 'FY10'], description: 'Peak bull \u2192 GFC \u2192 Recovery', icon: Leaf },
  { id: 'steady', label: '2010\u201315', fyKeys: ['FY11', 'FY12', 'FY13', 'FY14', 'FY15'], description: 'Sideways \u2192 Modi rally', icon: TreeDeciduous },
  { id: 'modern', label: '2015\u201320', fyKeys: ['FY16', 'FY17', 'FY18', 'FY19', 'FY20'], description: 'DeMon \u2192 IL&FS \u2192 COVID', icon: Sprout },
  { id: 'covid', label: '2020\u201324', fyKeys: ['FY21', 'FY22', 'FY23'], description: 'COVID recovery \u2192 Now', icon: Leaf },
]

const BUDGET_PRESETS = [10000, 100000, 1000000]

const ASSET_COLORS: Record<string, string> = {
  nifty: '#1D9E75',
  midcap: '#c0f18e',
  smallcap: '#378ADD',
  debt: 'rgba(255,255,255,0.25)',
}

const ASSET_NAMES: Record<string, string> = {
  nifty: 'Nifty 50',
  midcap: 'Midcap',
  smallcap: 'Smallcap',
  debt: 'Debt',
}

// ── Component ───────────────────────────────────────────────────────────────

export default function HarvestRoom() {
  const fearType = useAppStore(s => s.fearType) ?? 'loss'
  const addHarvestResult = useAppStore(s => s.addHarvestResult)
  const harvestResults = useAppStore(s => s.harvestResults)

  const [phase, setPhase] = useState<Phase>('setup')

  // Setup state
  const [selectedEra, setSelectedEra] = useState<Era>(ERAS[3])
  const [budget, setBudget] = useState(100000)
  const [customBudget, setCustomBudget] = useState('')
  const [style, setStyle] = useState<InvestStyle>('lumpsum')
  const [alloc, setAlloc] = useState({ nifty: 40, midcap: 25, smallcap: 25, debt: 10 })

  // Playback state
  const [currentFYIndex, setCurrentFYIndex] = useState(0)
  const [currentMonth, setCurrentMonth] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState(1)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Report state
  const [insights, setInsights] = useState('')
  const [insightsLoading, setInsightsLoading] = useState(false)

  const totalAlloc = alloc.nifty + alloc.midcap + alloc.smallcap + alloc.debt

  // ── Simulation logic ──────────────────────────────────────────────────

  const simulateEra = useCallback(() => {
    const fyKeys = selectedEra.fyKeys
    let running = {
      nifty: budget * (alloc.nifty / 100),
      midcap: budget * (alloc.midcap / 100),
      smallcap: budget * (alloc.smallcap / 100),
      debt: budget * (alloc.debt / 100),
    }
    const history: number[] = [budget]

    for (const fy of fyKeys) {
      const simResult = simulateFY(fy, alloc, budget)
      if (!simResult.monthlyValues.length) continue

      // For SIP: add monthly contributions
      for (let m = 0; m < 12; m++) {
        const mv = simResult.monthlyValues[m + 1]
        if (!mv) break
        const factor = {
          nifty: mv.nifty / (simResult.monthlyValues[m]?.nifty || 1),
          midcap: mv.midcap / (simResult.monthlyValues[m]?.midcap || 1),
          smallcap: mv.smallcap / (simResult.monthlyValues[m]?.smallcap || 1),
          debt: mv.debt / (simResult.monthlyValues[m]?.debt || 1),
        }
        running.nifty *= factor.nifty
        running.midcap *= factor.midcap
        running.smallcap *= factor.smallcap
        running.debt *= factor.debt

        if (style === 'sip') {
          const sipAmount = budget / (fyKeys.length * 12)
          running.nifty += sipAmount * (alloc.nifty / 100)
          running.midcap += sipAmount * (alloc.midcap / 100)
          running.smallcap += sipAmount * (alloc.smallcap / 100)
          running.debt += sipAmount * (alloc.debt / 100)
        }

        history.push(running.nifty + running.midcap + running.smallcap + running.debt)
      }
    }
    return { history, finalValues: running }
  }, [selectedEra, budget, alloc, style])

  // ── Playback tick ─────────────────────────────────────────────────────

  const totalMonths = selectedEra.fyKeys.length * 12

  const tick = useCallback(() => {
    const globalMonth = currentFYIndex * 12 + currentMonth
    if (globalMonth >= totalMonths - 1) {
      setIsPlaying(false)
      setTimeout(() => setPhase('report'), 600)
      return
    }
    const nextMonth = currentMonth + 1
    if (nextMonth >= 12) {
      setCurrentFYIndex(prev => prev + 1)
      setCurrentMonth(0)
    } else {
      setCurrentMonth(nextMonth)
    }
  }, [currentFYIndex, currentMonth, totalMonths])

  useEffect(() => {
    if (!isPlaying || phase !== 'playback') return
    const delay = speed === 20 ? 50 : speed === 5 ? 150 : speed === 2 ? 400 : 800
    timerRef.current = setTimeout(tick, delay)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [isPlaying, currentFYIndex, currentMonth, speed, phase, tick])

  // recalculate portfolio value on month change
  const globalMonth = currentFYIndex * 12 + currentMonth
  const simResult = useMemo(() => simulateEra(), [simulateEra])

  const currentTotal = simResult.history[Math.min(globalMonth, simResult.history.length - 1)] || budget
  const finalTotal = simResult.history[simResult.history.length - 1] || budget
  const totalInvested = style === 'sip' ? budget : budget
  const profit = finalTotal - totalInvested

  // ── Start playback ────────────────────────────────────────────────────

  const startPlayback = () => {
    setPhase('playback')
    setCurrentFYIndex(0)
    setCurrentMonth(0)
    setIsPlaying(true)
    setInsights('')
  }

  // ── Report generation ─────────────────────────────────────────────────

  useEffect(() => {
    if (phase !== 'report') return
    setInsightsLoading(true)
    generateHarvestDebrief({
      era: selectedEra.label,
      era_years: selectedEra.fyKeys.length,
      budget,
      style,
      allocation: alloc,
      final_value: finalTotal,
      total_invested: totalInvested,
      fear_type: fearType,
    })
      .then(r => setInsights(r.insights))
      .catch(() => setInsights('Your allocation through this era showed thought. Markets always reward patience over perfection.'))
      .finally(() => setInsightsLoading(false))
  }, [phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const saveResult = () => {
    addHarvestResult({
      era: selectedEra.label,
      budget,
      style,
      allocation: alloc,
      finalValue: finalTotal,
      totalInvested,
      kinuInsights: insights,
      date: new Date().toISOString(),
    })
  }

  const resetToSetup = () => {
    setPhase('setup')
    setCurrentFYIndex(0)
    setCurrentMonth(0)
    setIsPlaying(false)
    setInsights('')
  }

  // ── Mini sparkline ────────────────────────────────────────────────────

  const renderMiniChart = (data: number[], color: string, width: number = 200, height: number = 60) => {
    if (data.length < 2) return null
    const trimmed = data.slice(0, Math.min(globalMonth + 1, data.length))
    const min = Math.min(...trimmed) * 0.98
    const max = Math.max(...trimmed) * 1.02
    const range = max - min || 1
    const points = trimmed.map((v, i) => `${(i / (trimmed.length - 1)) * width},${height - ((v - min) / range) * height}`).join(' ')
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0">
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
      </svg>
    )
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
      <AnimatePresence mode="wait">

        {/* ═══ SETUP ═══════════════════════════════════════════════════════ */}
        {phase === 'setup' && (
          <motion.div key="setup" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-4xl mx-auto space-y-8">

            {/* Header */}
            <div className="text-center">
              <h1 className="font-display font-semibold text-3xl md:text-5xl text-white mb-3 tracking-tight">The Harvest Room</h1>
              <p className="font-sans text-base text-white/40 max-w-lg mx-auto">Pick an era. Plant your money. See what history grew.</p>
            </div>

            {/* Era Selection */}
            <div>
              <p className="font-sans text-[10px] text-white/25 uppercase tracking-wider mb-3 font-bold">Choose your era</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {ERAS.map(era => {
                  const Icon = era.icon
                  const isActive = selectedEra.id === era.id
                  return (
                    <button key={era.id} onClick={() => setSelectedEra(era)}
                      className="rounded-2xl p-5 border text-left transition-[background-color,border-color] duration-200"
                      style={{
                        background: isActive ? 'rgba(192,241,142,0.06)' : 'var(--surface)',
                        borderColor: isActive ? 'rgba(192,241,142,0.2)' : 'var(--border)',
                      }}>
                      <div className="flex items-center gap-2.5 mb-2">
                        <Icon className="w-4 h-4" style={{ color: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.2)' }} />
                        <span className="font-mono text-sm font-bold" style={{ color: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.5)' }}>{era.label}</span>
                      </div>
                      <p className="font-sans text-xs text-white/35">{era.description}</p>
                      <p className="font-mono text-[9px] text-white/15 mt-1">{era.fyKeys.length} years</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Budget */}
            <div className="rounded-3xl p-6 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <p className="font-sans text-[10px] text-white/25 uppercase tracking-wider mb-4 font-bold">Your budget</p>
              <div className="flex flex-wrap gap-2 mb-4">
                {BUDGET_PRESETS.map(b => (
                  <button key={b} onClick={() => { setBudget(b); setCustomBudget('') }}
                    className="px-4 py-2.5 rounded-xl font-mono text-sm border transition-[background-color,border-color,color] duration-200"
                    style={{
                      background: budget === b && !customBudget ? 'rgba(192,241,142,0.06)' : 'transparent',
                      borderColor: budget === b && !customBudget ? 'rgba(192,241,142,0.2)' : 'var(--border)',
                      color: budget === b && !customBudget ? 'var(--accent)' : 'rgba(255,255,255,0.4)',
                    }}>
                    {formatINR(b)}
                  </button>
                ))}
                <input
                  type="number"
                  value={customBudget}
                  onChange={e => { setCustomBudget(e.target.value); if (e.target.value) setBudget(Number(e.target.value)) }}
                  placeholder="Custom..."
                  className="px-4 py-2.5 rounded-xl font-mono text-sm border bg-transparent text-white outline-none placeholder:text-white/15 w-32 focus:border-[rgba(192,241,142,0.25)] transition-[border-color] duration-200"
                  style={{ borderColor: customBudget ? 'rgba(192,241,142,0.2)' : 'var(--border)' }}
                />
              </div>

              {/* Style */}
              <p className="font-sans text-[10px] text-white/25 uppercase tracking-wider mb-3 font-bold">Investment style</p>
              <div className="flex gap-2">
                {(['lumpsum', 'sip'] as InvestStyle[]).map(s => (
                  <button key={s} onClick={() => setStyle(s)}
                    className="flex-1 py-3 rounded-xl font-sans text-sm font-medium border transition-[background-color,border-color,color] duration-200"
                    style={{
                      background: style === s ? 'rgba(192,241,142,0.06)' : 'transparent',
                      borderColor: style === s ? 'rgba(192,241,142,0.2)' : 'var(--border)',
                      color: style === s ? 'var(--accent)' : 'rgba(255,255,255,0.35)',
                    }}>
                    {s === 'lumpsum' ? 'Lump Sum' : 'Monthly SIP'}
                  </button>
                ))}
              </div>
            </div>

            {/* Allocation */}
            <div className="rounded-3xl p-7 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <h3 className="font-display font-medium text-base text-white mb-6">Allocate your {formatINR(budget)}</h3>
              <div className="space-y-5">
                {Object.entries(ASSET_NAMES).map(([key, name]) => (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="font-sans text-sm text-white/70 font-medium">{name}</p>
                      <p className="font-mono text-sm" style={{ color: 'var(--accent)' }}>{alloc[key as keyof typeof alloc]}%</p>
                    </div>
                    <input
                      type="range" min={0} max={100} step={5}
                      value={alloc[key as keyof typeof alloc]}
                      onChange={e => setAlloc(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                      className="w-full h-1 rounded-full appearance-none cursor-pointer"
                      style={{ accentColor: ASSET_COLORS[key], background: 'rgba(255,255,255,0.08)' }}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="font-sans text-xs text-white/30">
                  Allocated: <span className={totalAlloc === 100 ? 'text-white font-medium' : ''} style={totalAlloc > 100 ? { color: 'var(--danger)' } : undefined}>{totalAlloc}%</span>
                </p>
                {totalAlloc > 100 && <p className="font-sans text-[10px]" style={{ color: 'var(--danger)' }}>Over-allocated</p>}
              </div>
            </div>

            {/* Begin */}
            <button onClick={startPlayback}
              disabled={totalAlloc !== 100 || budget <= 0}
              className="w-full py-4 rounded-full font-sans font-bold text-sm text-[#0a1a00] box-glow active:scale-[0.97] disabled:opacity-30 transition-[opacity,transform] duration-200 flex items-center justify-center gap-2"
              style={{ background: 'var(--accent)' }}>
              Begin Harvest <Sprout className="w-4 h-4" />
            </button>

            {/* Past Harvests */}
            {harvestResults.length > 0 && (
              <div className="rounded-3xl p-6 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <p className="font-sans text-[10px] text-white/25 uppercase tracking-wider mb-3 font-bold">Past harvests</p>
                <div className="space-y-2">
                  {harvestResults.slice(-3).reverse().map((r, i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                      <div>
                        <p className="font-sans text-sm text-white/60">{r.era}</p>
                        <p className="font-mono text-[10px] text-white/25">{formatINR(r.budget)} · {r.style}</p>
                      </div>
                      <p className="font-mono text-sm" style={{ color: r.finalValue >= r.budget ? 'var(--teal)' : 'var(--danger)' }}>
                        {formatINR(r.finalValue)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ═══ PLAYBACK ════════════════════════════════════════════════════ */}
        {phase === 'playback' && (
          <motion.div key="playback" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="max-w-4xl mx-auto space-y-6">

            {/* Top Bar */}
            <div className="flex items-center justify-between rounded-2xl px-5 py-3 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="flex items-center gap-4">
                <span className="font-mono text-sm text-white/40">{selectedEra.label}</span>
                <span className="font-sans text-sm text-white/70 font-medium">
                  Year {currentFYIndex + 1}, Month {currentMonth + 1}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setIsPlaying(!isPlaying)} className="w-8 h-8 rounded-full flex items-center justify-center border" style={{ borderColor: 'var(--border)' }}>
                  {isPlaying ? <Pause className="w-3.5 h-3.5 text-white/60" /> : <Play className="w-3.5 h-3.5 text-white/60" />}
                </button>
                {[1, 2, 5, 20].map(s => (
                  <button key={s} onClick={() => setSpeed(s)}
                    className="px-2 py-1 rounded-lg font-mono text-[10px] transition-[background-color,color] duration-200"
                    style={{ background: speed === s ? 'rgba(192,241,142,0.08)' : 'transparent', color: speed === s ? 'var(--accent)' : 'var(--text-secondary)' }}>
                    {s}x
                  </button>
                ))}
              </div>
            </div>

            {/* Portfolio Value */}
            <div className="text-center py-6">
              <p className="font-sans text-xs text-white/25 uppercase tracking-wider mb-2">Portfolio value</p>
              <p className="font-display font-bold text-4xl" style={{ color: currentTotal >= budget ? 'var(--teal)' : 'var(--danger)' }}>
                {formatINR(currentTotal)}
              </p>
              <p className="font-mono text-xs mt-1" style={{ color: currentTotal >= budget ? 'var(--teal)' : 'var(--danger)' }}>
                {currentTotal >= budget ? '+' : ''}{((currentTotal / budget - 1) * 100).toFixed(1)}%
              </p>
            </div>

            {/* Sparkline */}
            <div className="flex justify-center">
              {renderMiniChart(simResult.history, currentTotal >= budget ? '#1D9E75' : '#E24B4A', 400, 80)}
            </div>

            {/* Progress bar */}
            <div className="w-full">
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                <motion.div className="h-full rounded-full" style={{
                  background: currentTotal >= budget ? 'var(--accent)' : 'var(--danger)',
                  width: `${(globalMonth / (totalMonths - 1)) * 100}%`,
                }} />
              </div>
              <div className="flex justify-between mt-1">
                <span className="font-mono text-[9px] text-white/15">Start</span>
                <span className="font-mono text-[9px] text-white/15">{selectedEra.fyKeys.length} years</span>
              </div>
            </div>

            {/* Asset breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(ASSET_NAMES).map(([key, name]) => {
                const invested = budget * (alloc[key as keyof typeof alloc] / 100)
                const assetHistory = simResult.history.map((_, i) => {
                  const ratio = alloc[key as keyof typeof alloc] / 100
                  return (simResult.history[i] || budget) * ratio
                })
                const current = assetHistory[Math.min(globalMonth, assetHistory.length - 1)] || invested
                const pct = invested > 0 ? ((current - invested) / invested) * 100 : 0

                return (
                  <div key={key} className="rounded-2xl p-4 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                    <p className="font-sans text-xs text-white/50 mb-1">{name}</p>
                    <p className="font-display font-semibold text-sm text-white">{formatINR(current)}</p>
                    <p className="font-mono text-[10px] mt-0.5" style={{ color: pct >= 0 ? 'var(--teal)' : 'var(--danger)' }}>
                      {pct >= 0 ? '+' : ''}{pct.toFixed(1)}%
                    </p>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* ═══ REPORT ══════════════════════════════════════════════════════ */}
        {phase === 'report' && (
          <motion.div key="report" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto space-y-8">

            <div className="text-center">
              <h2 className="font-display font-bold text-3xl text-white mb-2 tracking-tight">Your Harvest Report</h2>
              <p className="font-sans text-sm text-white/40">{selectedEra.label} · {selectedEra.fyKeys.length} years · {formatINR(budget)} planted</p>
            </div>

            {/* Three-column result */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Planted */}
              <div className="rounded-3xl p-6 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <p className="font-sans text-[10px] text-white/25 uppercase tracking-wider mb-3">Planted</p>
                <p className="font-display font-bold text-2xl text-white">{formatINR(totalInvested)}</p>
                <p className="font-sans text-xs text-white/30 mt-1">{style === 'sip' ? 'Monthly SIP' : 'Lump sum'}</p>
              </div>

              {/* Harvested */}
              <div className="rounded-3xl p-6 border-2" style={{ background: 'var(--surface)', borderColor: profit >= 0 ? 'var(--teal)' : 'var(--danger)' }}>
                <p className="font-sans text-[10px] text-white/25 uppercase tracking-wider mb-3">Harvested</p>
                <p className="font-display font-bold text-2xl" style={{ color: profit >= 0 ? 'var(--teal)' : 'var(--danger)' }}>
                  {formatINR(finalTotal)}
                </p>
                <p className="font-sans text-xs mt-1" style={{ color: profit >= 0 ? 'var(--teal)' : 'var(--danger)' }}>
                  {profit >= 0 ? '+' : ''}{formatINR(profit)} ({((finalTotal / totalInvested - 1) * 100).toFixed(1)}%)
                </p>
              </div>

              {/* Final chart */}
              <div className="rounded-3xl p-6 border flex flex-col items-center justify-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <p className="font-sans text-[10px] text-white/25 uppercase tracking-wider mb-3">Growth curve</p>
                {renderMiniChart(simResult.history, profit >= 0 ? '#1D9E75' : '#E24B4A', 160, 60)}
              </div>
            </div>

            {/* KINU Insights */}
            <div className="space-y-4">
              {insightsLoading ? (
                <div className="flex items-center gap-3 py-8 justify-center">
                  <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
                  <p className="font-sans text-sm text-white/30">KINU is analysing your harvest...</p>
                </div>
              ) : (
                insights.split('|||').map((msg, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.3 }} className="flex gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(192,241,142,0.08)', border: '1px solid rgba(192,241,142,0.18)' }}>
                      <Zap className="w-4 h-4" style={{ color: 'var(--accent)' }} />
                    </div>
                    <div className="rounded-3xl p-5 border flex-1" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                      <p className="font-sans text-sm text-white/60 leading-relaxed">{msg.trim()}</p>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={resetToSetup}
                className="flex-1 py-3.5 rounded-full font-sans font-bold text-sm border active:scale-[0.97] transition-transform duration-200 flex items-center justify-center gap-2"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
                <RotateCcw className="w-3.5 h-3.5" /> Try another era
              </button>
              <button onClick={() => { saveResult(); resetToSetup() }}
                className="flex-1 py-3.5 rounded-full font-sans font-bold text-sm text-[#0a1a00] active:scale-[0.97] transition-transform duration-200 flex items-center justify-center gap-2"
                style={{ background: 'var(--accent)' }}>
                Save this harvest <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </motion.div>
  )
}
