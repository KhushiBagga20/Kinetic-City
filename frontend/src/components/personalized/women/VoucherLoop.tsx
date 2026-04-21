import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { useAppStore } from '../../../store/useAppStore'

const CHALLENGES = [
  { id: 'modules_3', label: 'Complete 3 modules', 
    points: 200, reward: '₹200 Nykaa voucher', partner: 'Nykaa',
    metric: 'modules', target: 3 },
  { id: 'streak_7', label: 'Maintain a 7-day streak',
    points: 200, reward: '₹200 Amazon voucher', partner: 'Amazon',
    metric: 'streak', target: 7 },
  { id: 'goal_first', label: 'Set your first financial goal',
    points: 150, reward: '₹150 Cult.fit voucher', partner: 'Cult.fit',
    metric: 'goals', target: 1 },
  { id: 'simulation_run', label: 'Run 2 simulations',
    points: 150, reward: '₹150 Myntra voucher', partner: 'Myntra',
    metric: 'simulations', target: 2 },
]

const SPENDING_INSIGHTS: Record<string, { category: string; monthly: number }> = {
  'Nykaa':    { category: 'beauty & skincare', monthly: 800 },
  'Amazon':   { category: 'online shopping',   monthly: 2200 },
  'Cult.fit': { category: 'fitness & wellness', monthly: 600 },
  'Myntra':   { category: 'fashion & clothing', monthly: 1400 },
}

export default function VoucherLoop() {
  const completedModules = useAppStore(s => s.completedModules)
  const streakDays = useAppStore(s => s.streakDays)
  const goals = useAppStore(s => s.goals)
  const simulationResult = useAppStore(s => s.simulationResult)
  const timeMachineResult = useAppStore(s => s.timeMachineResult)
  const voucherPoints = useAppStore(s => s.voucherPoints)
  const addVoucherPoints = useAppStore(s => s.addVoucherPoints)
  const pendingVoucher = useAppStore(s => s.pendingVoucher)
  const setPendingVoucher = useAppStore(s => s.setPendingVoucher)

  const [claimedIds, setClaimedIds] = useState<string[]>([])
  const [showMirror, setShowMirror] = useState<string | null>(null)

  const getProgress = (metric: string) => {
    switch (metric) {
      case 'modules': return completedModules.length
      case 'streak': return streakDays
      case 'goals': return goals.length
      case 'simulations': return (simulationResult ? 1 : 0) + (timeMachineResult ? 1 : 0)
      default: return 0
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-white font-display font-bold text-xl">Earn & Reflect</h2>
          <p className="text-white/40 text-sm mt-1">Complete challenges. Earn rewards. See the bigger picture.</p>
        </div>
        <div 
          className="flex items-center rounded-full px-3 py-1 text-[13px] font-bold"
          style={{ background: 'rgba(192,241,142,0.08)', border: '1px solid rgba(192,241,142,0.15)', color: '#c0f18e' }}
        >
          ⚡ {voucherPoints} pts
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CHALLENGES.map(challenge => {
          const current = getProgress(challenge.metric)
          const isComplete = current >= challenge.target
          const isClaimed = claimedIds.includes(challenge.id)
          const progressPct = Math.min(100, (current / challenge.target) * 100)

          return (
            <div key={challenge.id} className="rounded-3xl p-6 border flex flex-col items-center text-center relative"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              
              <div className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.6)' }}>
                {challenge.partner}
              </div>
              
              <h3 className="text-white font-medium text-sm mb-6">{challenge.label}</h3>

              {/* Progress Ring */}
              <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
                  <circle cx="50" cy="50" r="45" fill="none" stroke={isComplete ? '#c0f18e' : 'rgba(192,241,142,0.3)'} strokeWidth="6" 
                    strokeDasharray="283" strokeDashoffset={283 - (283 * progressPct) / 100} 
                    style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white/70">
                  {Math.min(current, challenge.target)}/{challenge.target}
                </div>
              </div>

              {isClaimed ? (
                <div className="w-full py-2.5 rounded-xl font-bold text-sm bg-transparent border text-[#c0f18e]"
                  style={{ borderColor: 'rgba(192,241,142,0.3)' }}>
                  Claimed ✓
                </div>
              ) : isComplete ? (
                <button
                  onClick={() => {
                    addVoucherPoints(challenge.points)
                    setClaimedIds([...claimedIds, challenge.id])
                    setPendingVoucher({ amount: challenge.points, partner: challenge.partner })
                    setShowMirror(challenge.partner)
                  }}
                  className="w-full py-2.5 rounded-xl font-bold text-sm text-[#0a1a00] transition-transform hover:scale-[1.02]"
                  style={{ background: '#c0f18e' }}
                >
                  Claim ₹{challenge.points}
                </button>
              ) : (
                <div className="w-full py-2.5 rounded-xl font-bold text-sm text-white/20"
                  style={{ background: 'rgba(255,255,255,0.02)' }}>
                  {challenge.reward}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* The Mirror Moment */}
      <AnimatePresence>
        {showMirror && pendingVoucher && SPENDING_INSIGHTS[showMirror] && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="rounded-3xl p-8 border mt-8 relative overflow-hidden"
            style={{ background: '#0a1a00', borderColor: 'rgba(192,241,142,0.3)' }}
          >
            {/* Background K */}
            <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full border-[20px] pointer-events-none"
              style={{ borderColor: 'rgba(192,241,142,0.03)' }} />
            
            <div className="relative z-10 text-center">
              <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-6"
                style={{ background: 'rgba(192,241,142,0.1)' }}>
                <span className="font-display font-bold text-3xl text-[#c0f18e]">K</span>
              </div>
              
              <h3 className="font-display font-bold text-2xl text-white mb-6">
                You just earned ₹{pendingVoucher.amount}
              </h3>

              <div className="rounded-2xl p-6 mb-8 text-left border"
                style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}>
                <p className="text-white/60 text-sm leading-relaxed">
                  Data shows women spend avg <span className="text-white font-bold">₹{SPENDING_INSIGHTS[showMirror].monthly}/month</span> on {SPENDING_INSIGHTS[showMirror].category}.
                </p>
              </div>

              <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
                <button 
                  onClick={() => {
                    setShowMirror(null)
                    setPendingVoucher(null)
                  }}
                  className="w-full md:w-auto px-6 py-3 rounded-xl text-sm font-medium border transition-colors hover:bg-white/5"
                  style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
                >
                  Use my voucher at {showMirror}
                </button>
                <button 
                  onClick={() => {
                    setShowMirror(null)
                    setPendingVoucher(null)
                  }}
                  className="w-full md:w-auto px-6 py-3 rounded-xl text-sm font-bold transition-transform hover:scale-[1.02]"
                  style={{ background: '#c0f18e', color: '#0a1a00' }}
                >
                  Convert to Digital Gold SIP ₹{pendingVoucher.amount}
                </button>
              </div>
              
              <p className="text-white/30 text-xs mt-6">
                No judgment either way. Both choices are yours.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
