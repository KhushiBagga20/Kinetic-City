import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useState, useEffect, useRef, useCallback } from 'react'

/* ── Market indicators ───────────────────────────────────────────────────── */

interface Indicator {
  name: string
  baseValue: number
  format: (v: number) => string
  noiseRange: number        // ±% per tick
}

const INDICATORS: Indicator[] = [
  { name: 'Nifty 50',     baseValue: 24198, format: v => v.toLocaleString('en-IN', { maximumFractionDigits: 0 }), noiseRange: 0.3 },
  { name: 'Sensex',       baseValue: 79442, format: v => v.toLocaleString('en-IN', { maximumFractionDigits: 0 }), noiseRange: 0.3 },
  { name: 'Midcap 150',   baseValue: 11024, format: v => v.toLocaleString('en-IN', { maximumFractionDigits: 0 }), noiseRange: 0.3 },
  { name: 'Gold (₹/g)',   baseValue: 7842,  format: v => `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, noiseRange: 0.1 },
  { name: 'USD/INR',      baseValue: 83.4,  format: v => v.toFixed(2), noiseRange: 0.1 },
]

/* ── Seed-based initial history ──────────────────────────────────────────── */

function seedHistory(base: number, noise: number): number[] {
  const pts: number[] = []
  let v = base
  for (let i = 0; i < 7; i++) {
    const delta = (Math.random() - 0.5) * 2 * (noise / 100) * v
    v += delta
    pts.push(v)
  }
  return pts
}

/* ── Mini sparkline SVG ──────────────────────────────────────────────────── */

function MiniSparkline({ data, up }: { data: number[]; up: boolean }) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = 60
  const h = 24

  const points = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: h - ((v - min) / range) * (h - 4) - 2,
  }))

  // Cubic bezier path
  let d = `M ${points[0].x},${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const cpx1 = prev.x + (curr.x - prev.x) * 0.4
    const cpx2 = prev.x + (curr.x - prev.x) * 0.6
    d += ` C ${cpx1},${prev.y} ${cpx2},${curr.y} ${curr.x},${curr.y}`
  }

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0">
      <path d={d} fill="none" stroke={up ? 'var(--teal)' : 'var(--danger)'} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/* ── Animated number display ─────────────────────────────────────────────── */

function AnimatedValue({ value, formatter, up }: { value: number; formatter: (v: number) => string; up: boolean }) {
  const mv = useMotionValue(value)
  const display = useTransform(mv, v => formatter(v))
  const [text, setText] = useState(formatter(value))

  useEffect(() => {
    const controls = animate(mv, value, { duration: 0.8, ease: 'easeOut' })
    const unsub = display.on('change', v => setText(v))
    return () => { controls.stop(); unsub() }
  }, [value, mv, display])

  return (
    <span className="font-mono text-[14px] tabular-nums" style={{ color: up ? 'var(--teal)' : 'var(--danger)' }}>
      {text}
    </span>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   MARKET PULSE BOARD
   ══════════════════════════════════════════════════════════════════════════ */

export default function MarketPulseBoard() {
  // State for each indicator: current value, change%, history
  const [state, setState] = useState(() =>
    INDICATORS.map(ind => {
      const history = seedHistory(ind.baseValue, ind.noiseRange)
      const current = history[history.length - 1]
      const prev = history[history.length - 2]
      return {
        current,
        changePct: ((current - prev) / prev) * 100,
        history,
      }
    })
  )

  const intervalRef = useRef<ReturnType<typeof setInterval>>(null)

  const tick = useCallback(() => {
    setState(prev =>
      prev.map((s, i) => {
        const ind = INDICATORS[i]
        const delta = (Math.random() - 0.5) * 2 * (ind.noiseRange / 100) * s.current
        const next = s.current + delta
        const changePct = ((next - s.current) / s.current) * 100
        const newHistory = [...s.history.slice(-6), next]
        return { current: next, changePct, history: newHistory }
      })
    )
  }, [])

  useEffect(() => {
    intervalRef.current = setInterval(tick, 30_000) // every 30 seconds
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [tick])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="rounded-3xl border"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        padding: '20px 24px',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <p className="font-sans text-[11px] font-medium uppercase tracking-wider text-white/25">Market Pulse</p>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ background: 'var(--teal)' }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'var(--teal)' }} />
          </span>
          <span className="font-sans text-[10px] text-white/30">LIVE · Simulated</span>
        </div>
      </div>

      {/* Rows */}
      <div className="space-y-0">
        {INDICATORS.map((ind, i) => {
          const s = state[i]
          const up = s.changePct >= 0
          return (
            <div key={ind.name}>
              {i > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '0' }} />}
              <div className="flex items-center py-3" style={{ gap: 12 }}>
                <span className="font-sans text-[14px] text-white/60 font-medium flex-1 min-w-0 truncate">{ind.name}</span>
                <AnimatedValue value={s.current} formatter={ind.format} up={up} />
                <span className="font-mono text-[12px] w-[56px] text-right tabular-nums" style={{ color: up ? 'var(--teal)' : 'var(--danger)' }}>
                  {up ? '+' : ''}{s.changePct.toFixed(1)}%
                </span>
                <MiniSparkline data={s.history} up={up} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Disclaimer */}
      <p className="font-sans text-[10px] text-white/15 mt-3">
        All values simulated for educational purposes. Not real-time data.
      </p>
    </motion.div>
  )
}
