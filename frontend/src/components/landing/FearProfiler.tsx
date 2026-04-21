import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, ChevronRight } from 'lucide-react'
import { useAppStore, type FearType, type MetaphorStyle } from '../../store/useAppStore'

// ── Question data ────────────────────────────────────────────────────────────

type ScoreMap = Partial<Record<FearType, number>>

interface Option {
  text: string
  scores: ScoreMap
  metaphorStyle?: MetaphorStyle
}

interface Question {
  id: number
  text: string
  options: Option[]
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "When you hear 'the market crashed 20% today' your first thought is?",
    options: [
      { text: "I just lost money I worked hard for", scores: { loss: 3 } },
      { text: "I don't even know what that means", scores: { jargon: 3 } },
      { text: "Someone is probably manipulating it", scores: { scam: 3 } },
      { text: "I'd never trust a fund manager with my money", scores: { trust: 3 } },
    ],
  },
  {
    id: 2,
    text: "What do you do in your free time?",
    options: [
      { text: "Gaming — I live for ranked matches", scores: { loss: 1 }, metaphorStyle: 'gamer' },
      { text: "Studying or reading, always learning", scores: { jargon: 1 }, metaphorStyle: 'student' },
      { text: "Working, side hustles, always grinding", scores: { trust: 1 }, metaphorStyle: 'professional' },
      { text: "Chilling, reels, vibing", scores: { scam: 1 }, metaphorStyle: 'generic' },
    ],
  },
  {
    id: 3,
    text: "You see an ad for a mutual fund. You think:",
    options: [
      { text: "What if I put in ₹10,000 and lose it all?", scores: { loss: 3 } },
      { text: "What even is a mutual fund?", scores: { jargon: 3 } },
      { text: "This is probably a scam", scores: { scam: 3 } },
      { text: "They'll just take fees and ghost me", scores: { trust: 3 } },
    ],
  },
  {
    id: 4,
    text: "You have ₹10,000 right now. You'd most likely:",
    options: [
      { text: "Put it in FD — at least I know it's safe", scores: { loss: 2, jargon: 1 } },
      { text: "Keep it in savings, investing feels complicated", scores: { jargon: 2 } },
      { text: "Keep it as cash, I don't trust apps", scores: { scam: 2, trust: 1 } },
      { text: "Invest only if a friend I trust recommends it", scores: { trust: 2 } },
    ],
  },
  {
    id: 5,
    text: "The biggest reason you haven't invested yet is:",
    options: [
      { text: "Fear of losing money", scores: { loss: 3 } },
      { text: "I don't understand any of it", scores: { jargon: 3 } },
      { text: "It all feels like a trap", scores: { scam: 3 } },
      { text: "I don't know who to trust", scores: { trust: 3 } },
    ],
  },
]

// ── Fear type profile data ────────────────────────────────────────────────────

const FEAR_PROFILES: Record<FearType, { name: string; color: string; bg: string; message: string }> = {
  loss: {
    name: 'Loss Avoider',
    color: '#E24B4A',
    bg: 'rgba(226,75,74,0.10)',
    message: "You're not scared of markets. You're scared of regret. That's actually a superpower — it means you think carefully before acting.",
  },
  jargon: {
    name: 'Clarity Seeker',
    color: '#378ADD',
    bg: 'rgba(55,138,221,0.10)',
    message: "You're not scared of investing. You're scared of doing something you don't fully understand. That's wisdom, not weakness.",
  },
  scam: {
    name: 'Pattern Detector',
    color: '#EF9F27',
    bg: 'rgba(239,159,39,0.10)',
    message: "You've been burned by too many fake promises. Your skepticism has protected you — now let's channel it into real due diligence.",
  },
  trust: {
    name: 'Independence Guardian',
    color: '#1D9E75',
    bg: 'rgba(29,158,117,0.10)',
    message: "You don't give your trust easily. That's smart. The good news: index funds don't need you to trust a person — just math.",
  },
}

// ── Slide animation variants ──────────────────────────────────────────────────

function slideVariants(direction: number) {
  return {
    enter: { x: direction > 0 ? '100%' : '-100%', opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: direction > 0 ? '-100%' : '100%', opacity: 0 },
  }
}

// ── Main component ────────────────────────────────────────────────────────────

export default function FearProfiler() {
  const setView = useAppStore(s => s.setView)
  const setFearProfile = useAppStore(s => s.setFearProfile)

  const [currentQ, setCurrentQ] = useState(0)
  const [direction, setDirection] = useState(1)
  const [selected, setSelected] = useState<(number | null)[]>(Array(5).fill(null))
  const [metaphorStyle, setMetaphorStyle] = useState<MetaphorStyle>('generic')
  const [revealed, setRevealed] = useState<FearType | null>(null)
  const [showContinue, setShowContinue] = useState(false)

  const question = QUESTIONS[currentQ]
  const selectedIdx = selected[currentQ]

  function handleSelect(optionIdx: number) {
    const newSelected = [...selected]
    newSelected[currentQ] = optionIdx
    setSelected(newSelected)

    const opt = QUESTIONS[currentQ].options[optionIdx]
    if (opt.metaphorStyle) setMetaphorStyle(opt.metaphorStyle)

    // Auto-advance after short delay on final question
    if (currentQ === QUESTIONS.length - 1) {
      setTimeout(() => {
        computeResult(newSelected, opt.metaphorStyle ?? metaphorStyle)
      }, 700)
    }
  }

  function computeResult(answers: (number | null)[], finalMetaphor: MetaphorStyle) {
    const totals: Record<FearType, number> = { loss: 0, jargon: 0, scam: 0, trust: 0 }
    let finalMetaphorStyle: MetaphorStyle = finalMetaphor

    QUESTIONS.forEach((q, qi) => {
      const idx = answers[qi]
      if (idx === null) return
      const opt = q.options[idx]
      for (const [key, val] of Object.entries(opt.scores)) {
        totals[key as FearType] += val ?? 0
      }
      if (opt.metaphorStyle) finalMetaphorStyle = opt.metaphorStyle
    })

    const fearType = (Object.entries(totals) as [FearType, number][])
      .sort((a, b) => b[1] - a[1])[0][0]

    setFearProfile(fearType, finalMetaphorStyle)
    setRevealed(fearType)

    setTimeout(() => setShowContinue(true), 1400)
  }

  function goNext() {
    if (selectedIdx === null) return
    setDirection(1)
    setCurrentQ(q => q + 1)
  }

  function goBack() {
    if (currentQ === 0) {
      setView('landing')
      return
    }
    setDirection(-1)
    setCurrentQ(q => q - 1)
  }

  // ── Reveal screen ───────────────────────────────────────────────────────────
  if (revealed) {
    const profile = FEAR_PROFILES[revealed]
    return (
      <div className="min-h-screen bg-[#00161b] flex flex-col items-center justify-center px-6 relative overflow-hidden">
        {/* Ambient glow matching fear type */}
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${profile.bg}, transparent)` }}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' as const }}
          className="relative z-10 text-center max-w-lg w-full"
        >
          {/* Label */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-[10px] font-sans font-bold tracking-[0.25em] text-white/40 uppercase mb-8"
          >
            Your Fear Type
          </motion.p>

          {/* Fear type name — punch in */}
          <motion.div
            layoutId="fear-badge"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: [0.8, 1.05, 1] }}
            transition={{ delay: 0.2, duration: 0.6, times: [0, 0.7, 1] }}
            className="block mx-auto max-w-sm mb-8"
          >
            <div
              className="rounded-3xl px-8 py-6 border text-center overflow-hidden"
              style={{
                background: profile.bg,
                borderColor: `${profile.color}30`,
              }}
            >
              <h1
                className="font-display font-bold tracking-tight leading-tight text-center w-full"
                style={{ fontSize: 'clamp(1.75rem, 6vw, 3rem)', color: profile.color, wordBreak: 'break-word', overflowWrap: 'break-word' }}
              >
                {profile.name}
              </h1>
            </div>
          </motion.div>

          {/* Message */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="font-sans text-base md:text-lg text-white/65 leading-[1.75] mb-12 max-w-md mx-auto"
          >
            {profile.message}
          </motion.p>

          {/* Continue */}
          {showContinue && (
            <motion.button
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              onClick={() => { useAppStore.getState().setIsNewUser(true); setView('signup') }}
              whileHover={{ boxShadow: '0 12px 32px -4px rgba(192,241,142,0.5), 0 0 0 1px rgba(192,241,142,0.25)' }}
              className="bg-[var(--color-primary-fixed)] hover:bg-[#b4e882] text-[#0a1a00] font-sans font-bold text-sm px-10 py-4 rounded-full transition-all duration-200 box-glow active:scale-[0.97] flex items-center gap-2 mx-auto"
            >
              Continue to Dashboard
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          )}
        </motion.div>
      </div>
    )
  }

  // ── Quiz screen ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#00161b] flex flex-col px-6">
      {/* Top bar */}
      <div className="max-w-2xl mx-auto w-full pt-8 pb-4 flex items-center justify-between">
        <button
          onClick={goBack}
          className="flex items-center gap-2 text-white/40 hover:text-white transition-colors duration-200 font-sans text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          {currentQ === 0 ? 'Exit' : 'Back'}
        </button>

        {/* Progress dots */}
        <div className="flex items-center gap-2.5">
          {QUESTIONS.map((_, i) => (
            <motion.div
              key={i}
              animate={{
                width: i === currentQ ? 24 : 8,
                backgroundColor: i <= currentQ ? '#c0f18e' : 'rgba(255,255,255,0.15)',
              }}
              transition={{ duration: 0.3 }}
              className="h-2 rounded-full"
            />
          ))}
        </div>

        <span className="font-mono text-[11px] text-white/30">
          {currentQ + 1} / {QUESTIONS.length}
        </span>
      </div>

      {/* Question area */}
      <div className="flex-1 flex items-center justify-center">
        <div className="max-w-2xl w-full relative overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentQ}
              custom={direction}
              variants={slideVariants(direction)}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.35, ease: 'easeInOut' as const }}
            >
              {/* Question text */}
              <motion.h2
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' as const }}
                className="font-display font-semibold text-white text-center mb-10 leading-[1.2] tracking-tight"
                style={{ fontSize: 'clamp(1.4rem, 3.5vw, 2.2rem)' }}
              >
                {question.text}
              </motion.h2>

              {/* Answer cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {question.options.map((option, i) => {
                  const isSelected = selectedIdx === i
                  return (
                      <motion.button
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          delay: 0.15 + i * 0.08,
                          duration: 0.5,
                          ease: 'easeOut' as const,
                        }}
                        whileHover={{ borderColor: 'rgba(255,255,255,0.15)' }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSelect(i)}
                        className="text-left p-5 rounded-3xl border transition-[background-color,border-color] duration-200 group relative overflow-hidden"
                      style={{
                        background: isSelected
                          ? 'rgba(192,241,142,0.07)'
                          : 'rgba(255,255,255,0.03)',
                        borderColor: isSelected
                          ? 'rgba(192,241,142,0.45)'
                          : 'rgba(255,255,255,0.07)',
                      }}
                    >
                      {/* Selection indicator */}
                      {isSelected && (
                        <motion.div
                          layoutId={`check-${currentQ}`}
                          className="absolute top-4 right-4 w-5 h-5 rounded-full bg-[var(--color-primary-fixed)] flex items-center justify-center"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                        >
                          <svg className="w-3 h-3 text-[#0a1a00]" fill="none" viewBox="0 0 12 12">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </motion.div>
                      )}

                      <p
                        className="font-sans text-sm leading-[1.6] pr-6 transition-colors duration-200"
                        style={{ color: isSelected ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.60)' }}
                      >
                        {option.text}
                      </p>
                    </motion.button>
                  )
                })}
              </div>

              {/* Next button - not shown on last Q (auto-advances) */}
              {currentQ < QUESTIONS.length - 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: selectedIdx !== null ? 1 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-8 flex justify-center"
                >
                  <motion.button
                    whileHover={{ boxShadow: '0 12px 32px -4px rgba(192,241,142,0.5), 0 0 0 1px rgba(192,241,142,0.25)' }}
                    onClick={goNext}
                    disabled={selectedIdx === null}
                    className="flex items-center gap-2.5 bg-[var(--color-primary-fixed)] hover:bg-[#b4e882] disabled:opacity-30 text-[#0a1a00] font-sans font-bold text-sm px-8 py-3.5 rounded-full transition-all duration-200 box-glow"
                  >
                    Next
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                </motion.div>
              )}

              {/* Last question hint */}
              {currentQ === QUESTIONS.length - 1 && selectedIdx === null && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-center mt-8 text-[11px] font-sans text-white/30"
                >
                  Select an answer to reveal your fear type
                </motion.p>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom padding */}
      <div className="h-16" />
    </div>
  )
}
