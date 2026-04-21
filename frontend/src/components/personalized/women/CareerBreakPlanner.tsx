import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { TrendingUp, Clock, RotateCcw, Zap } from 'lucide-react'
import { useAppStore } from '../../../store/useAppStore'
import { formatINR } from '../../../lib/formatINR'
import { generateKinuChat } from '../../../lib/kinuAI'

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function formatMonths(m: number): string {
  if (m < 12) return `${m} month${m !== 1 ? 's' : ''}`
  const y = Math.floor(m / 12)
  const rem = m % 12
  return rem === 0 ? `${y} year${y !== 1 ? 's' : ''}` : `${y}y ${rem}m`
}

/* ── Slider card sub-component ────────────────────────────────────────────── */

function SliderCard({
  label, displayValue, min, max, step, value, onChange, minLabel, maxLabel,
}: {
  label: string
  displayValue: string
  min: number
  max: number
  step: number
  value: number
  onChange: (v: number) => void
  minLabel: string
  maxLabel: string
}) {
  return (
    <div
      className="rounded-2xl p-5 border"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="font-sans text-xs text-white/40 uppercase tracking-wider">{label}</p>
        <p className="font-mono text-base text-white font-semibold">{displayValue}</p>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full cursor-pointer accent-[var(--accent)]"
      />
      <div className="flex justify-between mt-1.5">
        <span className="font-sans text-[10px] text-white/20">{minLabel}</span>
        <span className="font-sans text-[10px] text-white/20">{maxLabel}</span>
      </div>
    </div>
  )
}

/* ── Phase card sub-component ─────────────────────────────────────────────── */

function PhaseCard({
  phase, title, headline, sub, detail, bg, border, iconColor, Icon, delay,
}: {
  phase: string
  title: string
  headline: string
  sub: string
  detail: string
  bg: string
  border: string
  iconColor: string
  Icon: React.ElementType
  delay: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="rounded-2xl p-6 border flex flex-col gap-3 flex-1 min-w-0"
      style={{ background: bg, borderColor: border }}
    >
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `${iconColor}18`, border: `1px solid ${iconColor}30` }}
        >
          <Icon className="w-4 h-4" style={{ color: iconColor }} />
        </div>
        <span className="font-sans text-[11px] uppercase tracking-widest font-semibold" style={{ color: iconColor }}>
          {phase}
        </span>
      </div>

      <p className="font-sans text-[11px] text-white/40 font-medium">{title}</p>

      <p className="font-display font-bold text-xl text-white leading-tight">{headline}</p>

      <p className="font-sans text-sm text-white/50">{sub}</p>

      <p className="font-sans text-[11px] text-white/30 leading-relaxed border-t pt-3" style={{ borderColor: `${border}` }}>
        {detail}
      </p>
    </motion.div>
  )
}

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════════════ */

export default function CareerBreakPlanner() {
  const fearType = useAppStore(s => s.fearType) ?? 'loss'

  const [monthlySIP, setMonthlySIP] = useState(3000)
  const [breakMonths, setBreakMonths] = useState(12)
  const [currentCorpus, setCurrentCorpus] = useState(200000)
  const [monthsToBreak, setMonthsToBreak] = useState(24)
  const [showPlan, setShowPlan] = useState(false)
  const [kinuMessage, setKinuMessage] = useState<string | null>(null)
  const [kinuLoading, setKinuLoading] = useState(false)

  /* ── Calculations ─────────────────────────────────────────────────────────── */

  const { additionalSIP, totalSIPBeforeBreak, sustainableWithdrawal, monthlyWithdrawal, resumeSIP } =
    useMemo(() => {
      const r = 0.14 / 12

      // Phase 1: extra front-load SIP to offset the missed contributions
      const missedContributions = monthlySIP * breakMonths
      const futureValueMissed = missedContributions * Math.pow(1 + r, breakMonths)
      const denom = ((Math.pow(1 + r, monthsToBreak) - 1) / r) * (1 + r)
      const additionalSIP = Math.round(futureValueMissed / denom)
      const totalSIPBeforeBreak = monthlySIP + additionalSIP

      // Phase 2: SWP from corpus
      const monthlyWithdrawal = Math.round(
        (currentCorpus * r) / (1 - Math.pow(1 + r, -breakMonths))
      )
      const sustainableWithdrawal = Math.round(currentCorpus * r)

      // Phase 3: Resume ramp — 15% higher for 12 months
      const resumeSIP = Math.round(monthlySIP * 1.15)

      return { additionalSIP, totalSIPBeforeBreak, sustainableWithdrawal, monthlyWithdrawal, resumeSIP }
    }, [monthlySIP, breakMonths, currentCorpus, monthsToBreak])

  /* ── Generate plan + KINU ─────────────────────────────────────────────────── */

  function handleGenerate() {
    setShowPlan(true)
    setKinuMessage(null)
    setKinuLoading(true)
    generateKinuChat({
      message: `Career break plan: ₹${monthlySIP}/month SIP, ${breakMonths} month break, ₹${currentCorpus} corpus. Plan summary: increase to ₹${totalSIPBeforeBreak} before break, withdraw ₹${sustainableWithdrawal}/month during, resume at ₹${resumeSIP} after. Give one empowering sentence.`,
      fear_type: fearType,
      context: 'career_break_planner',
      conversation_history: [],
    })
      .then(d => setKinuMessage(d.reply))
      .catch(() => setKinuMessage('Your break is a chapter, not the end. Every pause is followed by momentum.'))
      .finally(() => setKinuLoading(false))
  }

  /* ── Render ───────────────────────────────────────────────────────────────── */

  return (
    <section className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="font-display font-bold text-2xl text-white">Career Break Planner</h2>
        <p className="font-sans text-sm text-white/40 mt-1">
          Plan your break before it starts — the only tool that treats a career pause as a financial strategy.
        </p>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SliderCard
          label="Monthly SIP amount"
          displayValue={`₹${monthlySIP.toLocaleString('en-IN')}`}
          min={500} max={20000} step={500}
          value={monthlySIP} onChange={v => { setMonthlySIP(v); setShowPlan(false) }}
          minLabel="₹500" maxLabel="₹20,000"
        />
        <SliderCard
          label="Break duration"
          displayValue={formatMonths(breakMonths)}
          min={3} max={60} step={1}
          value={breakMonths} onChange={v => { setBreakMonths(v); setShowPlan(false) }}
          minLabel="3 months" maxLabel="5 years"
        />
        <SliderCard
          label="Current corpus"
          displayValue={formatINR(currentCorpus)}
          min={0} max={2000000} step={10000}
          value={currentCorpus} onChange={v => { setCurrentCorpus(v); setShowPlan(false) }}
          minLabel="₹0" maxLabel="₹20 L"
        />
        <SliderCard
          label="Months until break"
          displayValue={formatMonths(monthsToBreak)}
          min={6} max={60} step={1}
          value={monthsToBreak} onChange={v => { setMonthsToBreak(v); setShowPlan(false) }}
          minLabel="6 months" maxLabel="5 years"
        />
      </div>

      {/* CTA */}
      <div className="flex justify-center">
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleGenerate}
          className="font-sans font-bold text-sm rounded-full px-8 py-3 transition-all duration-200"
          style={{ background: '#c0f18e', color: '#0a1a00' }}
        >
          Generate my plan
        </motion.button>
      </div>

      {/* Plan output */}
      <AnimatePresence>
        {showPlan && (
          <motion.div
            key="plan"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Phase cards */}
            <div className="flex flex-col md:flex-row gap-4">
              <PhaseCard
                phase="Phase 1"
                title="Before your break"
                headline={`Increase SIP to ₹${totalSIPBeforeBreak.toLocaleString('en-IN')}/month`}
                sub={`for ${formatMonths(monthsToBreak)}`}
                detail={`Extra ₹${additionalSIP.toLocaleString('en-IN')}/month neutralises the ${formatMonths(breakMonths)} gap — front-loaded so you never fall behind.`}
                bg="rgba(192,241,142,0.04)"
                border="rgba(192,241,142,0.15)"
                iconColor="#c0f18e"
                Icon={TrendingUp}
                delay={0}
              />
              <PhaseCard
                phase="Phase 2"
                title="During your break"
                headline={`Withdraw ₹${sustainableWithdrawal.toLocaleString('en-IN')}/month`}
                sub="Your corpus keeps growing"
                detail={`SWP from your ${formatINR(currentCorpus)} corpus — principal stays intact. Full annuity payout would be ₹${monthlyWithdrawal.toLocaleString('en-IN')}/month if you need more.`}
                bg="rgba(55,138,221,0.04)"
                border="rgba(55,138,221,0.15)"
                iconColor="#378ADD"
                Icon={Clock}
                delay={0.07}
              />
              <PhaseCard
                phase="Phase 3"
                title="After your break"
                headline={`Resume at ₹${resumeSIP.toLocaleString('en-IN')}/month`}
                sub="for 12 months, then drop back"
                detail={`Back on your original trajectory within 1 year of return. The 15% ramp covers the compounding you missed during the break.`}
                bg="rgba(29,158,117,0.04)"
                border="rgba(29,158,117,0.15)"
                iconColor="#1D9E75"
                Icon={RotateCcw}
                delay={0.14}
              />
            </div>

            {/* KINU message */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.25 }}
              className="rounded-2xl p-5 border flex items-start gap-4"
              style={{ background: 'rgba(192,241,142,0.03)', borderColor: 'rgba(192,241,142,0.12)' }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-display font-black text-[13px]"
                style={{ background: 'rgba(192,241,142,0.15)', color: '#c0f18e' }}
              >
                K
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-sans text-[11px] text-white/30 uppercase tracking-wider mb-1.5">KINU says</p>
                {kinuLoading ? (
                  <div className="space-y-2">
                    <div className="h-3 rounded-md animate-pulse w-full" style={{ background: 'rgba(255,255,255,0.06)' }} />
                    <div className="h-2.5 rounded-md animate-pulse w-3/4" style={{ background: 'rgba(255,255,255,0.06)' }} />
                  </div>
                ) : (
                  <p className="font-sans text-sm text-white/60 leading-relaxed">
                    {kinuMessage ?? 'Your break is a chapter, not the end. Every pause is followed by momentum.'}
                  </p>
                )}
              </div>
              <Zap className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Disclaimer */}
      <p className="font-sans text-[10px] text-white/20 text-center">
        Calculations assume 14% annual returns. Actual returns vary. For educational purposes only.
      </p>
    </section>
  )
}
