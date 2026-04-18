import { motion } from 'framer-motion'
import { useAppStore } from '../../store/useAppStore'

import { getTrackForFear } from '../../lib/curriculumData'

/* ── Next step logic ─────────────────────────────────────────────────────── */

interface NextStep {
  icon: string
  headline: string
  subtext: string
  cta: string
  route: string
}

function getNextModuleName(fearType: string, completedModules: string[]): string {
  const track = getTrackForFear(fearType)
  const nextModule = track.find(m => !completedModules.includes(m.id))
  return nextModule ? nextModule.title : track[track.length - 1].title
}

function getNextStep(state: {
  portfolioSetup: boolean
  goals: { length: number }
  completedModules: string[]
  simulationResult: any
  timeMachineResult: any
  fearType: string
}): NextStep {
  if (!state.portfolioSetup) return {
    icon: '⚡',
    headline: 'Start your first SIP',
    subtext: 'Set up ₹100/month and watch it grow. Takes 3 minutes.',
    cta: 'Start investing →',
    route: 'portfolio',
  }

  if (state.goals.length === 0) return {
    icon: '🎯',
    headline: 'What are you investing for?',
    subtext: 'Set a goal and KINETIC will tell you exactly how much you need each month.',
    cta: 'Add your first goal →',
    route: 'portfolio',
  }

  const trackModules = state.completedModules.filter(m => m.startsWith(state.fearType))
  if (trackModules.length < 3) return {
    icon: '📚',
    headline: 'Continue your learning track',
    subtext: `You've completed ${trackModules.length} of 10 modules. Next: "${getNextModuleName(state.fearType, state.completedModules)}"`,
    cta: 'Continue learning →',
    route: 'learn',
  }

  if (!state.simulationResult) return {
    icon: '📊',
    headline: 'Run your first simulation',
    subtext: 'See 600 possible futures for your money. Takes 30 seconds.',
    cta: 'Open simulation →',
    route: 'simulation',
  }

  if (!state.timeMachineResult) return {
    icon: '⏳',
    headline: 'Survive the 2020 COVID crash',
    subtext: 'Run ₹500 through the worst crash in recent memory. Watch it recover.',
    cta: 'Open Time Machine →',
    route: 'time-machine',
  }

  return {
    icon: '✅',
    headline: "You're doing great",
    subtext: "You've covered the core KINETIC experience. Explore the Harvest Room next.",
    cta: 'Try the Harvest Room →',
    route: 'harvest',
  }
}

/* ── Component ───────────────────────────────────────────────────────────── */

export default function NextStepCard() {
  const portfolioSetup = useAppStore(s => s.portfolioSetup)
  const goals = useAppStore(s => s.goals)
  const completedModules = useAppStore(s => s.completedModules)
  const simulationResult = useAppStore(s => s.simulationResult)
  const timeMachineResult = useAppStore(s => s.timeMachineResult)
  const fearType = useAppStore(s => s.fearType) ?? 'loss'
  const setDashboardSection = useAppStore(s => s.setDashboardSection)

  const step = getNextStep({
    portfolioSetup, goals, completedModules: [...new Set(completedModules)],
    simulationResult, timeMachineResult, fearType,
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="rounded-3xl p-5 border cursor-pointer group"
      style={{
        background: 'var(--surface)',
        borderColor: 'var(--border)',
        borderLeft: '3px solid var(--accent)',
      }}
      onClick={() => setDashboardSection(step.route)}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className="shrink-0 flex items-center justify-center text-lg"
          style={{
            width: 36, height: 36, borderRadius: '50%',
            background: 'rgba(192,241,142,0.15)',
          }}
        >
          {step.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="font-sans text-[16px] font-medium text-white leading-snug mb-1">
            {step.headline}
          </p>
          <p className="font-sans text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            {step.subtext}
          </p>
          <p
            className="font-sans text-[13px] font-medium mt-2 group-hover:translate-x-1 transition-transform duration-200"
            style={{ color: 'var(--accent)' }}
          >
            {step.cta}
          </p>
        </div>
      </div>
    </motion.div>
  )
}
