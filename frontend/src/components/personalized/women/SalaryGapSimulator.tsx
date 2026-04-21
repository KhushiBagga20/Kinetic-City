import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../../store/useAppStore'
import { formatINR } from '../../../lib/formatINR'

/* ── Constants ────────────────────────────────────────────────────────────── */

const INDUSTRY_GAPS: Record<string, { gap: number; label: string }> = {
  it_software:   { gap: 0.28, label: 'IT / Software' },
  banking:       { gap: 0.34, label: 'Banking & Finance' },
  healthcare:    { gap: 0.22, label: 'Healthcare' },
  education:     { gap: 0.18, label: 'Education' },
  retail:        { gap: 0.31, label: 'Retail' },
  manufacturing: { gap: 0.26, label: 'Manufacturing' },
  government:    { gap: 0.12, label: 'Government / PSU' },
  other:         { gap: 0.25, label: 'Other' },
}

/* ── Calculation helpers ──────────────────────────────────────────────────── */

function sipFV(monthly: number, rate: number, years: number): number {
  const r = rate / 12
  const n = years * 12
  return monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r)
}

/* ── Component ────────────────────────────────────────────────────────────── */

export default function SalaryGapSimulator() {
  const addGoal = useAppStore(s => s.addGoal)
  const monthlyAmount = useAppStore(s => s.monthlyAmount)

  const [salary, setSalary]             = useState(monthlyAmount > 0 ? monthlyAmount : 50000)
  const [industry, setIndustry]         = useState('it_software')
  const [yearsToRetire, setYearsToRetire] = useState(25)
  const [calculated, setCalculated]     = useState(false)
  const [goalAdded, setGoalAdded]       = useState(false)

  /* ── Derived ─────────────────────────────────────────────────────────────── */

  const { gapPct, herCorpus, hisCorpus, herSIP, hisSIP, corpusGap, extraSIPNeeded } =
    useMemo(() => {
      const gapPct     = INDUSTRY_GAPS[industry]?.gap ?? 0.25
      const maleSalary = salary * (1 + gapPct)
      const herSIP     = salary * 0.10
      const hisSIP     = maleSalary * 0.10
      const herCorpus  = sipFV(herSIP, 0.14, yearsToRetire)
      const hisCorpus  = sipFV(hisSIP, 0.14, yearsToRetire)
      const corpusGap  = hisCorpus - herCorpus

      // Solve for extra SIP needed: sipFV(herSIP + extra, 0.14, years) = hisCorpus
      const sipMultiplier  = sipFV(1, 0.14, yearsToRetire)
      const extraSIPNeeded = Math.round(corpusGap / sipMultiplier)

      return { gapPct, herCorpus, hisCorpus, herSIP, hisSIP, corpusGap, extraSIPNeeded }
    }, [salary, industry, yearsToRetire])

  /* ── Handlers ───────────────────────────────────────────────────────────── */

  const handleCalculate = () => setCalculated(true)

  const handleSetGoal = () => {
    addGoal({
      name: 'Close the salary gap',
      targetAmount: hisCorpus,
      targetYears: yearsToRetire,
      category: 'other',
      linkedSIPAmount: Math.round(herSIP + extraSIPNeeded),
    })
    setGoalAdded(true)
  }

  /* ── Row animation config ───────────────────────────────────────────────── */

  const rowAnim = (i: number) => ({
    initial:    { opacity: 0, y: 20 },
    animate:    { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  })

  /* ── Render ─────────────────────────────────────────────────────────────── */

  return (
    <div
      className="rounded-2xl border p-5"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {/* Header */}
      <div className="mb-5">
        <h2 className="font-display font-bold text-xl text-white">
          Salary Gap Simulator
        </h2>
        <p className="text-white/40 text-sm mt-1">
          The pay gap has a rupee amount. See yours.
        </p>
      </div>

      {/* Inputs card */}
      <div
        className="rounded-xl p-4 space-y-5 mb-4"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}
      >
        {/* Monthly salary */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="font-sans text-xs text-white/40">Your monthly salary</p>
            <p className="font-mono text-base text-white font-semibold">
              {formatINR(salary)}
            </p>
          </div>
          <input
            type="range"
            min={10000}
            max={200000}
            step={5000}
            value={salary}
            onChange={e => { setSalary(Number(e.target.value)); setCalculated(false); setGoalAdded(false) }}
            className="w-full accent-[var(--accent)] cursor-pointer"
          />
          <div className="flex justify-between mt-1">
            <span className="font-sans text-[9px] text-white/15">₹10K</span>
            <span className="font-sans text-[9px] text-white/15">₹2L</span>
          </div>
        </div>

        {/* Industry */}
        <div>
          <p className="font-sans text-xs text-white/40 mb-2">Your industry</p>
          <select
            value={industry}
            onChange={e => { setIndustry(e.target.value); setCalculated(false); setGoalAdded(false) }}
            className="w-full rounded-lg px-3 py-2 text-sm font-sans text-white/80 cursor-pointer"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid var(--border)',
              outline: 'none',
            }}
          >
            {Object.entries(INDUSTRY_GAPS).map(([key, { label }]) => (
              <option key={key} value={key} style={{ background: '#0e1a0e', color: '#fff' }}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Years to retirement */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="font-sans text-xs text-white/40">Years to retirement</p>
            <p className="font-mono text-base text-white font-semibold">
              {yearsToRetire} yrs
            </p>
          </div>
          <input
            type="range"
            min={10}
            max={35}
            step={1}
            value={yearsToRetire}
            onChange={e => { setYearsToRetire(Number(e.target.value)); setCalculated(false); setGoalAdded(false) }}
            className="w-full accent-[var(--accent)] cursor-pointer"
          />
          <div className="flex justify-between mt-1">
            <span className="font-sans text-[9px] text-white/15">10 yrs</span>
            <span className="font-sans text-[9px] text-white/15">35 yrs</span>
          </div>
        </div>

        {/* CTA */}
        <button
          onClick={handleCalculate}
          className="w-full py-3 rounded-full font-sans font-bold text-sm transition-all duration-150 active:scale-[0.97]"
          style={{ background: 'var(--accent)', color: '#0a1a00' }}
        >
          Calculate my gap
        </button>
      </div>

      {/* Results */}
      <AnimatePresence>
        {calculated && (
          <div className="space-y-3">
            {/* ROW 1 — Side-by-side corpus comparison */}
            <motion.div
              key="row1"
              {...rowAnim(0)}
              className="grid grid-cols-2 gap-3"
            >
              {/* Her column */}
              <div
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(192,241,142,0.04)',
                  border: '1px solid rgba(192,241,142,0.15)',
                }}
              >
                <p className="font-sans text-[11px] text-white/40 mb-1">
                  Your corpus at retirement
                </p>
                <p
                  className="font-display font-bold text-lg leading-tight"
                  style={{ color: '#c0f18e' }}
                >
                  {formatINR(herCorpus)}
                </p>
                <p className="font-sans text-[10px] text-white/30 mt-1">
                  {formatINR(herSIP)}/month SIP
                </p>
              </div>

              {/* His column */}
              <div
                className="rounded-xl p-4"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                }}
              >
                <p className="font-sans text-[11px] text-white/40 mb-1">
                  Male peer's corpus
                </p>
                <p className="font-display font-bold text-lg text-white leading-tight">
                  {formatINR(hisCorpus)}
                </p>
                <p className="font-sans text-[10px] text-white/30 mt-1">
                  {formatINR(hisSIP)}/month SIP
                </p>
                <p className="font-sans text-[9px] mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>
                  {Math.round(gapPct * 100)}% higher salary
                </p>
              </div>
            </motion.div>

            {/* ROW 2 — Gap card */}
            <motion.div
              key="row2"
              {...rowAnim(1)}
              className="rounded-xl p-4"
              style={{
                background: 'rgba(255,60,60,0.05)',
                border: '1px solid rgba(255,60,60,0.18)',
              }}
            >
              <p
                className="font-display font-bold text-2xl mb-1"
                style={{ color: '#ff6060' }}
              >
                −{formatINR(corpusGap)}
              </p>
              <p className="font-sans text-sm text-white/60 font-semibold mb-2">
                Retirement corpus gap
              </p>
              <p className="font-sans text-xs text-white/35 leading-relaxed">
                Not because you invested differently.{' '}
                Because you were paid less.
              </p>
            </motion.div>

            {/* ROW 3 — Action card */}
            <motion.div
              key="row3"
              {...rowAnim(2)}
              className="rounded-xl p-4"
              style={{
                background: 'rgba(192,241,142,0.04)',
                border: '2px solid rgba(192,241,142,0.3)',
              }}
            >
              <p className="font-sans text-xs text-white/50 mb-1">Close the gap anyway</p>
              <p
                className="font-display font-bold text-2xl mb-1"
                style={{ color: '#c0f18e' }}
              >
                +{formatINR(extraSIPNeeded)}/month
              </p>
              <p className="font-sans text-xs text-white/35 leading-relaxed mb-4">
                Add this to your SIP. In {yearsToRetire} years, your corpus matches
                your male peer's — regardless of what he earns.
              </p>

              <AnimatePresence mode="wait">
                {!goalAdded ? (
                  <motion.button
                    key="set-goal-btn"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    onClick={handleSetGoal}
                    className="w-full py-2.5 rounded-full font-sans font-bold text-sm transition-all duration-150 active:scale-[0.97]"
                    style={{ background: 'var(--accent)', color: '#0a1a00' }}
                  >
                    Set this as a goal →
                  </motion.button>
                ) : (
                  <motion.div
                    key="goal-added"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.25 }}
                    className="w-full py-2.5 rounded-full font-sans font-bold text-sm text-center"
                    style={{ background: 'rgba(192,241,142,0.12)', color: '#c0f18e', border: '1px solid rgba(192,241,142,0.25)' }}
                  >
                    ✓ Goal added to your dashboard
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom disclaimer */}
      <p className="font-sans text-[9px] text-white/20 mt-4 leading-relaxed">
        Gap percentages from India's National Sample Survey and ILO India gender wage gap report.
        Calculations at 14% CAGR for educational purposes only.
      </p>
    </div>
  )
}
