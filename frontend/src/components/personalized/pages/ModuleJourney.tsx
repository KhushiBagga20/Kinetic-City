import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../../store/useAppStore'
import { getTrackForFear } from '../../../lib/curriculumData'
import { ArrowLeft, Check, Activity, ChevronRight, Clock, BookOpen } from 'lucide-react'
import { getModulesForFear } from './LearnPage'
import { generateKinuChat } from '../../../lib/kinuAI'

export default function ModuleJourney() {
  const navigate = useNavigate()
  const activeModuleId = useAppStore(s => s.activeModuleId)
  const fearType = useAppStore(s => s.fearType) ?? 'loss'
  const completeModule = useAppStore(s => s.completeModule)
  const completedModules = useAppStore(s => s.completedModules)

  const track = getTrackForFear(fearType)
  const contentModules = getModulesForFear(fearType)

  const [kinuReaction, setKinuReaction] = useState<string | null>(null)
  const [kinuLoading, setKinuLoading] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [completionReaction, setCompletionReaction] = useState<string | null>(null)

  useEffect(() => {
    if (!activeModuleId) navigate('/dashboard/learn', { replace: true })
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    setKinuReaction(null)
  }, [activeModuleId, navigate])

  // Auto-dismiss celebration and navigate back
  useEffect(() => {
    if (!showCelebration) return
    const t = setTimeout(() => { setShowCelebration(false); navigate('/dashboard/learn') }, 2500)
    return () => clearTimeout(t)
  }, [showCelebration, navigate])

  const activeModuleIndex = track.findIndex(m => m.id === activeModuleId)
  const isModuleValid = activeModuleId && track.some(m => m.id === activeModuleId)

  if (!activeModuleId || !isModuleValid) return null

  const currentModule = track[activeModuleIndex]
  const contentModule = contentModules.find(m => m.id === activeModuleId)
  const isCompleted = completedModules.includes(currentModule.id)
  const nextModule = track[activeModuleIndex + 1]
  const prevModule = track[activeModuleIndex - 1]

  const liveContext: Record<string, string> = {
    loss: 'Markets saw a 1.2% dip today. This module will help you understand why your instincts say "sell" — and why ignoring that instinct builds wealth.',
    jargon: 'There is a lot of buzz today around "XIRR" in the news. This module will help you cut through the noise and understand what actually matters.',
    scam: 'A new crypto phishing scheme is trending on Telegram. Master this module to make your finances scam-proof.',
    trust: 'Active funds underperformed the Nifty 50 again this month. This module shows exactly why automation beats human fund managers.',
  }

  const askKinu = async (feeling: string) => {
    setKinuLoading(true)
    setKinuReaction(null)
    try {
      const data = await generateKinuChat({
        message: `The user just read the module '${currentModule.title}' and felt: '${feeling}'. Give them a very brief (2 sentences max), encouraging and insightful response tailored to their fear type.`,
        fear_type: fearType,
        context: 'module_journey_feedback',
        conversation_history: [],
      })
      setKinuReaction(data.reply)
    } catch {
      setKinuReaction("You're doing great — keep going. Every module brings you closer to fearless investing.")
    } finally {
      setKinuLoading(false)
    }
  }

  const handleComplete = () => {
    setCompleting(true)
    if (!isCompleted) {
      completeModule(currentModule.id, (currentModule as any).fearProgressIncrement)
      setShowCelebration(true)
      // Generate KINU completion reaction in background — overlay shows static fallback until ready
      setCompletionReaction(null)
      generateKinuChat({
        message: `User just completed the module '${currentModule.title}'. Fear type: ${fearType}. Give one short (max 2 sentences) celebratory and insightful message.`,
        fear_type: fearType,
        context: 'module_completion',
        conversation_history: [],
      })
      .then(d => setCompletionReaction(d.reply))
      .catch(() => setCompletionReaction("One module closer to fearless. Keep this momentum going."))
    } else {
      navigate('/dashboard/learn')
    }
  }

  const goToModule = (moduleId: string) => {
    useAppStore.getState().setActiveModuleId(moduleId)
    navigate(`/dashboard/module/${moduleId}`)
  }

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen"
    >
      {/* ── Top breadcrumb bar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate('/dashboard/learn')}
          className="flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer"
          style={{ color: 'rgba(255,255,255,0.4)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Modules
        </button>

        {/* Progress pill */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
            {activeModuleIndex + 1} / {track.length}
          </span>
          <div className="flex gap-1">
            {track.map((m, i) => (
              <button
                key={m.id}
                onClick={() => goToModule(m.id)}
                className="rounded-full transition-all duration-200 cursor-pointer"
                style={{
                  width: i === activeModuleIndex ? 20 : 6,
                  height: 6,
                  background: completedModules.includes(m.id)
                    ? '#1D9E75'
                    : i === activeModuleIndex
                    ? '#c0f18e'
                    : 'rgba(255,255,255,0.12)',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Module header ──────────────────────────────────────────────── */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: 'var(--accent)' }}>
            Module {activeModuleIndex + 1}
          </span>
          {isCompleted && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-sans"
              style={{ background: 'rgba(29,158,117,0.12)', color: '#1D9E75', border: '1px solid rgba(29,158,117,0.25)' }}>
              <Check className="w-3 h-3" /> Completed
            </span>
          )}
        </div>
        <h1 className="font-display font-bold text-3xl md:text-4xl text-white leading-tight mb-3">
          {currentModule.title}
        </h1>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            <Clock className="w-3.5 h-3.5" />
            {contentModule?.readTime ?? `${currentModule.estimatedMinutes} min`}
          </span>
          <span className="flex items-center gap-1.5 text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
            <BookOpen className="w-3.5 h-3.5" />
            {fearType.charAt(0).toUpperCase() + fearType.slice(1)} Track
          </span>
        </div>
      </div>

      {/* ── Live context strip ─────────────────────────────────────────── */}
      <div className="rounded-2xl p-4 mb-8 flex items-start gap-3"
        style={{ background: 'rgba(55,138,221,0.06)', border: '1px solid rgba(55,138,221,0.15)' }}>
        <Activity className="w-4 h-4 mt-0.5 shrink-0 text-[#378ADD] animate-pulse" />
        <p className="font-sans text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
          {liveContext[fearType]}
        </p>
      </div>

      {/* ── Main module content ────────────────────────────────────────── */}
      <div className="mb-12">
        {contentModule ? contentModule.content : (
          <div className="rounded-2xl p-8 text-center" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
            <p className="text-white/40 text-sm">Content loading…</p>
          </div>
        )}
      </div>

      {/* ── KINU reaction widget ───────────────────────────────────────── */}
      <div className="rounded-2xl p-6 mb-10 relative overflow-hidden"
        style={{ background: 'rgba(10,10,15,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c0f18e]/30 to-transparent" />
        <div className="flex gap-4">
          <div className="w-9 h-9 rounded-full flex items-center justify-center font-display text-sm font-bold shrink-0"
            style={{ background: 'rgba(192,241,142,0.1)', color: 'var(--accent)', border: '1px solid rgba(192,241,142,0.2)' }}>
            K
          </div>
          <div className="flex-1">
            {!kinuReaction && !kinuLoading && (
              <>
                <p className="font-sans text-sm text-white/60 italic mb-4">
                  "You made it through this module. How did that land for you?"
                </p>
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => askKinu("I'm confused")}
                    className="px-4 py-2 rounded-full text-xs font-sans border cursor-pointer transition-colors"
                    style={{ borderColor: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}>
                    I'm confused 🤔
                  </button>
                  <button onClick={() => askKinu("Makes sense now")}
                    className="px-4 py-2 rounded-full text-xs font-sans cursor-pointer transition-colors"
                    style={{ border: '1px solid rgba(192,241,142,0.3)', color: '#c0f18e', background: 'rgba(192,241,142,0.05)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(192,241,142,0.12)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(192,241,142,0.05)')}>
                    Makes sense 💡
                  </button>
                  <button onClick={() => askKinu("I want to know more")}
                    className="px-4 py-2 rounded-full text-xs font-sans cursor-pointer transition-colors"
                    style={{ border: '1px solid rgba(55,138,221,0.3)', color: '#378ADD', background: 'rgba(55,138,221,0.05)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(55,138,221,0.12)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(55,138,221,0.05)')}>
                    Tell me more 📖
                  </button>
                </div>
              </>
            )}
            {kinuLoading && (
              <div className="flex gap-2 py-2">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-2 h-2 rounded-full"
                    style={{ background: '#c0f18e' }}
                    animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                ))}
              </div>
            )}
            {kinuReaction && !kinuLoading && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <p className="font-sans text-sm text-white/85 leading-relaxed">{kinuReaction}</p>
                <button onClick={() => setKinuReaction(null)}
                  className="mt-3 text-[10px] uppercase tracking-widest cursor-pointer"
                  style={{ color: 'rgba(255,255,255,0.25)' }}>
                  Ask again
                </button>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ── Navigation: prev / complete / next ────────────────────────── */}
      <div className="flex items-center justify-between gap-4 pb-16">
        {/* Previous */}
        {prevModule ? (
          <button onClick={() => goToModule(prevModule.id)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium cursor-pointer transition-colors"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'rgba(255,255,255,0.4)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Previous</span>
          </button>
        ) : <div />}

        {/* Mark Complete */}
        <motion.button
          onClick={handleComplete}
          disabled={completing}
          whileTap={{ scale: 0.97 }}
          className="flex-1 max-w-xs flex items-center justify-center gap-2 py-3.5 rounded-2xl font-sans font-bold text-sm cursor-pointer transition-all"
          style={{
            background: isCompleted ? 'rgba(29,158,117,0.15)' : 'var(--accent)',
            color: isCompleted ? '#1D9E75' : '#0a1a00',
            border: isCompleted ? '1px solid rgba(29,158,117,0.3)' : 'none',
          }}
        >
          <Check className="w-4 h-4" />
          {isCompleted ? 'Completed — Return' : 'Mark Complete & Continue'}
        </motion.button>

        {/* Next */}
        {nextModule ? (
          <button onClick={() => goToModule(nextModule.id)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium cursor-pointer transition-colors"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'rgba(255,255,255,0.4)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : <div />}
      </div>
    </motion.div>

      {/* ── Celebration overlay ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            onClick={() => { setShowCelebration(false); navigate('/dashboard/learn') }}
            className="fixed inset-0 z-[400] flex flex-col items-center justify-center cursor-pointer"
            style={{ background: 'rgba(0,22,27,0.92)' }}
          >
            {/* Radial glow */}
            <div style={{ background: 'radial-gradient(circle at 50% 50%, rgba(192,241,142,0.12) 0%, transparent 70%)', position: 'absolute', inset: 0, pointerEvents: 'none' }} />

            {/* Checkmark circle */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22, delay: 0.1 }}
              className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
              style={{ background: 'rgba(192,241,142,0.12)', border: '2px solid rgba(192,241,142,0.5)' }}
            >
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                <motion.path
                  d="M10 20 L17 27 L30 14"
                  stroke="#c0f18e"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                />
              </svg>
            </motion.div>

            {/* +50 XP badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.4, delay: 0.5 }}
              className="text-[22px] font-bold mb-4 px-5 py-2 rounded-full"
              style={{ background: 'rgba(192,241,142,0.1)', color: '#c0f18e', border: '1px solid rgba(192,241,142,0.25)' }}
            >
              +50 XP
            </motion.div>

            {/* KINU completion message */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="font-sans text-sm max-w-xs text-center mb-5 leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.55)' }}
            >
              {completionReaction ?? 'One module closer to fearless. Keep this momentum going.'}
            </motion.p>

            <p className="font-sans text-white/40 text-[13px]">Tap anywhere to continue</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
