import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef, useCallback } from 'react'
import { X, Plus, ArrowRight } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

/* ── Static KINU insights ────────────────────────────────────────────────── */

const KINU_INSIGHTS: Record<string, string> = {
  NIFTY50: 'The Nifty 50 is the single most diversified exposure to Indian equity growth. Your index fund tracks this.',
  SENSEX: "Sensex tracks India's top 30 companies. It moves nearly identically to Nifty 50 over long periods.",
  MIDCAP: 'Midcap has historically outperformed Nifty 50 over 10+ years but with significantly more volatility.',
  GOLD: 'Gold tends to rise when equity markets fall — making it a genuine diversifier, not just a tradition.',
  USDINR: 'A weakening rupee increases returns on dollar-denominated assets. It also increases import-driven inflation.',
  RELIANCE: 'Reliance Industries has the single highest weight in Nifty 50. Its movement significantly affects your index fund.',
  HDFCBANK: 'HDFC Bank is the largest private bank in India by assets. Banking sector strength directly affects this.',
  INFY: 'Infosys is a bellwether for IT sector health. When the US tech sector slows, Infosys often feels it first.',
  TCS: 'TCS is India's largest IT company by market cap. It is a defensive large-cap with steady dividend payouts.',
  ICICIBANK: 'ICICI Bank has transformed from an NPA-heavy lender to one of India's most efficient private banks.',
  BHARTIARTL: 'Bharti Airtel is a quasi-monopoly with pricing power. Telecom is a rare defensive growth sector in India.',
  ITC: 'ITC is the highest-dividend-yield Nifty stock. Its FMCG pivot is the key story to watch.',
  SBIN: 'SBI is India's largest bank by assets. Government ownership means implicit sovereign backing.',
  KOTAKBANK: 'Kotak Mahindra Bank is known for conservative lending. Lower growth but very high asset quality.',
  LT: 'L&T is India's largest infrastructure company. Its order book is a proxy for India's capex cycle.',
  AXISBANK: 'Axis Bank has shown strong retail loan growth. It is the third-largest private bank in India.',
  TATAMOTORS: 'Tata Motors is a volatile stock driven by JLR profitability. High beta — amplifies market moves.',
  WIPRO: 'Wipro is an IT mid-tier. It tends to underperform TCS and Infosys but benefits from the same IT cycle.',
  HCLTECH: 'HCL Tech is strong in infrastructure management services. Less impacted by discretionary IT spend cuts.',
  BAJFINANCE: 'Bajaj Finance is India's largest NBFC. Its stock is a high-beta proxy for Indian consumer credit growth.',
}

/* ── Simulated data generation (deterministic per symbol) ────────────────── */

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function generateSparkline(symbol: string, currentValue: number): number[] {
  const seed = hashCode(symbol)
  const points: number[] = []
  let val = currentValue * (1 - 0.02 * ((seed % 5) - 2) / 5)
  for (let i = 0; i < 7; i++) {
    const noise = (((seed * (i + 1) * 17) % 100) - 50) / 5000
    val = val * (1 + noise)
    points.push(val)
  }
  points[6] = currentValue
  return points
}

function generateStats(symbol: string, type: string): {
  week: number; month: number; high52: number; low52: number; pe?: number; sector?: string
} {
  const seed = hashCode(symbol)
  const weekChange = ((seed % 50) - 25) / 10
  const monthChange = ((seed % 80) - 40) / 10
  const baseVal = 20000 + (seed % 60000)
  return {
    week: weekChange,
    month: monthChange,
    high52: Math.round(baseVal * 1.15),
    low52: Math.round(baseVal * 0.78),
    pe: type === 'stock' ? 10 + (seed % 40) : undefined,
    sector: type === 'stock' ? ['IT', 'Banking', 'FMCG', 'Auto', 'Pharma', 'Energy', 'Infra', 'Telecom'][seed % 8] : undefined,
  }
}

/* ── SVG Sparkline ───────────────────────────────────────────────────────── */

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const width = 288
  const height = 64
  const padding = 4
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  const points = data.map((v, i) => ({
    x: padding + (i / (data.length - 1)) * (width - 2 * padding),
    y: padding + (1 - (v - min) / range) * (height - 2 * padding),
  }))

  // Build smooth bezier path
  let d = `M ${points[0].x},${points[0].y}`
  for (let i = 1; i < points.length; i++) {
    const cp1x = points[i - 1].x + (points[i].x - points[i - 1].x) * 0.4
    const cp1y = points[i - 1].y
    const cp2x = points[i].x - (points[i].x - points[i - 1].x) * 0.4
    const cp2y = points[i].y
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${points[i].x},${points[i].y}`
  }

  const fillD = d + ` L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`
  const color = positive ? '#1D9E75' : '#E24B4A'

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="w-full">
      <defs>
        <linearGradient id={`fill-${positive ? 'g' : 'r'}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.08" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillD} fill={`url(#fill-${positive ? 'g' : 'r'})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

/* ── Component ───────────────────────────────────────────────────────────── */

interface StockDetailPopupProps {
  symbol: string
  name: string
  currentValue: number
  dayChange: number
  type: 'index' | 'stock' | 'commodity' | 'currency'
  anchorRect: DOMRect
  onClose: () => void
  onNavigateLearn?: () => void
}

export default function StockDetailPopup({
  symbol, name, currentValue, dayChange, type, anchorRect, onClose, onNavigateLearn,
}: StockDetailPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null)
  const watchlist = useAppStore(s => s.watchlist)
  const toggleWatchlist = useAppStore(s => s.toggleWatchlist)
  const isWatched = watchlist.includes(symbol)

  // Position the popup
  const viewportH = window.innerHeight
  const showAbove = anchorRect.bottom > viewportH / 2
  const top = showAbove
    ? Math.max(8, anchorRect.top - 8) // will use transform to move up
    : anchorRect.bottom + 8

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) onClose()
    }
    const escHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', handler)
    document.addEventListener('keydown', escHandler)
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('keydown', escHandler)
    }
  }, [onClose])

  const sparkData = generateSparkline(symbol, currentValue)
  const positive = sparkData[6] >= sparkData[0]
  const stats = generateStats(symbol, type)
  const insight = KINU_INSIGHTS[symbol] ?? "This instrument is part of India's publicly traded markets, regulated by SEBI."

  const formatNum = useCallback((n: number): string => {
    if (n >= 100000) return `₹${(n / 100000).toFixed(2)}L`
    return `₹${n.toLocaleString('en-IN')}`
  }, [])

  return (
    <AnimatePresence>
      <motion.div
        ref={popupRef}
        initial={{ opacity: 0, scale: 0.95, y: showAbove ? 8 : -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: showAbove ? 8 : -8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className="fixed z-[200]"
        style={{
          top: showAbove ? undefined : top,
          bottom: showAbove ? viewportH - anchorRect.top + 8 : undefined,
          left: Math.min(anchorRect.left, window.innerWidth - 340),
          width: 320,
          background: 'rgba(10,10,15,0.98)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 16,
        }}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between mb-1.5">
            <p className="font-sans text-[15px] font-medium text-white">{name}</p>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-white/30">{symbol}</span>
              <button onClick={onClose} className="text-white/20 hover:text-white/50 transition-colors" style={{ minHeight: 'auto' }}>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-lg" style={{ color: 'var(--accent)' }}>
              {type === 'currency' ? `₹${currentValue.toFixed(2)}` : formatNum(currentValue)}
            </span>
            <span className="font-mono text-[13px]" style={{ color: dayChange >= 0 ? '#1D9E75' : '#E24B4A' }}>
              {dayChange >= 0 ? '+' : ''}{dayChange.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Sparkline */}
        <div className="px-4 py-3">
          <Sparkline data={sparkData} positive={positive} />
          <div className="flex justify-between mt-1">
            <span className="font-sans text-[9px] text-white/15">7 days ago</span>
            <span className="font-sans text-[9px] text-white/15">Today</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="px-4 py-3 grid grid-cols-2 gap-x-6 gap-y-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <p className="font-sans text-[10px] text-white/25 uppercase tracking-wider">1 Week</p>
            <p className="font-mono text-[13px] text-white/70">{stats.week >= 0 ? '+' : ''}{stats.week.toFixed(1)}%</p>
          </div>
          <div>
            <p className="font-sans text-[10px] text-white/25 uppercase tracking-wider">1 Month</p>
            <p className="font-mono text-[13px] text-white/70">{stats.month >= 0 ? '+' : ''}{stats.month.toFixed(1)}%</p>
          </div>
          <div>
            <p className="font-sans text-[10px] text-white/25 uppercase tracking-wider">
              {type === 'stock' ? '1 Year' : '52W High'}
            </p>
            <p className="font-mono text-[13px] text-white/70">
              {type === 'stock' && stats.pe ? `+${(stats.week * 4.2).toFixed(1)}%` : formatNum(stats.high52)}
            </p>
          </div>
          <div>
            <p className="font-sans text-[10px] text-white/25 uppercase tracking-wider">
              {type === 'stock' ? (stats.pe ? 'P/E Ratio' : '52W Low') : '52W Low'}
            </p>
            <p className="font-mono text-[13px] text-white/70">
              {type === 'stock' && stats.pe ? stats.pe.toFixed(1) : formatNum(stats.low52)}
            </p>
          </div>
        </div>

        {/* KINU insight */}
        <div className="px-4 py-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-start gap-2">
            <div className="flex items-center gap-1 shrink-0 mt-0.5">
              <div className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }} />
              <span className="font-sans text-[10px] font-bold" style={{ color: 'var(--accent)' }}>KINU</span>
            </div>
            <p className="font-sans text-[11px] text-white/40 leading-relaxed">{insight}</p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-4 pb-3.5 flex items-center gap-4">
          <button
            onClick={() => toggleWatchlist(symbol)}
            className="flex items-center gap-1 font-sans text-[11px] transition-colors"
            style={{ color: isWatched ? 'var(--accent)' : 'rgba(255,255,255,0.3)', minHeight: 'auto' }}
          >
            {isWatched ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
            {isWatched ? 'Watching' : 'Add to watchlist'}
          </button>
          {onNavigateLearn && (
            <button
              onClick={onNavigateLearn}
              className="flex items-center gap-1 font-sans text-[11px] text-white/30 hover:text-white/50 transition-colors"
              style={{ minHeight: 'auto' }}
            >
              Open in Learn <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ── Need Check icon for watched state ───────────────────────────────────── */
function Check({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}
