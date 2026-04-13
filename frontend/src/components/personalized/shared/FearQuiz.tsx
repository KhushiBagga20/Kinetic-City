import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useAppStore, type FearType } from '../../../store/useAppStore'
import { CheckCircle, XCircle, Zap } from 'lucide-react'

/* ── Quiz data — 3 questions per fear type ────────────────────────────────── */

interface QuizQuestion {
  question: string
  options: string[]
  correctIndex: number
  explanation: string
}

const QUIZ_DATA: Record<FearType, QuizQuestion[]> = {
  loss: [
    {
      question: 'In 2020, Nifty 50 fell 38% due to COVID. How long did the full recovery take?',
      options: ['2 years', '6 months', '18 months', 'It never recovered'],
      correctIndex: 1,
      explanation: 'Nifty recovered from its March 2020 low to pre-crash levels by September 2020 — just 6 months. FY21 then gave 70% returns.',
    },
    {
      question: 'Since 2001, how many times has Nifty given negative returns over any 7-year period?',
      options: ['5 times', '3 times', '1 time', 'Zero times'],
      correctIndex: 3,
      explanation: 'Every single 7-year rolling period since 2001 has been positive. Time is the antidote to volatility.',
    },
    {
      question: 'If you invested ₹500/month for 20 years at 14% CAGR, what would you have?',
      options: ['₹2.4 lakh', '₹7.9 lakh', '₹1.2 lakh', '₹15.8 lakh'],
      correctIndex: 1,
      explanation: 'SIP FV = ₹500 × [((1.0117)^240 − 1) / 0.0117] × 1.0117 ≈ ₹7.9 lakh. You invested ₹1.2 lakh. The rest is compounding.',
    },
  ],
  jargon: [
    {
      question: 'What does NAV stand for?',
      options: ['Net Annual Value', 'Net Asset Value', 'New Account Verification', 'National Audit Version'],
      correctIndex: 1,
      explanation: 'NAV = Net Asset Value. It\'s the price of one unit of a mutual fund. Think of it as the "current price tag."',
    },
    {
      question: 'What is an expense ratio?',
      options: ['The tax you pay on profits', 'The annual fee a fund charges', 'The ratio of stocks to bonds', 'The minimum investment amount'],
      correctIndex: 1,
      explanation: 'Expense ratio is the annual fee (as a %) that the fund deducts for managing your money. Index funds have the lowest — around 0.1-0.2%.',
    },
    {
      question: 'What does CAGR mean in plain English?',
      options: ['The highest return in one year', 'Average yearly growth rate assuming smooth compounding', 'The total return over all years combined', 'Monthly interest rate'],
      correctIndex: 1,
      explanation: 'CAGR = Compound Annual Growth Rate. It smooths out the bumps and tells you "if growth had been perfectly steady, what would the annual rate be?"',
    },
  ],
  scam: [
    {
      question: 'Where is your mutual fund money actually stored?',
      options: ['In the AMC\'s bank account', 'With a SEBI-registered custodian', 'In the fund manager\'s vault', 'In a government treasury'],
      correctIndex: 1,
      explanation: 'Your money is held by an independent custodian (like CSDL/NSDL), not the AMC. Even if the AMC shuts down, your money is safe and gets transferred to another AMC.',
    },
    {
      question: 'What happens if a mutual fund company (AMC) goes bankrupt?',
      options: ['You lose all your money', 'SEBI transfers your funds to another AMC', 'The government pays you back', 'Your money is frozen forever'],
      correctIndex: 1,
      explanation: 'SEBI mandates that investors\' assets are kept separate from the AMC\'s. If an AMC shuts down, another AMC takes over, or units are liquidated and returned to you.',
    },
    {
      question: 'Which of these is a red flag for a financial scam?',
      options: ['Returns of 12-15% mentioned as historical average', 'Guaranteed returns above 20% with zero risk', 'Fund registered with SEBI/AMFI', 'Investment accessible via a known broker app'],
      correctIndex: 1,
      explanation: '"Guaranteed high returns with zero risk" is the #1 scam signal. No legitimate investment guarantees returns. If someone promises this — run.',
    },
  ],
  trust: [
    {
      question: 'In an index fund, who decides which stocks to buy?',
      options: ['A fund manager using personal judgment', 'An algorithm that copies a pre-set index', 'The government regulator', 'Shareholders via voting'],
      correctIndex: 1,
      explanation: 'Index funds are rule-based. They automatically copy the index (e.g., Nifty 50). No human fund manager makes stock-picking decisions. Pure math.',
    },
    {
      question: 'Over 20 years, what percentage of active fund managers beat the Nifty index?',
      options: ['About 80%', 'About 50%', 'Less than 15%', 'Over 90%'],
      correctIndex: 2,
      explanation: 'SPIVA India data shows that over long periods, less than 15% of active large-cap fund managers beat the index. The rest charged higher fees for worse performance.',
    },
    {
      question: 'What is the typical expense ratio of an Indian index fund vs an active fund?',
      options: ['Both charge 2%', 'Index: 0.1-0.2% vs Active: 1.5-2.5%', 'Index: 1% vs Active: 1%', 'Index funds are free'],
      correctIndex: 1,
      explanation: 'Index funds charge 0.1-0.2% because there\'s no stock-picking team. Active funds charge 1.5-2.5%. Over 20 years, this fee difference compounds to lakhs in lost returns.',
    },
  ],
}

const KINU_SCORES: Record<string, string> = {
  '3': 'Impressive. You already know more than most people who\'ve been investing for years.',
  '2': 'Solid foundation. The one you missed is exactly the kind of misconception that holds people back.',
  '1': 'Good start. The misconceptions you have are extremely common — and extremely fixable.',
  '0': 'That\'s why you\'re here. Every wrong answer is a belief that was costing you money. Now you know.',
}

/* ── Component ───────────────────────────────────────────────────────────── */

interface FearQuizProps {
  fearType: FearType
}

export default function FearQuiz({ fearType }: FearQuizProps) {
  const questions = QUIZ_DATA[fearType]
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>([null, null, null])
  const [showResult, setShowResult] = useState(false)
  const [revealed, setRevealed] = useState(false)

  const completeModule = useAppStore(s => s.completeModule)

  const handleAnswer = (optionIndex: number) => {
    if (revealed) return
    const newAnswers = [...answers]
    newAnswers[currentQ] = optionIndex
    setAnswers(newAnswers)
    setRevealed(true)
  }

  const handleNext = () => {
    setRevealed(false)
    if (currentQ < 2) {
      setCurrentQ(currentQ + 1)
    } else {
      setShowResult(true)
      // Award progress
      completeModule(`quiz_${fearType}`, 15)
    }
  }

  const score = answers.filter((a, i) => a === questions[i].correctIndex).length
  const q = questions[currentQ]

  if (showResult) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-2xl p-6 border"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="text-center mb-5">
          <p className="font-display font-bold text-4xl mb-2" style={{ color: score === 3 ? '#1D9E75' : score >= 2 ? '#378ADD' : '#EF9F27' }}>
            {score}/3
          </p>
          <p className="font-sans text-sm text-white/50">correct answers</p>
        </div>

        {/* KINU message */}
        <div className="rounded-xl p-4 border mb-4" style={{ background: 'rgba(192,241,142,0.03)', borderColor: 'rgba(192,241,142,0.1)' }}>
          <div className="flex items-start gap-2.5">
            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 font-display text-[9px] font-bold" style={{ background: 'rgba(192,241,142,0.08)', color: 'var(--accent)' }}>K</div>
            <p className="font-sans text-sm text-white/50 leading-relaxed">{KINU_SCORES[String(score)]}</p>
          </div>
        </div>

        {/* Answer review */}
        <div className="space-y-3">
          {questions.map((quest, i) => {
            const isCorrect = answers[i] === quest.correctIndex
            return (
              <div key={i} className="flex items-start gap-2.5">
                {isCorrect
                  ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#1D9E75' }} />
                  : <XCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#E24B4A' }} />
                }
                <div>
                  <p className="font-sans text-xs text-white/50 leading-relaxed">{quest.question}</p>
                  {!isCorrect && (
                    <p className="font-sans text-[11px] text-white/30 mt-1">Correct: {quest.options[quest.correctIndex]}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t" style={{ borderColor: 'var(--border)' }}>
          <Zap className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
          <p className="font-sans text-[11px] text-white/30">+15 fear progress earned</p>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="rounded-2xl p-5 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      {/* Progress dots */}
      <div className="flex gap-1.5 mb-4">
        {[0, 1, 2].map(i => (
          <div key={i} className="h-1 flex-1 rounded-full" style={{
            background: i < currentQ ? 'var(--accent)' : i === currentQ ? 'rgba(192,241,142,0.4)' : 'rgba(255,255,255,0.06)',
          }} />
        ))}
      </div>

      <p className="font-sans text-[10px] text-white/25 uppercase tracking-wider mb-3">Question {currentQ + 1} of 3</p>
      <p className="font-display font-semibold text-sm text-white mb-5 leading-snug">{q.question}</p>

      {/* Options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
        {q.options.map((opt, i) => {
          const isSelected = answers[currentQ] === i
          const isCorrect = i === q.correctIndex
          let bg = 'transparent'
          let border = 'rgba(255,255,255,0.06)'
          let color = 'rgba(255,255,255,0.5)'

          if (revealed) {
            if (isCorrect) { bg = 'rgba(29,158,117,0.08)'; border = 'rgba(29,158,117,0.25)'; color = '#1D9E75' }
            else if (isSelected && !isCorrect) { bg = 'rgba(226,75,74,0.08)'; border = 'rgba(226,75,74,0.25)'; color = '#E24B4A' }
          } else if (isSelected) {
            bg = 'rgba(192,241,142,0.06)'; border = 'rgba(192,241,142,0.2)'; color = 'var(--accent)'
          }

          return (
            <button
              key={i}
              onClick={() => handleAnswer(i)}
              disabled={revealed}
              className="rounded-xl px-4 py-3 border text-left text-xs font-sans transition-all duration-200"
              style={{ background: bg, borderColor: border, color }}
            >
              {opt}
            </button>
          )
        })}
      </div>

      {/* Explanation (shown after answer) */}
      <AnimatePresence>
        {revealed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="rounded-xl p-4 mb-4" style={{ background: 'rgba(55,138,221,0.04)', border: '1px solid rgba(55,138,221,0.12)' }}>
              <p className="font-sans text-xs text-white/50 leading-relaxed">{q.explanation}</p>
            </div>
            <button
              onClick={handleNext}
              className="w-full py-3 rounded-full font-sans font-bold text-sm active:scale-[0.97] transition-transform duration-200"
              style={{ background: 'var(--accent)', color: '#0a1a00' }}
            >
              {currentQ < 2 ? 'Next question →' : 'See your score'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
