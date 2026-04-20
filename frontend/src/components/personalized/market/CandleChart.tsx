import { useEffect, useRef, useState } from 'react'
import { createChart, type IChartApi, type ISeriesApi, CandlestickSeries, AreaSeries, ColorType } from 'lightweight-charts'
import type { CandleData } from '../../../hooks/useLiveMarket'

const INTERVALS = [
  { label: '1D',  interval: '5',   days: 1   },
  { label: '5D',  interval: '15',  days: 5   },
  { label: '1M',  interval: '60',  days: 30  },
  { label: '6M',  interval: '240', days: 180 },
  { label: 'YTD', interval: '240', days: 0   },
]

interface Props {
  exchange: string
  token: string
  lp?: string
  fetchCandles: (exch: string, tok: string, intv: string, days: number) => Promise<CandleData[]>
}

export default function CandleChart({ exchange, token, lp, fetchCandles }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | ISeriesApi<'Area'> | null>(null)
  const [activeIdx, setActiveIdx] = useState(0) // Default to '1D'
  const [loading, setLoading] = useState(true)

  // Create chart once on mount
  useEffect(() => {
    if (!containerRef.current) return
    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 280,
      layout: { background: { type: ColorType.Solid, color: 'transparent' }, textColor: 'rgba(255,255,255,0.4)', fontSize: 11 },
      grid: { vertLines: { color: 'rgba(255,255,255,0.04)' }, horzLines: { color: 'rgba(255,255,255,0.04)' } },
      crosshair: { vertLine: { color: 'rgba(192,241,142,0.2)' }, horzLine: { color: 'rgba(192,241,142,0.2)' } },
      timeScale: { borderColor: 'rgba(255,255,255,0.06)', timeVisible: true },
      rightPriceScale: { borderColor: 'rgba(255,255,255,0.06)' },
    })
    chartRef.current = chart

    const ro = new ResizeObserver(entries => {
      for (const e of entries) chart.applyOptions({ width: e.contentRect.width })
    })
    ro.observe(containerRef.current)

    return () => { ro.disconnect(); chart.remove(); chartRef.current = null; seriesRef.current = null }
  }, [])

  // Fetch candles when token or interval changes
  useEffect(() => {
    let cancelled = false
    const cfg = INTERVALS[activeIdx]
    setLoading(true)

    const ytdDays = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 86400000
    )
    const daysToFetch = cfg.label === 'YTD' ? ytdDays : cfg.days

    fetchCandles(exchange, token, cfg.interval, daysToFetch).then(candles => {
      if (cancelled || !chartRef.current) return

      if (seriesRef.current) {
        try { chartRef.current.removeSeries(seriesRef.current) } catch {}
        seriesRef.current = null
      }

      if (!candles || candles.length === 0) {
        setLoading(false)
        return
      }

      const valid = candles
        .filter(c => c.time && !isNaN((c as any).open ?? c.o) && !isNaN((c as any).close ?? c.c))
        .map(c => ({
          time: c.time > 1e12 ? Math.floor(c.time / 1000) : c.time,
          open:  parseFloat((c as any).open  ?? c.o),
          high:  parseFloat((c as any).high  ?? c.h),
          low:   parseFloat((c as any).low   ?? c.l),
          close: parseFloat((c as any).close ?? c.c),
        }))
        .sort((a, b) => a.time - b.time)
        .filter((c, i, arr) => i === 0 || c.time !== arr[i-1].time)

      if (valid.length === 0) {
        setLoading(false)
        return
      }

      const isArea = cfg.label === '1D'

      if (isArea) {
        const areaSeries = chartRef.current.addSeries(AreaSeries, {
          lineColor: '#1D9E75',
          topColor: 'rgba(29, 158, 117, 0.4)',
          bottomColor: 'rgba(29, 158, 117, 0.0)',
          priceLineColor: '#1D9E75',
        })
        seriesRef.current = areaSeries
        
        const mapped = valid.map(c => ({ time: c.time as any, value: c.close }))
        areaSeries.setData(mapped)
      } else {
        const candleSeries = chartRef.current.addSeries(CandlestickSeries, {
          upColor: '#1D9E75', downColor: '#E24B4A',
          wickUpColor: '#1D9E75', wickDownColor: '#E24B4A',
          borderVisible: false,
        })
        seriesRef.current = candleSeries
        
        const mapped = valid.map(c => ({ time: c.time as any, open: c.open, high: c.high, low: c.low, close: c.close }))
        candleSeries.setData(mapped)
      }

      try { chartRef.current.timeScale().fitContent() } catch {}
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [exchange, token, activeIdx, fetchCandles])

  // Update last candle close on live tick
  useEffect(() => {
    if (!chartRef.current || !lp || !seriesRef.current) return
    const price = parseFloat(lp)
    if (isNaN(price)) return
    
    const cfg = INTERVALS[activeIdx]
    const timeVal = Math.floor(Date.now() / 1000) as any
    if (cfg.label === '1D') {
      try { (seriesRef.current as ISeriesApi<'Area'>).update({ time: timeVal, value: price }) } catch {}
    } else {
      try { (seriesRef.current as ISeriesApi<'Candlestick'>).update({ time: timeVal, open: price, high: price, low: price, close: price }) } catch {}
    }
  }, [lp, activeIdx])

  return (
    <div>
      {/* Interval tabs */}
      <div className="flex gap-1 mb-3">
        {INTERVALS.map((intv, i) => (
          <button key={intv.label} onClick={() => setActiveIdx(i)}
            className="px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all duration-200"
            style={{
              background: i === activeIdx ? 'rgba(192,241,142,0.1)' : 'rgba(255,255,255,0.03)',
              color: i === activeIdx ? '#c0f18e' : 'rgba(255,255,255,0.35)',
              border: `1px solid ${i === activeIdx ? 'rgba(192,241,142,0.2)' : 'rgba(255,255,255,0.06)'}`,
            }}>
            {intv.label}
          </button>
        ))}
      </div>

      {/* Chart container */}
      <div className="relative rounded-xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center" style={{ background: 'rgba(0,22,27,0.8)' }}>
            <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(192,241,142,0.3)', borderTopColor: 'transparent' }} />
          </div>
        )}
        <div ref={containerRef} style={{ height: 280 }} />
      </div>
    </div>
  )
}
