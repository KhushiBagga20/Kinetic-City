import { motion } from 'framer-motion'
import { useAppStore } from '../../store/useAppStore'

/* ── Module names for next-module display ────────────────────────────────── */

const MODULE_NAMES: Record<string, string[]> = {
  loss: [
    'Why your brain hates losing money',
    'The recovery truth',
    'Your first ₹100 SIP',
    'What is a Nifty 50 Index Fund?',
    'The 70-year proof',
    'How KINETIC\'s simulators work',
    'SIP vs Lumpsum vs FD — the comparison',
    'Reading the Monte Carlo fan chart',
    'The ₹500 Time Machine',
    'Set up your first goal',
  ],
  jargon: [
    'The Jargon Graveyard',
    'NAV — the only number that matters',
    'SIP — automatic investing explained',
    'Expense ratio — the silent fee',
    'CAGR vs absolute returns',
    'How KINETIC\'s simulators work',
    'SIP vs Lumpsum vs FD — the comparison',
    'Reading the Monte Carlo fan chart',
    'Build your first SIP calculation',
    'Set up your first goal',
  ],
  scam: [
    'How SEBI protects your money',
    'Red flags in fake schemes',
    'Why index funds can\'t scam you',
    'The AMFI verification method',
    'Reading a mutual fund factsheet',
    'How KINETIC\'s simulators work',
    'SIP vs Lumpsum vs FD — the comparison',
    'Reading the Monte Carlo fan chart',
    'Verify a real fund',
    'Set up your first goal',
  ],
  trust: [
    'Why banks want your money in FDs',
    'The math of index funds vs FDs',
    'Compound interest — your edge',
    'Direct plans vs regular plans',
    'The 0.1% expense ratio advantage',
    'How KINETIC\'s simulators work',
    'SIP vs Lumpsum vs FD — the comparison',
    'Reading the Monte Carlo fan chart',
    'The fee X-ray',
    'Set up your first goal',
  ],
}

/* ── Next step logic ─────────────────────────────────────────────────────── */

interface NextStep {
  icon: string
  headline: string
  subtext: string
  cta: string
  route: string
}

function getNextModuleName(fearType: string, completedModules: string[]): string {
  const names = MODULE_NAMES[fearType] || MODULE_NAMES.loss
  const trackModules = completedModules.filter(m => m.startsWith(fearType))
  const nextIndex = trackModules.length
  return names[nextIndex] || names[0]
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
