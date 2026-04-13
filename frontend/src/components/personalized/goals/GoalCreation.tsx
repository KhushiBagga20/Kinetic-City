import { motion, AnimatePresence } from 'framer-motion'
import { useState, useMemo } from 'react'
import { useAppStore, type Goal } from '../../../store/useAppStore'
import { formatINR } from '../../../lib/formatINR'
import { Shield, Car, Home, Sun, Heart, GraduationCap, Pencil, X, Target } from 'lucide-react'

/* ── Goal categories ─────────────────────────────────────────────────────── */

const CATEGORIES = [
  { id: 'emergency' as const, icon: Shield, label: 'Emergency Fund', sub: '3–6 months of expenses', defaultYears: 1 },
  { id: 'car' as const, icon: Car, label: 'First Car', sub: 'My own wheels', defaultYears: 3 },
  { id: 'house' as const, icon: Home, label: 'Home Down Payment', sub: 'My first property', defaultYears: 10 },
  { id: 'retirement' as const, icon: Sun, label: 'Retirement', sub: 'Financial freedom', defaultYears: 25 },
  { id: 'wedding' as const, icon: Heart, label: 'Wedding', sub: 'The big day', defaultYears: 5 },
  { id: 'education' as const, icon: GraduationCap, label: 'Education', sub: 'Skill up or study', defaultYears: 3 },
]

/* ── SIP calculator ──────────────────────────────────────────────────────── */

function requiredSIP(target: number, annualRate: number, years: number): number {
  const r = annualRate / 12
  const n = years * 12
  if (r === 0 || n === 0) return target
  return target / (((Math.pow(1 + r, n) - 1) / r) * (1 + r))
}

/* ── Component ───────────────────────────────────────────────────────────── */

interface GoalCreationProps {
  onClose: () => void
}

export default function GoalCreation({ onClose }: GoalCreationProps) {
  const [step, setStep] = useState(1)
  const [category, setCategory] = useState<Goal['category'] | null>(null)
  const [targetAmount, setTargetAmount] = useState(500000)
  const [targetYears, setTargetYears] = useState(5)
  const [goalName, setGoalName] = useState('')

  const addGoal = useAppStore(s => s.addGoal)
  const monthlyAmount = useAppStore(s => s.monthlyAmount)

  const sipNeeded = useMemo(() => Math.round(requiredSIP(targetAmount, 0.14, targetYears)), [targetAmount, targetYears])
  const isCovered = monthlyAmount >= sipNeeded
  const gap = sipNeeded - monthlyAmount

  const handleCategorySelect = (cat: Goal['category']) => {
    setCategory(cat)
    setTargetYears(CATEGORIES.find(c => c.id === cat)?.defaultYears ?? 5)
    setGoalName(CATEGORIES.find(c => c.id === cat)?.label ?? '')
    setStep(2)
  }

  const handleSubmit = () => {
    if (!category) return
    addGoal({
      name: goalName || CATEGORIES.find(c => c.id === category)?.label || 'Goal',
      targetAmount,
      targetYears,
      category,
      linkedSIPAmount: Math.min(monthlyAmount, sipNeeded),
    })
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3 }}
      className="overflow-hidden rounded-2xl border mb-4"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="p-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <p className="font-display font-semibold text-sm text-white">
            {step === 1 ? 'What are you saving for?' : step === 2 ? 'Set your target' : 'Name this goal'}
          </p>
          <button onClick={onClose} className="text-white/20 hover:text-white/50 transition-colors" style={{ minHeight: 'auto' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1 — Category selection */}
          {step === 1 && (
            <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES.map(cat => {
                  const Icon = cat.icon
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat.id)}
                      className="rounded-xl p-3 border text-center transition-all duration-200 hover:border-white/14"
                      style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'var(--border)' }}
                    >
                      <Icon className="w-5 h-5 mx-auto mb-1.5 text-white/40" />
                      <p className="font-sans text-[11px] text-white/60 font-medium">{cat.label}</p>
                      <p className="font-sans text-[9px] text-white/20 mt-0.5">{cat.sub}</p>
                    </button>
                  )
                })}
              </div>
              {/* Custom goal */}
              <button
                onClick={() => { setCategory('other'); setStep(2) }}
                className="w-full mt-2 rounded-xl p-3 border text-left transition-all duration-200 hover:border-white/14 flex items-center gap-2"
                style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'var(--border)' }}
              >
                <Pencil className="w-4 h-4 text-white/30" />
                <span className="font-sans text-[11px] text-white/40">Custom goal...</span>
              </button>
            </motion.div>
          )}

          {/* Step 2 — Target amount & years */}
          {step === 2 && (
            <motion.div key="s2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="space-y-5">
                {/* Amount */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-sans text-xs text-white/30">I need</p>
                    <p className="font-mono text-lg text-white font-medium">{formatINR(targetAmount)}</p>
                  </div>
                  <input type="range" min={50000} max={10000000} step={50000} value={targetAmount}
                    onChange={e => setTargetAmount(Number(e.target.value))}
                    className="w-full accent-[var(--accent)] cursor-pointer" />
                  <div className="flex justify-between mt-1">
                    <span className="font-sans text-[9px] text-white/15">₹50K</span>
                    <span className="font-sans text-[9px] text-white/15">₹1Cr</span>
                  </div>
                </div>

                {/* Years */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-sans text-xs text-white/30">In</p>
                    <p className="font-mono text-lg text-white font-medium">{targetYears} years</p>
                  </div>
                  <input type="range" min={1} max={30} step={1} value={targetYears}
                    onChange={e => setTargetYears(Number(e.target.value))}
                    className="w-full accent-[var(--accent)] cursor-pointer" />
                </div>

                {/* Live calculation */}
                <div className="rounded-xl p-4 border" style={{ background: 'rgba(192,241,142,0.03)', borderColor: 'rgba(192,241,142,0.12)', borderLeft: '3px solid var(--accent)' }}>
                  <p className="font-sans text-xs text-white/40 mb-1">To reach {formatINR(targetAmount)} in {targetYears} years:</p>
                  <p className="font-display font-bold text-xl" style={{ color: 'var(--accent)' }}>
                    {formatINR(sipNeeded)}<span className="text-sm text-white/30 font-normal">/month</span>
                  </p>
                  <p className="font-sans text-[10px] text-white/20 mt-1">At 14% CAGR (Nifty 50 historical)</p>

                  {monthlyAmount > 0 && (
                    <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <p className="font-sans text-xs" style={{ color: isCovered ? '#1D9E75' : 'rgba(255,255,255,0.4)' }}>
                        {isCovered
                          ? '✓ Your current SIP covers this goal.'
                          : `You need ${formatINR(gap)} more per month.`}
                      </p>
                    </div>
                  )}
                </div>

                <button onClick={() => setStep(3)}
                  className="w-full py-3 rounded-full font-sans font-bold text-sm active:scale-[0.97] transition-transform"
                  style={{ background: 'var(--accent)', color: '#0a1a00' }}>
                  Next →
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 3 — Name */}
          {step === 3 && (
            <motion.div key="s3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="space-y-4">
                <div>
                  <p className="font-sans text-xs text-white/30 mb-2">What do you want to call this goal?</p>
                  <input
                    type="text"
                    value={goalName}
                    onChange={e => setGoalName(e.target.value)}
                    placeholder={category === 'other' ? 'My goal...' : CATEGORIES.find(c => c.id === category)?.label}
                    className="input-bottom w-full text-base py-2 font-sans"
                  />
                </div>

                {/* Summary */}
                <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.02)' }}>
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                    <p className="font-sans text-xs text-white/50">{goalName || 'Your goal'}</p>
                  </div>
                  <p className="font-mono text-sm text-white/70">
                    {formatINR(targetAmount)} in {targetYears} years → {formatINR(sipNeeded)}/month
                  </p>
                </div>

                <button onClick={handleSubmit}
                  className="w-full py-3 rounded-full font-sans font-bold text-sm active:scale-[0.97] transition-transform"
                  style={{ background: 'var(--accent)', color: '#0a1a00' }}>
                  Add this goal →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
