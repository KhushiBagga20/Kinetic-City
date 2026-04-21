import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../../store/useAppStore'
import { getTrackForFear } from '../../../lib/curriculumData'
import { ArrowLeft, Check, Activity, ChevronRight, Clock, BookOpen, Send } from 'lucide-react'
import { getModulesForFear } from './LearnPage'
import { generateKinuChatWithNav, buildAppContext } from '../../../lib/kinuAI'

export default function ModuleJourney() {
  const navigate = useNavigate()
  const store = useAppStore()
  const { fearType, completedModules, activeModuleId } = store
  const completeModule = store.completeModule
  const setDashboardSection = store.setDashboardSection

  const track = getTrackForFear(fearType ?? 'loss')
  const contentModules = getModulesForFear(fearType ?? 'loss')

  const [kinuReaction, setKinuReaction] = useState<string | null>(null)
  const [kinuLoading, setKinuLoading] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [completionReaction, setCompletionReaction] = useState<string | null>(null)
  const [freeInput, setFreeInput] = useState('')
  const [freeLoading, setFreeLoading] = useState(false)
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string }[]>([])

  useEffect(() => {
    if (!activeModuleId) {
      // Guard: if we somehow land here with no module id, go to learn
      setDashboardSection('learn')
      navigate('/dashboard/learn', { replace: true })
      return
    }
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
    setKinuReaction(null)
    setChatHistory([])
  }, [activeModuleId, navigate, setDashboardSection])

  // Auto-dismiss celebration and navigate back
  useEffect(() => {
    if (!showCelebration) return
    const t = setTimeout(() => {
      setShowCelebration(false)
      setDashboardSection('learn')
      navigate('/dashboard/learn')
    }, 2500)
    return () => clearTimeout(t)
  }, [showCelebration, navigate, setDashboardSection])

  const activeModuleIndex = track.findIndex(m => m.id === activeModuleId)

  // Render nothing only if both store and URL are still catching up — prevents flash
  if (!activeModuleId) return null

  const currentModule = track[activeModuleIndex]
  const contentModule = contentModules.find(m => m.id === activeModuleId)
  const isCompleted = completedModules.includes(currentModule.id)
  const nextModule = track[activeModuleIndex + 1]
  const prevModule = track[activeModuleIndex - 1]

  // Helper: navigate to learn page and sync store atomically
  const goToLearn = useCallback(() => {
    setDashboardSection('learn')
    navigate('/dashboard/learn')
  }, [navigate, setDashboardSection])

  const getLiveContext = (fType: string, title: string) => {
    const bases: Record<string, string[]> = {
      loss: [
        'Markets saw a 1.2% dip today.',
        'The volatility index spiked this morning.',
        'A major blue-chip stock dropped 5% after earnings.',
      ],
      jargon: [
        'There is a lot of buzz today around "XIRR" in the news.',
        'Financial influencers are debating Alpha vs Beta today.',
        'The RBI policy update just dropped with heavy terminology.',
      ],
      scam: [
        'A new crypto phishing scheme is trending on Telegram.',
        'SEBI just issued a warning against guaranteed-return bots.',
        'A fake IPO allotment message is circulating on WhatsApp.',
      ],
      trust: [
        'Active funds underperformed the Nifty 50 again this month.',
        'A star fund manager just resigned, causing panic.',
        'New data shows 84% of managers failed to beat the index.',
      ],
    }
    const lines = bases[fType] || bases['loss']
    const line = lines[title.length % lines.length]
    return `${line} This module ("${title}") provides the exact framework you need to navigate this.`
  }

  // Build rich context for KINU
  const buildModuleContext = () => {
    const s = useAppStore.getState()
    return buildAppContext({
      fearType: s.fearType,
      userName: s.userName,
      monthlyAmount: s.monthlyAmount,
      years: s.years,
      currentSavings: s.currentSavings,
      streakDays: s.streakDays,
      fearProgress: s.fearProgress,
      completedModules: s.completedModules,
      goals: s.goals.map(g => ({ name: g.name, targetAmount: g.targetAmount, targetYears: g.targetYears })),
      simulationResult: s.simulationResult
        ? { p50: s.simulationResult.p50, totalInvested: s.simulationResult.totalInvested }
        : null,
      portfolioSetup: s.portfolioSetup,
      selectedFund: s.selectedFund,
      xpPoints: s.xpPoints,
      dashboardSection: 'module-reader',
      currentModuleTitle: currentModule.title,
    })
  }

  const goToModule = (moduleId: string) => {
    useAppStore.getState().setActiveModuleId(moduleId)
    navigate(`/dashboard/module/${moduleId}`)
  }

  // Quick-feel response (taps the emotion chips)
  const askKinu = async (feeling: string) => {
    setKinuLoading(true)
    setKinuReaction(null)
    const history = [...chatHistory, { role: 'user', content: feeling }]
    try {
      const appContext = buildModuleContext()
      const { reply, navigate_to, action } = await generateKinuChatWithNav({
        message: `I just read the module "${currentModule.title}" and felt: ${feeling}`,
        appContext,
        conversation_history: history.slice(-6),
      })
      const newHistory = [...history, { role: 'assistant', content: reply }]
      setChatHistory(newHistory)

      let displayReply = reply
      if (navigate_to) {
        displayReply += `\n\n↗ Taking you there…`
        setTimeout(() => {
          useAppStore.getState().setDashboardSection(navigate_to)
          navigate(`/dashboard/${navigate_to}`)
        }, 1400)
      }
      if (action === 'mark_module_complete') {
        displayReply += `\n\n✓ Marking as complete…`
        setTimeout(() => handleComplete(), 800)
      }
      if (action === 'go_to_next_module' && nextModule) {
        setTimeout(() => goToModule(nextModule.id), 900)
      }
      if (action === 'go_to_prev_module' && prevModule) {
        setTimeout(() => goToModule(prevModule.id), 900)
      }
      setKinuReaction(displayReply)
    } catch {
      setKinuReaction("You're doing great — keep going. Every module brings you closer to fearless investing.")
    } finally {
      setKinuLoading(false)
    }
  }

  // Free-text chat with KINU inside the module
  const askKinuFree = async () => {
    const trimmed = freeInput.trim()
    if (!trimmed || freeLoading) return
    setFreeInput('')
    setFreeLoading(true)
    const history = [...chatHistory, { role: 'user', content: trimmed }]
    try {
      const appContext = buildModuleContext()
      const { reply, navigate_to, action } = await generateKinuChatWithNav({
        message: trimmed,
        appContext,
        conversation_history: history.slice(-8),
      })
      const newHistory = [...history, { role: 'assistant', content: reply }]
      setChatHistory(newHistory)

      let displayReply = reply
      if (navigate_to) {
        displayReply += `\n\n↗ Taking you to ${navigate_to}…`
        setTimeout(() => {
          useAppStore.getState().setDashboardSection(navigate_to)
          navigate(`/dashboard/${navigate_to}`)
        }, 1200)
      }
      if (action === 'mark_module_complete') {
        displayReply += `\n\n✓ Marking as complete…`
        setTimeout(() => handleComplete(), 900)
      }
      if (action === 'go_to_next_module' && nextModule) {
        displayReply += `\n\n→ Going to next module…`
        setTimeout(() => goToModule(nextModule.id), 900)
      }
      if (action === 'go_to_prev_module' && prevModule) {
        displayReply += `\n\n← Going to previous module…`
        setTimeout(() => goToModule(prevModule.id), 900)
      }
      setKinuReaction(displayReply)
    } catch {
      setKinuReaction("I'm having a moment — try again in a second.")
    } finally {
      setFreeLoading(false)
    }
  }

  const handleComplete = useCallback(() => {
    setCompleting(true)
    if (!isCompleted) {
      completeModule(currentModule.id, (currentModule as any).fearProgressIncrement)
      setShowCelebration(true)
      setCompletionReaction(null)
      const appContext = buildModuleContext()
      generateKinuChatWithNav({
        message: `User just completed the module "${currentModule.title}". Give one short (max 2 sentences) celebratory message.`,
        appContext,
        conversation_history: chatHistory.slice(-4),
      })
        .then(d => setCompletionReaction(d.reply))
        .catch(() => setCompletionReaction('One module closer to fearless. Keep this momentum going.'))
    } else {
      goToLearn()
    }
  }, [isCompleted, currentModule, chatHistory, navigate, completeModule, goToLearn])

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
          onClick={goToLearn}
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
            {(fearType ?? 'loss').charAt(0).toUpperCase() + (fearType ?? 'loss').slice(1)} Track
          </span>
        </div>
      </div>

      {/* ── Live context strip ─────────────────────────────────────────── */}
      <div className="rounded-2xl p-4 mb-8 flex items-start gap-3"
        style={{ background: 'rgba(55,138,221,0.06)', border: '1px solid rgba(55,138,221,0.15)' }}>
        <Activity className="w-4 h-4 mt-0.5 shrink-0 text-[#378ADD] animate-pulse" />
        <p className="font-sans text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.65)' }}>
          {getLiveContext(fearType ?? 'loss', currentModule.title)}
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
                <div className="flex flex-wrap gap-2 mb-4">
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
                  <button onClick={() => askKinu("I'm ready for the next one")}
                    className="px-4 py-2 rounded-full text-xs font-sans cursor-pointer transition-colors"
                    style={{ border: '1px solid rgba(29,158,117,0.3)', color: '#1D9E75', background: 'rgba(29,158,117,0.05)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(29,158,117,0.12)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(29,158,117,0.05)')}>
                    Next module →
                  </button>
                </div>

                {/* Free text ask */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={freeInput}
                    onChange={e => setFreeInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') askKinuFree() }}
                    placeholder='Ask KINU anything about this module…'
                    className="flex-1 bg-transparent border rounded-xl px-4 py-2.5 font-sans text-xs text-white outline-none placeholder:text-white/20 transition-colors"
                    style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                  />
                  <button
                    onClick={askKinuFree}
                    disabled={!freeInput.trim() || freeLoading}
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-30 cursor-pointer transition-all active:scale-95"
                    style={{ background: 'var(--accent)' }}
                  >
                    <Send className="w-3.5 h-3.5 text-[#0a1a00]" />
                  </button>
                </div>
              </>
            )}
            {(kinuLoading || freeLoading) && (
              <div className="flex gap-2 py-2">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-2 h-2 rounded-full"
                    style={{ background: '#c0f18e' }}
                    animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.3, 1] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }} />
                ))}
              </div>
            )}
            {kinuReaction && !kinuLoading && !freeLoading && (
              <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                <p className="font-sans text-sm text-white/85 leading-relaxed whitespace-pre-line">{kinuReaction}</p>
                <div className="flex gap-3 mt-3">
                  <button onClick={() => setKinuReaction(null)}
                    className="text-[10px] uppercase tracking-widest cursor-pointer"
                    style={{ color: 'rgba(255,255,255,0.25)' }}>
                    Ask again
                  </button>
                  {!isCompleted && (
                    <button onClick={handleComplete}
                      className="text-[10px] uppercase tracking-widest cursor-pointer"
                      style={{ color: '#c0f18e' }}>
                      Mark complete →
                    </button>
                  )}
                </div>
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
            onClick={() => { setShowCelebration(false); goToLearn() }}
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
