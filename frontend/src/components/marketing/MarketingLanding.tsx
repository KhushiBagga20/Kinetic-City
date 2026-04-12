import { useEffect, useRef, useState, useCallback } from 'react'
import { useAppStore } from '../../store/useAppStore'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { ArrowRight, Lock, ChevronRight } from 'lucide-react'
import KineticCity from './KineticCity'
import ScrollReviews from './ScrollReviews'


// ── Helpers ──────────────────────────────────────────────────────────────────

function useCountUp(target: number, suffix = '', decimals = 0, trigger: boolean) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!trigger) return
    const start = Date.now()
    const dur = 1800
    const fn = () => {
      const t = Math.min((Date.now() - start) / dur, 1)
      const ease = 1 - Math.pow(1 - t, 3)
      const cur = parseFloat((ease * target).toFixed(decimals))
      setVal(cur)
      if (t < 1) requestAnimationFrame(fn)
    }
    requestAnimationFrame(fn)
  }, [trigger, target, decimals])
  return decimals > 0 ? val.toFixed(decimals) + suffix : Math.round(val) + suffix
}

// ── FEAR TYPE CARDS data ─────────────────────────────────────────────────────

const FEAR_CARDS = [
  {
    id: 'loss', label: 'Loss Avoider', color: '#E24B4A',
    tagline: 'You think carefully before acting.',
    desc: 'Your caution isn\'t a weakness — it\'s a superpower. The market rewards patience more than speed. We\'ll show you why.',
  },
  {
    id: 'jargon', label: 'Clarity Seeker', color: '#378ADD',
    tagline: 'You want to understand before you commit.',
    desc: 'That\'s the smartest approach. Once you kill 3 words — NAV, SIP, CAGR — the rest is just math. Let\'s do it.',
  },
  {
    id: 'scam', label: 'Pattern Detector', color: '#c0f18e',
    tagline: 'Your skepticism has protected you.',
    desc: 'You\'ve been right to be careful. Now let\'s aim that pattern recognition at SEBI-regulated funds vs. WhatsApp scams.',
  },
  {
    id: 'trust', label: 'Independence Guardian', color: '#1D9E75',
    tagline: 'You trust math over people.',
    desc: 'Index funds were literally built for you. No fund manager to trust, no human decisions. Just math that tracks the market.',
  },
]

// ── HOW IT WORKS steps data ──────────────────────────────────────────────────

const STEPS = [
  {
    n: '01', title: 'Take the Vibe Check',
    sub: '5 questions. No jargon. Just your honest reactions.',
    visual: <QuizMockup />,
  },
  {
    n: '02', title: 'Get your Fear Profile',
    sub: 'We tell you exactly what\'s holding you back — and why it makes complete sense.',
    visual: <FearRevealMockup />,
  },
  {
    n: '03', title: 'Your dashboard. Built for you.',
    sub: 'Every module, every lesson, every simulation is tailored to your fear type.',
    visual: <DashboardMockup />,
  },
  {
    n: '04', title: 'Simulate. Learn. Overcome.',
    sub: 'Run your ₹500 through a real market crash. Watch it survive. Then you\'ll know.',
    visual: <FanChartMockup />,
  },
]



// ── VISUAL MOCKUPS (CSS-built) ───────────────────────────────────────────────

function QuizMockup() {
  return (
    <div className="rounded-3xl p-6 border max-w-[280px]" style={{ background: '#071a1f', borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="flex gap-1.5 mb-5">
        {[1,2,3,4,5].map(i => (
          <div key={i} className="h-1 flex-1 rounded-full" style={{ background: i === 1 ? '#c0f18e' : 'rgba(255,255,255,0.08)' }} />
        ))}
      </div>
      <p className="font-sans text-[10px] text-white/30 uppercase tracking-wider mb-3">Question 1 of 5</p>
      <p className="font-display font-semibold text-sm text-white mb-4 leading-snug">You have ₹10,000 saved. The market drops 20%. You...</p>
      {['Panic and want to withdraw', 'Stay calm, this happens', 'Log in to check daily', 'I\'d never invest'].map((opt, i) => (
        <div key={i} className="rounded-xl px-3 py-2.5 mb-2 border text-xs font-sans" style={{
          background: i === 1 ? 'rgba(192,241,142,0.08)' : 'transparent',
          borderColor: i === 1 ? 'rgba(192,241,142,0.25)' : 'rgba(255,255,255,0.06)',
          color: i === 1 ? '#c0f18e' : 'rgba(255,255,255,0.4)',
        }}>{opt}</div>
      ))}
    </div>
  )
}

function FearRevealMockup() {
  return (
    <motion.div
      className="rounded-3xl p-7 border max-w-[260px] text-center"
      style={{ background: '#071a1f', borderColor: 'rgba(226,75,74,0.2)' }}
      animate={{ scale: [1, 1.03, 1] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div className="w-12 h-12 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(226,75,74,0.1)' }}>
        <div className="w-5 h-5 rounded-full" style={{ background: '#E24B4A' }} />
      </div>
      <p className="font-sans text-[9px] text-white/30 uppercase tracking-wider mb-2">Your fear type</p>
      <p className="font-display font-bold text-xl mb-3" style={{ color: '#E24B4A' }}>Loss Avoider</p>
      <p className="font-sans text-xs text-white/40 leading-relaxed">Your caution isn't a weakness. It's what will make you a patient, long-term investor.</p>
    </motion.div>
  )
}

function DashboardMockup() {
  return (
    <div className="rounded-3xl p-5 border max-w-[280px]" style={{ background: '#071a1f', borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="flex gap-2 mb-4">
        {['Home', 'Learn', 'Sim'].map((nav, i) => (
          <div key={nav} className="px-2.5 py-1 rounded-full text-[9px] font-sans" style={{
            background: i === 0 ? 'rgba(192,241,142,0.08)' : 'transparent',
            color: i === 0 ? '#c0f18e' : 'rgba(255,255,255,0.25)',
          }}>{nav}</div>
        ))}
      </div>
      <div className="rounded-2xl p-3 border mb-2" style={{ borderColor: 'rgba(226,75,74,0.2)', background: 'rgba(226,75,74,0.04)' }}>
        <p className="text-[8px] text-white/25 uppercase mb-1">For Loss Avoiders</p>
        <p className="font-sans text-xs text-white/70">Why the market always recovers →</p>
      </div>
      <div className="rounded-2xl p-3 border mb-2" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <p className="text-[8px] text-white/25 uppercase mb-1">Time Machine</p>
        <p className="font-sans text-xs text-white/50">Survive the COVID crash</p>
      </div>
      <div className="rounded-2xl p-3 border" style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
        <p className="text-[8px] text-white/25 uppercase mb-1">Jargon Graveyard</p>
        <p className="font-sans text-xs text-white/50">Kill 3 words today</p>
      </div>
    </div>
  )
}

function FanChartMockup() {
  const paths = [
    { d: 'M 20,120 Q 100,100 180,40', stroke: 'rgba(29,158,117,0.6)', sw: 2 },
    { d: 'M 20,120 Q 100,110 180,70', stroke: '#378ADD',               sw: 2.5 },
    { d: 'M 20,120 Q 100,120 180,100', stroke: 'rgba(226,75,74,0.6)',  sw: 2 },
  ]
  return (
    <div className="rounded-3xl p-5 border max-w-[280px]" style={{ background: '#071a1f', borderColor: 'rgba(255,255,255,0.06)' }}>
      <p className="font-sans text-[9px] text-white/30 uppercase tracking-wider mb-4">₹500/month · 10 years · 600 simulations</p>
      <svg viewBox="0 0 200 140" className="w-full h-28">
        {/* Fan area */}
        <path d="M 20,120 Q 100,90 180,20 L 180,110 Q 100,130 20,120 Z" fill="rgba(55,138,221,0.06)" />
        {/* Dashed invested line */}
        <path d="M 20,120 L 180,115" stroke="rgba(192,241,142,0.4)" strokeWidth="1" strokeDasharray="4,3" />
        {/* Paths */}
        {paths.map((p, i) => <path key={i} d={p.d} stroke={p.stroke} strokeWidth={p.sw} fill="none" />)}
        {/* Labels */}
        <text x="185" y="38" fill="rgba(29,158,117,0.8)" fontSize="8" fontFamily="monospace">Best</text>
        <text x="185" y="72" fill="#378ADD" fontSize="8" fontFamily="monospace">Median</text>
        <text x="185" y="102" fill="rgba(226,75,74,0.8)" fontSize="8" fontFamily="monospace">Bear</text>
      </svg>
      <div className="flex justify-between mt-2">
        <div><p className="text-[7px] text-white/25">Invested</p><p className="font-mono text-xs text-white/60">₹60K</p></div>
        <div className="text-right"><p className="text-[7px] text-white/25">Median</p><p className="font-mono text-xs" style={{ color: '#378ADD' }}>₹2.1L</p></div>
      </div>
    </div>
  )
}

// ── SECTION WRAPPERS ─────────────────────────────────────────────────────────

function FadeIn({ children, delay = 0, className = '', from = 'bottom' }: {
  children: React.ReactNode; delay?: number; className?: string; from?: 'bottom' | 'left' | 'right'
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const x = from === 'left' ? -30 : from === 'right' ? 30 : 0
  const y = from === 'bottom' ? 30 : 0
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x, y }}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

// ── STAT COUNTER (Section 4) ─────────────────────────────────────────────────

function StatCounter({ value, suffix, decimals, label, sublabel }: {
  value: number; suffix: string; decimals?: number; label: string; sublabel: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const display = useCountUp(value, suffix, decimals ?? 0, inView)
  return (
    <div ref={ref} className="text-center">
      <p className="font-display font-bold text-5xl md:text-7xl text-white mb-1" style={{ color: 'var(--accent)' }}>{display}</p>
      <p className="font-sans text-sm text-white/60 mb-1">{label}</p>
      <p className="font-sans text-xs text-white/30">{sublabel}</p>
    </div>
  )
}

// ── FEAR CARD (Section 2) ───────────────────────────────────────────────────

function FearTypeCard({ card, index }: { card: typeof FEAR_CARDS[0]; index: number }) {
  const [open, setOpen] = useState(false)
  return (
    <FadeIn delay={index * 0.1}>
      <div
        className="relative rounded-3xl p-7 border cursor-pointer transition-all duration-300 overflow-hidden"
        style={{
          background: open ? `${card.color}08` : '#071a1f',
          borderColor: open ? `${card.color}30` : 'rgba(255,255,255,0.06)',
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={() => setOpen(o => !o)}
      >
        {/* Blur overlay when closed */}
        {!open && (
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl z-10"
            style={{ backdropFilter: 'blur(1px)', WebkitBackdropFilter: 'blur(1px)', background: 'rgba(7,26,31,0.3)' }}>
            <Lock className="w-4 h-4 mb-2 text-white/25" />
          </div>
        )}

        <div className="relative z-20">
          {/* Fear badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-5"
            style={{ background: `${card.color}12`, borderColor: `${card.color}25`, color: card.color }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: card.color }} />
            <span className="font-sans text-[10px] font-bold tracking-wide">{card.label}</span>
          </div>

          <p className="font-display font-semibold text-base text-white mb-2">{card.tagline}</p>

          <AnimatePresence>
            {open && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="font-sans text-sm text-white/50 leading-relaxed"
              >
                {card.desc}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </FadeIn>
  )
}

// ── HOW IT WORKS STEP ────────────────────────────────────────────────────────

function HowItWorksStep({ step, index }: { step: typeof STEPS[0]; index: number }) {
  const isRight = index % 2 === 0
  return (
    <div className={`flex flex-col ${isRight ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12 md:gap-20`}>
      <FadeIn from={isRight ? 'left' : 'right'} className="flex-1">
        <p className="font-mono text-xs text-white/20 mb-3">{step.n}</p>
        <h3 className="font-display font-bold text-2xl md:text-3xl text-white mb-4 leading-tight">{step.title}</h3>
        <p className="font-sans text-base text-white/50 leading-relaxed">{step.sub}</p>
      </FadeIn>
      <FadeIn from={isRight ? 'right' : 'left'} delay={0.15} className="flex-1 flex justify-center">
        {step.visual}
      </FadeIn>
    </div>
  )
}

// ── FINAL CTA WORDS ──────────────────────────────────────────────────────────

const CTA_WORDS = ['Every month', 'you wait', 'costs you', 'something', "you can't", 'get back.']

function FinalCTASection({ onStart }: { onStart: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-100px' })
  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-6 py-24"
      style={{ background: '#071a1f' }}>
      <div ref={ref} className="text-center max-w-2xl mx-auto">
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mb-8">
          {CTA_WORDS.map((word, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: i * 0.22, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="font-display font-bold text-4xl md:text-6xl text-white block"
            >
              {word}
            </motion.span>
          ))}
        </div>
        <motion.p
          initial={{ opacity: 0 }} animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: CTA_WORDS.length * 0.22 + 0.2 }}
          className="font-display font-medium text-xl md:text-2xl mb-10"
          style={{ color: 'var(--accent)' }}
        >
          Not money. Time.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ delay: CTA_WORDS.length * 0.22 + 0.5, type: 'spring', stiffness: 200 }}
        >
          <button onClick={onStart}
            className="px-9 py-4 rounded-full font-display font-bold text-base text-[#0a1a00] box-glow active:scale-[0.97] transition-transform duration-200"
            style={{ background: 'var(--accent)' }}>
            Start now. It's free. No sign-up required yet →
          </button>
          <p className="font-sans text-xs text-white/25 mt-4">Takes 60 seconds. No financial advice. No spam.</p>
        </motion.div>
      </div>
    </section>
  )
}

// ── MAIN LANDING PAGE ────────────────────────────────────────────────────────

export default function MarketingLanding() {
  const navRef = useRef<HTMLElement>(null)

  // Navbar blur on scroll
  useEffect(() => {
    const handler = () => {
      if (!navRef.current) return
      if (window.scrollY > 60) navRef.current.setAttribute('data-scrolled', 'true')
      else navRef.current.removeAttribute('data-scrolled')
    }
    window.addEventListener('scroll', handler, { passive: true })
    return () => window.removeEventListener('scroll', handler)
  }, [])

  const setView = useAppStore(s => s.setView)

  const handleStart = useCallback(() => {
    setView('quiz')
  }, [setView])

  const statsRef = useRef<HTMLDivElement>(null)



  return (
    <div className="min-h-screen text-white overflow-x-hidden" style={{ background: '#00161b' }}>

      {/* ── NAVBAR ──────────────────────────────────────────────────── */}
      <nav
        ref={navRef}
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-500 nav-marketing"
        style={{ borderBottom: '1px solid transparent' }}
      >
        <div className="max-w-[1200px] mx-auto px-6 md:px-10 h-16 flex items-center justify-between">
          <span className="font-display font-bold text-lg tracking-[0.08em]" style={{ color: 'var(--accent)' }}>
            KINETIC
          </span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('kinetic:open-login'))}
              className="font-sans text-sm text-white/50 hover:text-white transition-colors duration-200"
            >
              Login
            </button>
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-4 py-2 rounded-full font-sans font-bold text-sm text-[#0a1a00] active:scale-[0.97] transition-transform duration-200"
              style={{ background: 'var(--accent)' }}
            >
              Start the Vibe Check <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      {/* ── HERO — Kinetic City ────────────────────────────────────── */}
      <KineticCity onStart={handleStart} />

      {/* ── SECTION 1: THE PROBLEM ──────────────────────────────────── */}
      <section style={{ marginTop: 0, paddingTop: '80px', paddingBottom: '80px', background: 'var(--bg)', width: '100%' }}>
        <div className="px-6 md:px-10 max-w-[1100px] mx-auto">
          <FadeIn from="left" className="mb-16">
          <h2 className="font-display font-bold text-3xl md:text-5xl text-white leading-tight">
            Your money is shrinking.<br />
            <span style={{ color: 'var(--accent)' }}>You just can't see it.</span>
          </h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
          {[
            { n: '7.5%', label: 'of Indians invest in markets', sub: 'Despite 140 crore people' },
            { n: '5.8%', label: 'annual inflation', sub: 'Silently eating your savings' },
            { n: '4.2', label: 'years wasted on average', sub: 'Before making the first investment' },
          ].map((stat, i) => (
            <FadeIn key={i} delay={i * 0.1}>
              <div className="rounded-3xl p-7 border" style={{ background: '#071a1f', borderColor: 'rgba(255,255,255,0.06)' }}>
                <p className="font-display font-bold text-4xl md:text-5xl mb-2" style={{ color: 'var(--accent)' }}>{stat.n}</p>
                <p className="font-sans text-sm text-white/60 mb-1">{stat.label}</p>
                <p className="font-sans text-xs text-white/30">{stat.sub}</p>
              </div>
            </FadeIn>
          ))}
        </div>

          <FadeIn>
            <p className="font-display font-medium text-xl md:text-2xl text-center text-white/60">
              The problem isn't the market. It's the <span className="text-white">fear of it.</span>
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── SECTION 2: FEAR TYPES ───────────────────────────────────── */}
      <section className="py-28 px-6 md:px-10" style={{ background: '#071a1f' }}>
        <div className="max-w-[1100px] mx-auto">
          <FadeIn className="mb-4 text-center">
            <h2 className="font-display font-bold text-3xl md:text-5xl text-white leading-tight">
              There are 4 types of investing fear.<br />
              <span style={{ color: 'var(--accent)' }}>Most people don't know theirs.</span>
            </h2>
          </FadeIn>
          <FadeIn delay={0.1} className="text-center mb-16">
            <p className="font-sans text-base text-white/40">Hover over each card to reveal your type.</p>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-14">
            {FEAR_CARDS.map((card, i) => (
              <FearTypeCard key={card.id} card={card} index={i} />
            ))}
          </div>

          <FadeIn className="text-center">
            <button onClick={handleStart}
              className="inline-flex items-center gap-2.5 px-9 py-4 rounded-full font-display font-bold text-base text-[#0a1a00] box-glow active:scale-[0.97] transition-transform duration-200"
              style={{ background: 'var(--accent)' }}>
              Find out which one you are — 60 seconds <ChevronRight className="w-4 h-4" />
            </button>
          </FadeIn>
        </div>
      </section>

      {/* ── SECTION 3: HOW IT WORKS ─────────────────────────────────── */}
      <section className="py-28 px-6 md:px-10 max-w-[1100px] mx-auto">
        <FadeIn className="text-center mb-20">
          <p className="font-sans text-xs font-bold tracking-[0.2em] text-white/30 uppercase mb-4">How Kinetic works</p>
          <h2 className="font-display font-bold text-3xl md:text-5xl text-white">Four steps. Real change.</h2>
        </FadeIn>

        <div className="space-y-28">
          {STEPS.map((step, i) => (
            <HowItWorksStep key={i} step={step} index={i} />
          ))}
        </div>
      </section>

      {/* ── SCROLL-ANIMATED REVIEWS ─────────────────────────────────── */}
      <ScrollReviews />

      {/* ── SECTION 4: LIVE STATS ───────────────────────────────────── */}
      <section className="py-28 px-6" style={{ background: '#071a1f' }}>
        <div ref={statsRef} className="max-w-[1000px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-6 mb-12">
            <StatCounter value={500} suffix="" label="minimum to start" sublabel="One cup of coffee a month" />
            <StatCounter value={14} suffix="%" label="Nifty 50 avg CAGR" sublabel="Since 2001 — NSE data" />
            <StatCounter value={6} suffix=" months" label="COVID recovery time" sublabel="March → September 2020" />
          </div>
          <FadeIn className="text-center">
            <p className="font-sans text-sm text-white/30">Backed by NSE data. No opinions. Just numbers.</p>
          </FadeIn>
        </div>
      </section>

      {/* ── SECTION 6: FINAL CTA ────────────────────────────────────── */}
      <FinalCTASection onStart={handleStart} />

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <footer className="border-t px-6 md:px-10 py-10" style={{ borderColor: 'rgba(255,255,255,0.06)', background: '#00161b' }}>
        <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <p className="font-display font-bold tracking-[0.08em] mb-1" style={{ color: 'var(--accent)' }}>KINETIC</p>
            <p className="font-sans text-xs text-white/25">Built at Finvasia Innovation Hackathon 2026</p>
          </div>
          <p className="font-sans text-xs text-white/25">
            Data sources: NSE India · RBI · SEBI · AMFI
          </p>
        </div>
        <div className="max-w-[1100px] mx-auto mt-6 pt-6 border-t" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
          <p className="font-sans text-[10px] text-white/20">Educational tool only. Not financial advice.</p>
        </div>
      </footer>
    </div>
  )
}
