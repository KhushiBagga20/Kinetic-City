import { useState } from 'react'
import { Toggle } from '../pages/ProfilePage'
import { formatINR } from '../../../lib/formatINR'

export default function LongevityRetirement() {
  const [currentAge, setCurrentAge] = useState(28)
  const [retireAge, setRetireAge] = useState(60)
  const [monthlyExpenses, setMonthlyExpenses] = useState(40000)
  const [longevityOn, setLongevityOn] = useState(true)

  const FEMALE_EXTRA_YEARS = 5.4
  const INFLATION = 0.058
  const RETURN_RATE = 0.14
  const WITHDRAWAL_RATE = 0.06

  const yearsToRetire = retireAge - currentAge
  const standardRetirementYears = 25
  const adjustedRetirementYears = longevityOn 
    ? standardRetirementYears + FEMALE_EXTRA_YEARS 
    : standardRetirementYears
  
  const futureExpenses = monthlyExpenses * Math.pow(1 + INFLATION, yearsToRetire)
  
  const r = WITHDRAWAL_RATE / 12
  const n = adjustedRetirementYears * 12
  const corpusNeeded = futureExpenses * ((1 - Math.pow(1+r, -n)) / r)
  
  const sipR = RETURN_RATE / 12
  const sipN = yearsToRetire * 12
  const monthlySIP = Math.round(
    corpusNeeded / (((Math.pow(1+sipR, sipN)-1)/sipR) * (1+sipR))
  )
  
  const standardN = standardRetirementYears * 12
  const standardCorpus = futureExpenses * ((1 - Math.pow(1+r, -standardN)) / r)
  const longevityExtra = corpusNeeded - standardCorpus
  const standardMonthlySIP = Math.round(
    standardCorpus / (((Math.pow(1+sipR, sipN)-1)/sipR) * (1+sipR))
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-white font-display font-bold text-xl">Your Retirement, Honestly</h2>
        <p className="text-white/40 text-sm mt-1">Adjusted for how long you'll actually live.</p>
      </div>

      {/* Inputs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl p-4 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <label className="text-white/50 text-xs uppercase tracking-wider font-bold mb-3 block">Current Age</label>
          <input type="range" min="20" max="50" value={currentAge} onChange={e => setCurrentAge(parseInt(e.target.value))} className="w-full accent-[#c0f18e] mb-2" />
          <div className="text-white font-medium">{currentAge} years</div>
        </div>
        <div className="rounded-2xl p-4 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <label className="text-white/50 text-xs uppercase tracking-wider font-bold mb-3 block">Retirement Age</label>
          <input type="range" min="50" max="65" value={retireAge} onChange={e => setRetireAge(parseInt(e.target.value))} className="w-full accent-[#c0f18e] mb-2" />
          <div className="text-white font-medium">{retireAge} years</div>
        </div>
        <div className="rounded-2xl p-4 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <label className="text-white/50 text-xs uppercase tracking-wider font-bold mb-3 block">Monthly Expenses</label>
          <input type="range" min="10000" max="200000" step="5000" value={monthlyExpenses} onChange={e => setMonthlyExpenses(parseInt(e.target.value))} className="w-full accent-[#c0f18e] mb-2" />
          <div className="text-white font-medium">{formatINR(monthlyExpenses)}</div>
        </div>
      </div>

      {/* Toggle */}
      <div className="flex items-center justify-between p-4 rounded-2xl border transition-colors"
        style={{ borderColor: longevityOn ? 'rgba(192,241,142,0.3)' : 'var(--border)', background: 'var(--surface)' }}>
        <div>
          <p className="text-white text-[14px] font-medium">Longevity adjustment</p>
          <p className="text-white/40 text-[12px] mt-0.5">Women live 5.4 years longer on average (WHO India 2023)</p>
        </div>
        <Toggle on={longevityOn} onChange={setLongevityOn} />
      </div>

      {/* Main Corpus Card */}
      <div className="rounded-3xl p-8 border text-center"
        style={{ background: 'rgba(192,241,142,0.05)', borderColor: 'rgba(192,241,142,0.15)' }}>
        <p className="text-[#c0f18e]/70 text-sm font-bold uppercase tracking-wider mb-2">Corpus you need</p>
        <p className="font-display font-bold text-4xl text-[#c0f18e] mb-2">{formatINR(corpusNeeded)}</p>
        <p className="text-white/40 text-sm">for {Math.round(adjustedRetirementYears)} years of retirement</p>
      </div>

      {/* Extra Card */}
      {longevityOn && (
        <div className="rounded-2xl p-4 border"
          style={{ background: 'rgba(239,159,39,0.05)', borderColor: 'rgba(239,159,39,0.2)' }}>
          <p className="text-[#EF9F27] text-sm mb-1">Because of longevity adjustment:</p>
          <p className="text-[#EF9F27] font-bold text-lg mb-1">+{formatINR(longevityExtra)} more than standard calculators show</p>
          <p className="text-[#EF9F27]/60 text-xs">This is what they don't tell you.</p>
        </div>
      )}

      {/* SIP Card */}
      <div className="rounded-3xl p-6 border flex flex-col md:flex-row items-center justify-between gap-4"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div>
          <p className="text-white/50 text-xs uppercase tracking-wider font-bold mb-1">Monthly SIP needed starting today</p>
          <p className="text-white font-display font-bold text-2xl">₹{monthlySIP.toLocaleString('en-IN')}</p>
        </div>
        <button 
          onClick={() => {
            // In a real app this would call addGoal
            alert(`Goal set: Retirement in ${yearsToRetire} years with ₹${monthlySIP.toLocaleString('en-IN')}/mo SIP`)
          }}
          className="w-full md:w-auto px-6 py-3 rounded-xl text-sm font-bold transition-transform hover:scale-[1.02] whitespace-nowrap"
          style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}
        >
          Set this as my retirement goal →
        </button>
      </div>

      {/* Bottom Fact */}
      <p className="text-white/30 text-xs leading-relaxed max-w-2xl mx-auto text-center mt-6">
        Standard retirement calculators plan for 25 years. Your plan accounts for {Math.round(adjustedRetirementYears)} years.
        The difference is {formatINR(longevityExtra)} — and it's ₹{(monthlySIP - standardMonthlySIP).toLocaleString('en-IN')}/month starting today.
      </p>
    </div>
  )
}
