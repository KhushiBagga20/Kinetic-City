import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { RefreshCw } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { fetchMarketNews, getFearFraming, type NewsItem } from '../../lib/newsAPI'
import { SkeletonCard } from '../Skeleton'
import { generateKinuChat } from '../../lib/kinuAI'

/* ── Category config ──────────────────────────────────────────────────────── */

const CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'market', label: 'Market' },
  { key: 'macro', label: 'Macro' },
  { key: 'sector', label: 'Sectors' },
  { key: 'commodity', label: 'Commodities' },
] as const

const CATEGORY_COLORS: Record<string, string> = {
  market: 'rgba(255,255,255,0.35)',
  macro: 'rgba(55,138,221,0.6)',
  sector: 'rgba(29,158,117,0.6)',
  commodity: 'rgba(192,241,142,0.6)',
}

const SENTIMENT_COLORS: Record<string, string> = {
  positive: 'var(--teal)',
  negative: 'var(--danger)',
  neutral: 'rgba(255,255,255,0.25)',
}

const FEAR_COLORS: Record<string, string> = {
  loss: '#E24B4A',
  jargon: '#378ADD',
  scam: '#EF9F27',
  trust: '#1D9E75',
}

/* ── Props ─────────────────────────────────────────────────────────────────── */

interface Props {
  maxItems?: number
  compact?: boolean
  fearType?: string
}

/* ── Skeleton shimmer ─────────────────────────────────────────────────────── */

function SkeletonRow() {
  return (
    <div className="px-6 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="flex items-start gap-3">
        <div className="w-2 h-2 rounded-full mt-1.5 shrink-0 skeleton-shimmer" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 rounded-lg skeleton-shimmer" style={{ background: 'rgba(255,255,255,0.04)', width: '80%' }} />
          <div className="h-2.5 rounded-lg skeleton-shimmer" style={{ background: 'rgba(255,255,255,0.03)', width: '60%' }} />
          <div className="flex gap-2">
            <div className="h-2 rounded-full skeleton-shimmer" style={{ background: 'rgba(255,255,255,0.03)', width: 48 }} />
            <div className="h-2 rounded-full skeleton-shimmer" style={{ background: 'rgba(255,255,255,0.03)', width: 40 }} />
          </div>
        </div>
        <div className="h-2.5 rounded-lg skeleton-shimmer shrink-0" style={{ background: 'rgba(255,255,255,0.03)', width: 56 }} />
      </div>
    </div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════
   MARKET NEWS FEED
   ══════════════════════════════════════════════════════════════════════════ */

export default function MarketNewsFeed({ maxItems = 5, compact: _compact = false, fearType }: Props) {
  const newsItems = useAppStore(s => s.newsItems)
  const newsLastFetched = useAppStore(s => s.newsLastFetched)

  const [items, setItems] = useState<NewsItem[]>(newsItems || [])
  const [loading, setLoading] = useState(!newsItems?.length)
  const [error, setError] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState('')
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  const ft = fearType || useAppStore.getState().fearType || 'loss'

  // AI frame cache — lazy, generated on hover with debounce, never on mount
  const [aiFrames, setAiFrames] = useState<Map<string, string>>(new Map())
  const [loadingFrames, setLoadingFrames] = useState<Set<string>>(new Set())
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const aiCallInFlight = useRef(false)  // only 1 AI call at a time from this component

  async function generateFrame(item: NewsItem) {
    const key = item.id || item.title
    // Skip if already cached, loading, or another call is in flight
    if (aiFrames.has(key) || loadingFrames.has(key) || aiCallInFlight.current) return
    aiCallInFlight.current = true
    setLoadingFrames(prev => new Set([...prev, key]))
    try {
      const data = await generateKinuChat({
        message: `News: "${item.title}". In one sentence, what does this mean for a ${ft} investor?`,
        fear_type: ft,
        context: 'news_framing',
        conversation_history: [],
      })
      setAiFrames(prev => new Map([...prev, [key, data.reply]]))
    } catch {
      setAiFrames(prev => new Map([...prev, [key, item.impact || '']]))
    } finally {
      setLoadingFrames(prev => { const s = new Set(prev); s.delete(key); return s })
      aiCallInFlight.current = false
    }
  }

  function handleMouseEnter(i: number, item: NewsItem) {
    setHoveredIdx(i)
    // Debounce: only fire AI call if user hovers for 400ms
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    hoverTimerRef.current = setTimeout(() => generateFrame(item), 400)
  }

  function handleMouseLeave() {
    setHoveredIdx(null)
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
  }

  const doFetch = useCallback(async () => {
    setRefreshing(true)
    setError(false)
    try {
      const data = await fetchMarketNews(ft)
      if (data.length > 0) {
        setItems(data)
        useAppStore.setState({ newsItems: data, newsLastFetched: Date.now() })
        setLastUpdated(new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }))
      } else if (!items.length) {
        setError(true)
      }
    } catch {
      if (!items.length) setError(true)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [ft, items.length])

  useEffect(() => {
    if (newsItems?.length) {
      setItems(newsItems)
      setLoading(false)
      setLastUpdated(newsLastFetched ? new Date(newsLastFetched).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '')
      // Refetch if stale (>15 min)
      if (Date.now() - (newsLastFetched || 0) > 900_000) {
        doFetch()
      }
    } else {
      doFetch()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = useMemo(() => {
    const base = activeCategory === 'all' ? items : items.filter(i => i.category === activeCategory)
    return base.slice(0, maxItems)
  }, [items, activeCategory, maxItems])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ scale: 1.01, boxShadow: '0 8px 32px rgba(192,241,142,0.08)', borderColor: 'rgba(192,241,142,0.15)' }}
      className="rounded-3xl border overflow-hidden transition-all duration-300"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {/* Shimmer keyframes */}
      <style>{`
        @keyframes shimmer { 0%,100% { opacity: 0.3 } 50% { opacity: 0.7 } }
        .skeleton-shimmer { animation: shimmer 1.5s infinite ease-in-out; }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between" style={{ padding: '18px 24px 14px' }}>
        <div className="flex items-center gap-2.5">
          <span className="font-sans text-[13px] font-medium uppercase tracking-wider text-white/25">Market News</span>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full rounded-full animate-ping opacity-75" style={{ background: 'var(--teal)' }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'var(--teal)' }} />
          </span>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="font-sans text-[11px] text-white/20">{lastUpdated}</span>
          )}
          <button
            onClick={doFetch}
            disabled={refreshing}
            className="w-7 h-7 rounded-full flex items-center justify-center border transition-all duration-200 hover:border-white/15"
            style={{ borderColor: 'var(--border)' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-white/30 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* ── Category pills ─────────────────────────────────────────────── */}
      <div className="flex gap-2" style={{ padding: '0 24px 14px' }}>
        {CATEGORIES.map(cat => {
          const isActive = activeCategory === cat.key
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className="px-3 py-1.5 rounded-lg font-sans text-[11px] font-medium border transition-all duration-200"
              style={{
                background: isActive ? 'rgba(192,241,142,0.06)' : 'rgba(255,255,255,0.02)',
                borderColor: isActive ? 'rgba(192,241,142,0.2)' : 'rgba(255,255,255,0.06)',
                color: isActive ? 'var(--accent)' : 'rgba(255,255,255,0.3)',
              }}
            >
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* ── News list ──────────────────────────────────────────────────── */}
      <div
        style={{
          maxHeight: 420,
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.12) transparent',
        }}
      >
        {loading ? (
          <div className="space-y-3" style={{ padding: '12px 16px' }}>
            <SkeletonCard height={80} />
            <SkeletonCard height={80} />
            <SkeletonCard height={80} />
          </div>
        ) : error ? (
          <div className="text-center py-10 px-6">
            <p className="font-sans text-sm text-white/25 mb-3">Could not load news. Tap to retry.</p>
            <button
              onClick={doFetch}
              className="font-sans text-[12px] font-medium px-4 py-2 rounded-lg border transition-colors"
              style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
            >
              Retry
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-10 px-6">
            <p className="font-sans text-sm text-white/25 mb-3">Market news unavailable right now.</p>
            <button
              onClick={doFetch}
              className="font-sans text-[12px] font-medium px-4 py-2 rounded-lg border transition-colors"
              style={{ borderColor: 'var(--border)', color: 'rgba(255,255,255,0.4)' }}
            >
              Refresh
            </button>
          </div>
        ) : (
          <AnimatePresence>
            {filtered.map((item, i) => {
              const isHovered = hoveredIdx === i
              const isLast = i === filtered.length - 1
              const fearFrame = getFearFraming(item, ft)
              const ftColor = FEAR_COLORS[ft] || 'var(--accent)'

              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="transition-[background-color] duration-150 cursor-default"
                  style={{
                    padding: '14px 24px',
                    borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,0.04)',
                    background: isHovered ? 'rgba(255,255,255,0.03)' : 'transparent',
                  }}
                  onMouseEnter={() => handleMouseEnter(i, item)}
                  onMouseLeave={handleMouseLeave}
                >
                  {/* Row 1: dot + title + time */}
                  <div className="flex items-start gap-3">
                    <div
                      className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                      style={{ background: SENTIMENT_COLORS[item.sentiment] }}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className="font-sans text-[14px] font-medium leading-snug transition-[color] duration-150"
                        style={{
                          color: isHovered ? 'var(--accent)' : 'rgba(255,255,255,0.8)',
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {item.url ? (
                          <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                            {item.title}
                          </a>
                        ) : item.title}
                      </p>
                    </div>
                    <span className="font-sans text-[11px] text-white/20 shrink-0 mt-0.5">{item.time}</span>
                  </div>

                  {/* Row 2: summary */}
                  <p
                    className="font-sans text-[12px] text-white/35 mt-1 ml-5"
                    style={{ display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                  >
                    {item.summary}
                  </p>

                  {/* Row 3: pills + impact */}
                  <div className="flex items-center gap-2 mt-2 ml-5">
                    <span
                      className="px-2 py-0.5 rounded-md font-sans text-[10px]"
                      style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)' }}
                    >
                      {item.source}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-md font-sans text-[10px]"
                      style={{ background: `${CATEGORY_COLORS[item.category] || 'rgba(255,255,255,0.2)'}15`, color: CATEGORY_COLORS[item.category] || 'rgba(255,255,255,0.3)' }}
                    >
                      {item.category}
                    </span>
                    <motion.span
                      className="font-sans text-[11px] italic ml-auto"
                      style={{ color: 'rgba(255,255,255,0.3)' }}
                      animate={{ y: isHovered ? 0 : 4, opacity: isHovered ? 1 : 0.6 }}
                      transition={{ duration: 0.15 }}
                    >
                      <span style={{ color: 'var(--accent)' }}>→ </span>{item.impact}
                    </motion.span>
                  </div>

                  {/* Fear-type framing — AI-generated lazily on hover */}
                  {isHovered && (() => {
                    const key = item.id || item.title
                    const aiText = aiFrames.get(key)
                    const isLoading = loadingFrames.has(key)
                    if (isLoading) return (
                      <div className="mt-1.5 ml-5">
                        <div className="h-2.5 w-3/4 rounded-md animate-pulse" style={{ background: 'rgba(255,255,255,0.06)' }} />
                      </div>
                    )
                    const displayText = aiText ?? fearFrame
                    if (!displayText || displayText === item.impact) return null
                    return (
                      <motion.p
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="font-sans text-[11px] mt-1.5 ml-5"
                        style={{ color: ftColor, opacity: 0.7 }}
                      >
                        {displayText}
                      </motion.p>
                    )
                  })()}
                </motion.div>
              )
            })}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  )
}
