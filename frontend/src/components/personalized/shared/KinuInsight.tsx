/**
 * KinuInsight — contextual AI insight card, drop it anywhere in the app.
 *
 * Shows a personalised GPT-4o tip relevant to the current page, based on the
 * user's full profile (fear type, SIP, goals, progress) + any extra page context.
 *
 * Usage:
 *   <KinuInsight page="simulation" extraContext="User just ran a SIP simulation" />
 */
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAppStore } from '../../../store/useAppStore'
import { callGroq } from '../../../lib/groqPool'
import { useNavigate } from 'react-router-dom'
import { Sparkles, ArrowRight, RefreshCw } from 'lucide-react'

interface KinuInsightProps {
  page: string
  extraContext?: string
  /** If set, tapping the CTA navigates here */
  ctaSection?: string
  ctaLabel?: string
  className?: string
}

const FEAR_ACCENT: Record<string, string> = {
  loss:   '#E24B4A',
  jargon: '#378ADD',
  scam:   '#EF9F27',
  trust:  '#1D9E75',
}

const PAGE_FALLBACKS: Record<string, string> = {
  simulation:    'Run the simulation to see 600 possible futures for your money.',
  learn:         'Each module you complete builds real investing confidence.',
  portfolio:     'Your portfolio is the scoreboard. Set it up, then let time do the work.',
  'time-machine':'Surviving a crash on paper is the best rehearsal for the real thing.',
  sandbox:       'The sandbox is a safe place to make expensive mistakes for free.',
  harvest:       'Tax-loss harvesting can recover thousands every year — no extra risk.',
  home:          'Every day you stay invested, compound interest works in your favour.',
  roadmap:       'A clear investing roadmap removes emotion from every decision.',
  'my-card':     'Your investor identity defines how you act when markets get scary.',
}

export default function KinuInsight({
  page,
  extraContext,
  ctaSection,
  ctaLabel,
  className = '',
}: KinuInsightProps) {
  const fearType   = useAppStore(s => s.fearType) ?? 'loss'
  const rawName    = useAppStore(s => s.userName)
  const monthly    = useAppStore(s => s.monthlyAmount)
  const years      = useAppStore(s => s.years)
  const savings    = useAppStore(s => s.currentSavings)
  const streak     = useAppStore(s => s.streakDays)
  const modules    = useAppStore(s => s.completedModules)
  const goals      = useAppStore(s => s.goals)
  const simResult  = useAppStore(s => s.simulationResult)
  const portfolio  = useAppStore(s => s.portfolioSetup)

  const userName = rawName && rawName !== 'Explorer' ? rawName.split(' ')[0] : ''
  const navigate = useNavigate()
  const setSection = useAppStore(s => s.setDashboardSection)

  const [insight, setInsight] = useState(PAGE_FALLBACKS[page] ?? 'You are making the right moves. Keep going.')
  const [isAI, setIsAI] = useState(false)
  const [loading, setLoading] = useState(false)
  const fetchKey = useRef('')

  const accent = FEAR_ACCENT[fearType] ?? '#c0f18e'

  const fetchInsight = useCallback(async (force = false) => {
    // Build a key that captures all relevant context — only refetch when it changes
    const goalStr = goals.slice(0, 2).map(g => `${g.name}:${g.targetAmount}`).join(',')
    const simStr = simResult ? `p50:${simResult.p50}` : 'none'
    const key = `${page}|${fearType}|${monthly}|${years}|${modules.length}|${extraContext ?? ''}|${simStr}|${goalStr}`

    if (!force && fetchKey.current === key) return
    fetchKey.current = key

    setLoading(true)
    // Show fallback instantly while AI loads
    setInsight(PAGE_FALLBACKS[page] ?? 'You are making the right moves. Keep going.')
    setIsAI(false)

    // Build a rich, hyper-personalised prompt
    const goalSummary = goals.length
      ? goals.slice(0, 3).map(g => `${g.name} (₹${g.targetAmount.toLocaleString('en-IN')} in ${g.targetYears}y)`).join(', ')
      : 'No goals set yet'

    const simSummary = simResult
      ? `Simulation result: median ₹${simResult.p50.toLocaleString('en-IN')} on ₹${simResult.totalInvested.toLocaleString('en-IN')} invested`
      : 'No simulation run yet'

    const system = `You are KINU, a calm, direct AI financial mentor in the Kinetic City investing app for young Indians.
Output ONLY 1-2 sentences (max 30 words). No markdown, no emojis, no headers, no filler phrases like "Great job" or "Remember that".
Be hyper-specific using the user's real numbers. Reference ₹ amounts, years, or module counts when relevant.`

    const prompt = `Page the user is on: ${page}
Fear type: ${fearType}
User name: ${userName || 'there'}
Monthly SIP: ₹${monthly.toLocaleString('en-IN')}
Investment horizon: ${years} years
Current savings: ₹${savings.toLocaleString('en-IN')}
Streak: ${streak} days
Modules completed: ${modules.length}
Goals: ${goalSummary}
Portfolio set up: ${portfolio ? 'yes' : 'no'}
${simSummary}
${extraContext ? `Additional context: ${extraContext}` : ''}

Give one specific, actionable insight for what the user should focus on or understand RIGHT NOW on this page. Use their real numbers.`

    try {
      const raw = await callGroq(prompt, system, 'insights')
      const clean = raw.trim().replace(/^["']|["']$/g, '')
      if (clean && clean.length > 10) {
        setInsight(clean)
        setIsAI(true)
      }
    } catch {
      // Keep fallback
    }
    setLoading(false)
  }, [page, fearType, userName, monthly, years, savings, streak, modules.length, goals, simResult, portfolio, extraContext])

  // Re-fetch whenever key context changes (not just page/fearType)
  useEffect(() => {
    fetchInsight()
  }, [fetchInsight])

  const handleCta = () => {
    if (!ctaSection) return
    setSection(ctaSection)
    navigate(`/dashboard/${ctaSection}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-2xl p-4 border relative overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)`,
        borderColor: `${accent}22`,
        borderLeft: `3px solid ${accent}`,
      }}
    >
      {/* Subtle glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{ background: `radial-gradient(circle at 10% 50%, ${accent}, transparent 60%)` }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-2 relative">
        <div className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3" style={{ color: accent }} />
          <span className="font-sans text-[10px] font-semibold uppercase tracking-widest" style={{ color: accent }}>
            KINU Insight
          </span>
        </div>
        <button
          onClick={() => fetchInsight(true)}
          className="text-white/15 hover:text-white/40 transition-colors cursor-pointer"
          title="Refresh insight"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Insight text */}
      <AnimatePresence mode="wait">
        <motion.p
          key={insight}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="font-sans text-[13px] leading-relaxed relative"
          style={{ color: 'rgba(255,255,255,0.7)' }}
        >
          {insight}
        </motion.p>
      </AnimatePresence>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 relative">
        {isAI && (
          <span className="font-sans text-[9px] text-white/20 uppercase tracking-wider">
            KINU · personalised
          </span>
        )}
        {ctaSection && ctaLabel && (
          <button
            onClick={handleCta}
            className="flex items-center gap-1 font-sans text-[11px] font-medium ml-auto transition-colors cursor-pointer hover:opacity-80"
            style={{ color: accent }}
          >
            {ctaLabel}
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </motion.div>
  )
}
