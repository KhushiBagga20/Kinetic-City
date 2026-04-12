import { motion } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { useAppStore, type FearType } from '../../../store/useAppStore'
import { postFearQuote } from '../../../lib/api'

// ── Props ───────────────────────────────────────────────────────────────────

interface FearQuoteProps {
  context?: 'dashboard' | 'profile' | 'card' | 'simulation' | 'portfolio' | 'learn'
  variant?: 'inline' | 'card' | 'subtle'
  className?: string
}

// ── Static fallbacks per fear type (shown instantly, no network needed) ──────

const INSTANT_FALLBACKS: Record<FearType, string[]> = {
  loss: [
    "The worst crashes in history lasted 14 months. Your patience lasts a lifetime.",
    "Every rupee you didn't invest out of fear has already lost to inflation.",
    "A 40% drop needs a 67% recovery. The Nifty has done it every single time.",
  ],
  jargon: [
    "You don't need to know what XIRR stands for to start. You just need Rs. 500.",
    "Three words: Nifty. Index. Fund. That's the whole strategy.",
    "Every expert on CNBC started by Googling what a mutual fund was.",
  ],
  scam: [
    "SEBI regulation means your mutual fund money sits in a registered custodian. Not with some guy.",
    "Your skepticism is a superpower. Directed at verified data, it becomes precision.",
    "Every transaction is tracked by CAMS or KFintech. There is a paper trail for every rupee.",
  ],
  trust: [
    "An index fund is a formula, not a person. The Nifty 50 has no ego, no bias, no agenda.",
    "The beauty of math: it does not need your faith to be correct.",
    "Your independence is an edge. Most investors lose money by following the crowd.",
  ],
}

const FEAR_COLORS: Record<FearType, string> = {
  loss: '#E24B4A', jargon: '#378ADD', scam: '#EF9F27', trust: '#1D9E75',
}

// ── Component ───────────────────────────────────────────────────────────────

export default function FearQuote({ context = 'dashboard', variant = 'inline', className = '' }: FearQuoteProps) {
  const fearType = useAppStore(s => s.fearType) ?? 'loss'
  const rawName = useAppStore(s => s.userName)
  const userName = rawName && rawName !== 'Explorer' ? rawName.split(' ')[0] : ''

  const [quote, setQuote] = useState('')
  const [isAI, setIsAI] = useState(false)
  const hasFetched = useRef(false)

  useEffect(() => {
    // Show a fallback instantly
    const fallbacks = INSTANT_FALLBACKS[fearType]
    const seed = Date.now() + context.length
    setQuote(fallbacks[seed % fallbacks.length])

    // Then upgrade to an AI quote in the background
    if (hasFetched.current) return
    hasFetched.current = true

    postFearQuote({ fear_type: fearType, user_name: userName, context })
      .then(res => {
        if (res.quote && res.quote.length > 10) {
          setQuote(res.quote)
          setIsAI(true)
        }
      })
      .catch(() => { /* keep fallback */ })
  }, [fearType, userName, context])

  if (!quote) return null

  const color = FEAR_COLORS[fearType]

  if (variant === 'subtle') {
    return (
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className={`font-sans text-xs text-white/30 italic leading-relaxed ${className}`}
      >
        &ldquo;{quote}&rdquo;
      </motion.p>
    )
  }

  if (variant === 'card') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className={`rounded-2xl p-5 border relative overflow-hidden ${className}`}
        style={{
          background: 'var(--surface)',
          borderColor: `${color}18`,
          borderLeft: `3px solid ${color}`,
        }}
      >
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ background: `radial-gradient(circle at 80% 50%, ${color}, transparent 60%)` }}
        />
        <p className="font-sans text-sm text-white/55 italic leading-relaxed relative">
          &ldquo;{quote}&rdquo;
        </p>
        {isAI && (
          <p className="font-sans text-[9px] text-white/15 mt-2 uppercase tracking-wider">
            Arjun &middot; personalised for you
          </p>
        )}
      </motion.div>
    )
  }

  // Default: inline
  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className={`font-sans text-xs text-white/35 italic leading-relaxed ${className}`}
    >
      &ldquo;{quote}&rdquo;
    </motion.p>
  )
}
