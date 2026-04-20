import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback, useRef } from 'react'
import { RefreshCw } from 'lucide-react'
import type { QuoteData, CandleData } from '../../../hooks/useLiveMarket'
import { useAppStore } from '../../../store/useAppStore'
import CandleChart from './CandleChart'

const API_BASE = (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8000'

function formatIndian(val: string | undefined): string {
  if (!val || val === 'nan' || val === 'NaN' || val === 'undefined') return '—'
  const n = parseFloat(val)
  if (isNaN(n) || !isFinite(n)) return '—'
  if (n >= 1_00_00_000) return `${(n / 1_00_00_000).toFixed(2)}Cr`
  if (n >= 1_00_000) return `${(n / 1_00_000).toFixed(2)}L`
  return n.toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

function formatPrice(val: string | undefined): string {
  if (!val || val === 'nan' || val === 'NaN' || val === 'undefined') return '—'
  const n = parseFloat(val)
  if (isNaN(n) || !isFinite(n)) return '—'
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

interface Props {
  symbol: string
  token: string
  exchange: string
  quote?: QuoteData
  fetchCandles: (exch: string, tok: string, intv: string, days: number) => Promise<CandleData[]>
  onBack: () => void
}

export default function StockDetail({ symbol, token, exchange, quote, fetchCandles, onBack }: Props) {
  const fearType = useAppStore(s => s.fearType)
  const [kinuText, setKinuText] = useState('')
  const [kinuLoading, setKinuLoading] = useState(false)
  const [flash, setFlash] = useState<'up' | 'down' | null>(null)
  const prevLp = useRef(quote?.lp)

  const lp = quote?.lp
  const pc = quote?.pc
  const isUp = pc ? parseFloat(pc) >= 0 : true

  // Price flash effect
  useEffect(() => {
    if (!lp || lp === prevLp.current) return
    const prev = parseFloat(prevLp.current || '0')
    const curr = parseFloat(lp)
    if (curr > prev) setFlash('up')
    else if (curr < prev) setFlash('down')
    prevLp.current = lp
    const t = setTimeout(() => setFlash(null), 600)
    return () => clearTimeout(t)
  }, [lp])

  // KINU analysis fetch
  const fetchKinu = useCallback(async () => {
    if (!lp) return
    setKinuLoading(true)
    try {
      const prompt = `In 2 sentences, what should a ${fearType || 'cautious'} investor know about ${symbol} right now? Current price ₹${lp}, change ${pc || '0'}% today.`
      const resp = await fetch(`${API_BASE}/api/mentor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: prompt, fear_type: fearType || 'loss', metaphor_style: 'professional' }),
      })
      const data = await resp.json()
      setKinuText(data.reply || data.response || 'Analysis unavailable.')
    } catch {
      setKinuText('Could not fetch analysis right now.')
    }
    setKinuLoading(false)
  }, [symbol, lp, pc, fearType])

  useEffect(() => {
    if (lp) fetchKinu()
  }, [symbol]) // Only on token change, not every tick

  const ohlcItems = [
    { label: 'Open', value: formatPrice(quote?.o) },
    { label: 'High', value: formatPrice(quote?.h) },
    { label: 'Low', value: formatPrice(quote?.l) },
    { label: 'Close', value: formatPrice(quote?.c) },
  ]

  const statsGrid = [
    { label: 'Volume', value: formatIndian(quote?.v) },
    { label: 'Avg Price', value: formatPrice(quote?.ap) },
    { label: 'Prev Close', value: formatPrice(quote?.c) },
    { label: 'Day Range', value: quote?.l && quote?.h ? `${formatPrice(quote.l)} – ${formatPrice(quote.h)}` : '—' },
    { label: 'P/E Ratio', value: '—', sub: 'Coming soon' },
    { label: '52W Range', value: '—', sub: 'Coming soon' },
  ]

  return (
    <motion.div initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }} className="flex flex-col gap-5 min-h-0 overflow-y-auto pr-1"
      style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>

      {/* Back button (mobile) */}
      <button onClick={onBack} className="md:hidden flex items-center gap-1.5 text-[12px] text-white/30 hover:text-white/50 mb-1">
        ← Back to watchlist
      </button>

      {/* SECTION A — Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h2 className="font-display font-bold text-2xl text-white">{symbol}</h2>
          <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded"
            style={{ background: 'rgba(192,241,142,0.08)', color: '#c0f18e' }}>{exchange}</span>
        </div>
        <div className="flex items-baseline gap-3 mb-3">
          <span className={`font-display text-4xl font-bold transition-colors duration-300 ${flash === 'up' ? 'text-[#1D9E75]' : flash === 'down' ? 'text-[#E24B4A]' : ''}`}
            style={!flash ? { color: isUp ? '#1D9E75' : '#E24B4A' } : undefined}>
            {formatPrice(lp)}
          </span>
          {pc && (
            <span className="text-[14px] font-mono font-semibold" style={{ color: isUp ? '#1D9E75' : '#E24B4A' }}>
              {isUp ? '+' : ''}{parseFloat(pc).toFixed(2)}%
            </span>
          )}
        </div>
        {/* OHLC pills */}
        <div className="flex flex-wrap gap-2">
          {ohlcItems.map(item => (
            <div key={item.label} className="px-2.5 py-1 rounded-lg" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
              <span className="text-[9px] text-white/25 uppercase mr-1.5">{item.label}</span>
              <span className="text-[12px] text-white/70 font-mono">{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION B — Chart */}
      <CandleChart exchange={exchange} token={token} lp={lp} fetchCandles={fetchCandles} />

      {/* SECTION C — Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {statsGrid.map(s => (
          <div key={s.label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-[9px] text-white/25 uppercase tracking-wide mb-1">{s.label}</p>
            <p className="text-[14px] text-white/80 font-mono">{s.value}</p>
            {s.sub && <p className="text-[9px] text-white/15 mt-0.5">{s.sub}</p>}
          </div>
        ))}
      </div>

      {/* SECTION D — KINU Analysis */}
      <div className="rounded-xl p-4" style={{ background: 'rgba(192,241,142,0.03)', border: '1px solid rgba(192,241,142,0.08)' }}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(192,241,142,0.15)' }}>
              <span className="text-[11px] font-bold" style={{ color: '#c0f18e' }}>K</span>
            </div>
            <span className="text-[12px] font-semibold text-white/60">KINU's Take</span>
          </div>
          <button onClick={fetchKinu} className="text-white/20 hover:text-white/50 transition-colors" title="Refresh">
            <RefreshCw className={`w-3.5 h-3.5 ${kinuLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
        {kinuLoading ? (
          <div className="space-y-2">
            {[100, 85, 60].map((w, i) => (
              <div key={i} className="h-3 rounded" style={{ width: `${w}%`, background: 'linear-gradient(90deg,rgba(255,255,255,0.03) 25%,rgba(255,255,255,0.07) 50%,rgba(255,255,255,0.03) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
            ))}
          </div>
        ) : (
          <p className="text-[13px] text-white/70 leading-relaxed">{kinuText || 'Select a stock with live data to see analysis.'}</p>
        )}
      </div>
    </motion.div>
  )
}
