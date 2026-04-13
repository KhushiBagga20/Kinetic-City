import { motion } from 'framer-motion'
import { useState, useRef, useEffect, useMemo } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { Minus, Plus } from 'lucide-react'

export default function AgeAllocation() {
  const userAge = useAppStore(s => s.userAge)
  const setUserAge = useAppStore(s => s.setUserAge)
  const setDashboardSection = useAppStore(s => s.setDashboardSection)
  const [age, setAge] = useState(userAge)

  const handleAgeChange = (newAge: number) => {
    const clamped = Math.max(18, Math.min(60, newAge))
    setAge(clamped)
    setUserAge(clamped)
  }

  // Calculate allocation
  const allocation = useMemo(() => {
    const equity = Math.max(0, 100 - age)
    const goldFixed = 5
    const debt = age
    const equityAfterGold = Math.max(0, equity - goldFixed)

    let largecap: number, midcap: number, smallcap: number
    if (age < 30) {
      largecap = equityAfterGold * 0.60
      midcap = equityAfterGold * 0.30
      smallcap = equityAfterGold * 0.10
    } else if (age < 40) {
      largecap = equityAfterGold * 0.70
      midcap = equityAfterGold * 0.25
      smallcap = equityAfterGold * 0.05
    } else if (age < 50) {
      largecap = equityAfterGold * 0.85
      midcap = equityAfterGold * 0.15
      smallcap = 0
    } else {
      largecap = equityAfterGold
      midcap = 0
      smallcap = 0
    }

    return {
      largecap: Math.round(largecap),
      midcap: Math.round(midcap),
      smallcap: Math.round(smallcap),
      debt,
      gold: goldFixed,
    }
  }, [age])

  // Donut chart
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const size = canvas.width
    const cx = size / 2
    const cy = size / 2
    const radius = size / 2 - 6
    const innerRadius = radius * 0.62
    ctx.clearRect(0, 0, size, size)

    const total = allocation.largecap + allocation.midcap + allocation.smallcap + allocation.debt + allocation.gold
    const segments = [
      { pct: allocation.largecap, color: '#1D9E75' },
      { pct: allocation.midcap, color: '#c0f18e' },
      { pct: allocation.smallcap, color: '#378ADD' },
      { pct: allocation.debt, color: 'rgba(255,255,255,0.25)' },
      { pct: allocation.gold, color: '#B8956A' },
    ]

    let startAngle = -Math.PI / 2
    for (const seg of segments) {
      if (seg.pct <= 0) continue
      const sweep = (seg.pct / total) * Math.PI * 2
      ctx.beginPath()
      ctx.arc(cx, cy, radius, startAngle, startAngle + sweep)
      ctx.arc(cx, cy, innerRadius, startAngle + sweep, startAngle, true)
      ctx.closePath()
      ctx.fillStyle = seg.color
      ctx.fill()
      startAngle += sweep
    }
  }, [allocation])

  const rows = [
    { name: 'Largecap', pct: allocation.largecap, color: '#1D9E75', note: 'Stable large companies. Your anchor.' },
    { name: 'Midcap', pct: allocation.midcap, color: '#c0f18e', note: 'Growth potential with moderate risk.' },
    { name: 'Smallcap', pct: allocation.smallcap, color: '#378ADD', note: 'High growth, high volatility. Only if you can stomach swings.' },
    { name: 'Debt', pct: allocation.debt, color: 'rgba(255,255,255,0.5)', note: 'Bonds and fixed income. Your safety net.' },
    { name: 'Gold', pct: allocation.gold, color: '#B8956A', note: 'Inflation hedge. Always a small allocation.' },
  ]

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
      className="rounded-3xl p-7 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>

      <h3 className="font-display font-medium text-base text-white mb-1">Allocation for your age</h3>
      <p className="font-sans text-xs text-white/30 mb-5">Classic 100-minus-age rule</p>

      {/* Age input */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => handleAgeChange(age - 1)} className="w-8 h-8 rounded-full flex items-center justify-center border" style={{ borderColor: 'var(--border)' }}>
          <Minus className="w-3.5 h-3.5 text-white/40" />
        </button>
        <div className="text-center">
          <p className="font-display font-bold text-3xl" style={{ color: 'var(--accent)' }}>{age}</p>
          <p className="font-sans text-[9px] text-white/20">years old</p>
        </div>
        <button onClick={() => handleAgeChange(age + 1)} className="w-8 h-8 rounded-full flex items-center justify-center border" style={{ borderColor: 'var(--border)' }}>
          <Plus className="w-3.5 h-3.5 text-white/40" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[140px_1fr] gap-6">
        {/* Donut */}
        <div className="flex justify-center md:justify-start">
          <canvas ref={canvasRef} width={140} height={140} />
        </div>

        {/* Rows */}
        <div className="space-y-3">
          {rows.map(row => (
            <div key={row.name} className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: row.color }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="font-sans text-sm text-white/70">{row.name}</p>
                  <p className="font-mono text-sm" style={{ color: 'var(--accent)' }}>{row.pct}%</p>
                </div>
                <p className="font-sans text-[10px] text-white/25 truncate">{row.note}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <p className="font-sans text-sm text-white/35 mt-6 leading-relaxed">
        This is the classic 100-minus-age rule used by most wealth managers. It is a starting point, not a prescription. Your risk tolerance may differ.
      </p>

      {/* Ask KINU */}
      <button onClick={() => setDashboardSection('kinu')}
        className="font-sans text-[10px] mt-3 transition-[color] duration-200 hover:text-white/40"
        style={{ color: 'var(--accent)' }}>
        Ask KINU to customise this for me →
      </button>
    </motion.div>
  )
}
