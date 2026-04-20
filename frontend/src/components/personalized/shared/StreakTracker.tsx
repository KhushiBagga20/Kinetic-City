import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Flame } from 'lucide-react'
import { useAppStore } from '../../../store/useAppStore'
import { generateKinuChat } from '../../../lib/kinuAI'

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getMotivation(days: number): string {
  if (days <= 0) return 'Come back tomorrow to start a streak.'
  if (days <= 3) return "You're building something."
  if (days <= 7) return 'A week of consistency. Keep going.'
  if (days <= 14) return 'Two weeks. This is becoming a habit.'
  if (days <= 30) return 'Habits compound like interest.'
  return "You've been here longer than most people stay anywhere."
}

export default function StreakTracker() {
  const streakDays = useAppStore(s => s.streakDays)
  const fearType = useAppStore(s => s.fearType) ?? 'loss'
  const updateStreak = useAppStore(s => s.updateStreak)
  const acknowledgedStreakMilestones = useAppStore(s => s.acknowledgedStreakMilestones)
  const acknowledgeMilestone = useAppStore(s => s.acknowledgeMilestone)
  const [showMilestoneToast, setShowMilestoneToast] = useState(false)
  const [milestoneReached, setMilestoneReached] = useState(0)
  const [milestoneMsg, setMilestoneMsg] = useState<Record<number, string>>({})

  useEffect(() => {
    updateStreak()
  }, [updateStreak])

  useEffect(() => {
    const MILESTONES = [3, 7, 14, 30, 60, 90, 100, 365]
    if (MILESTONES.includes(streakDays) && !acknowledgedStreakMilestones.includes(streakDays)) {
      setMilestoneReached(streakDays)
      setShowMilestoneToast(true)
      acknowledgeMilestone(streakDays)
      
      // Auto-hide toast after 4 seconds
      const timer = setTimeout(() => setShowMilestoneToast(false), 4000)
      return () => clearTimeout(timer)
    }
  }, [streakDays, acknowledgedStreakMilestones, acknowledgeMilestone])

  // Generate AI milestone message async — show static fallback immediately, upgrade when ready
  useEffect(() => {
    if (!milestoneReached || milestoneMsg[milestoneReached]) return
    generateKinuChat({
      message: `User just hit a ${milestoneReached}-day streak on KINETIC. Fear type: ${fearType}. Give one punchy celebratory sentence (max 12 words).`,
      fear_type: fearType,
      context: 'streak_milestone',
      conversation_history: [],
    })
    .then(d => setMilestoneMsg(prev => ({ ...prev, [milestoneReached]: d.reply })))
    .catch(() => {})
  }, [milestoneReached, fearType])


  // Monday-first index: Mon=0, Tue=1, ..., Sun=6
  // JS getDay(): Sun=0, Mon=1, ..., Sat=6
  const todayJS = new Date().getDay()
  const todayIndex = (todayJS + 6) % 7 // Convert to Monday-first

  // For each slot Mon–Sun, compute whether it's filled
  const dots = DAY_LABELS.map((_, i) => {
    // How many days ago was slot i?
    let daysAgo = (todayIndex - i + 7) % 7
    const isToday = daysAgo === 0
    const isFuture = i > todayIndex
    const isFilled = !isFuture && daysAgo < streakDays
    const isMissed = !isFuture && !isFilled && !isToday
    return { isToday, isFuture, isFilled, isMissed }
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      whileHover={{ scale: 1.01, boxShadow: '0 8px 32px rgba(192,241,142,0.08)', borderColor: 'rgba(192,241,142,0.15)' }}
      className="rounded-3xl p-6 border transition-all duration-300 relative"
      style={{
        background: 'var(--surface)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: 'var(--border)',
      }}
    >
      <AnimatePresence>
        {showMilestoneToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap px-4 py-2 rounded-full border shadow-xl flex items-center gap-2 z-50"
            style={{ background: 'rgba(20,20,20,0.95)', borderColor: 'var(--accent)' }}
          >
            <Flame className="w-4 h-4" style={{ color: 'var(--accent)' }} />
            <span className="font-display text-[13px] text-white">
              {milestoneMsg[milestoneReached]
                ? milestoneMsg[milestoneReached]
                : <><span style={{ color: 'var(--accent)' }}>{milestoneReached} Day</span> Streak Milestone! 🔥</>
              }
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(192,241,142,0.10)' }}>
          <Flame className="w-4 h-4" style={{ color: 'var(--accent)' }} />
        </div>
        <div>
          <p className="font-display font-medium" style={{ fontSize: 18, color: 'var(--accent)' }}>
            {streakDays > 0 ? `Day ${streakDays}` : 'No streak yet'}
          </p>
          <p className="text-[11px] font-sans text-white/35">
            {getMotivation(streakDays)}
          </p>
        </div>
      </div>

      {/* Day dots */}
      <div className="flex items-center justify-between">
        {dots.map((dot, i) => (
          <div key={i} className="flex flex-col items-center gap-1.5">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.05 * i, type: 'spring', stiffness: 500, damping: 25 }}
              className="relative rounded-full"
              style={{
                width: 28, height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: dot.isFilled
                  ? 'var(--teal)'
                  : dot.isToday && streakDays > 0
                    ? 'var(--accent)'
                    : 'rgba(255,255,255,0.06)',
                border: dot.isFilled
                  ? '1.5px solid rgba(29,158,117,0.5)'
                  : dot.isToday && streakDays > 0
                    ? '1.5px solid rgba(192,241,142,0.5)'
                    : '1.5px solid rgba(255,255,255,0.08)',
              }}
            >
              {/* Today pulse */}
              {dot.isToday && streakDays > 0 && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ border: '1.5px solid var(--accent)' }}
                  animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}
              {/* Missed indicator — small red dot */}
              {dot.isMissed && (
                <div className="absolute -top-0.5 -right-0.5 rounded-full"
                  style={{ width: 5, height: 5, background: 'var(--danger)' }} />
              )}
            </motion.div>
            <span className="text-[10px] font-sans" style={{
              color: dot.isToday ? 'var(--accent)' : 'rgba(255,255,255,0.2)',
            }}>
              {DAY_LABELS[i]}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
