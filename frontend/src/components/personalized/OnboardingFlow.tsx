import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { useAppStore, type FearType } from '../../store/useAppStore'

// ── Hardcoded fear-type data (self-contained, no external imports) ────────────

const FEAR_NAMES: Record<FearType, string> = {
  loss: 'Loss Avoider',
  jargon: 'Clarity Seeker',
  scam: 'Pattern Detector',
  trust: 'Independence Guardian',
}

const FEAR_COLORS: Record<FearType, string> = {
  loss: '#E24B4A',
  jargon: '#378ADD',
  scam: '#c0f18e',
  trust: '#1D9E75',
}

const FEAR_DESCRIPTIONS: Record<FearType, string> = {
  loss: "You're wired to avoid losses more than you chase gains. That instinct protected humans from tigers. In investing, it can stop you from building wealth.",
  jargon: 'Unfamiliar words feel like barriers. Once you decode 3 key terms, investing becomes much more accessible.',
  scam: "You have sharp pattern recognition. Directed at regulated funds, that's a superpower.",
  trust: 'You prefer verified data over human opinions. Index funds were literally built for you — pure math, no people.',
}

const FEAR_STRENGTHS: Record<FearType, [string, string]> = {
  loss: ['Careful with risk', 'Holds well through recovery'],
  jargon: ['Asks before acting', 'Learns fast once terms click'],
  scam: ['Reads fine print', 'Immune to hype'],
  trust: ['Data-driven', 'Never follows the crowd'],
}

const KINU_FALLBACKS: Record<FearType, string> = {
  loss: 'Market downturns are not losses. They are discounts waiting to be seized.',
  jargon: 'Complexity is a disguise for high fees. True wealth is built on simple principles.',
  scam: 'Skepticism is your armor. Trust only the math, never the promise.',
  trust: 'Nobody cares more about your money than you do. Own your independence.',
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function OnboardingFlow() {
  const fearType = useAppStore(s => s.fearType) ?? 'loss'
  const setOnboardingComplete = useAppStore(s => s.setOnboardingComplete)

  const [step, setStep] = useState<0 | 1 | 2>(0)

  const color = FEAR_COLORS[fearType]
  const name = FEAR_NAMES[fearType]

  // ── Step content ────────────────────────────────────────────────────────────

  function renderStep() {
    switch (step) {
      /* ── Step 0: Fear Reveal ─────────────────────────────────────────────── */
      case 0:
        return (
          <div className="flex flex-col items-center text-center max-w-[480px] mx-auto px-6">
            {/* Icon circle */}
            <div
              className="flex items-center justify-center rounded-full"
              style={{
                width: 80,
                height: 80,
                background: `${color}26`,
                border: `2px solid ${color}66`,
              }}
            >
              <span
                className="font-display font-black text-2xl"
                style={{ color }}
              >
                {name.charAt(0)}
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-display font-bold text-4xl text-white mt-6">
              You are a {name}
            </h1>

            {/* Description */}
            <p className="text-[15px] text-white/60 leading-relaxed mt-3">
              {FEAR_DESCRIPTIONS[fearType]}
            </p>

            {/* Strengths */}
            <p className="text-[11px] uppercase tracking-widest text-white/30 mt-6">
              Your strengths:
            </p>
            <div className="flex items-center gap-2 mt-2">
              {FEAR_STRENGTHS[fearType].map((s, i) => (
                <span
                  key={i}
                  className="text-[13px] text-white/70 bg-white/5 border border-white/10 rounded-full px-4 py-1.5"
                >
                  {s}
                </span>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={() => setStep(1)}
              className="mt-8 bg-[#c0f18e] text-[#0a1a00] font-bold px-8 py-3.5 rounded-full transition-transform duration-150 active:scale-[0.97] hover:brightness-110"
            >
              See your dashboard →
            </button>
          </div>
        )

      /* ── Step 1: First Action ────────────────────────────────────────────── */
      case 1:
        return (
          <div className="flex flex-col items-center text-center max-w-[480px] mx-auto px-6">
            <h2 className="font-display font-bold text-2xl text-white">
              Here's your one job for today
            </h2>

            {/* Static preview card */}
            <div
              className="w-full rounded-2xl p-5 mt-6 text-left"
              style={{
                borderColor: 'rgba(192,241,142,0.2)',
                borderWidth: 1,
                borderStyle: 'solid',
                borderLeft: '3px solid #c0f18e',
                background: 'rgba(192,241,142,0.04)',
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-lg">⚡</span>
                <span className="font-display font-bold text-[15px] text-white">
                  Start your first SIP
                </span>
              </div>
              <p className="text-[13px] text-white/50 leading-relaxed">
                Set up ₹100/month and watch it grow. Takes 3 minutes.
              </p>
            </div>

            {/* CTA */}
            <button
              onClick={() => setStep(2)}
              className="mt-8 bg-[#c0f18e] text-[#0a1a00] font-bold px-8 py-3.5 rounded-full transition-transform duration-150 active:scale-[0.97] hover:brightness-110"
            >
              Got it →
            </button>
          </div>
        )

      /* ── Step 2: Meet KINU ───────────────────────────────────────────────── */
      case 2:
        return (
          <div className="flex flex-col items-center text-center max-w-[480px] mx-auto px-6">
            {/* KINU avatar */}
            <div className="w-16 h-16 rounded-2xl bg-[#c0f18e] flex items-center justify-center">
              <span className="font-display font-black text-2xl text-[#0a1a00]">K</span>
            </div>

            <h2 className="font-display font-bold text-2xl text-white mt-4">
              Meet KINU, your AI mentor
            </h2>

            <p className="text-[14px] text-white/50 mt-2">
              Ask anything, anytime. No jargon. Just answers built for your fear type.
            </p>

            {/* Fake chat */}
            <div className="w-full mt-6 space-y-3">
              {/* User bubble */}
              <div className="flex justify-end">
                <div
                  className="max-w-[240px] bg-white/[0.08] rounded-2xl rounded-br-sm px-4 py-2.5"
                >
                  <p className="text-[13px] text-white/80 text-left">
                    Is my money safe in mutual funds?
                  </p>
                </div>
              </div>
              {/* KINU bubble */}
              <div className="flex justify-start">
                <div
                  className="max-w-[280px] rounded-2xl rounded-bl-sm px-4 py-2.5"
                  style={{
                    background: 'rgba(192,241,142,0.08)',
                    border: '1px solid rgba(192,241,142,0.15)',
                  }}
                >
                  <p className="text-[13px] text-white/80 text-left">
                    {KINU_FALLBACKS[fearType]}
                  </p>
                </div>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={() => setOnboardingComplete()}
              className="mt-8 bg-[#c0f18e] text-[#0a1a00] font-bold px-8 py-3.5 rounded-full transition-transform duration-150 active:scale-[0.97] hover:brightness-110"
            >
              Let's go →
            </button>
          </div>
        )
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 flex flex-col items-center justify-center"
      style={{ zIndex: 500, background: 'rgba(0,22,27,0.97)' }}
    >
      {/* Skip button */}
      <button
        onClick={() => setOnboardingComplete()}
        className="absolute top-6 right-6 w-9 h-9 rounded-full flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors duration-150"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Step content with transitions */}
      <div className="flex-1 flex items-center justify-center w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-2 pb-12">
        {([0, 1, 2] as const).map(i => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === step ? 24 : 8,
              height: 8,
              background: i === step ? '#c0f18e' : 'rgba(255,255,255,0.2)',
            }}
          />
        ))}
      </div>
    </motion.div>
  )
}
