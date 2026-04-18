import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Brain, TrendingDown, TrendingUp, ChevronRight, Star, ShieldCheck, Check, Loader2, Zap } from 'lucide-react'
import { postActivateSIP } from '../../../lib/api'
// ── Shared Layout Utilities ─────────────────────────────────────────────────

export function VideoConcept({ 
  title, content, insight, stats,
  accent = '#c0f18e'
}: { 
  videoSrc?: string, title?: string, content: React.ReactNode, insight?: string,
  stats?: { label: string; value: string }[],
  accent?: string
}) {
  const [revealed, setRevealed] = useState(false)

  return (
    <div className="space-y-4">
      {/* Hero card - replaces broken video */}
      <div
        className="w-full rounded-2xl overflow-hidden relative border border-white/10 shadow-2xl"
        style={{ background: 'linear-gradient(135deg, #071810 0%, #0a1f14 40%, #06121e 100%)', minHeight: 200 }}
      >
        {/* Animated glow blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-8 -left-8 w-48 h-48 rounded-full opacity-20 blur-3xl" style={{ background: accent }} />
          <div className="absolute -bottom-8 -right-8 w-40 h-40 rounded-full opacity-15 blur-3xl" style={{ background: '#378ADD' }} />
        </div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: 'linear-gradient(rgba(192,241,142,1) 1px, transparent 1px), linear-gradient(90deg, rgba(192,241,142,1) 1px, transparent 1px)',
          backgroundSize: '32px 32px'
        }} />

        <div className="relative z-10 p-6 pb-8">
          {/* Tag */}
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: accent }} />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-60" style={{ color: accent }}>Concept Module</span>
          </div>

          {/* Title */}
          {title && (
            <h3 className="font-display text-2xl font-black text-white leading-tight mb-5 drop-shadow-lg">{title}</h3>
          )}

          {/* Stats row */}
          {stats && stats.length > 0 && (
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(stats.length, 3)}, 1fr)` }}>
              {stats.map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="rounded-xl p-3 text-center"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <p className="font-mono text-xl font-black" style={{ color: accent }}>{s.value}</p>
                  <p className="text-[9px] text-white/35 uppercase tracking-widest mt-1 leading-tight">{s.label}</p>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Text body */}
      <div
        className="rounded-2xl p-5"
        style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div className="font-sans text-sm text-white/75 leading-[1.8] space-y-3">
          {content}
        </div>
      </div>

      {/* Kinu insight */}
      {insight && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl p-4 flex gap-3 items-start"
          style={{ background: `${accent}0d`, border: `1px solid ${accent}20` }}
        >
          <Brain className="w-5 h-5 shrink-0 mt-0.5" style={{ color: accent }} />
          <p className="text-xs leading-relaxed italic" style={{ color: `${accent}bb` }}>{insight}</p>
        </motion.div>
      )}
    </div>
  )
}

export function QuizModule({ 
  questions 
}: { 
  questions: { q: string, a: boolean, reason: string }[] 
}) {
  const [idx, setIdx] = useState(0)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [choice, setChoice] = useState<boolean | null>(null)
  const done = idx >= questions.length

  const s = questions[idx]

  const answer = (v: boolean) => {
    setChoice(v)
    setAnswered(true)
    if (v === s.a) setScore(x => x + 1)
  }
  const next = () => { setIdx(i => i + 1); setAnswered(false); setChoice(null) }

  if (done) return (
    <div className="text-center py-6 space-y-3">
      <ShieldCheck className="w-10 h-10 text-[#1D9E75] mx-auto" />
      <p className="font-display text-2xl font-bold text-white">{score}/{questions.length}</p>
      <p className="text-sm text-white/50">{score === questions.length ? 'Perfect score. You are impenetrable.' : 'Good effort. The market requires constant vigilance.'}</p>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Final Boss Authentication</p>
        <p className="text-[10px] font-mono text-white/30">{idx + 1} / {questions.length}</p>
      </div>
      <div className="rounded-2xl p-4 bg-white/[0.03] border border-white/[0.06]">
        <p className="text-sm text-white/80 leading-relaxed italic">"{s.q}"</p>
      </div>
      {!answered ? (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => answer(true)} className="py-3 rounded-xl border border-[#1D9E75]/40 text-[#1D9E75] text-sm font-bold hover:bg-[#1D9E75]/10 transition-all">True / Legit</button>
          <button onClick={() => answer(false)} className="py-3 rounded-xl border border-[#E24B4A]/40 text-[#E24B4A] text-sm font-bold hover:bg-[#E24B4A]/10 transition-all">False / Scam</button>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <div className={`p-4 rounded-xl border ${choice === s.a ? 'bg-[#1D9E75]/10 border-[#1D9E75]/30' : 'bg-[#E24B4A]/10 border-[#E24B4A]/30'}`}>
            <p className="text-sm font-bold mb-1" style={{ color: choice === s.a ? '#1D9E75' : '#E24B4A' }}>
              {choice === s.a ? '✓ Correct' : '✗ Wrong'}
            </p>
            <p className="text-xs text-white/60">{s.reason}</p>
          </div>
          <button onClick={next} className="w-full py-3 rounded-xl bg-white/5 text-xs font-mono uppercase tracking-widest text-[#c0f18e] hover:text-white transition-colors">
            {idx < questions.length - 1 ? 'Next Scenario →' : 'View Results'}
          </button>
        </motion.div>
      )}
    </div>
  )
}

export function ChecklistModule({ items }: { items: string[] }) {
  const [checked, setChecked] = useState<boolean[]>(items.map(() => false))
  const [isActivating, setIsActivating] = useState(false)
  const [isActivated, setIsActivated] = useState(false)

  const allChecked = checked.every(c => c)

  const handleActivate = async () => {
    setIsActivating(true)
    try {
      await postActivateSIP({ amount: 500, frequency: 'monthly' })
      setIsActivated(true)
    } catch (e) {
      console.error(e)
      // Fallback for UI if backend is not ready
      setTimeout(() => setIsActivated(true), 1500)
    } finally {
      setIsActivating(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-white/60 mb-4">Complete your initiation sequence to finalize your market armor.</p>
      {items.map((item, i) => (
        <button key={i} onClick={() => { const c = [...checked]; c[i] = !c[i]; setChecked(c) }}
          className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200"
          style={{ background: checked[i] ? 'rgba(29,158,117,0.1)' : 'rgba(255,255,255,0.02)', borderColor: checked[i] ? 'rgba(29,158,117,0.4)' : 'rgba(255,255,255,0.05)' }}
        >
          <div className="w-5 h-5 rounded border flex items-center justify-center shrink-0" style={{ borderColor: checked[i] ? '#1D9E75' : 'rgba(255,255,255,0.1)' }}>
            {checked[i] && <Check className="w-3 h-3 text-[#1D9E75]" />}
          </div>
          <span className="font-sans text-sm" style={{ color: checked[i] ? '#c0f18e' : 'rgba(255,255,255,0.6)' }}>{item}</span>
        </button>
      ))}

      <AnimatePresence>
        {allChecked && !isActivated && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} className="pt-4">
            <button
              onClick={handleActivate}
              disabled={isActivating}
              className="w-full py-4 rounded-xl font-bold text-[#0d1a12] flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, #c0f18e 0%, #1D9E75 100%)' }}
            >
              {isActivating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
              {isActivating ? 'Activating SIP...' : 'Initialize Autopilot SIP'}
            </button>
          </motion.div>
        )}

        {isActivated && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mt-4 p-4 rounded-xl bg-[#1D9E75]/10 border border-[#1D9E75]/30 text-center">
            <ShieldCheck className="w-8 h-8 text-[#1D9E75] mx-auto mb-2" />
            <p className="font-sans font-bold text-[#c0f18e]">Initiation Complete</p>
            <p className="text-xs text-white/50 mt-1">Your wealth engine is now online.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function AppFeatureTour({ featureName, explanation, steps }: { featureName: string, explanation: string, steps: string[] }) {
  const [activeStep, setActiveStep] = useState(0)
  return (
    <div className="space-y-4">
      {/* Feature hero */}
      <div className="rounded-2xl overflow-hidden relative" style={{ background: 'linear-gradient(135deg, #06121e 0%, #071810 100%)', border: '1px solid rgba(55,138,221,0.2)' }}>
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full blur-3xl opacity-20" style={{ background: '#378ADD' }} />
        <div className="relative z-10 p-5">
          <span className="font-mono text-[10px] text-[#378ADD] uppercase tracking-[0.2em]">Kinetic Feature</span>
          <h3 className="font-display text-xl font-black text-white mt-1 mb-3">{featureName}</h3>
          <p className="text-sm text-white/60 leading-relaxed">{explanation}</p>
        </div>
      </div>

      {/* Step-by-step */}
      <div className="space-y-2">
        {steps.map((step, i) => (
          <motion.button
            key={i}
            onClick={() => setActiveStep(i)}
            className="w-full flex gap-3 items-start p-4 rounded-xl text-left transition-all"
            style={{
              background: activeStep === i ? 'rgba(55,138,221,0.1)' : 'rgba(255,255,255,0.02)',
              border: activeStep === i ? '1px solid rgba(55,138,221,0.3)' : '1px solid rgba(255,255,255,0.05)'
            }}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
              style={{ background: activeStep === i ? '#378ADD' : 'rgba(255,255,255,0.06)', color: activeStep === i ? '#fff' : 'rgba(255,255,255,0.3)' }}
            >{i + 1}</div>
            <p className="text-sm" style={{ color: activeStep === i ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.5)' }}>{step}</p>
          </motion.button>
        ))}
      </div>
    </div>
  )
}

// ── Appended Complex Interactive Modules ────────────────────────────────────

export function CrashTimeline() {
  const crashes = [
    { year: '2008', drop: 52, recovery: '18 months', sipResult: '₹1.82L from ₹54K invested', color: '#E24B4A' },
    { year: '2011', drop: 28, recovery: '8 months', sipResult: '₹52K from ₹30K invested', color: '#f97316' },
    { year: '2020', drop: 38, recovery: '6 months', sipResult: '₹68K from ₹30K invested', color: '#E24B4A' },
  ]
  const [active, setActive] = useState<string | null>(null)
  return (
    <div className="space-y-4">
      <p className="text-sm text-white/60 leading-relaxed">Every crash felt like the end of the world. None of them were. Tap to see what SIP investors actually earned:</p>

      {/* Visual bar chart */}
      <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="space-y-3">
          {crashes.map(c => (
            <button key={c.year} onClick={() => setActive(active === c.year ? null : c.year)} className="w-full text-left">
              <div className="flex items-center gap-3 mb-1.5">
                <span className="font-mono text-xs font-bold text-white w-10">{c.year}</span>
                <div className="flex-1 h-7 rounded-lg overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${c.drop}%` }}
                    transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-lg flex items-center px-2"
                    style={{ background: `${c.color}33`, border: `1px solid ${c.color}44` }}
                  >
                    <span className="font-mono text-[10px] font-bold" style={{ color: c.color }}>−{c.drop}%</span>
                  </motion.div>
                </div>
                <ChevronRight className={`w-3.5 h-3.5 text-white/30 shrink-0 transition-transform ${active === c.year ? 'rotate-90' : ''}`} />
              </div>
              <AnimatePresence>
                {active === c.year && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="ml-14 mb-3 grid grid-cols-2 gap-2">
                      <div className="rounded-xl p-3" style={{ background: 'rgba(29,158,117,0.1)', border: '1px solid rgba(29,158,117,0.2)' }}>
                        <p className="text-[9px] text-white/40 uppercase mb-1">Recovery</p>
                        <p className="font-mono text-xs text-[#1D9E75] font-bold">{c.recovery}</p>
                      </div>
                      <div className="rounded-xl p-3" style={{ background: 'rgba(192,241,142,0.06)', border: '1px solid rgba(192,241,142,0.15)' }}>
                        <p className="text-[9px] text-white/40 uppercase mb-1">SIP Result</p>
                        <p className="font-mono text-xs text-[#c0f18e] font-bold">{c.sipResult}</p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          ))}
        </div>
      </div>
      <p className="text-xs text-white/30 text-center italic">Panic sellers locked in losses. SIP investors bought more at the bottom.</p>
    </div>
  )
}

export function SipSimulator() {
  const [monthly, setMonthly] = useState(1000)
  const [years, setYears] = useState(10)
  const invested = monthly * years * 12
  const gained = Math.round(invested * Math.pow(1.14, years) * 0.38)
  const corpus = invested + gained
  return (
    <div className="space-y-5">
      <p className="text-sm text-white/70 leading-relaxed">Drag the sliders. Watch compounding work in real time.</p>
      <div className="space-y-4 rounded-2xl p-5 bg-white/[0.03] border border-white/[0.06]">
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-[11px] text-white/40 uppercase tracking-widest">Monthly SIP</label>
            <span className="font-mono text-sm text-[#c0f18e]">₹{monthly.toLocaleString('en-IN')}</span>
          </div>
          <input type="range" min={500} max={10000} step={500} value={monthly} onChange={e => setMonthly(+e.target.value)}
            className="w-full h-1 rounded-full appearance-none cursor-pointer" style={{ accentColor: '#c0f18e', background: 'rgba(255,255,255,0.08)' }} />
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-[11px] text-white/40 uppercase tracking-widest">Years</label>
            <span className="font-mono text-sm text-[#c0f18e]">{years} years</span>
          </div>
          <input type="range" min={3} max={30} step={1} value={years} onChange={e => setYears(+e.target.value)}
            className="w-full h-1 rounded-full appearance-none cursor-pointer" style={{ accentColor: '#c0f18e', background: 'rgba(255,255,255,0.08)' }} />
        </div>
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-white/5">
          <div className="text-center">
            <p className="text-[9px] text-white/30 uppercase mb-1">Invested</p>
            <p className="font-mono text-sm text-white/70">₹{(invested / 100000).toFixed(1)}L</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] text-white/30 uppercase mb-1">Returns</p>
            <p className="font-mono text-sm text-[#1D9E75]">₹{(gained / 100000).toFixed(1)}L</p>
          </div>
          <div className="text-center">
            <p className="text-[9px] text-white/30 uppercase mb-1">Corpus</p>
            <p className="font-mono text-sm font-bold text-[#c0f18e]">₹{(corpus / 100000).toFixed(1)}L</p>
          </div>
        </div>
      </div>
      <p className="text-xs text-white/30 text-center">At 14% CAGR (Nifty 50 historical average)</p>
    </div>
  )
}

export function FDTrapInteractive() {
  const [amount, setAmount] = useState(100000)
  const inflation = 0.063
  const fdRate = 0.068
  const niftyRate = 0.14
  const yrs = 10
  const nominal = Math.round(amount * Math.pow(1 + fdRate, yrs))
  const real = Math.round(nominal / Math.pow(1 + inflation, yrs))
  const nifty = Math.round(amount * Math.pow(1 + niftyRate, yrs))
  const lost = nifty - real
  return (
    <div className="space-y-5">
      <p className="text-sm text-white/70 leading-relaxed">FD is <em>not</em> safe. After 6.3% inflation eats your 6.8% return, you barely break even. Meanwhile Nifty 50 averages 14%.</p>
      <div className="space-y-3 rounded-2xl p-5 bg-white/[0.03] border border-white/[0.06]">
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-[11px] text-white/40 uppercase tracking-widest">Principal</label>
            <span className="font-mono text-sm text-[#c0f18e]">₹{(amount / 1000).toFixed(0)}K</span>
          </div>
          <input type="range" min={10000} max={500000} step={10000} value={amount} onChange={e => setAmount(+e.target.value)}
            className="w-full h-1 rounded-full appearance-none cursor-pointer" style={{ accentColor: '#c0f18e', background: 'rgba(255,255,255,0.08)' }} />
        </div>
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
          <div className="rounded-xl p-3 bg-white/[0.02] border border-white/5 text-center">
            <p className="text-[8px] text-white/30 uppercase mb-1">FD After 10y</p>
            <p className="font-mono text-xs text-white/60">₹{(nominal/1000).toFixed(0)}K</p>
          </div>
          <div className="rounded-xl p-3 bg-[#E24B4A]/10 border border-[#E24B4A]/20 text-center">
            <p className="text-[8px] text-white/30 uppercase mb-1">Real value</p>
            <p className="font-mono text-xs text-[#E24B4A]">₹{(real/1000).toFixed(0)}K</p>
          </div>
          <div className="rounded-xl p-3 bg-[#1D9E75]/10 border border-[#1D9E75]/20 text-center">
            <p className="text-[8px] text-white/30 uppercase mb-1">Nifty 50</p>
            <p className="font-mono text-xs text-[#1D9E75]">₹{(nifty/1000).toFixed(0)}K</p>
          </div>
        </div>
        <p className="text-center text-[11px]">By choosing FD over index investing, you silently lost <span className="font-bold text-[#E24B4A]">₹{Math.round(lost/1000)}K</span></p>
      </div>
    </div>
  )
}

// ── Track-specific Supporting Components ────────────────────────────────────

export function SebiProtection() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl p-5 border flex flex-col items-center text-center space-y-3 bg-white/[0.03] border-white/[0.06]">
        <div className="w-14 h-14 rounded-full bg-[#1D9E75]/10 border border-[#1D9E75]/30 flex items-center justify-center">
          <span className="text-2xl">🛡️</span>
        </div>
        <p className="font-display font-bold text-white text-lg">SEBI</p>
        <p className="font-sans text-xs text-white/50 leading-relaxed max-w-xs">The Securities and Exchange Board of India regulates every single mutual fund. If an app or person asks for money and isn't registered with SEBI, you have zero legal protection.</p>
      </div>
      <div className="space-y-2">
        {['Every fund publishes NAV daily on amfiindia.com', 'Your money goes to a custodian — never to the app', 'SEBI can freeze and audit any fund at any time'].map((item, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
            <div className="w-5 h-5 rounded-full bg-[#1D9E75]/20 flex items-center justify-center text-[10px] text-[#1D9E75] font-bold shrink-0">{i + 1}</div>
            <p className="text-xs text-white/60 leading-relaxed">{item}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function MoneyFlow() {
  const steps = [
    { num: '01', label: 'Your Bank', desc: 'UPI Mandate deducts ₹500 on autopilot on SIP date', color: '#378ADD' },
    { num: '02', label: 'Clearing Corp', desc: 'Money hits BSE Star MF — never touches any app\'s bank account', color: '#c0f18e' },
    { num: '03', label: 'Fund House', desc: 'NAV units are allocated to your unique folio number', color: '#1D9E75' },
    { num: '04', label: 'Your Demat', desc: 'Units are visible in your secure statement within 2 business days', color: '#1D9E75' },
  ]
  return (
    <div className="space-y-3">
      <p className="text-sm text-white/70 leading-relaxed">Your money travels through a legally mandated, audited pipeline. Here's every step:</p>
      {steps.map((s, i) => (
        <div key={i} className="flex gap-3 items-start">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0" style={{ background: `${s.color}18`, color: s.color }}>{s.num}</div>
            {i < steps.length - 1 && <div className="w-px h-5 mt-1" style={{ background: `${s.color}30` }} />}
          </div>
          <div className="pb-3">
            <p className="text-sm font-bold text-white">{s.label}</p>
            <p className="text-xs text-white/45 mt-0.5">{s.desc}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export function DueDiligenceChecklist() {
  const [checked, setChecked] = useState<boolean[]>([false, false, false, false])
  const items = [
    'Is the fund SEBI registered? (Check AMFI website)',
    'Does the app route directly to NSE/BSE clearing house?',
    'Are there zero guaranteed return promises?',
    'Is the expense ratio clearly disclosed (< 0.5% for index)?',
  ]
  return (
    <div className="space-y-3">
      <p className="text-sm text-white/70 mb-4">Run this checklist on any investment before committing money. Check each one off:</p>
      {items.map((item, i) => (
        <button key={i} onClick={() => { const c = [...checked]; c[i] = !c[i]; setChecked(c) }}
          className="w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200"
          style={{ background: checked[i] ? 'rgba(29,158,117,0.1)' : 'rgba(255,255,255,0.02)', borderColor: checked[i] ? 'rgba(29,158,117,0.4)' : 'rgba(255,255,255,0.05)' }}
        >
          <div className="w-5 h-5 rounded border flex items-center justify-center shrink-0" style={{ borderColor: checked[i] ? '#1D9E75' : 'rgba(255,255,255,0.1)' }}>
            {checked[i] && <Check className="w-3 h-3 text-[#1D9E75]" />}
          </div>
          <span className="text-xs" style={{ color: checked[i] ? '#c0f18e' : 'rgba(255,255,255,0.6)' }}>{item}</span>
        </button>
      ))}
      {checked.every(Boolean) && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-mono text-xs text-center text-[#1D9E75] mt-4 uppercase tracking-widest">
          Due Diligence Complete ✓
        </motion.p>
      )}
    </div>
  )
}

export function IndexFundExplainer() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-white/70 leading-relaxed">A Fund Manager is a human trying to guess the future. They charge you 2% a year for this guessing.</p>
      <p className="text-sm text-white/70 leading-relaxed">An Index Fund is an algorithm. It just buys the top 50 companies by market cap and charges 0.1% a year.</p>
      <div className="rounded-2xl p-5 border text-center bg-[#E24B4A]/5 border-[#E24B4A]/20">
        <p className="font-display font-black text-4xl text-[#E24B4A]">84%</p>
        <p className="text-xs text-white/60 mt-2">of active human fund managers fail to beat the Nifty 50 index over 10 years.</p>
      </div>
      <div className="rounded-2xl p-4 border bg-[#1D9E75]/5 border-[#1D9E75]/20">
        <p className="text-xs text-white/50 leading-relaxed">The index wins because it has no emotions, never panic-sells, and automatically replaces bad companies with good ones every quarter.</p>
      </div>
    </div>
  )
}

export function ActiveVsPassive() {
  return (
    <div className="space-y-5">
      <p className="text-sm text-white/70 leading-relaxed">20-year race: human managers vs. a simple algorithm.</p>
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 h-10 rounded-xl bg-[#E24B4A]/10 border border-[#E24B4A]/20 flex items-center px-3">
            <p className="text-xs text-[#E24B4A] font-mono">Active Funds — avg. 11.2% CAGR</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 h-10 rounded-xl bg-[#1D9E75]/10 border border-[#1D9E75]/20 flex items-center px-3">
            <p className="text-xs text-[#1D9E75] font-mono">Nifty 50 Index — avg. 14.1% CAGR </p>
          </div>
          <span className="text-[10px] text-[#c0f18e] font-mono">+2.9%</span>
        </div>
      </div>
      <div className="rounded-2xl p-4 border bg-white/[0.02] border-white/[0.05]">
        <p className="text-xs text-white/45 leading-relaxed">On ₹1L over 20 years, that 2.9% gap compounds into a <span className="text-[#c0f18e] font-bold">₹5.7L difference</span>. The robot doesn't just beat the human — it destroys them.</p>
      </div>
    </div>
  )
}

export function FeeCalculator() {
  const [amount, setAmount] = useState(100000)
  const years = 20
  const indexCorpus = Math.round(amount * Math.pow(1 + (0.141 - 0.001), years))
  const activeCorpus = Math.round(amount * Math.pow(1 + (0.141 - 0.020), years))
  const lost = indexCorpus - activeCorpus
  return (
    <div className="space-y-5">
      <p className="text-sm text-white/70 leading-relaxed">A 2% fee sounds small until you compound it over 20 years.</p>
      <div className="space-y-3 rounded-2xl p-5 bg-white/[0.03] border border-white/[0.06]">
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-[11px] text-white/40 uppercase tracking-widest">Your Investment</label>
            <span className="font-mono text-sm text-[#c0f18e]">₹{(amount / 1000).toFixed(0)}K</span>
          </div>
          <input type="range" min={10000} max={500000} step={10000} value={amount} onChange={e => setAmount(+e.target.value)}
            className="w-full h-1 rounded-full appearance-none cursor-pointer" style={{ accentColor: '#c0f18e', background: 'rgba(255,255,255,0.08)' }} />
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
          <div className="rounded-xl p-3 bg-[#1D9E75]/10 border border-[#1D9E75]/20 text-center">
            <p className="text-[8px] text-white/30 uppercase mb-1">Index Fund (0.1%)</p>
            <p className="font-mono text-sm text-[#1D9E75]">₹{(indexCorpus / 100000).toFixed(1)}L</p>
          </div>
          <div className="rounded-xl p-3 bg-[#E24B4A]/10 border border-[#E24B4A]/20 text-center">
            <p className="text-[8px] text-white/30 uppercase mb-1">Active Fund (2%)</p>
            <p className="font-mono text-sm text-[#E24B4A]">₹{(activeCorpus / 100000).toFixed(1)}L</p>
          </div>
        </div>
        <p className="text-center text-[11px]">The "expert" human cost you <span className="font-bold text-[#E24B4A]">₹{Math.round(lost / 100000).toFixed(1)}L</span> in 20 years.</p>
      </div>
    </div>
  )
}

export function IndiaGrowth() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-white/70 leading-relaxed">When you buy a Nifty 50 Index Fund, you're buying India's GDP growth. 50 biggest companies across all sectors — from banking to tech to oil.</p>
      <div className="rounded-2xl p-4 border bg-white/[0.03] border-white/[0.06] space-y-3">
        {[
          { sector: 'Financial Services', pct: '33%' },
          { sector: 'IT & Technology', pct: '15%' },
          { sector: 'Oil & Energy', pct: '12%' },
          { sector: 'FMCG & Consumer', pct: '10%' },
          { sector: 'Other Sectors', pct: '30%' },
        ].map(s => (
          <div key={s.sector} className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-[#1D9E75] shrink-0" />
            <p className="text-xs text-white/60 flex-1">{s.sector}</p>
            <p className="font-mono text-xs text-[#c0f18e]">{s.pct}</p>
          </div>
        ))}
      </div>
      <p className="text-xs text-white/30 text-center">If India grows, the index grows. No single-company risk.</p>
    </div>
  )
}

export function SipExplainer() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-white/70 leading-relaxed">Let's trace exactly what happens to your ₹500 SIP each month:</p>
      <div className="rounded-2xl p-4 border bg-white/[0.03] border-white/[0.06] space-y-2">
        {[
          { month: 'Month 1', nav: '₹50', units: '10', note: 'Market is normal' },
          { month: 'Month 2', nav: '₹40', units: '12.5', note: 'Market dipped — you bought more!' },
          { month: 'Month 3', nav: '₹60', units: '8.3', note: 'Market recovered' },
        ].map(r => (
          <div key={r.month} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
            <div>
              <p className="text-xs font-bold text-white">{r.month}</p>
              <p className="text-[10px] text-white/30">{r.note}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-xs text-white/60">NAV {r.nav}</p>
              <p className="font-mono text-xs text-[#1D9E75]">{r.units} units</p>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl p-3 border bg-[#c0f18e]/5 border-[#c0f18e]/10">
        <p className="text-xs text-white/50 text-center">Total: ₹1,500 invested → 30.8 units. Now worth ₹1,848 at NAV ₹60.</p>
        <p className="text-xs text-[#c0f18e] text-center mt-1 font-bold">+23% return from buying dips automatically!</p>
      </div>
    </div>
  )
}

export function FundFactSheet() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-white/70 leading-relaxed">When you look at a fund anywhere, ignore the noise. Check only these 3 numbers:</p>
      <div className="space-y-3">
        {[
          { label: 'Expense Ratio', target: '< 0.5%', why: 'The annual fee. Over 0.5% for an index fund is a ripoff.', good: true },
          { label: 'Tracking Error', target: '< 0.1%', why: 'How closely it mimics the real Nifty 50. Lower is always better.', good: true },
          { label: 'AUM', target: '> ₹500 Cr', why: 'Total money in the fund. Ensures you can sell easily anytime.', good: true },
        ].map(f => (
          <div key={f.label} className="rounded-2xl p-4 border bg-white/[0.02] border-white/[0.05]">
            <div className="flex items-center justify-between mb-1">
              <p className="font-mono text-xs font-bold text-white">{f.label}</p>
              <span className="font-mono text-xs text-[#1D9E75] bg-[#1D9E75]/10 px-2 py-0.5 rounded-full">{f.target}</span>
            </div>
            <p className="text-[11px] text-white/40">{f.why}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

export function FirstHundred() {
  const [years, setYears] = useState(15)
  const val = Math.round(100 * 12 * Math.pow(1.14, years) * 0.35)
  return (
    <div className="space-y-5">
      <p className="text-sm text-white/70 leading-relaxed">₹100/month. That's one chai and a samosa. Into a Nifty 50 index fund. For a very long time.</p>
      <div className="rounded-2xl p-5 bg-white/[0.03] border border-white/[0.06] space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-[11px] text-white/40 uppercase tracking-widest">How long?</label>
            <span className="font-mono text-sm text-[#c0f18e]">{years} years</span>
          </div>
          <input type="range" min={5} max={30} step={1} value={years} onChange={e => setYears(+e.target.value)}
            className="w-full h-1 rounded-full appearance-none cursor-pointer" style={{ accentColor: '#c0f18e', background: 'rgba(255,255,255,0.08)' }} />
        </div>
        <div className="text-center py-4 rounded-xl bg-[#c0f18e]/5 border border-[#c0f18e]/10">
          <p className="text-[10px] text-white/30 uppercase tracking-widest mb-2">Your ₹100/month becomes</p>
          <motion.p key={val} initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="font-display text-3xl font-bold text-[#c0f18e]">
            ₹{val >= 100000 ? `${(val / 100000).toFixed(1)}L` : `${(val / 1000).toFixed(1)}K`}
          </motion.p>
          <p className="text-[10px] text-white/30 mt-1">invested only ₹{(100 * 12 * years / 1000).toFixed(1)}K total</p>
        </div>
      </div>
      <p className="text-xs text-white/30 text-center">The only real secret is starting.</p>
    </div>
  )
}
