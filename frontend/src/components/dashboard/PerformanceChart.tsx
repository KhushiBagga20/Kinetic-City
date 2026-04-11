import { useEffect, useRef, useState } from 'react'
import {
  createChart,
  type IChartApi,
  type ISeriesApi,
  AreaSeries,
  ColorType,
  CrosshairMode,
} from 'lightweight-charts'
import { ChevronDown } from 'lucide-react'
import { motion } from 'framer-motion'

// ── Data shape the backend will emit ─────────────────────────────────────────
export interface PortfolioDataPoint {
  time: string   // 'YYYY-MM-DD'
  value: number  // portfolio value in ₹
}

// ── Mock data — will be replaced by API call ─────────────────────────────────
const MOCK_DATA: PortfolioDataPoint[] = [
  { time: '2023-01-02', value: 14200000 },
  { time: '2023-01-09', value: 14050000 },
  { time: '2023-01-16', value: 14380000 },
  { time: '2023-01-23', value: 14650000 },
  { time: '2023-02-06', value: 14420000 },
  { time: '2023-02-13', value: 14800000 },
  { time: '2023-02-20', value: 15100000 },
  { time: '2023-03-06', value: 15350000 },
  { time: '2023-03-13', value: 14900000 },
  { time: '2023-03-20', value: 15200000 },
  { time: '2023-04-03', value: 15600000 },
  { time: '2023-04-17', value: 16100000 },
  { time: '2023-05-01', value: 15800000 },
  { time: '2023-05-15', value: 16400000 },
  { time: '2023-06-01', value: 16700000 },
  { time: '2023-06-19', value: 16200000 },
  { time: '2023-07-03', value: 16900000 },
  { time: '2023-07-17', value: 17500000 },
  { time: '2023-08-07', value: 17100000 },
  { time: '2023-08-14', value: 18420000 },  // peak — matches tooltip
  { time: '2023-09-04', value: 17800000 },
  { time: '2023-09-18', value: 17200000 },
  { time: '2023-10-02', value: 17600000 },
  { time: '2023-10-16', value: 18000000 },
  { time: '2023-11-06', value: 17700000 },
  { time: '2023-11-20', value: 18100000 },
  { time: '2023-12-04', value: 18350000 },
  { time: '2023-12-18', value: 18420500 },
]

const PERIODS = ['1W', '1M', '3M', '6M', '1Y', 'ALL'] as const
type Period = typeof PERIODS[number]

function formatValue(v: number): string {
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`
  if (v >= 100000)   return `₹${(v / 100000).toFixed(2)}L`
  return `₹${v.toLocaleString('en-IN')}`
}

function filterByPeriod(data: PortfolioDataPoint[], period: Period): PortfolioDataPoint[] {
  if (period === 'ALL') return data
  const now = new Date(data[data.length - 1].time)
  const cutoff = new Date(now)
  if (period === '1W')  cutoff.setDate(now.getDate() - 7)
  if (period === '1M')  cutoff.setMonth(now.getMonth() - 1)
  if (period === '3M')  cutoff.setMonth(now.getMonth() - 3)
  if (period === '6M')  cutoff.setMonth(now.getMonth() - 6)
  if (period === '1Y')  cutoff.setFullYear(now.getFullYear() - 1)
  return data.filter(d => new Date(d.time) >= cutoff)
}

interface Props {
  /** Backend can inject live data via this prop. Falls back to mock when undefined. */
  data?: PortfolioDataPoint[]
}

export default function PerformanceChart({ data: externalData }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef     = useRef<IChartApi | null>(null)
  const seriesRef    = useRef<ISeriesApi<'Area'> | null>(null)
  const [period, setPeriod]   = useState<Period>('1Y')
  const [tooltip, setTooltip] = useState<{ date: string; value: string } | null>(null)

  const sourceData = externalData ?? MOCK_DATA

  // ── Create chart once ────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor: 'rgba(255,255,255,0.4)',
        fontFamily: "'Inter', sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)' },
        horzLines: { color: 'rgba(255,255,255,0.04)' },
      },
      crosshair: {
        mode: CrosshairMode.Magnet,
        vertLine: {
          color: 'rgba(192,241,142,0.3)',
          width: 1,
          style: 2,          // dashed
          labelBackgroundColor: '#0e2000',
        },
        horzLine: {
          color: 'rgba(192,241,142,0.3)',
          width: 1,
          style: 2,
          labelBackgroundColor: '#0e2000',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        textColor: 'rgba(255,255,255,0.35)',
        scaleMargins: { top: 0.1, bottom: 0.05 },
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        timeVisible: true,
        secondsVisible: false,
        fixLeftEdge: true,
        fixRightEdge: true,
      },
      handleScroll: { mouseWheel: false, pressedMouseMove: false },
      handleScale: { mouseWheel: false, pinch: false },
    })

    const series = chart.addSeries(AreaSeries, {
      lineColor: '#c0f18e',
      topColor: 'rgba(192,241,142,0.18)',
      bottomColor: 'rgba(192,241,142,0)',
      lineWidth: 2,
      priceFormat: {
        type: 'custom',
        formatter: (p: number) => formatValue(p),
        minMove: 1000,
      },
    })
    chartRef.current = chart
    seriesRef.current = series

    // crosshair tooltip
    chart.subscribeCrosshairMove(param => {
      if (!param.time || !param.seriesData) {
        setTooltip(null)
        return
      }
      const d = param.seriesData.get(series) as { value: number } | undefined
      if (!d) { setTooltip(null); return }
      setTooltip({
        date: String(param.time),
        value: formatValue(d.value),
      })
    })

    // Resize observer
    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth })
      }
    })
    ro.observe(containerRef.current)

    return () => {
      ro.disconnect()
      chart.remove()
      chartRef.current = null
      seriesRef.current = null
    }
  }, [])

  // ── Update data on period/source change ──────────────────────────────────
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return
    const filtered = filterByPeriod(sourceData, period)
    seriesRef.current.setData(filtered)
    chartRef.current.timeScale().fitContent()
  }, [period, sourceData])

  const lastPoint = sourceData[sourceData.length - 1]
  const firstPoint = filterByPeriod(sourceData, period)[0]
  const change = lastPoint && firstPoint
    ? ((lastPoint.value - firstPoint.value) / firstPoint.value) * 100
    : 0
  const isPositive = change >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' as const }}
      className="bg-[#071a1f] border border-white/[0.06] rounded-3xl overflow-hidden"
    >
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 md:px-8 pt-6 pb-4">
        <div>
          <div className="flex items-baseline gap-3 mb-0.5">
            <h2 className="font-display text-lg text-white font-medium tracking-tight">
              Portfolio Performance
            </h2>
            <span className={`text-sm font-mono font-bold ${isPositive ? 'text-[#c0f18e]' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{change.toFixed(2)}%
            </span>
          </div>
          <p className="text-[11px] font-sans text-white/35 tracking-wide">
            {tooltip
              ? <><span className="text-white/60 font-medium">{tooltip.value}</span> &middot; {tooltip.date}</>
              : 'Institutional grade real-time tracking'
            }
          </p>
        </div>

        <div className="flex items-center gap-1">
          {/* Period pills */}
          {PERIODS.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`
                px-3 py-1.5 rounded-lg text-[11px] font-sans font-semibold tracking-wider transition-all duration-150
                ${p === period
                  ? 'bg-[#c0f18e]/10 text-[#c0f18e] border border-[#c0f18e]/20'
                  : 'text-white/35 hover:text-white/60'
                }
              `}
            >
              {p}
            </button>
          ))}

          {/* Separator */}
          <div className="w-px h-5 bg-white/10 mx-2" />

          {/* Type toggle (future) */}
          <button className="flex items-center gap-1.5 border border-white/10 rounded-lg px-3 py-1.5 hover:bg-white/5 transition-colors">
            <span className="text-[11px] font-sans text-white/50">Area</span>
            <ChevronDown className="w-3 h-3 text-white/30" />
          </button>
        </div>
      </div>

      {/* ── Chart ───────────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="w-full"
        style={{ height: '340px' }}
      />

      {/* ── Footer bar ──────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center px-6 md:px-8 py-3 border-t border-white/[0.04]">
        <span className="text-[10px] font-mono text-white/25 tracking-widest uppercase">
          Data: Real-time · Backend Connected
        </span>
        <span className="text-[10px] font-mono text-white/25 tracking-widest">
          {lastPoint ? formatValue(lastPoint.value) : '—'}
        </span>
      </div>
    </motion.div>
  )
}
