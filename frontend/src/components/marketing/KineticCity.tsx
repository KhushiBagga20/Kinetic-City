import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, useMotionValue, animate } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import './kinetic-city.css'

/* ─────────────────────────────────────────────────────────────────────────────
   Design tokens — exact values from index.css, no new colours
   ───────────────────────────────────────────────────────────────────────────── */
const C = {
  bg:         '#00161b',
  surfHover:  'rgba(255,255,255,0.07)',
  surfBright: 'rgba(255,255,255,0.10)',
  surfBase:   'rgba(255,255,255,0.04)',
  surfFear:   'rgba(255,255,255,0.055)',
  border:     'rgba(255,255,255,0.08)',
  borderBrt:  'rgba(255,255,255,0.16)',
  accent:     '#c0f18e',
  danger:     '#E24B4A',
  teal:       '#1D9E75',
  blue:       '#378ADD',
  amber:      '#d4a853',
  txtHi:      'rgba(255,255,255,0.92)',
  txtMd:      'rgba(255,255,255,0.60)',
  txtLo:      'rgba(255,255,255,0.35)',
  ground:     'rgba(255,255,255,0.03)',
  road:       'rgba(255,255,255,0.09)',
}

/* ── Ticker ────────────────────────────────────────────────────────────────── */
const TICKER_FALLBACK = 'NIFTY 50  24,198  ▲1.2%   ·   SENSEX  79,442  ▲0.8%   ·   MIDCAP  11,024  ▲2.1%   ·   SMALLCAP  8,847  ▲3.4%   ·   GOLD  ₹7,842/g  ▲0.3%   ·   USD/INR  83.42  ▼0.1%   ·   10Y BOND  7.1%  ─0.0%   ·   '

interface MarketItem { label: string; price: string; change: number; direction: 'up' | 'down'; inverse?: boolean }

function useMarketTicker() {
  const [items, setItems] = useState<MarketItem[] | null>(null)
  useEffect(() => {
    fetch('/api/market/latest')
      .then(r => r.json())
      .then(d => { if (d.items?.length) setItems(d.items) })
      .catch(() => {}) // silently fall back to static
  }, [])
  return items
}

function TickerContent({ items }: { items: MarketItem[] | null }) {
  if (!items) {
    // Fallback: render static ticker
    const parts = TICKER_FALLBACK.split(/(▲\S+|▼\S+|─\S+)/)
    return (
      <>
        {parts.map((p, i) => {
          if (p.startsWith('▲')) return <span key={i} style={{ color: C.teal }}>{p}</span>
          if (p.startsWith('▼')) return <span key={i} style={{ color: C.danger }}>{p}</span>
          if (p.startsWith('─')) return <span key={i} style={{ color: C.txtMd }}>{p}</span>
          return <span key={i}>{p}</span>
        })}
      </>
    )
  }
  return (
    <>
      {items.map((item, i) => {
        const isUp = item.direction === 'up'
        const isInverse = !!item.inverse
        const itemColor = isUp 
          ? (isInverse ? C.danger : C.teal) 
          : (isInverse ? C.teal : C.danger)

        return (
          <span key={i}>
            {item.label}  {item.price}  
            <span style={{ color: itemColor }}>
              {isUp ? '▲' : '▼'}{Math.abs(item.change)}%
            </span>
            {'   ·   '}
          </span>
        )
      })}
    </>
  )
}

/* ── Hooks ─────────────────────────────────────────────────────────────────── */

function useClock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const tick = () => {
      const d = new Date()
      let h = d.getHours(); const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12
      setTime(`${h}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')} ${ap}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return time
}

function useFearPct() {
  const [v, setV] = useState(-1.2)
  useEffect(() => {
    const s = [-1.2,-1.5,-1.8,-2.1,-2.4]; let i = 0
    const id = setInterval(() => { i = (i+1)%s.length; setV(s[i]) }, 1600)
    return () => clearInterval(id)
  }, [])
  return v.toFixed(1)
}

function useSipCounter() {
  const mv = useMotionValue(0)
  const [d, setD] = useState('₹0')
  useEffect(() => {
    const ctrl = animate(mv, 120000, { duration: 40, ease: 'linear', repeat: Infinity, repeatType: 'loop' as const })
    const unsub = mv.on('change', v => setD(`₹${(Math.round(v/500)*500).toLocaleString('en-IN')}`))
    return () => { ctrl.stop(); unsub() }
  }, [mv])
  return d
}

/* ── Icons for fear cards (16px, 1px stroke) ──────────────────────────────── */
const ShieldIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
const SearchIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
const FpIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><path d="M2 12C2 6.5 6.5 2 12 2a10 10 0 0 1 8 4"/><path d="M5 19.5C5.5 18 6 15 6 12c0-3.5 2.5-6 6-6s6 2.5 6 6c0 1.5-.5 3-1 4"/></svg>
const UnlockIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>

/* ── Building entrance spring ────────────────────────── */
const rise = { type: 'spring' as const, stiffness: 180, damping: 18, mass: 1.0 }

/* ── Fear card data ────────────────────────────────────────────────────────── */
const FEAR_CARDS = [
  { label: 'Loss Avoider',          desc: 'Fear of losing money',         Icon: ShieldIcon, color: C.danger, posStyle: { left: '25px',  top: '30px' } },
  { label: 'Clarity Seeker',        desc: 'Fear of not understanding',    Icon: SearchIcon, color: C.blue,   posStyle: { right: '45px', bottom: '330px' } },
  { label: 'Pattern Detector',      desc: 'Fear of being scammed',        Icon: FpIcon,     color: C.amber,  posStyle: { left: '30px',  bottom: '48px' } },
  { label: 'Independence Guardian', desc: 'Fear of trusting others',      Icon: UnlockIcon, color: C.teal,   posStyle: { right: '30px', bottom: '48px' } },
]

/* ═══════════════════════════════════════════════════════════════════════════ */

interface Props { onStart: () => void }

export default function KineticCity({ onStart }: Props) {
  const [pulse, setPulse] = useState(false)
  const [ctaHovered, setCtaHovered] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const clock = useClock()
  const fearPct = useFearPct()
  const sipCount = useSipCounter()
  const marketItems = useMarketTicker()

  // Pause CSS anims when tab hidden
  useEffect(() => {
    const h = () => {
      const s = document.hidden ? 'paused' : 'running'
      document.querySelectorAll('.kinetic-anim').forEach(el => {
        ;(el as HTMLElement).style.animationPlayState = s
      })
    }
    document.addEventListener('visibilitychange', h)
    return () => document.removeEventListener('visibilitychange', h)
  }, [])

  const handleCTA = useCallback(() => {
    if (pulse) return
    setPulse(true)
    onStart()
    setTimeout(() => setPulse(false), 150)
  }, [onStart, pulse])

  /* ── Entrance timing ─────────────────────────────────────────────────── */
  const D = {
    ground: 0.2,
    roads:  0.6,
    b: (i: number) => 1.0 + i * 0.18,
    trees:  2.2,
    ticker: 2.6,
    card: (i: number) => 3.2 + i * 1.2,
    letter: (i: number) => 0.8 + i * 0.06,
    sub:    1.5,
    italic: 1.7,
    cta:    2.1,
    fine:   2.25,
  }

  const GY = 390
  const title = 'KINETIC'

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ════════════ ZONE A — Text zone ════════════════════ */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          textAlign: 'center',
          paddingTop: '48px',
          paddingBottom: '32px',
          flexShrink: 0,
        }}
      >
        <div className="relative z-10 flex flex-col items-center px-6 text-center">
          {/* "KINETIC" headline */}
          <div className="flex items-center gap-[2px] md:gap-1 mb-3">
            {title.split('').map((ch, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: D.letter(i), duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="font-display font-bold text-5xl md:text-[5.5rem] leading-none select-none"
                style={{ color: C.accent, letterSpacing: '0.12em', textShadow: '0 0 40px rgba(192,241,142,0.3)' }}
              >
                {ch}
              </motion.span>
            ))}
          </div>

          <motion.p
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: D.sub, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="font-display font-medium text-lg md:text-2xl mb-2 select-none kc-text-spotlight"
            style={{ color: 'rgba(255,255,255,0.7)', position: 'relative', zIndex: 60 }}
          >
            Face the fear. Start with &#8377;500.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: D.italic, duration: 0.4 }}
            className="font-sans text-[11px] md:text-sm italic mb-5 select-none"
            style={{ color: C.txtLo }}
          >
            One of these four is yours.
          </motion.p>

          {/* CTA Button */}
          <motion.button
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: D.cta, duration: 0.55, ease: [0.34, 1.56, 0.64, 1] }}
            onClick={handleCTA}
            onMouseEnter={() => setCtaHovered(true)}
            onMouseLeave={() => setCtaHovered(false)}
            className="relative z-50 inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-display font-bold text-sm md:text-base cursor-pointer active:scale-[0.97] transition-transform duration-200 box-glow"
            style={{ background: C.accent, color: '#0a1a00' }}
          >
            Find my fear type <ArrowRight className="w-4 h-4" />
          </motion.button>

          <motion.p
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: D.fine, duration: 0.35 }}
            className="font-sans text-[9px] md:text-[10px] mt-3 tracking-[0.12em] select-none"
            style={{ color: C.txtLo }}
          >
            60 seconds &middot; No sign-up &middot; No financial advice.
          </motion.p>
        </div>

        {/* Gradient overlay at bottom of the text block */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            width: '100%',
            height: '60px',
            background: 'linear-gradient(to bottom, transparent, rgba(10,10,15,0))',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      </div>

      {/* ════════════ ZONE B — City wrapper ════════════════ */}
      <div
        className="city-wrapper"
        style={{
          position: 'relative',
          width: '100%',
          flex: 1,
          minHeight: 0,
        }}
      >
        {/* ── Fear Type Cards (floating in Zone B) ─────────────── */}
        {FEAR_CARDS.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 0 }}
            animate={{
              opacity: 1,
              y: [0, -8, 0],
            }}
            transition={{
              opacity: { delay: D.card(i), duration: 0.6 },
              y: { delay: D.card(i) + 0.6, duration: 4 + i * 0.3, repeat: Infinity, repeatType: 'reverse' as const, ease: 'easeInOut' },
            }}
            style={{
              position: 'absolute',
              zIndex: 20,
              pointerEvents: 'none',
              width: '160px',
              ...card.posStyle,
            }}
          >
            <div
              style={{
                width: '100%',
                height: 'auto',
                background: 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderLeft: `2px solid ${card.color}${ctaHovered ? 'ff' : '99'}`,
                borderRadius: '12px',
                padding: '10px 12px',
                transform: ctaHovered ? 'scale(1.02)' : 'scale(1)',
                transition: 'border-color 300ms, transform 300ms',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{ color: card.color, display: 'flex' }}><card.Icon /></span>
                <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: '12px', fontWeight: 500, fontFamily: 'Inter,sans-serif' }}>{card.label}</span>
              </div>
              <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '10px', fontFamily: 'Inter,sans-serif', margin: 0, lineHeight: 1.4 }}>{card.desc}</p>
            </div>
          </motion.div>
        ))}

        {/* City SVG */}
        <svg
          viewBox="0 0 1000 540"
          preserveAspectRatio="xMidYMax slice"
          overflow="visible"
          role="img"
          aria-label="An animated financial city representing the Kinetic investment journey."
          style={{
            position: 'absolute',
            bottom: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '100%',
            minWidth: '1200px',
            height: '100%',
            filter: pulse ? 'brightness(1.6)' : 'brightness(1)',
            transition: pulse ? 'filter 0.15s ease-in' : 'filter 0.25s ease-out',
          }}
        >
          <defs>
            <filter id="glow-sm"><feGaussianBlur stdDeviation="2" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <filter id="glow-md"><feGaussianBlur stdDeviation="4" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <filter id="glow-danger"><feGaussianBlur stdDeviation="6" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <filter id="glow-accent-win"><feGaussianBlur stdDeviation="3" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>

          {/* ── Ground plane ──────────────────────────────────────── */}
          <motion.rect
            x="0" y={GY} width="1000" height="150" fill={C.ground}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ delay: D.ground, duration: 0.5 }}
          />

          {/* ── Roads ──────────────────────────────────────────────── */}
          <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: D.roads, duration: 0.7 }}>
            <rect x="30" y={GY + 3} width="940" height="18" rx="2" fill={C.road} />
            <line x1="40" y1={GY + 12} x2="960" y2={GY + 12} stroke="rgba(255,255,255,0.04)" strokeWidth="0.8" strokeDasharray="6 5" />
            <circle r="4" fill={C.accent} opacity="0.8" className="kinetic-anim kc-dot-glow">
              <animateMotion dur="5s" repeatCount="indefinite" path={`M80,${GY+12} L420,${GY+12}`} />
            </circle>
            <circle r="4" fill={C.teal} opacity="0.8" className="kinetic-anim kc-dot-glow">
              <animateMotion dur="4s" repeatCount="indefinite" path={`M500,${GY+12} L680,${GY+12}`} />
            </circle>
            <circle r="3" fill={C.accent} opacity="0.4" className="kinetic-anim kc-dot-glow">
              <animateMotion dur="8s" repeatCount="indefinite" path={`M840,${GY+12} L120,${GY+12}`} />
            </circle>
          </motion.g>

          {/* ═══════ BLD 4: FD VAULT ═══════ */}
          <motion.g
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
            transition={{ delay: D.b(4), ...rise }}
            style={{ transformOrigin: `90px ${GY}px` }}
          >
            <rect x="40" y={GY-55} width="100" height="55" rx="2" fill={C.surfBase} stroke={C.border} strokeWidth="0.5" />
            <rect x="80" y={GY-40} width="14" height="11" rx="2" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
            <path d={`M83,${GY-40} V${GY-45} a5,5 0 0,1 8,0 V${GY-40}`} fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="1" />
            <text x="90" y={GY-15} fill={C.txtMd} fontSize="7" fontFamily="Inter,sans-serif" textAnchor="middle">FD: 6.8%</text>
            <circle r="3" cx="108" cy={GY-28} fill="rgba(255,255,255,0.45)" className="kinetic-anim kc-coin-reject" />
            <text x="52" y={GY+30} fill={C.danger} fontSize="6" fontFamily="Inter,sans-serif">&larr; 6.8%</text>
            <text x="100" y={GY+30} fill={C.teal} fontSize="6.5" fontFamily="Inter,sans-serif" fontWeight="600">14% &rarr;</text>
          </motion.g>

          {/* ═══════ BLD 1: FEAR TOWER ═══════ */}
          <motion.g
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
            transition={{ delay: D.b(3), ...rise }}
            style={{ transformOrigin: `220px ${GY}px` }}
            filter="url(#glow-danger)"
          >
            <rect x="195" y={GY-200} width="50" height="200" rx="2" fill={C.surfFear} stroke="rgba(226,75,74,0.15)" strokeWidth="0.8" />
            <rect x="200" y={GY-178} width="40" height="50" rx="2" fill="#060a0c" />
            {[0,1,2,3,4].map(i => {
              const x = 204 + i * 7
              const h = 30 - i * 4
              return <rect key={`c${i}`} x={x} y={GY-172+(30-h)} width="4.5" height={h} rx="0.5"
                fill={C.danger} opacity="1" className={`kinetic-anim kc-candle-${i+1}`} />
            })}
            <text x="220" y={GY-130} fill={C.danger} fontSize="9" fontFamily="monospace" textAnchor="middle" fontWeight="bold">{fearPct}%</text>
            <line x1="220" y1={GY-200} x2="220" y2={GY-215} stroke={C.txtLo} strokeWidth="1" />
            <circle cx="220" cy={GY-217} r="3" fill={C.danger} className="kinetic-anim kc-antenna" />
            <text x="220" y={GY-224} fill={C.danger} fontSize="5" fontFamily="Inter,sans-serif" textAnchor="middle" letterSpacing="1.5" fontWeight="600" className="kinetic-anim kc-label-blink">FEAR INDEX</text>
            <g opacity="0.5">
              <circle cx="206" cy={GY-8} r="3" fill={C.txtLo} />
              <rect x="204" y={GY-5} width="5" height="5" rx="1" fill={C.txtLo} />
              <circle cx="233" cy={GY-8} r="3" fill={C.txtLo} />
              <rect x="231" y={GY-5} width="5" height="5" rx="1" fill={C.txtLo} />
            </g>
          </motion.g>

          {/* ═══════ BLD 6: CRASH MEMORIAL ═══════ */}
          <motion.g
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
            transition={{ delay: D.b(5), ...rise }}
            style={{ transformOrigin: `310px ${GY}px` }}
          >
            <polygon points={`304,${GY} 316,${GY} 314,${GY-50} 310,${GY-58} 306,${GY-50}`} fill={C.surfHover} stroke={C.border} strokeWidth="0.5" />
            <text x="310" y={GY-40} fill={C.danger} fontSize="4" fontFamily="monospace" textAnchor="middle" opacity="0.7">2008 -60%</text>
            <text x="310" y={GY-30} fill={C.danger} fontSize="4" fontFamily="monospace" textAnchor="middle" opacity="0.7">2020 -38%</text>
            <text x="310" y={GY-20} fill={C.danger} fontSize="4" fontFamily="monospace" textAnchor="middle" opacity="0.7">2022 -16%</text>
            <ellipse cx="310" cy={GY-60} rx="3" ry="5" fill={C.accent} className="kinetic-anim kc-flame" />
          </motion.g>

          {/* ═══════ BLD 2: INDEX TEMPLE — centrepiece ═══════ */}
          <motion.g
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
            transition={{ delay: D.b(0), ...rise }}
            style={{ transformOrigin: `500px ${GY}px` }}
          >
            <rect x="395" y={GY-150} width="210" height="150" rx="3" fill={C.surfBright} stroke={C.borderBrt} strokeWidth="0.5" />
            <polygon points={`395,${GY-150} 500,${GY-175} 605,${GY-150}`} fill={C.surfBright} stroke={C.borderBrt} strokeWidth="0.5" />
            {[414,438,462,486,510,534,558,582].map((x,i) => (
              <rect key={`col${i}`} x={x} y={GY-145} width="3.5" height="105" rx="1" fill="rgba(255,255,255,0.08)" />
            ))}
            <text x="500" y={GY-153} fill={C.txtHi} fontSize="6" fontFamily="Inter,sans-serif" textAnchor="middle" letterSpacing="2.5" fontWeight="700">NIFTY 50</text>
            <rect x="418" y={GY-130} width="164" height="70" rx="3" fill="rgba(0,0,0,0.3)" />
            {[0,1,2,3,4,5,6,7].map(i => {
              const bx = 426 + i * 19
              const bh = 24 + (i * 7 % 14) + 6
              return <rect key={`b${i}`} x={bx} y={GY-62-bh} width="12" height={bh} rx="1.5"
                fill={C.teal} opacity="0.8" className={`kinetic-anim kc-bar-${i+1}`} />
            })}
            <g filter="url(#glow-accent-win)">
              {[[418,GY-138],[448,GY-138],[478,GY-138],[528,GY-138],[558,GY-138],[588,GY-138]].map(([wx,wy],i) => (
                <rect key={`w${i}`} x={wx} y={wy} width="6" height="4" rx="0.5" fill={C.accent} opacity="0.7"
                  className={`kinetic-anim kc-win-${['a','b','c','d','a','b'][i]}`} />
              ))}
            </g>
            <rect x="458" y={GY-192} width="84" height="18" rx="5" fill="#050a0c" stroke={C.border} strokeWidth="0.5" />
            <text x="500" y={GY-179} fill={C.accent} fontSize="12" fontFamily="monospace" textAnchor="middle" fontWeight="bold" opacity="1">{clock}</text>
          </motion.g>

          {/* ═══════ BLD 3: SIP FACTORY ═══════ */}
          <motion.g
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
            transition={{ delay: D.b(1), ...rise }}
            style={{ transformOrigin: `700px ${GY}px` }}
            className="kinetic-anim kc-factory-glow"
          >
            <rect x="650" y={GY-115} width="100" height="115" rx="3" fill={C.surfHover} stroke={C.border} strokeWidth="0.5" />
            <rect x="722" y={GY-145} width="14" height="42" rx="1" fill={C.surfHover} stroke={C.border} strokeWidth="0.4" />
            {[0,1,2].map(i => (
              <circle key={`coin${i}`} cx="729" cy={GY-147} r="3.5" fill={C.accent} opacity="1"
                className={`kinetic-anim kc-coin-${i+1}`} />
            ))}
            <text x="700" y={GY-88} fill={C.accent} fontSize="6" fontFamily="Inter,sans-serif" textAnchor="middle" letterSpacing="0.8" fontWeight="600">&#8377;500/mo</text>
            <rect x="657" y={GY-62} width="82" height="2" rx="1" fill="rgba(255,255,255,0.12)" />
            <rect x="660" y={GY-68} width="8" height="5" rx="1" fill={C.accent} opacity="0.7" className="kinetic-anim kc-pkg-1" />
            <rect x="660" y={GY-68} width="8" height="5" rx="1" fill={C.accent} opacity="0.7" className="kinetic-anim kc-pkg-2" />
            <rect x="660" y={GY-48} width="60" height="16" rx="3" fill="#050a0c" stroke={C.border} strokeWidth="0.3" />
            <text x="690" y={GY-37} fill={C.accent} fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="bold">{sipCount}</text>
            <rect x="658" y={GY-105} width="8" height="6" rx="1" fill={C.accent} opacity="0.5" className="kinetic-anim kc-win-a" />
            <rect x="674" y={GY-105} width="8" height="6" rx="1" fill={C.accent} opacity="0.5" className="kinetic-anim kc-win-b" />
          </motion.g>

          {/* ═══════ BLD 5: KINU LIGHTHOUSE ═══════ */}
          <motion.g
            initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
            transition={{ delay: D.b(2), ...rise }}
            style={{ transformOrigin: `870px ${GY}px` }}
          >
            <polygon points={`855,${GY} 885,${GY} 880,${GY-185} 860,${GY-185}`} fill={C.surfHover} stroke={C.border} strokeWidth="0.5" />
            <rect x="856" y={GY-200} width="28" height="16" rx="4" fill={C.surfBright} stroke={C.accent} strokeWidth="0.5" />
            <g className="kinetic-anim kc-beam" style={{ transformOrigin: `870px ${GY-192}px`, animation: 'beam-sweep-spotlight 12s infinite' }}>
              <polygon points={`870,${GY-192} 2370,${GY-492} 2370,${GY+108}`} fill={C.accent} />
            </g>
            <circle cx="870" cy={GY-155} r="3" fill={C.accent} opacity="0.6" className="kinetic-anim kc-port-a" />
            <circle cx="870" cy={GY-125} r="3" fill={C.accent} opacity="0.6" className="kinetic-anim kc-port-b" />
            <circle cx="870" cy={GY-95} r="3" fill={C.accent} opacity="0.6" className="kinetic-anim kc-port-a" />
            <rect x="864" y={GY-15} width="12" height="15" rx="1.5" fill={C.surfHover} stroke={C.amber} strokeWidth="0.5" />
            <rect x="865" y={GY-14} width="10" height="13" rx="1" fill={C.amber} className="kinetic-anim kc-door-light" filter="url(#glow-sm)" />
          </motion.g>

          {/* ── Trees ──────────────────────────────────────────── */}
          <motion.g
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: D.trees, duration: 0.3, type: 'spring', stiffness: 300, damping: 16 }}
          >
            {[265,340,620,770,820,910,60].map((tx,i) => (
              <g key={`t${i}`} className="kinetic-anim kc-tree" style={{ transformOrigin: `${tx}px ${GY}px` }}>
                <polygon points={`${tx},${GY-20} ${tx-6},${GY-5} ${tx+6},${GY-5}`} fill="rgba(29,158,117,0.22)" />
                <rect x={tx-1.5} y={GY-7} width="3" height="7" rx="0.5" fill="rgba(29,158,117,0.15)" />
              </g>
            ))}
          </motion.g>

          {/* ── Street Lights ──────────────────────────────────── */}
          {[270,360,615,800].map((sx,i) => (
            <g key={`sl${i}`}>
              <rect x={sx} y={GY-16} width="1.5" height="16" fill={C.txtLo} />
              <rect x={sx-2.5} y={GY-18} width="6" height="1.5" fill={C.txtLo} />
              <circle cx={sx+3.5} cy={GY-18} r="2" fill={C.amber} opacity="0.45" filter="url(#glow-sm)" />
            </g>
          ))}
        </svg>

        {/* ── Market Ticker ──────────────────────────────────── */}
        <motion.div
           initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
           transition={{ delay: D.ticker, duration: 0.3 }}
           style={{
             position: 'absolute',
             bottom: 0,
             left: 0,
             width: '100%',
             zIndex: 15,
             height: '28px',
             background: 'rgba(255,255,255,0.06)',
             borderTop: `1px solid ${C.border}`,
             overflow: 'hidden',
             display: 'flex',
             alignItems: 'center'
           }}
        >
          <div className="kinetic-anim kc-ticker-track" style={{ display: 'flex', whiteSpace: 'nowrap', fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.02em', color: C.txtMd }}>
            <span><TickerContent items={marketItems} /></span>
            <span><TickerContent items={marketItems} /></span>
          </div>
        </motion.div>

      </div>
    </div>
  )
}
