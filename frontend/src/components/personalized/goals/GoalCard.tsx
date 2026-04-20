import { motion } from 'framer-motion'
import { useAppStore, type Goal } from '../../../store/useAppStore'
import { formatINR } from '../../../lib/formatINR'
import { X, Shield, Car, Home, Sun, Heart, GraduationCap, Target } from 'lucide-react'

/* ── Category icons ──────────────────────────────────────────────────────── */

const CATEGORY_ICONS: Record<Goal['category'], typeof Shield> = {
  emergency: Shield, car: Car, house: Home, retirement: Sun, wedding: Heart, education: GraduationCap, other: Target,
}

/* ── SIP FV for progress calculation ─────────────────────────────────────── */

function sipFV(monthly: number, annualRate: number, years: number): number {
  const r = annualRate / 12
  const n = years * 12
  if (r === 0) return monthly * n
  return monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r)
}

/* ── Component ───────────────────────────────────────────────────────────── */

export default function GoalCard({ goal }: { goal: Goal }) {
  const removeGoal = useAppStore(s => s.removeGoal)

  // Calculate progress — with guards for brand-new goals (monthsElapsed === 0)
  const createdAt = new Date(goal.createdAt)
  const now = new Date()
  const monthsElapsed = Math.max(0,
    (now.getFullYear() - createdAt.getFullYear()) * 12 + (now.getMonth() - createdAt.getMonth())
  )
  const rawCurrentValue = monthsElapsed > 0 ? sipFV(goal.linkedSIPAmount, 0.14, monthsElapsed / 12) : 0
  const currentValue = isNaN(rawCurrentValue) || !isFinite(rawCurrentValue) ? 0 : rawCurrentValue
  const rawProgress = goal.targetAmount > 0 ? Math.min(100, (currentValue / goal.targetAmount) * 100) : 0
  const progress = isNaN(rawProgress) || !isFinite(rawProgress) ? 0 : rawProgress
  const yearsRemaining = Math.max(0, goal.targetYears - monthsElapsed / 12)
  const onTrack = goal.linkedSIPAmount >= goal.requiredMonthlySIP
  const shortfall = goal.requiredMonthlySIP - goal.linkedSIPAmount

  const Icon = CATEGORY_ICONS[goal.category]

  // SVG progress ring
  const radius = 26
  const circumference = 2 * Math.PI * radius
  const ringProgress = Math.max(0.04, progress / 100)
  const offset = circumference - ringProgress * circumference

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ scale: 1.02, boxShadow: '0 8px 32px rgba(192,241,142,0.08)', borderColor: 'rgba(192,241,142,0.15)' }}
      className="rounded-2xl p-4 border transition-all duration-300 cursor-default"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-white/30" />
          <p className="font-sans text-sm font-medium text-white/70">{goal.name}</p>
        </div>
        <button onClick={() => removeGoal(goal.id)} className="text-white/15 hover:text-white/40 transition-colors" style={{ minHeight: 'auto' }}>
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Amount */}
      <p className="font-sans text-xs text-white/25 mb-3">
        {formatINR(currentValue)} of {formatINR(goal.targetAmount)}
      </p>

      {/* Progress ring + stats */}
      <div className="flex items-center gap-4 mb-3">
        <div className="relative w-16 h-16 shrink-0">
          <svg width="64" height="64" className="-rotate-90 absolute inset-0">
            <circle cx="32" cy="32" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="4" />
            <motion.circle
              cx="32" cy="32" r={radius} fill="none" stroke="#c0f18e" strokeWidth="4" strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon className="w-5 h-5" style={{ color: '#c0f18e' }} />
          </div>
        </div>
        <div>
          <p className="font-sans text-xs text-white/30 mb-1">
            Required: {formatINR(goal.requiredMonthlySIP)}/month
          </p>
          <p className="font-sans text-xs" style={{ color: onTrack ? '#1D9E75' : 'rgba(255,255,255,0.4)' }}>
            {onTrack ? '✓ On track' : `₹${shortfall.toLocaleString('en-IN')} short`}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: 'var(--teal)' }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, progress)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>
      <p className="font-sans text-[10px] text-white/20 mt-1.5">
        {progress.toFixed(0)}% of goal reached · {yearsRemaining.toFixed(1)} years remaining
      </p>
    </motion.div>
  )
}
