import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatINR } from '../../../lib/formatINR'

/* ══════════════════════════════════════════════════════════════════════════════
   DATA
   ══════════════════════════════════════════════════════════════════════════════ */

type Investor = {
  id: string
  name: string
  years: string
  title: string
  quote: string
  philosophy: string
  color: string
  emoji: string
  strategy: string[]
  // Historical simulation: ₹1 lakh invested, annual return, period
  startYear: number
  endYear: number
  annualReturn: number   // decimal e.g. 0.22
  startCorpus: number   // ₹1L = 100000
  peakMultiple: number
  insight: string
}

const INVESTORS: Investor[] = [
  {
    id: 'cathie',
    name: 'Cathie Wood',
    years: '1956 – present',
    title: 'The Disruptor',
    quote: '"Disruptive innovation is the key to extraordinary growth."',
    philosophy: 'ARK Invest founder who bets on AI, genomics, crypto and EVs before the world notices. Her 2020 fund returned 153% — one of the best years any fund manager ever had.',
    color: '#c0f18e',
    emoji: '🚀',
    strategy: ['Disruptive tech', 'Long-term vision', 'High conviction'],
    startYear: 2014,
    endYear: 2021,
    annualReturn: 0.29,
    startCorpus: 100000,
    peakMultiple: 5.9,
    insight: 'Cathie ignored short-term losses on Tesla, Zoom, and Coinbase. In 2020 alone, ARK Innovation returned 153%. Patience + conviction.',
  },
  {
    id: 'geraldine',
    name: 'Geraldine Weiss',
    years: '1926 – 2022',
    title: 'The Dividend Detective',
    quote: '"Dividends don\'t lie."',
    philosophy: 'In a 1966 world that wouldn\'t read her newsletter if it had a woman\'s name, she signed as "G. Weiss." Built a 30-year record beating the market with dividend yield analysis alone.',
    color: '#EF9F27',
    emoji: '📊',
    strategy: ['Dividend yield', 'Blue chip stocks', 'Value investing'],
    startYear: 1966,
    endYear: 2002,
    annualReturn: 0.14,
    startCorpus: 100000,
    peakMultiple: 104,
    insight: 'Over 36 years, her newsletter "Investment Quality Trends" beat the S&P 500 consistently. ₹1L became ₹1.04 Cr — by doing nothing fancy.',
  },
  {
    id: 'hetty',
    name: 'Hetty Green',
    years: '1834 – 1916',
    title: 'The Witch of Wall Street',
    quote: '"I buy when things are low and nobody wants them."',
    philosophy: 'The richest woman in the world in 1900, nicknamed "The Witch of Wall Street" for her ruthlessness. Grew a $6M inheritance to $200M purely through contrarian, patient investing.',
    color: '#E24B4A',
    emoji: '🧠',
    strategy: ['Contrarian bets', 'Cash in crisis', 'Buy the fear'],
    startYear: 1865,
    endYear: 1916,
    annualReturn: 0.09,
    startCorpus: 100000,
    peakMultiple: 89,
    insight: 'In every panic — 1873, 1893, 1907 — Hetty lent money when banks couldn\'t. She bought what everyone was selling. Over 51 years: ₹1L → ₹89L.',
  },
  {
    id: 'mellody',
    name: 'Mellody Hobson',
    years: '1969 – present',
    title: 'The Color of Money',
    quote: '"Be financially fearless."',
    philosophy: 'Co-CEO of Ariel Investments, Starbucks Chair, and the first Black woman to chair a major company board. Champion of financial literacy and "Be financially fearless."',
    color: '#378ADD',
    emoji: '✨',
    strategy: ['Small-cap value', 'Long-term compounding', 'Financial inclusion'],
    startYear: 1994,
    endYear: 2024,
    annualReturn: 0.13,
    startCorpus: 100000,
    peakMultiple: 37,
    insight: 'Ariel Fund\'s 30-year return: 13% CAGR, outperforming the Russell 2500. Small-cap undervalued stocks. Time + discipline. ₹1L → ₹37L.',
  },
]

/* ── Mini sparkline ──────────────────────────────────────────────────────────── */

function Sparkline({ investor, active }: { investor: Investor; active: boolean }) {
  const years = investor.endYear - investor.startYear
  const points = useMemo(() => {
    const pts: { x: number; y: number }[] = []
    for (let i = 0; i <= years; i += Math.max(1, Math.floor(years / 20))) {
      const val = investor.startCorpus * Math.pow(1 + investor.annualReturn, i)
      pts.push({ x: i / years, y: val })
    }
    // ensure last point
    const lastVal = investor.startCorpus * Math.pow(1 + investor.annualReturn, years)
    pts.push({ x: 1, y: lastVal })
    return pts
  }, [investor])

  const maxY = Math.max(...points.map(p => p.y))
  const minY = Math.min(...points.map(p => p.y))
  const range = maxY - minY || 1

  const W = 200
  const H = 60

  const svgPoints = points
    .map(p => `${p.x * W},${H - ((p.y - minY) / range) * (H - 4) - 2}`)
    .join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="none">
      <defs>
        <linearGradient id={`fill-${investor.id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={investor.color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={investor.color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {/* Fill area */}
      <polyline
        points={`0,${H} ${svgPoints} ${W},${H}`}
        fill={`url(#fill-${investor.id})`}
      />
      {/* Line */}
      <motion.polyline
        points={svgPoints}
        fill="none"
        stroke={investor.color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={active ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
        transition={{ duration: 1.4, ease: 'easeInOut' }}
      />
      {/* End dot */}
      {active && (
        <motion.circle
          cx={W}
          cy={H - ((maxY - minY) / range) * (H - 4) - 2}
          r="4"
          fill={investor.color}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1.3, type: 'spring', stiffness: 300 }}
        />
      )}
    </svg>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════════════ */

export default function LegendaryInvestors() {
  const [selected, setSelected] = useState<string>('cathie')

  const investor = INVESTORS.find(i => i.id === selected)!
  const finalCorpus = Math.round(investor.startCorpus * Math.pow(1 + investor.annualReturn, investor.endYear - investor.startYear))
  const totalYears = investor.endYear - investor.startYear

  return (
    <section className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display font-bold text-2xl text-white">
          Legendary Women Investors
        </h2>
        <p className="font-sans text-sm text-white/40 mt-1">
          Four women who changed how the world invests. See how ₹1 lakh grew under their strategy.
        </p>
      </div>

      {/* Investor selector pills */}
      <div className="flex flex-wrap gap-2">
        {INVESTORS.map(inv => (
          <motion.button
            key={inv.id}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setSelected(inv.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-sans text-sm font-medium transition-all duration-200"
            style={{
              background: selected === inv.id ? `${inv.color}18` : 'rgba(255,255,255,0.04)',
              border: `1.5px solid ${selected === inv.id ? inv.color + '55' : 'rgba(255,255,255,0.08)'}`,
              color: selected === inv.id ? inv.color : 'rgba(255,255,255,0.45)',
            }}
          >
            <span>{inv.emoji}</span>
            <span>{inv.name.split(' ')[0]}</span>
          </motion.button>
        ))}
      </div>

      {/* Profile card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selected}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="rounded-3xl overflow-hidden border"
          style={{ borderColor: `${investor.color}22`, background: `${investor.color}06` }}
        >
          {/* Top strip */}
          <div
            className="h-1 w-full"
            style={{ background: `linear-gradient(to right, ${investor.color}00, ${investor.color}, ${investor.color}00)` }}
          />

          <div className="p-6 space-y-5">
            {/* Name + years */}
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{investor.emoji}</span>
                  <span
                    className="font-sans text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                    style={{ background: `${investor.color}15`, color: investor.color }}
                  >
                    {investor.title}
                  </span>
                </div>
                <h3 className="font-display font-bold text-2xl text-white">{investor.name}</h3>
                <p className="font-sans text-xs text-white/30 mt-0.5">{investor.years}</p>
              </div>

              {/* Strategy tags */}
              <div className="flex flex-wrap gap-1.5 justify-end">
                {investor.strategy.map(s => (
                  <span
                    key={s}
                    className="font-sans text-[10px] px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            {/* Quote */}
            <blockquote
              className="font-display text-lg font-semibold italic leading-snug"
              style={{ color: investor.color }}
            >
              {investor.quote}
            </blockquote>

            {/* Philosophy */}
            <p className="font-sans text-sm text-white/55 leading-relaxed">
              {investor.philosophy}
            </p>

            {/* Portfolio simulation */}
            <div
              className="rounded-2xl p-5 border space-y-4"
              style={{ background: 'rgba(0,0,0,0.3)', borderColor: `${investor.color}20` }}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <p className="font-sans text-[11px] uppercase tracking-widest text-white/30 font-bold">
                  ₹1 Lakh invested in {investor.startYear}
                </p>
                <p className="font-sans text-[11px] text-white/25">{totalYears} years · {Math.round(investor.annualReturn * 100)}% CAGR</p>
              </div>

              {/* Sparkline */}
              <div className="w-full h-16">
                <Sparkline investor={investor} active />
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center">
                  <p className="font-sans text-[10px] text-white/30 mb-0.5">Invested</p>
                  <p className="font-mono font-bold text-white text-sm">₹1.00 L</p>
                </div>
                <div className="text-center">
                  <p className="font-sans text-[10px] text-white/30 mb-0.5">Grew to</p>
                  <p className="font-mono font-bold text-sm" style={{ color: investor.color }}>
                    {formatINR(finalCorpus)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="font-sans text-[10px] text-white/30 mb-0.5">Multiple</p>
                  <p className="font-mono font-bold text-sm" style={{ color: investor.color }}>
                    {investor.peakMultiple}×
                  </p>
                </div>
              </div>
            </div>

            {/* KINU-style insight */}
            <div
              className="rounded-2xl px-5 py-4 flex items-start gap-3 border"
              style={{ background: `${investor.color}06`, borderColor: `${investor.color}18` }}
            >
              <span className="text-lg mt-0.5">💡</span>
              <p className="font-sans text-sm leading-relaxed" style={{ color: `rgba(255,255,255,0.6)` }}>
                {investor.insight}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <p className="font-sans text-[10px] text-white/20 text-center">
        Historical simulations for educational purposes. Past returns don't guarantee future results.
        Corpus values in Indian Rupees assuming equivalent investment.
      </p>
    </section>
  )
}
