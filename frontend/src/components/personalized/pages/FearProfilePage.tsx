import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore, type FearType } from '../../../store/useAppStore'
import { Shield, Search, Fingerprint, Unlock, ChevronDown, RefreshCcw, Zap } from 'lucide-react'
import FearQuote from '../shared/FearQuote'
import FearQuiz from '../shared/FearQuiz'

// ── Fear Type Data ──────────────────────────────────────────────────────────

interface FearTypeInfo {
  id: FearType
  name: string
  coreFear: string
  whatItIs: string
  reframe: string
  color: string
  icon: typeof Shield
  kineticBullets: string[]
}

const FEAR_TYPES: FearTypeInfo[] = [
  {
    id: 'loss',
    name: 'Loss Avoider',
    coreFear: '"I will work hard for years and lose it all in one crash."',
    whatItIs: 'Loss aversion — a cognitive bias identified by Kahneman where losses feel 2.5× more painful than equivalent gains feel good. This is not weakness. It is the brain doing its job too well.',
    reframe: 'You don\'t fear markets. You fear regret. That\'s precision thinking applied to the wrong timeframe.',
    color: '#E24B4A',
    icon: Shield,
    kineticBullets: [
      'Sandbox crash simulations show you every crash and its recovery — data replaces dread',
      'Time Machine lets you survive market crises in fast-forward, building emotional resilience safely',
      'Portfolio Pulse anchors you to your actual numbers, not the headlines',
    ],
  },
  {
    id: 'jargon',
    name: 'Clarity Seeker',
    coreFear: '"I will do something stupid because I don\'t understand the rules."',
    whatItIs: 'A rational response to information asymmetry. The financial industry has deliberately made itself confusing. The confusion is a feature, not a bug — it keeps advisors employed.',
    reframe: 'You\'re not afraid of investing. You\'re afraid of being taken advantage of because you don\'t speak the language. That\'s not ignorance. That\'s caution.',
    color: '#378ADD',
    icon: Search,
    kineticBullets: [
      'The Jargon Graveyard kills 40 terms dead with plain-English definitions and real-world analogies',
      'Every module is written at a level where zero prior knowledge is assumed',
      'KINU answers any question — no jargon, no judgment, no sales pitch',
    ],
  },
  {
    id: 'scam',
    name: 'Pattern Detector',
    coreFear: '"This is another elaborate scam and I\'ll be the one who gets burned."',
    whatItIs: 'A trauma response. Most Pattern Detectors have been burned before — a chit fund, a relative\'s tip, a WhatsApp group promising 40%. Their skepticism is earned and deserved.',
    reframe: 'Your pattern recognition has protected you. Now let\'s give it something legitimate to verify instead of always finding reasons to run.',
    color: '#EF9F27',
    icon: Fingerprint,
    kineticBullets: [
      'Red Flag Detector quiz tests your scam-spotting instincts against real scenarios',
      'Every data point includes its source — NSE, RBI, SEBI — nothing is unverifiable',
      'The regulatory wall module traces exactly where your money sits and who guards it',
    ],
  },
  {
    id: 'trust',
    name: 'Independence Guardian',
    coreFear: '"I will hand my money to someone who profits from bad advice and I will have no control."',
    whatItIs: 'A healthy distrust of principal-agent problems. Fund managers profit from AUM regardless of performance. This fear is not irrational — it is economically literate.',
    reframe: 'You don\'t need to trust anyone. Index funds are the one financial product where the math runs itself. No humans required.',
    color: '#1D9E75',
    icon: Unlock,
    kineticBullets: [
      'Fee X-ray calculator reveals the true cost of human fund managers over 20 years',
      'Active vs Passive racing module proves the index wins with zero human judgment',
      'Autonomous portfolio builder removes every human opinion from your allocation',
    ],
  },
]

// ── Component ───────────────────────────────────────────────────────────────

export default function FearProfilePage() {
  const fearType = useAppStore(s => s.fearType) ?? 'loss'
  const setFearProfile = useAppStore(s => s.setFearProfile)
  const rawName = useAppStore(s => s.userName)
  const firstName = rawName && rawName !== 'Explorer' ? rawName.split(' ')[0] : ''
  const navigate = useNavigate()

  const [expandedTypes, setExpandedTypes] = useState<Set<FearType>>(new Set([fearType]))
  const [compareMode, setCompareMode] = useState(false)

  const toggleType = (id: FearType) => {
    if (compareMode) return
    setExpandedTypes(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleCompare = () => {
    if (compareMode) {
      setCompareMode(false)
      setExpandedTypes(new Set([fearType]))
    } else {
      setCompareMode(true)
      setExpandedTypes(new Set(FEAR_TYPES.map(f => f.id)))
    }
  }

  const handleRetake = () => {
    setFearProfile(null as unknown as FearType, null as any)
    navigate('/start')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-3xl mx-auto"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <h1 className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight mb-3">
          {firstName ? `${firstName}'s Fear Profile` : 'Your Fear Profile'}
        </h1>
        <p className="font-sans text-sm text-white/40 max-w-lg leading-relaxed">
          Fear isn't a flaw — it's a signal. Understanding yours is the first step toward making it work for you instead of against you.
        </p>
      </motion.div>

      {/* AI personalised quote */}
      <FearQuote context="profile" variant="card" className="mb-6" />

      {/* Fear Type Sections */}
      <div className="space-y-4 mb-8">
        {FEAR_TYPES.map((ft, index) => {
          const isUserType = ft.id === fearType
          const isExpanded = expandedTypes.has(ft.id)
          const Icon = ft.icon

          return (
            <motion.div
              key={ft.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              className="rounded-3xl border overflow-hidden transition-[border-color] duration-300"
              style={{
                background: 'var(--surface)',
                borderColor: isUserType && isExpanded ? `${ft.color}40` : 'var(--border)',
                borderLeft: isUserType ? `4px solid ${ft.color}` : undefined,
              }}
            >
              {/* Header — always visible */}
              <button
                onClick={() => toggleType(ft.id)}
                className="w-full flex items-center gap-4 p-6 text-left group"
              >
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 transition-[background-color] duration-200"
                  style={{ background: `${ft.color}12` }}
                >
                  <Icon className="w-4.5 h-4.5" style={{ color: ft.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2.5">
                    <h3 className="font-display font-semibold text-lg text-white">{ft.name}</h3>
                    {isUserType && (
                      <span
                        className="text-[9px] font-sans font-bold px-2.5 py-1 rounded-full uppercase tracking-wider"
                        style={{ background: `${ft.color}15`, color: ft.color }}
                      >
                        Your type
                      </span>
                    )}
                  </div>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-white/20 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Expanded content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-6 space-y-5">
                      {/* Core fear */}
                      <div>
                        <p className="font-sans text-[10px] text-white/20 uppercase tracking-wider mb-1.5">Core fear</p>
                        <p className="font-sans text-sm text-white/40 italic leading-relaxed">{ft.coreFear}</p>
                      </div>

                      {/* What it actually is */}
                      <div>
                        <p className="font-sans text-[10px] text-white/20 uppercase tracking-wider mb-1.5">What it actually is</p>
                        <p className="font-sans text-sm text-white/60 leading-relaxed">{ft.whatItIs}</p>
                      </div>

                      {/* Reframe */}
                      <div
                        className="rounded-2xl p-5 border"
                        style={{ background: `${ft.color}06`, borderColor: `${ft.color}18` }}
                      >
                        <p className="font-sans text-[10px] uppercase tracking-wider mb-2" style={{ color: `${ft.color}90` }}>Your reframe</p>
                        <p className="font-display font-medium text-base leading-relaxed" style={{ color: ft.color }}>
                          {ft.reframe}
                        </p>
                      </div>

                      {/* What Kinetic does for you */}
                      <div>
                        <p className="font-sans text-[10px] text-white/20 uppercase tracking-wider mb-3">What Kinetic does for you</p>
                        <ul className="space-y-2.5">
                          {ft.kineticBullets.map((bullet, i) => (
                            <li key={i} className="flex items-start gap-2.5">
                              <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5" style={{ background: ft.color }} />
                              <p className="font-sans text-sm text-white/50 leading-relaxed">{bullet}</p>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Test yourself quiz */}
                      <div>
                        <p className="font-sans text-[10px] text-white/20 uppercase tracking-wider mb-3">Test yourself</p>
                        <FearQuiz fearType={ft.id} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>

      {/* Compare toggle */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        onClick={toggleCompare}
        className="w-full py-3 rounded-xl font-sans text-sm border transition-[background-color,border-color,color] duration-200 mb-8"
        style={{
          borderColor: compareMode ? 'rgba(192,241,142,0.2)' : 'var(--border)',
          background: compareMode ? 'rgba(192,241,142,0.04)' : 'transparent',
          color: compareMode ? 'var(--accent)' : 'rgba(255,255,255,0.35)',
        }}
      >
        {compareMode ? 'Collapse to your type' : 'Compare with other types'}
      </motion.button>

      {/* Can fear types change? */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="rounded-3xl p-7 border mb-6"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'rgba(192,241,142,0.08)', border: '1px solid rgba(192,241,142,0.18)' }}
          >
            <Zap className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
          </div>
          <h3 className="font-display font-semibold text-base text-white pt-1">Can fear types change?</h3>
        </div>
        <p className="font-sans text-sm text-white/50 leading-relaxed">
          Yes. Fear types are a starting point, not a verdict. Most people find their fear score on a secondary type drops significantly after 30 days of using Kinetic. Some shift primary types entirely. Your dashboard adapts as your profile updates.
        </p>
      </motion.div>

      {/* Retake button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={handleRetake}
        className="w-full py-4 rounded-full font-sans font-bold text-sm border flex items-center justify-center gap-2.5 active:scale-[0.97] transition-[background-color,border-color,transform] duration-200 hover:bg-[rgba(255,255,255,0.03)]"
        style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
      >
        <RefreshCcw className="w-3.5 h-3.5" />
        Retake the Vibe Check
      </motion.button>
    </motion.div>
  )
}
