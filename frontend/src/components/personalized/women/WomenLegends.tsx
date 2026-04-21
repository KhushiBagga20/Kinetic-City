import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { ChevronDown, TrendingUp, Sparkles, Target, Clock } from 'lucide-react'

/* ── Types ──────────────────────────────────────────────────────────────────── */

interface DataPoint { year: number; value: number }

interface Investor {
  id: string
  name: string
  title: string
  era: string
  color: string
  avatar: string
  philosophy: string
  quote: string
  stats: { label: string; value: string }[]
  bio: string[]
  keyMoves: string[]
  portfolio: DataPoint[]
}

/* ── Investor data ──────────────────────────────────────────────────────────── */

const INVESTORS: Investor[] = [
  {
    id: 'cathie',
    name: 'Cathie Wood',
    title: 'The Disruptor',
    era: '2014 – Present',
    color: '#A78BFA',
    avatar: 'CW',
    philosophy: 'Bet on disruptive innovation before the world catches on.',
    quote: 'Innovation solves problems — and problem-solving in the face of skepticism is how great wealth is created.',
    stats: [
      { label: 'Fund', value: 'ARK Invest' },
      { label: 'Peak AUM', value: '$60B' },
      { label: 'Style', value: 'Disruptive Growth' },
    ],
    bio: [
      'Cathie Wood launched ARK Invest in 2014 when she was 58 — an age when most fund managers are winding down. Wall Street laughed. She bet everything on Tesla, genomics, blockchain, and AI years before they were mainstream.',
      'By 2021, ARK\'s flagship fund had returned over 500%. Her conviction-driven approach proved that deep research into exponential technologies could outperform traditional stock-picking.',
      'Despite a brutal 2022 drawdown, Wood never wavered. She doubled down on her highest-conviction names, demonstrating that true disruptive investors think in 5-year horizons, not quarterly earnings.',
    ],
    keyMoves: [
      'First major fund to make Tesla a top holding at $40/share',
      'Pioneered thematic ETFs around genomics, fintech & autonomous tech',
      'Published all research open-source — radical transparency',
      'Held conviction through a 75% drawdown in 2022',
    ],
    portfolio: [
      { year: 2014, value: 10000 }, { year: 2015, value: 10800 },
      { year: 2016, value: 10200 }, { year: 2017, value: 14500 },
      { year: 2018, value: 12800 }, { year: 2019, value: 18200 },
      { year: 2020, value: 52000 }, { year: 2021, value: 78000 },
      { year: 2022, value: 28000 }, { year: 2023, value: 35000 },
      { year: 2024, value: 45000 },
    ],
  },
  {
    id: 'geraldine',
    name: 'Geraldine Weiss',
    title: 'Grand Dame of Dividends',
    era: '1966 – 2002',
    color: '#FBBF24',
    avatar: 'GW',
    philosophy: 'Buy blue chips when dividend yields are historically high. Patience pays.',
    quote: 'Dividends don\'t lie. When a company raises its dividend consistently, it\'s telling you something the stock price hasn\'t caught up to yet.',
    stats: [
      { label: 'Newsletter', value: 'Investment Quality Trends' },
      { label: 'Track Record', value: '36 Years' },
      { label: 'Style', value: 'Dividend Value' },
    ],
    bio: [
      'In 1966, no brokerage firm would hire Geraldine Weiss because she was a woman. So she started her own newsletter — "Investment Quality Trends" — and published under the pen name "G. Weiss" to hide her gender.',
      'Her strategy was elegantly simple: buy blue-chip stocks when their dividend yields were near historic highs (undervalued), and sell when yields dropped to historic lows (overvalued). Over 36 years, she outperformed 75% of all fund managers.',
      'When her identity was finally revealed, Wall Street was stunned. She proved that disciplined, dividend-focused investing could beat the flashiest traders on the Street — and she did it without ever stepping inside their boys\' club.',
    ],
    keyMoves: [
      'Invented dividend-yield based valuation for blue chips',
      'Published anonymously for years to avoid gender bias',
      'Outperformed 75% of professional fund managers',
      'Bought heavily during the 1974 crash and 1987 Black Monday',
    ],
    portfolio: [
      { year: 1966, value: 10000 }, { year: 1970, value: 12500 },
      { year: 1974, value: 9800 }, { year: 1978, value: 18500 },
      { year: 1982, value: 32000 }, { year: 1986, value: 55000 },
      { year: 1987, value: 44000 }, { year: 1990, value: 68000 },
      { year: 1994, value: 105000 }, { year: 1998, value: 185000 },
      { year: 2002, value: 290000 },
    ],
  },
  {
    id: 'hetty',
    name: 'Hetty Green',
    title: 'The Witch of Wall Street',
    era: '1865 – 1916',
    color: '#34D399',
    avatar: 'HG',
    philosophy: 'Buy when everyone is selling. Sell when everyone is buying. Never overpay.',
    quote: 'There is no great secret in fortune making. All you have to do is buy cheap and sell dear, act with thrift and shrewdness — and be persistent.',
    stats: [
      { label: 'Peak Wealth', value: '$200M (1916)' },
      { label: 'Adj. Today', value: '~$5.6 Billion' },
      { label: 'Style', value: 'Contrarian Value' },
    ],
    bio: [
      'Henrietta "Hetty" Green was the richest woman in America from the Gilded Age until her death in 1916. She built her fortune by doing what terrified everyone else — buying during panics.',
      'During the Panic of 1873, 1893, and 1907, when banks were collapsing and the wealthy were selling everything, Hetty was buying railroad bonds, real estate, and government debt at pennies on the dollar. She personally bailed out New York City during the 1907 crisis.',
      'She lived frugally, wore the same black dress, and kept meticulous records. Wall Street called her a "witch" because they couldn\'t accept that a woman could be smarter than all of them. Her $200M fortune in 1916 would be roughly $5.6 billion today.',
    ],
    keyMoves: [
      'Bought aggressively during Panics of 1873, 1893 & 1907',
      'Personally loaned money to NYC during the 1907 crisis',
      'Held railroad bonds & real estate — zero speculation',
      'Richest self-made woman in American history at her time',
    ],
    portfolio: [
      { year: 1865, value: 10000 }, { year: 1873, value: 38000 },
      { year: 1880, value: 85000 }, { year: 1885, value: 140000 },
      { year: 1893, value: 190000 }, { year: 1900, value: 520000 },
      { year: 1907, value: 480000 }, { year: 1910, value: 850000 },
      { year: 1916, value: 2000000 },
    ],
  },
  {
    id: 'mellody',
    name: 'Mellody Hobson',
    title: 'The Patient Builder',
    era: '1991 – Present',
    color: '#FB7185',
    avatar: 'MH',
    philosophy: 'Be patient, be present, and invest in what you understand for the long haul.',
    quote: 'The biggest risk is not taking any risk. In a world that\'s changing quickly, the only strategy that is guaranteed to fail is not taking risks.',
    stats: [
      { label: 'Firm', value: 'Ariel Investments' },
      { label: 'AUM', value: '$16B+' },
      { label: 'Style', value: 'Patient Value' },
    ],
    bio: [
      'Mellody Hobson joined Ariel Investments as an intern at 19 and became its president by 31. She transformed the firm into one of the largest minority-owned asset managers in the US, with over $16 billion under management.',
      'Her investment approach is deceptively simple: buy quality companies at reasonable prices, then hold them for years. She champions financial literacy, especially for communities that have been historically excluded from wealth-building.',
      'As Chair of Starbucks and a board member of JPMorgan Chase, Hobson has shattered glass ceilings while proving that patient, research-driven value investing delivers consistent long-term returns.',
    ],
    keyMoves: [
      'Grew Ariel from a small firm to $16B+ in AUM',
      'Bought aggressively during 2008-2009 financial crisis',
      'Champions financial literacy for underrepresented communities',
      'First Black woman to chair an S&P 500 company (Starbucks)',
    ],
    portfolio: [
      { year: 1991, value: 10000 }, { year: 1995, value: 19500 },
      { year: 2000, value: 38000 }, { year: 2002, value: 24000 },
      { year: 2005, value: 42000 }, { year: 2008, value: 26000 },
      { year: 2010, value: 45000 }, { year: 2015, value: 72000 },
      { year: 2018, value: 88000 }, { year: 2020, value: 75000 },
      { year: 2022, value: 110000 }, { year: 2024, value: 148000 },
    ],
  },
]

/* ── Chart helper ───────────────────────────────────────────────────────────── */

function buildPath(data: DataPoint[], w: number, h: number, pad: number) {
  const maxV = Math.max(...data.map(d => d.value)) * 1.08
  const minY = data[0].year
  const maxY = data[data.length - 1].year
  const pts = data.map(d => ({
    x: pad + ((d.year - minY) / (maxY - minY)) * (w - pad * 2),
    y: h - pad - (d.value / maxV) * (h - pad * 2),
  }))
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const area = `${line} L${pts[pts.length - 1].x},${h - pad} L${pts[0].x},${h - pad} Z`
  return { line, area, pts }
}

function formatValue(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`
  return `$${v}`
}

/* ── Portfolio Chart ────────────────────────────────────────────────────────── */

function PortfolioChart({ data, color }: { data: DataPoint[]; color: string }) {
  const W = 440, H = 170, PAD = 24
  const { line, area, pts } = buildPath(data, W, H, PAD)
  const gradId = `grad-${color.replace('#', '')}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map(f => (
        <line key={f} x1={PAD} x2={W - PAD} y1={H - PAD - f * (H - PAD * 2)} y2={H - PAD - f * (H - PAD * 2)}
          stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      ))}

      {/* Area fill */}
      <motion.path
        d={area} fill={`url(#${gradId})`}
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.3 }}
      />

      {/* Line */}
      <motion.path
        d={line} stroke={color} strokeWidth="2.5" fill="none"
        strokeLinecap="round" strokeLinejoin="round"
        initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      />

      {/* Start & End labels */}
      <text x={pts[0].x} y={H - 6} fill="rgba(255,255,255,0.25)" fontSize="9" textAnchor="start" fontFamily="Inter">
        {data[0].year}
      </text>
      <text x={pts[pts.length - 1].x} y={H - 6} fill="rgba(255,255,255,0.25)" fontSize="9" textAnchor="end" fontFamily="Inter">
        {data[data.length - 1].year}
      </text>

      {/* End dot with glow */}
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="8" fill={color} opacity="0.15">
        <animate attributeName="opacity" values="0.1;0.25;0.1" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="4" fill={color} />

      {/* Peak marker */}
      {(() => {
        const peak = pts.reduce((max, p, i) => data[i].value > data[max].value ? i : max, 0)
        return (
          <g>
            <circle cx={pts[peak].x} cy={pts[peak].y} r="3" fill={color} opacity="0.5" />
            <text x={pts[peak].x} y={pts[peak].y - 10} fill={color} fontSize="8" textAnchor="middle"
              fontFamily="Inter" fontWeight="600" opacity="0.7">
              {formatValue(data[peak].value)}
            </text>
          </g>
        )
      })()}
    </svg>
  )
}

/* ── Sparkle decoration ─────────────────────────────────────────────────────── */

function SparkleSet({ color }: { color: string }) {
  return (
    <div className="absolute top-3 right-3 pointer-events-none" style={{ opacity: 0.3 }}>
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <motion.circle cx="10" cy="10" r="1.5" fill={color}
          animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.3, 1] }}
          transition={{ duration: 2, repeat: Infinity, delay: 0 }} />
        <motion.circle cx="30" cy="8" r="1" fill={color}
          animate={{ opacity: [0.2, 0.8, 0.2], scale: [1, 1.5, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }} />
        <motion.circle cx="22" cy="25" r="1.2" fill={color}
          animate={{ opacity: [0.4, 1, 0.4], scale: [1, 1.2, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, delay: 1 }} />
      </svg>
    </div>
  )
}

/* ── Investor Card ──────────────────────────────────────────────────────────── */

function InvestorCard({ investor, isOpen, onToggle }: {
  investor: Investor; isOpen: boolean; onToggle: () => void
}) {
  const { name, title, era, color, avatar, philosophy, quote, stats, bio, keyMoves, portfolio } = investor
  const initial = portfolio[0].value
  const final = portfolio[portfolio.length - 1].value
  const years = portfolio[portfolio.length - 1].year - portfolio[0].year
  const cagr = ((Math.pow(final / initial, 1 / years) - 1) * 100).toFixed(1)
  const multiple = (final / initial).toFixed(0)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-3xl overflow-hidden relative"
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: `1px solid ${color}18`,
      }}
    >
      <SparkleSet color={color} />

      {/* Accent top stripe */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${color}00, ${color}80, ${color}00)` }} />

      <div className="p-6 md:p-8">
        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          {/* Avatar */}
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-display text-lg font-bold shrink-0"
            style={{ background: `${color}15`, color, border: `1.5px solid ${color}30` }}>
            {avatar}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-xl text-white">{name}</h3>
            <p className="font-sans text-sm mt-0.5" style={{ color: `${color}cc` }}>{title}</p>
          </div>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-sans font-medium shrink-0"
            style={{ background: `${color}10`, color: `${color}aa`, border: `1px solid ${color}20` }}>
            <Clock className="w-3 h-3" />
            {era}
          </span>
        </div>

        {/* Philosophy */}
        <p className="font-sans text-sm leading-relaxed mb-6" style={{ color: 'rgba(255,255,255,0.55)' }}>
          "{philosophy}"
        </p>

        {/* Chart */}
        <div className="rounded-2xl p-4 mb-5" style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.04)' }}>
          {/* Chart header */}
          <div className="flex items-center justify-between mb-2">
            <span className="font-sans text-[11px] font-medium" style={{ color: 'rgba(255,255,255,0.3)' }}>
              $10,000 invested in {portfolio[0].year}
            </span>
            <span className="font-mono text-sm font-bold" style={{ color }}>
              → {formatValue(final)}
            </span>
          </div>

          <PortfolioChart data={portfolio} color={color} />

          {/* Growth stats */}
          <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}>
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" style={{ color }} />
              <span className="font-mono text-xs" style={{ color }}>{cagr}% CAGR</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
              <span className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{multiple}x return</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" style={{ color: 'rgba(255,255,255,0.3)' }} />
              <span className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>{years} years</span>
            </div>
          </div>
        </div>

        {/* Stats badges */}
        <div className="flex flex-wrap gap-2 mb-5">
          {stats.map(s => (
            <span key={s.label} className="px-3 py-1.5 rounded-xl text-[11px] font-sans"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.5)' }}>
              <span style={{ color: 'rgba(255,255,255,0.25)' }}>{s.label}:</span>{' '}
              <span className="font-medium text-white/70">{s.value}</span>
            </span>
          ))}
        </div>

        {/* Quote */}
        <div className="rounded-2xl p-4 mb-5 relative overflow-hidden"
          style={{ background: `${color}06`, border: `1px solid ${color}12` }}>
          <div className="absolute top-2 left-3 font-serif text-4xl leading-none" style={{ color: `${color}20` }}>"</div>
          <p className="font-sans text-[13px] italic leading-relaxed pl-5 pr-2" style={{ color: 'rgba(255,255,255,0.55)' }}>
            {quote}
          </p>
          <p className="font-sans text-[10px] mt-2 pl-5" style={{ color: `${color}60` }}>— {name}</p>
        </div>

        {/* Read Her Story toggle */}
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-sans font-medium transition-all duration-200"
          style={{
            background: isOpen ? `${color}10` : 'rgba(255,255,255,0.03)',
            color: isOpen ? color : 'rgba(255,255,255,0.4)',
            border: `1px solid ${isOpen ? `${color}25` : 'rgba(255,255,255,0.06)'}`,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = `${color}12`; e.currentTarget.style.color = color }}
          onMouseLeave={e => {
            e.currentTarget.style.background = isOpen ? `${color}10` : 'rgba(255,255,255,0.03)'
            e.currentTarget.style.color = isOpen ? color : 'rgba(255,255,255,0.4)'
          }}
        >
          <Sparkles className="w-4 h-4" />
          {isOpen ? 'Close Story' : 'Read Her Story'}
          <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown className="w-4 h-4" />
          </motion.span>
        </button>

        {/* Expanded story */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="pt-6 space-y-4">
                {/* Bio */}
                {bio.map((p, i) => (
                  <motion.p key={i}
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="font-sans text-sm leading-relaxed"
                    style={{ color: 'rgba(255,255,255,0.55)' }}>
                    {p}
                  </motion.p>
                ))}

                {/* Key moves */}
                <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${color}12` }}>
                  <p className="font-sans text-xs font-medium uppercase tracking-widest mb-3"
                    style={{ color: `${color}80` }}>
                    Key Moves
                  </p>
                  <div className="space-y-2">
                    {keyMoves.map((m, i) => (
                      <motion.div key={i}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.08 }}
                        className="flex items-start gap-2.5">
                        <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: color }} />
                        <p className="font-sans text-[13px]" style={{ color: 'rgba(255,255,255,0.5)' }}>{m}</p>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

/* ── Main Component ─────────────────────────────────────────────────────────── */

export default function WomenLegends() {
  const [openId, setOpenId] = useState<string | null>(null)

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4" style={{ color: '#FBBF24' }} />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: '#FBBF24' }}>
            Legends Gallery
          </span>
        </div>
        <h2 className="font-display font-bold text-2xl text-white mb-2">
          Women Who Changed Wall Street
        </h2>
        <p className="font-sans text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
          What if you invested $10,000 alongside history's greatest women investors?
          <br />Explore their strategies, see their portfolios grow, and find your own path.
        </p>
      </div>

      {/* Investor cards */}
      <div className="grid gap-6">
        {INVESTORS.map((inv, i) => (
          <motion.div key={inv.id}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.12 }}>
            <InvestorCard
              investor={inv}
              isOpen={openId === inv.id}
              onToggle={() => setOpenId(prev => prev === inv.id ? null : inv.id)}
            />
          </motion.div>
        ))}
      </div>

      {/* Footer inspiration */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-8 rounded-2xl p-6 text-center"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
        <p className="font-sans text-sm italic" style={{ color: 'rgba(255,255,255,0.35)' }}>
          "Behind every portfolio is a philosophy. Behind every philosophy is a woman who refused to be told no."
        </p>
        <p className="font-mono text-[10px] mt-2" style={{ color: 'rgba(255,255,255,0.15)' }}>
          All simulations use historical index-adjusted returns. Past performance ≠ future results.
        </p>
      </motion.div>
    </div>
  )
}
