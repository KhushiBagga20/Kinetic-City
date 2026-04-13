import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, useInView } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/* ╔══════════════════════════════════════════════════════════════════════════╗
   ║  KINETIC — SCROLL REVIEWS SECTION                                      ║
   ║  Inspired by Groww's floating-card constellation                        ║
   ║                                                                         ║
   ║  FLOW:                                                                  ║
   ║  1. Cards clustered behind headline text                                ║
   ║  2. Scroll → cards float outward, headline fades                        ║
   ║  3. Cards continuously drift/float (alive animation)                    ║
   ║  4. Big stat "Trusted by" in center                                     ║
   ║  5. Scroll → cards converge, glowing logo, exit text                    ║
   ╚══════════════════════════════════════════════════════════════════════════╝ */

// ── DATA ────────────────────────────────────────────────────────────────────

interface Review {
  id: number
  badge: string
  badgeColor: string
  quote: string
  name: string
  role: string
}

const REVIEWS: Review[] = [
  {
    id: 1, badge: 'Loss Avoider', badgeColor: 'var(--danger)',
    quote: 'I kept ₹40,000 in FD for two years because I was scared. Kinetic showed me I had already lost ₹4,800 in real value.',
    name: 'Rahul M.', role: 'Software Engineer, Hyderabad',
  },
  {
    id: 2, badge: 'Clarity Seeker', badgeColor: 'var(--blue)',
    quote: 'I finally understand what NAV means. Took me 4 years of avoiding it and 10 minutes on Kinetic.',
    name: 'Sneha P.', role: 'Design Student, Bengaluru',
  },
  {
    id: 3, badge: 'Pattern Detector', badgeColor: 'var(--accent)',
    quote: "Three WhatsApp groups had 'guaranteed 40% returns.' Kinetic showed me exactly why those are scams.",
    name: 'Priya K.', role: 'Marketing Manager, Mumbai',
  },
  {
    id: 4, badge: 'Independence Guardian', badgeColor: 'var(--teal)',
    quote: "No fund manager. No salesperson. Just math and a dashboard. That's all I needed.",
    name: 'Kiran T.', role: 'Freelancer, Pune',
  },
  {
    id: 5, badge: 'Loss Avoider', badgeColor: 'var(--danger)',
    quote: 'I ran the Time Machine from 2015. Watched my virtual ₹100 drop during COVID. Then watched it come back.',
    name: 'Priya V.', role: 'CA Intern, Delhi',
  },
  {
    id: 6, badge: 'Clarity Seeker', badgeColor: 'var(--blue)',
    quote: 'The Jargon Graveyard killed XIRR, expense ratio, and NAV for me in one sitting.',
    name: 'Aditya R.', role: 'Engineering Student, Chennai',
  },
  {
    id: 7, badge: 'Pattern Detector', badgeColor: 'var(--accent)',
    quote: "Every number on this app has a source. NSE. RBI. SEBI. That's the only reason I trusted it.",
    name: 'Meera K.', role: 'Data Analyst, Bengaluru',
  },
  {
    id: 8, badge: 'Independence Guardian', badgeColor: 'var(--teal)',
    quote: "Index fund. 0.1% expense ratio. ₹100 a month. Kinetic made a 3-step plan feel obvious.",
    name: 'Vivek N.', role: 'Product Manager, Gurugram',
  },
  {
    id: 9, badge: 'Loss Avoider', badgeColor: 'var(--danger)',
    quote: "My parents put everything in FD. Kinetic's FD erosion chart explained why that's losing money in 10 seconds.",
    name: 'Ananya D.', role: 'College Final Year, Jaipur',
  },
  {
    id: 10, badge: 'Clarity Seeker', badgeColor: 'var(--blue)',
    quote: "I was scared to even open a demat account. Kinetic made the first step feel like nothing.",
    name: 'Rohan G.', role: 'BBA Student, Chandigarh',
  },
  {
    id: 11, badge: 'Pattern Detector', badgeColor: 'var(--accent)',
    quote: "My uncle's stock tips cost me ₹15K. Kinetic's pattern quiz showed me why I kept falling for it.",
    name: 'Kavya S.', role: 'Content Writer, Kochi',
  },
  {
    id: 12, badge: 'Independence Guardian', badgeColor: 'var(--teal)',
    quote: "Started with ₹100/month. Seeing my SIP grow in real-time changed everything about how I think about money.",
    name: 'Nikhil P.', role: 'Junior Developer, Noida',
  },
]

// ── Scattered positions (percentage based: left%, top%) ─────────────────────
// These define where cards land when exploded out
// Deliberately going edge-to-edge, some even partially off-screen for depth
const CARD_LAYOUT = [
  // Row 1: top band
  { left: -4,  top: 2,   w: 260, scale: 0.88, delay: 0 },
  { left: 22,  top: -1,  w: 230, scale: 0.82, delay: 0.3 },
  { left: 48,  top: 3,   w: 240, scale: 0.85, delay: 0.1 },
  { left: 74,  top: -2,  w: 250, scale: 0.9,  delay: 0.4 },
  // Row 2: upper-mid
  { left: 8,   top: 28,  w: 270, scale: 0.92, delay: 0.2 },
  { left: 38,  top: 24,  w: 220, scale: 0.78, delay: 0.5 },
  { left: 66,  top: 30,  w: 260, scale: 0.88, delay: 0.15 },
  // Row 3: lower-mid
  { left: -2,  top: 56,  w: 250, scale: 0.85, delay: 0.35 },
  { left: 28,  top: 60,  w: 240, scale: 0.82, delay: 0.05 },
  { left: 55,  top: 54,  w: 230, scale: 0.8,  delay: 0.45 },
  { left: 78,  top: 58,  w: 260, scale: 0.88, delay: 0.25 },
  // Row 4: bottom
  { left: 14,  top: 82,  w: 240, scale: 0.84, delay: 0.4 },
]

// Random float offsets for continuous drift animation
const FLOAT_RANGES = [
  { x: 12, y: 18, dur: 6.5 },
  { x: -15, y: 12, dur: 7.2 },
  { x: 10, y: -16, dur: 5.8 },
  { x: -12, y: -14, dur: 6.8 },
  { x: 18, y: 10, dur: 7.5 },
  { x: -10, y: 18, dur: 6.2 },
  { x: 14, y: -12, dur: 5.5 },
  { x: -16, y: 15, dur: 7.0 },
  { x: 11, y: 14, dur: 6.0 },
  { x: -14, y: -10, dur: 7.8 },
  { x: 16, y: -18, dur: 5.2 },
  { x: -11, y: 16, dur: 6.4 },
]

// ── REVIEW CARD COMPONENT ───────────────────────────────────────────────────

function ReviewCard({ review, width }: { review: Review; width: number }) {
  return (
    <div
      className="glass rounded-xl overflow-hidden"
      style={{
        width: `${width}px`,
        padding: '16px 18px',
        border: '1px solid var(--border)',
        backdropFilter: 'blur(16px)',
        transition: 'border-color 0.3s ease, transform 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'rgba(192,241,142,0.3)'
        e.currentTarget.style.transform = 'scale(1.04)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.transform = 'scale(1)'
      }}
    >
      {/* Badge */}
      <div
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full mb-3"
        style={{
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.05em',
          background: `color-mix(in srgb, ${review.badgeColor} 12%, transparent)`,
          border: `1px solid color-mix(in srgb, ${review.badgeColor} 22%, transparent)`,
          color: review.badgeColor,
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: review.badgeColor }} />
        {review.badge}
      </div>

      {/* Quote */}
      <p
        className="leading-relaxed mb-3"
        style={{ color: 'var(--text-primary)', fontSize: '13px', fontStyle: 'italic' }}
      >
        "{review.quote}"
      </p>

      {/* Author */}
      <div className="flex items-center gap-2.5 pt-2.5" style={{ borderTop: '1px solid var(--border)' }}>
        {/* Avatar circle */}
        <div
          className="rounded-full flex items-center justify-center text-xs font-bold"
          style={{
            width: 28, height: 28, flexShrink: 0,
            background: `color-mix(in srgb, ${review.badgeColor} 20%, transparent)`,
            color: review.badgeColor,
          }}
        >
          {review.name.charAt(0)}
        </div>
        <div>
          <p className="font-semibold" style={{ fontSize: '12px', color: 'var(--text-primary)' }}>
            {review.name}
          </p>
          <p style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
            {review.role}
          </p>
        </div>
      </div>
    </div>
  )
}

// ── DESKTOP: PINNED CONSTELLATION ───────────────────────────────────────────

function DesktopScrollReviews() {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const pinnedRef = useRef<HTMLDivElement>(null)
  const headlineRef = useRef<HTMLDivElement>(null)
  const centerTextRef = useRef<HTMLDivElement>(null)
  const logoRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLDivElement | null)[]>([])
  const floatTweens = useRef<gsap.core.Tween[]>([])

  useEffect(() => {
    const wrapper = wrapperRef.current
    const pinned = pinnedRef.current
    const headline = headlineRef.current
    const centerText = centerTextRef.current
    const logo = logoRef.current
    if (!wrapper || !pinned || !headline || !centerText || !logo) return

    const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[]
    if (cards.length !== REVIEWS.length) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const ctx = gsap.context(() => {
      // ── Start continuous floating animation on each card ──
      if (!prefersReduced) {
        cards.forEach((card, i) => {
          const fr = FLOAT_RANGES[i]
          const tween = gsap.to(card, {
            x: `+=${fr.x}`,
            y: `+=${fr.y}`,
            duration: fr.dur,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
            delay: i * 0.3,
            paused: true, // Start paused, enable when cards are visible
          })
          floatTweens.current.push(tween)
        })
      }

      // ── Main scroll-driven timeline ──
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: wrapper,
          start: 'top top',
          end: 'bottom bottom',
          pin: pinned,
          scrub: 0.8,
          anticipatePin: 1,
        },
      })

      // ═══════════════════════════════════════════════════════════════════
      // PHASE 1 (0→10): Headline visible, cards tiny behind it
      // ═══════════════════════════════════════════════════════════════════
      // (cards start stacked at center with opacity 0.15 via CSS)

      // ═══════════════════════════════════════════════════════════════════
      // PHASE 2 (10→45): Headline fades, cards EXPLODE to positions
      // ═══════════════════════════════════════════════════════════════════

      // Headline fades and pushes up
      tl.to(headline, {
        opacity: 0,
        y: -80,
        scale: 0.92,
        duration: 12,
        ease: 'power2.in',
      }, 10)

      // Each card flies to its scattered layout position
      cards.forEach((card, i) => {
        const layout = CARD_LAYOUT[i]
        tl.to(card, {
          left: `${layout.left}%`,
          top: `${layout.top}%`,
          scale: layout.scale,
          opacity: 1,
          rotation: (Math.random() - 0.5) * 4, // slight random tilt
          duration: 22,
          ease: 'power3.out',
          onStart: () => {
            // Enable float animation once card reaches position
            if (floatTweens.current[i]) {
              floatTweens.current[i].play()
            }
          },
        }, 10 + layout.delay * 10)
      })

      // ═══════════════════════════════════════════════════════════════════
      // PHASE 3 (35→55): Center stat text fades in over the cards
      // ═══════════════════════════════════════════════════════════════════

      tl.fromTo(centerText,
        { opacity: 0, scale: 0.9, y: 30 },
        { opacity: 1, scale: 1, y: 0, duration: 12, ease: 'power2.out' },
        35
      )

      // Hold the view...

      // ═══════════════════════════════════════════════════════════════════
      // PHASE 4 (60→80): Center text fades, cards converge, logo glows
      // ═══════════════════════════════════════════════════════════════════

      // Center text fades
      tl.to(centerText, {
        opacity: 0,
        y: -40,
        duration: 8,
        ease: 'power2.in',
      }, 60)

      // Cards converge back toward center and fade
      cards.forEach((card, i) => {
        tl.to(card, {
          left: '50%',
          top: '50%',
          scale: 0.1,
          opacity: 0,
          rotation: 0,
          duration: 20,
          ease: 'power2.inOut',
          onStart: () => {
            // Pause float when collapsing
            if (floatTweens.current[i]) {
              floatTweens.current[i].pause()
            }
          },
        }, 62 + i * 0.6)
      })

      // Glowing KINETIC logo
      tl.fromTo(logo,
        { opacity: 0, scale: 0.7 },
        { opacity: 1, scale: 1, duration: 14, ease: 'power2.out' },
        72
      )

      // Logo fades at the end
      tl.to(logo, {
        opacity: 0,
        scale: 1.05,
        duration: 8,
        ease: 'power2.in',
      }, 92)

    }, wrapper)

    return () => {
      floatTweens.current.forEach(t => t.kill())
      floatTweens.current = []
      ctx.revert()
    }
  }, [])

  return (
    <div ref={wrapperRef} style={{ height: '400vh' }} className="relative">
      <div
        ref={pinnedRef}
        className="relative w-full overflow-hidden"
        style={{ height: '100vh', background: 'var(--bg)' }}
      >
        {/* ── Headline (Phase 1) ── */}
        <div
          ref={headlineRef}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none px-8"
        >
          <p className="text-sm uppercase tracking-[0.25em] mb-6" style={{ color: 'var(--accent)', fontWeight: 600 }}>
            What they're saying
          </p>
          <h2
            className="font-display font-bold text-center leading-[1.1] mb-5"
            style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)', color: 'white' }}
          >
            Real stories.<br />Real&nbsp;progress.
          </h2>
          <p className="text-center text-lg" style={{ color: 'var(--text-secondary)' }}>
            From people who were exactly where you are.
          </p>
        </div>

        {/* ── Center stat text (Phase 3) ── */}
        <div
          ref={centerTextRef}
          className="absolute inset-0 z-20 flex flex-col items-center justify-center pointer-events-none"
          style={{ opacity: 0 }}
        >
          <p
            className="font-display font-bold text-center leading-none"
            style={{
              fontSize: 'clamp(3rem, 8vw, 7rem)',
              color: 'white',
              textShadow: '0 0 80px rgba(0,0,0,0.5)',
            }}
          >
            1 in 14
          </p>
          <p className="text-lg mt-4" style={{ color: 'var(--text-secondary)' }}>
            Young Indians who currently invest.
          </p>
          <p className="text-lg mt-1 font-semibold" style={{ color: 'var(--text-primary)' }}>
            You could be the next one.
          </p>
        </div>

        {/* ── Glowing KINETIC logo (Phase 4) ── */}
        <div
          ref={logoRef}
          className="absolute inset-0 z-30 flex flex-col items-center justify-center pointer-events-none"
          style={{ opacity: 0 }}
        >
          <div className="relative">
            {/* Glow layers */}
            <div
              className="absolute inset-0 blur-3xl opacity-30"
              style={{
                background: 'radial-gradient(circle, rgba(192,241,142,0.4) 0%, transparent 70%)',
                transform: 'scale(3)',
              }}
            />
            <p
              className="font-display font-bold tracking-[0.2em] relative"
              style={{
                fontSize: 'clamp(4rem, 10vw, 9rem)',
                color: 'var(--accent)',
                textShadow: '0 0 60px rgba(192,241,142,0.5), 0 0 120px rgba(192,241,142,0.2), 0 0 200px rgba(192,241,142,0.1)',
              }}
            >
              KINETIC
            </p>
          </div>
          <p className="text-lg mt-8" style={{ color: 'var(--text-secondary)' }}>
            Your turn. Start with ₹100.
          </p>
        </div>

        {/* ── THE 12 REVIEW CARDS ── */}
        {REVIEWS.map((review, i) => {
          const layout = CARD_LAYOUT[i]
          return (
            <div
              key={review.id}
              ref={el => { cardRefs.current[i] = el }}
              className="absolute"
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                scale: 0.15,
                opacity: 0.12,
                zIndex: 10,
                willChange: 'transform, opacity, left, top',
              }}
            >
              <ReviewCard review={review} width={layout.w} />
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── MOBILE: CARD TICKER ─────────────────────────────────────────────────────

function MobileReviewCarousel() {
  const [activeIdx, setActiveIdx] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const inView = useInView(sectionRef, { once: true, margin: '-60px' })

  const handleScroll = useCallback(() => {
    if (!containerRef.current) return
    const el = containerRef.current
    const cardWidth = el.scrollWidth / REVIEWS.length
    const idx = Math.round(el.scrollLeft / cardWidth)
    setActiveIdx(Math.min(idx, REVIEWS.length - 1))
  }, [])

  return (
    <section ref={sectionRef} className="py-20 px-5" style={{ background: 'var(--bg)' }}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="text-center mb-10"
      >
        <p
          className="text-xs uppercase tracking-[0.25em] mb-3"
          style={{ color: 'var(--accent)', fontWeight: 600 }}
        >
          What they're saying
        </p>
        <h2 className="font-display font-bold text-2xl text-white leading-tight mb-3">
          Real stories.<br />Real progress.
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          From people who were exactly where you are.
        </p>
      </motion.div>

      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-5 px-5"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {REVIEWS.map((review, i) => (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: i * 0.04, duration: 0.5 }}
            className="snap-center flex-shrink-0"
            style={{ width: '82vw', maxWidth: '300px' }}
          >
            <ReviewCard review={review} width={300} />
          </motion.div>
        ))}
      </div>

      <div className="flex justify-center gap-1.5 mt-5">
        {REVIEWS.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === activeIdx ? '18px' : '5px',
              height: '5px',
              background: i === activeIdx ? 'var(--accent)' : 'rgba(255,255,255,0.12)',
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.4, duration: 0.7 }}
        className="text-center mt-14"
      >
        <p className="font-display font-bold text-4xl" style={{ color: 'var(--accent)' }}>
          1 in 14
        </p>
        <p className="text-sm mt-2" style={{ color: 'var(--text-secondary)' }}>
          Young Indians who currently invest.
        </p>
        <p className="text-sm mt-1 font-semibold" style={{ color: 'var(--text-primary)' }}>
          You could be the next one.
        </p>
      </motion.div>
    </section>
  )
}

// ── MAIN EXPORT ─────────────────────────────────────────────────────────────

export default function ScrollReviews() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  if (isMobile) return <MobileReviewCarousel />
  return <DesktopScrollReviews />
}
