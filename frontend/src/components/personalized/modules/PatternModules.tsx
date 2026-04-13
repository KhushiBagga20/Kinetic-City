import { motion } from 'framer-motion'
import { useState } from 'react'
import { ShieldCheck, Database, Zap, Check, X as XIcon } from 'lucide-react'
import { useAppStore } from '../../../store/useAppStore'

// ── Module 1: The Proof Board ───────────────────────────────────────────────

function ProofBoard() {
  const proofs = [
    'SEBI regulates all mutual funds in India since 1993',
    "AMFI publishes every fund's NAV daily — publicly",
    'Your money is held by a custodian bank, not the fund company',
    'Even if the AMC shuts down, your money is safe',
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="rounded-3xl p-7 md:p-8 border"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(192,241,142,0.10)' }}>
          <ShieldCheck className="w-4 h-4" style={{ color: '#EF9F27' }} />
        </div>
        <h3 className="font-display text-lg text-white font-medium tracking-tight">The Proof Board</h3>
      </div>

      <p className="font-sans text-sm text-white/45 mb-6">Here's what protects your money.</p>

      <div className="space-y-3">
        {proofs.map((proof, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.15 + i * 0.1 }}
            className="flex items-start gap-3.5 p-4 rounded-2xl border"
            style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}
          >
            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(29,158,117,0.15)' }}>
              <Check className="w-3 h-3" style={{ color: '#1D9E75' }} />
            </div>
            <p className="font-sans text-sm text-white/65 leading-relaxed">{proof}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// ── Module 2: Red Flag Detector ─────────────────────────────────────────────

function RedFlagDetector() {
  const comparisons = [
    { legit: 'SEBI registered', scam: '"Guaranteed 40% returns"' },
    { legit: 'Publicly listed NAV', scam: '"Secret algorithm"' },
    { legit: 'Withdraw anytime', scam: '"Lock-in with penalty"' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
      className="rounded-3xl p-7 border"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <h3 className="font-display text-lg text-white font-medium tracking-tight mb-5">Red Flag Detector</h3>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <p className="text-[9px] font-sans font-bold tracking-[0.2em] text-white/30 uppercase pl-4">Legit Fund</p>
        <p className="text-[9px] font-sans font-bold tracking-[0.2em] text-white/30 uppercase pl-4">Scam Signal</p>
      </div>

      <div className="space-y-2">
        {comparisons.map((row, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
            className="grid grid-cols-2 gap-3"
          >
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl border" style={{ background: 'rgba(29,158,117,0.04)', borderColor: 'rgba(29,158,117,0.12)' }}>
              <Check className="w-3.5 h-3.5 shrink-0" style={{ color: '#1D9E75' }} />
              <span className="font-sans text-xs text-white/65">{row.legit}</span>
            </div>
            <div className="flex items-center gap-2.5 p-3.5 rounded-xl border" style={{ background: 'rgba(226,75,74,0.04)', borderColor: 'rgba(226,75,74,0.12)' }}>
              <XIcon className="w-3.5 h-3.5 shrink-0" style={{ color: '#E24B4A' }} />
              <span className="font-sans text-xs text-white/65">{row.scam}</span>
            </div>
          </motion.div>
        ))}
      </div>

      <p className="text-[10px] font-sans text-white/25 mt-4">Tap any row to ask KINU for more details.</p>
    </motion.div>
  )
}

// ── Module 3: Data Sources ──────────────────────────────────────────────────

function DataSources() {
  const sources = [
    { name: 'Nifty 50 data', source: 'NSE India (public)' },
    { name: 'Inflation', source: 'RBI CPI Index (public)' },
    { name: 'FD rates', source: 'SBI published rates (public)' },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2, ease: 'easeOut' }}
      className="rounded-3xl p-7 border"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(192,241,142,0.10)' }}>
          <Database className="w-4 h-4" style={{ color: '#EF9F27' }} />
        </div>
        <h3 className="font-display text-base text-white font-medium tracking-tight">Data Sources</h3>
      </div>

      <p className="font-sans text-xs text-white/40 mb-5">Every number on this app has a source.</p>

      <div className="space-y-2">
        {sources.map((s, i) => (
          <div key={i} className="flex items-center justify-between p-3.5 rounded-xl border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>
            <span className="font-sans text-sm text-white/60">{s.name}</span>
            <span className="font-mono text-[11px] text-white/35">{s.source}</span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}

// ── Module 4: Scam vs Real Quiz ─────────────────────────────────────────────

function ScamVsRealQuiz() {
  const completeModule = useAppStore(s => s.completeModule)
  const completedModules = useAppStore(s => s.completedModules)
  const [currentQ, setCurrentQ] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)

  const quizDone = completedModules.includes('scam-quiz')

  const questions = [
    {
      question: '"Guaranteed 30% returns in 6 months" — is this legit?',
      options: ['Legit', 'Scam Signal'],
      correct: 1,
      explanation: 'No legitimate investment can guarantee returns. SEBI-regulated funds always warn that returns are subject to market risk.',
    },
    {
      question: 'A fund registered with SEBI and listed on AMFI — is this legit?',
      options: ['Legit', 'Scam Signal'],
      correct: 0,
      explanation: "SEBI registration and AMFI listing are the two strongest credibility signals. You can verify both yourself online.",
    },
    {
      question: '"Invest now or miss this exclusive opportunity forever" — is this legit?',
      options: ['Legit', 'Scam Signal'],
      correct: 1,
      explanation: 'Urgency and exclusivity are classic scam tactics. Real investments are always available. FOMO is the scammer\'s best tool.',
    },
  ]

  if (quizDone) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
        className="rounded-3xl p-6 border"
        style={{
          background: 'rgba(29,158,117,0.04)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: 'rgba(29,158,117,0.12)',
        }}
      >
        <div className="flex items-center gap-3">
          <Check className="w-5 h-5" style={{ color: '#1D9E75' }} />
          <p className="font-display text-sm text-white font-medium">Scam vs Real Quiz — Completed</p>
        </div>
      </motion.div>
    )
  }

  const q = questions[currentQ]

  function handleAnswer(idx: number) {
    if (answered) return
    setSelectedIdx(idx)
    setAnswered(true)
    // Track correct answer (visual feedback handled by border colors)

    setTimeout(() => {
      if (currentQ < questions.length - 1) {
        setCurrentQ(c => c + 1)
        setAnswered(false)
        setSelectedIdx(null)
      } else {
        // Quiz complete — increment progress by 15% (handled as special case)
        completeModule('scam-quiz')
        // Extra 5% for the quiz bonus
        completeModule('scam-quiz-bonus')
      }
    }, 1500)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
      className="rounded-3xl p-7 border"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display text-base text-white font-medium tracking-tight">Scam vs Real: Quiz</h3>
        <span className="font-mono text-[10px] text-white/25">{currentQ + 1}/{questions.length}</span>
      </div>

      <p className="font-sans text-sm text-white/65 leading-relaxed mb-5">{q.question}</p>

      <div className="space-y-2">
        {q.options.map((opt, i) => {
          let bg = 'rgba(255,255,255,0.03)'
          let border = 'rgba(255,255,255,0.06)'
          if (answered && selectedIdx === i) {
            if (i === q.correct) {
              bg = 'rgba(29,158,117,0.08)'
              border = 'rgba(29,158,117,0.25)'
            } else {
              bg = 'rgba(226,75,74,0.08)'
              border = 'rgba(226,75,74,0.25)'
            }
          }

          return (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              className="w-full p-4 rounded-xl text-left font-sans text-sm text-white/65 border transition-[background-color,border-color] duration-200"
              style={{ background: bg, borderColor: border }}
            >
              {opt}
            </button>
          )
        })}
      </div>

      {answered && (
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-sans text-xs text-white/40 mt-4 leading-relaxed"
        >
          {q.explanation}
        </motion.p>
      )}
    </motion.div>
  )
}

// ── Module 5: Today's Micro Action ──────────────────────────────────────────

function TodaysMicroAction() {
  const completeModule = useAppStore(s => s.completeModule)
  const completedModules = useAppStore(s => s.completedModules)

  const actions = [
    { id: 'scam-micro-1', text: "Verify: Look up any mutual fund on SEBI's website" },
    { id: 'scam-micro-2', text: "Check: Find your fund's custodian bank" },
    { id: 'scam-micro-3', text: 'Read: How AMFI protects retail investors' },
  ]

  const dayIndex = new Date().getDate() % actions.length
  const action = actions[dayIndex]
  const isCompleted = completedModules.includes(action.id)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4, ease: 'easeOut' }}
      className="rounded-3xl p-6 border"
      style={{
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(192,241,142,0.10)' }}>
          <Zap className="w-4 h-4" style={{ color: '#EF9F27' }} />
        </div>
        <h3 className="font-display text-sm text-white font-medium">Today's Micro Action</h3>
      </div>

      <p className="font-sans text-sm text-white/60 leading-relaxed mb-4">{action.text}</p>

      <button
        onClick={() => !isCompleted && completeModule(action.id)}
        disabled={isCompleted}
        className="text-[10px] font-sans font-bold tracking-[0.15em] uppercase transition-all duration-200"
        style={{
          color: isCompleted ? '#1D9E75' : 'var(--color-primary-fixed)',
          opacity: isCompleted ? 0.7 : 1,
        }}
      >
        {isCompleted ? '✓ Completed' : 'Mark as done'}
      </button>
    </motion.div>
  )
}

// ── Export ───────────────────────────────────────────────────────────────────

export default function PatternModules() {
  return (
    <div className="space-y-5">
      <ProofBoard />
      <RedFlagDetector />
      <DataSources />
      <ScamVsRealQuiz />
      <TodaysMicroAction />
    </div>
  )
}
