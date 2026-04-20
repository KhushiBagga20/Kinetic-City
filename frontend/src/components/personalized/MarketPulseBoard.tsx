import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Search, X, Wifi, WifiOff } from 'lucide-react'
import { useLiveMarket, type QuoteData, type DataSource } from '../../hooks/useLiveMarket'
import StockDetail from './market/StockDetail'

/* ── Token map ───────────────────────────────────────────────────────────── */

interface WatchlistItem {
  symbol: string; token: string; exch: string; type: 'index' | 'stock'
}

const DEFAULT_WATCHLIST: WatchlistItem[] = [
  { symbol: 'NIFTY 50',   token: '11630', exch: 'NSE', type: 'index' },
  { symbol: 'BANK NIFTY', token: '26000', exch: 'NSE', type: 'index' },
  { symbol: 'SENSEX',     token: '1',     exch: 'BSE', type: 'index' },
  { symbol: 'RELIANCE',   token: '2885',  exch: 'NSE', type: 'stock' },
  { symbol: 'HDFC BANK',  token: '1333',  exch: 'NSE', type: 'stock' },
  { symbol: 'INFOSYS',    token: '1594',  exch: 'NSE', type: 'stock' },
  { symbol: 'TCS',        token: '11536', exch: 'NSE', type: 'stock' },
  { symbol: 'ICICI BANK', token: '4963',  exch: 'NSE', type: 'stock' },
]

/* ── Mini sparkline ──────────────────────────────────────────────────────── */

function Sparkline({ data, up }: { data: number[]; up: boolean }) {
  if (data.length < 2) return null
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1
  const w = 48, h = 20
  const pts = data.map((v, i) => ({ x: (i / (data.length - 1)) * w, y: h - ((v - min) / range) * (h - 4) - 2 }))
  let d = `M ${pts[0].x},${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const p = pts[i - 1], c = pts[i]
    d += ` C ${p.x + (c.x - p.x) * 0.4},${p.y} ${p.x + (c.x - p.x) * 0.6},${c.y} ${c.x},${c.y}`
  }
  return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="shrink-0"><path d={d} fill="none" stroke={up ? '#1D9E75' : '#E24B4A'} strokeWidth="1.5" strokeLinecap="round" /></svg>
}

/* ── Price formatter ─────────────────────────────────────────────────────── */

function fmtPrice(v: string | undefined): string {
  if (!v || v === 'nan' || v === 'NaN' || v === 'undefined') return '—'
  const n = parseFloat(v)
  if (isNaN(n) || !isFinite(n)) return '—'
  return `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/* ══════════════════════════════════════════════════════════════════════════
   MARKET PULSE BOARD — Full Stock Terminal
   ══════════════════════════════════════════════════════════════════════════ */

export default function MarketPulseBoard() {
  const { quotes, connected, dataSource, fetchCandles, searchScrip, fetchQuote } = useLiveMarket()

  const [watchlist, setWatchlist] = useState<WatchlistItem[]>(DEFAULT_WATCHLIST)
  const [selectedToken, setSelectedToken] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Array<{ tsym: string; token: string; exch: string; cname: string }>>([])
  const [showSearch, setShowSearch] = useState(false)
  const [showMobileDetail, setShowMobileDetail] = useState(false)

  // Rolling sparkline data per token (last 8 LTPs)
  const sparkData = useRef<Record<string, number[]>>({})

  // Track LTP changes for sparklines
  useEffect(() => {
    for (const item of watchlist) {
      const lp = quotes[item.token]?.lp
      if (!lp) continue
      const n = parseFloat(lp)
      if (isNaN(n)) continue
      const arr = sparkData.current[item.token] || []
      if (arr.length === 0 || arr[arr.length - 1] !== n) {
        sparkData.current[item.token] = [...arr.slice(-7), n]
      }
    }
  }, [quotes, watchlist])

  // REST polling fallback when WS is disconnected
  // Polls the selected token AND all search-added (non-default) tokens
  useEffect(() => {
    if (connected) return

    // Collect tokens we need to poll: selected + any non-default watchlist items
    const defaultTokens = new Set(DEFAULT_WATCHLIST.map(w => w.token))
    const extraItems = watchlist.filter(w => !defaultTokens.has(w.token))

    const poll = setInterval(() => {
      // Poll selected token
      const sel = watchlist.find(w => w.token === selectedToken)
      if (sel) fetchQuote(sel.exch, sel.token)
      // Poll all search-added stocks so their prices stay updated
      for (const item of extraItems) {
        if (item.token !== selectedToken) fetchQuote(item.exch, item.token)
      }
    }, 5000)
    return () => clearInterval(poll)
  }, [connected, selectedToken, watchlist, fetchQuote])

  // Debounced search
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handleSearch = useCallback((q: string) => {
    setSearchQuery(q)
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (!q.trim()) { setSearchResults([]); return }
    searchTimer.current = setTimeout(async () => {
      const results = await searchScrip(q, 'NSE')
      setSearchResults(results)
    }, 400)
  }, [searchScrip])

  const addToWatchlist = useCallback((result: { tsym: string; token: string; exch: string }) => {
    if (watchlist.some(w => w.token === result.token && w.exch === result.exch)) {
      setSelectedToken(result.token)
    } else {
      setWatchlist(prev => [...prev, { symbol: result.tsym, token: result.token, exch: result.exch, type: 'stock' }])
      setSelectedToken(result.token)
    }
    // Immediately fetch quote so price + detail appear right away
    fetchQuote(result.exch, result.token)
    setSearchQuery(''); setSearchResults([]); setShowSearch(false)
  }, [watchlist, fetchQuote])

  const selectedItem = useMemo(() => watchlist.find(w => w.token === selectedToken), [watchlist, selectedToken])

  // Filter existing watchlist by search query (instant, client-side)
  const filteredWatchlist = useMemo(() => {
    if (!searchQuery.trim()) return watchlist
    const q = searchQuery.trim().toLowerCase()
    return watchlist.filter(w => w.symbol.toLowerCase().includes(q))
  }, [watchlist, searchQuery])

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
      className="rounded-3xl border overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>

      <div className="flex flex-col md:flex-row" style={{ minHeight: 680 }}>

        {/* ── LEFT PANEL — Watchlist ──────────────────────────────────────── */}
        <div className={`flex-none md:w-72 border-r flex flex-col ${showMobileDetail ? 'hidden md:block' : ''}`}
          style={{ borderColor: 'rgba(255,255,255,0.06)' }}>

          {/* Header */}
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] uppercase tracking-widest text-white/30 font-medium">Market</span>
              {/* Data source badge */}
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }}>
                {dataSource === 'shoonya' ? (
                  <>
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping" style={{ background: '#c0f18e' }} />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: '#c0f18e' }} />
                    </span>
                    <span className="text-[9px] font-medium" style={{ color: '#c0f18e' }}>LIVE</span>
                  </>
                ) : dataSource === 'yfinance' ? (
                  <>
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5" style={{ background: '#F59E0B' }} />
                    </span>
                    <span className="text-[9px] font-medium" style={{ color: '#F59E0B' }}>DELAYED · 15 min</span>
                  </>
                ) : (
                  <>
                    <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
                    <span className="text-[9px] text-white/25">OFFLINE</span>
                  </>
                )}
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <Search className="w-3.5 h-3.5 text-white/20 shrink-0" />
                <input value={searchQuery} onChange={e => handleSearch(e.target.value)}
                  onFocus={() => setShowSearch(true)}
                  onKeyDown={e => e.key === 'Escape' && (setShowSearch(false), setSearchResults([]))}
                  placeholder="Search stocks…" className="bg-transparent text-[12px] text-white/80 w-full outline-none placeholder:text-white/20" />
                {searchQuery && (
                  <button onClick={() => { setSearchQuery(''); setSearchResults([]); setShowSearch(false) }}>
                    <X className="w-3 h-3 text-white/20 hover:text-white/40" />
                  </button>
                )}
              </div>

              {/* Search dropdown */}
              <AnimatePresence>
                {showSearch && searchResults.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-20"
                    style={{ background: 'rgba(10,20,25,0.98)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}>
                    {searchResults.map(r => (
                      <button key={`${r.exch}-${r.token}`} onClick={() => addToWatchlist(r)}
                        className="flex items-center justify-between w-full px-3 py-2 text-left hover:bg-white/[0.03] transition-colors">
                        <div>
                          <span className="text-[12px] text-white/80 font-medium">{r.tsym}</span>
                          {r.cname && <p className="text-[10px] text-white/25 truncate max-w-[180px]">{r.cname}</p>}
                        </div>
                        <span className="text-[8px] font-bold uppercase px-1.5 py-0.5 rounded" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)' }}>{r.exch}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Watchlist items */}
          <div className="px-2 pb-3 overflow-y-auto flex-1" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.06) transparent' }}>
            {filteredWatchlist.length === 0 && searchQuery.trim() ? (
              <div className="px-3 py-4 text-center">
                <p className="text-[12px] text-white/25">No matches in watchlist</p>
                <p className="text-[10px] text-white/15 mt-1">Results above will add a new stock</p>
              </div>
            ) : null}
            {filteredWatchlist.map((item, i) => {
              const q = quotes[item.token]
              const lp = q?.lp
              const pc = q?.pc
              const isUp = pc ? parseFloat(pc) >= 0 : true
              const active = selectedToken === item.token
              const spark = sparkData.current[item.token] || []

              return (
                <motion.button key={`${item.exch}-${item.token}`}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                  onClick={() => { setSelectedToken(item.token); setShowMobileDetail(true) }}
                  className="flex items-center w-full px-3 py-2.5 rounded-xl transition-all duration-150"
                  style={{
                    background: active ? 'rgba(192,241,142,0.06)' : 'transparent',
                    borderLeft: active ? '2px solid #c0f18e' : '2px solid transparent',
                  }}>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[13px] font-medium text-white truncate">{item.symbol}</span>
                      <span className="text-[8px] font-bold uppercase px-1 py-px rounded"
                        style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.25)' }}>{item.exch}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {lp ? (
                      <>
                        <Sparkline data={spark} up={isUp} />
                        <div className="text-right">
                          <p className="text-[12px] font-mono tabular-nums text-white/80">{fmtPrice(lp)}</p>
                          <p className="text-[10px] font-mono tabular-nums" style={{ color: isUp ? '#1D9E75' : '#E24B4A' }}>
                            {(() => {
                              const pct = parseFloat(pc || '0')
                              return (isNaN(pct) || !isFinite(pct)) ? '0.00%' : `${isUp ? '+' : ''}${pct.toFixed(2)}%`
                            })()}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col gap-1 items-end">
                        <div className="h-3 w-16 rounded" style={{ background: 'linear-gradient(90deg,rgba(255,255,255,0.03) 25%,rgba(255,255,255,0.07) 50%,rgba(255,255,255,0.03) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
                        <div className="h-2.5 w-10 rounded" style={{ background: 'linear-gradient(90deg,rgba(255,255,255,0.03) 25%,rgba(255,255,255,0.07) 50%,rgba(255,255,255,0.03) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite' }} />
                      </div>
                    )}
                  </div>
                </motion.button>
              )
            })}
          </div>
        </div>

        {/* ── RIGHT PANEL — Detail ───────────────────────────────────────── */}
        <div className={`flex-1 p-5 ${!showMobileDetail ? 'hidden md:block' : ''}`}>
          <AnimatePresence mode="wait">
            {selectedItem ? (
              <StockDetail
                key={selectedItem.token}
                symbol={selectedItem.symbol}
                token={selectedItem.token}
                exchange={selectedItem.exch}
                quote={quotes[selectedItem.token]}
                fetchCandles={fetchCandles}
                onBack={() => setShowMobileDetail(false)}
              />
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center gap-3 text-center py-20">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  {connected ? <Wifi className="w-5 h-5 text-white/15" /> : <WifiOff className="w-5 h-5 text-white/15" />}
                </div>
                <p className="text-[14px] text-white/30 font-medium">Select a stock to view details</p>
                <p className="text-[11px] text-white/15">Click any item in the watchlist</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
