import { motion, useMotionValue, useTransform, animate, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef, useCallback } from 'react'
import { X } from 'lucide-react'

/* ── Market indicators ───────────────────────────────────────────────────── */

interface Indicator {
  name: string
  baseValue: number
  format: (v: number) => string
  noiseRange: number        // ±% per tick
  explanation: string       // fear-framed educational blurb
}

const INDICATORS: Indicator[] = [
  { name: 'Nifty 50',     baseValue: 24198, format: v => v.toLocaleString('en-IN', { maximumFractionDigits: 0 }), noiseRange: 0.3, explanation: 'The Nifty 50 tracks India\'s 50 largest companies by market cap. When you invest via an index fund, this is exactly what your money copies. No human picks stocks — just math.' },
  { name: 'Sensex',       baseValue: 79442, format: v => v.toLocaleString('en-IN', { maximumFractionDigits: 0 }), noiseRange: 0.3, explanation: 'The Sensex tracks the top 30 companies on the BSE. It\'s the oldest index in India and moves similarly to Nifty 50. If one is up, the other almost always is too.' },
  { name: 'Midcap 150',   baseValue: 11024, format: v => v.toLocaleString('en-IN', { maximumFractionDigits: 0 }), noiseRange: 0.3, explanation: 'Midcap companies are mid-sized — they grow faster than large caps but swing more. Higher reward, higher volatility. Good for long-term (7+ year) investors.' },
  { name: 'Gold (₹/g)',   baseValue: 7842,  format: v => `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, noiseRange: 0.1, explanation: 'Gold is a hedge — it tends to rise when equity falls. Many investors keep 5–10% in gold ETFs for stability. It doesn\'t compound like equity, but it protects.' },
  { name: 'USD/INR',      baseValue: 83.4,  format: v => v.toFixed(2), noiseRange: 0.1, explanation: 'The rupee-dollar rate affects import costs and IT sector earnings. A weaker rupee boosts IT stocks (they earn in dollars) but raises fuel and import prices.' },
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

function MiniSparkline({ data, up, width = 60, height = 24 }: { data: number[]; up: boolean; width?: number; height?: number }) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const w = width
  const h = height

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

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
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

  const selectedInd = selectedIdx !== null ? INDICATORS[selectedIdx] : null
  const selectedState = selectedIdx !== null ? state[selectedIdx] : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      whileHover={{ scale: 1.01, boxShadow: '0 8px 32px rgba(192,241,142,0.08)', borderColor: 'rgba(192,241,142,0.2)' }}
      className="rounded-3xl border transition-all duration-300"
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

      {/* Rows — each clickable */}
      <div className="space-y-0">
        {INDICATORS.map((ind, i) => {
          const s = state[i]
          const up = s.changePct >= 0
          return (
            <div key={ind.name}>
              {i > 0 && <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '0' }} />}
              <button
                onClick={() => setSelectedIdx(i)}
                className="flex items-center py-3 w-full text-left transition-[background-color] duration-150 rounded-lg -mx-2 px-2 hover:bg-[rgba(255,255,255,0.03)]"
                style={{ gap: 12 }}
              >
                <span className="font-sans text-[14px] text-white/60 font-medium flex-1 min-w-0 truncate">{ind.name}</span>
                <AnimatedValue value={s.current} formatter={ind.format} up={up} />
                <span className="font-mono text-[12px] w-[56px] text-right tabular-nums" style={{ color: up ? 'var(--teal)' : 'var(--danger)' }}>
                  {up ? '+' : ''}{s.changePct.toFixed(1)}%
                </span>
                <MiniSparkline data={s.history} up={up} />
              </button>
            </div>
          )
        })}
      </div>

      {/* Disclaimer */}
      <p className="font-sans text-[10px] text-white/15 mt-3">
        All values simulated for educational purposes. Not real-time data.
      </p>

      {/* ── Stock Detail Popup Overlay ───────────────────────────────── */}
      <AnimatePresence>
        {selectedInd && selectedState && selectedIdx !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[300] flex items-center justify-center p-6"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
            onClick={() => setSelectedIdx(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="max-w-md w-full rounded-3xl p-7 border"
              style={{
                background: 'rgba(10,10,15,0.96)',
                backdropFilter: 'blur(24px)',
                borderColor: 'var(--border)',
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setSelectedIdx(null)}
                className="absolute top-4 right-4 text-white/20 hover:text-white/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Name + Value */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-semibold text-xl text-white">{selectedInd.name}</h3>
                <span className={`font-mono text-sm font-bold ${selectedState.changePct >= 0 ? 'text-[var(--teal)]' : 'text-[var(--danger)]'}`}>
                  {selectedState.changePct >= 0 ? '+' : ''}{selectedState.changePct.toFixed(2)}%
                </span>
              </div>

              {/* Current value */}
              <p className="font-display font-bold text-3xl mb-5" style={{ color: selectedState.changePct >= 0 ? 'var(--teal)' : 'var(--danger)' }}>
                {selectedInd.format(selectedState.current)}
              </p>

              {/* Larger sparkline */}
              <div className="mb-5 flex justify-center">
                <MiniSparkline data={selectedState.history} up={selectedState.changePct >= 0} width={280} height={60} />
              </div>

              {/* Explanation */}
              <div className="rounded-2xl p-4 border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'var(--border)' }}>
                <p className="font-sans text-[13px] text-white/50 leading-relaxed">
                  {selectedInd.explanation}
                </p>
              </div>

              {/* Dismiss */}
              <button
                onClick={() => setSelectedIdx(null)}
                className="w-full mt-4 py-3 rounded-full font-sans text-sm font-medium text-white/40 hover:text-white/60 transition-colors"
              >
                Got it
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
