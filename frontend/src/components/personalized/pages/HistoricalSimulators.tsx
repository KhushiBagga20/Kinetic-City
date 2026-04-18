import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { FlaskConical, Sprout, ArrowRight } from 'lucide-react'

const SANDBOX_YEARS = [
  { label: '2020–21 (COVID)', fy: '2020-21' },
  { label: '2008–09 (GFC)', fy: '2008-09' },
  { label: '2021–22 (+70%)', fy: '2021-22' },
]

const HARVEST_ERAS = [
  { label: 'April 2015 (Pre-bull)', year: 2015 },
  { label: 'April 2019 (Pre-COVID)', year: 2019 },
  { label: 'April 2010 (Post-crash)', year: 2010 },
]

export default function HistoricalSimulators() {
  const navigate = useNavigate()

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl mx-auto"
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-10"
      >
        <h1 className="font-display font-bold text-3xl md:text-4xl text-white tracking-tight mb-3">
          Historical Simulators
        </h1>
        <p className="font-sans text-sm text-white/40 max-w-lg leading-relaxed">
          Real market data. Virtual money. Zero risk. Pick a tool and see what history actually did.
        </p>
      </motion.div>

      {/* Two cards side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">

        {/* Card 1 — Sandbox */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="rounded-3xl p-7 border flex flex-col"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            borderLeft: '3px solid var(--accent)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <FlaskConical className="w-5 h-5" style={{ color: 'var(--accent)' }} />
            <h2 className="font-display font-medium text-xl text-white">Sandbox</h2>
          </div>
          <p className="font-sans text-sm text-white/50 leading-relaxed mb-6">
            Pick any year. Allocate ₹50,000. See what history gave back.
          </p>

          {/* Year shortcut pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {SANDBOX_YEARS.map(y => (
              <button
                key={y.fy}
                onClick={() => navigate('/dashboard/sandbox')}
                className="px-3 py-1.5 rounded-full font-sans text-xs border transition-[background-color,border-color] duration-200 hover:border-white/15"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'var(--border)', color: 'rgba(255,255,255,0.5)' }}
              >
                {y.label}
              </button>
            ))}
          </div>

          <div className="mt-auto">
            <button
              onClick={() => navigate('/dashboard/sandbox')}
              className="w-full py-3.5 rounded-full font-sans font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform duration-200"
              style={{ background: '#EF9F27', color: '#1a1000' }}
            >
              Enter the Sandbox <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Card 2 — Harvest Room */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="rounded-3xl p-7 border flex flex-col"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            borderLeft: '3px solid #1D9E75',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <Sprout className="w-5 h-5" style={{ color: '#1D9E75' }} />
            <h2 className="font-display font-medium text-xl text-white">Harvest Room</h2>
          </div>
          <p className="font-sans text-sm text-white/50 leading-relaxed mb-6">
            Choose your era. Plant your money. See what history grew.
          </p>

          {/* Era shortcut pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {HARVEST_ERAS.map(e => (
              <button
                key={e.year}
                onClick={() => navigate('/dashboard/harvest')}
                className="px-3 py-1.5 rounded-full font-sans text-xs border transition-[background-color,border-color] duration-200 hover:border-white/15"
                style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'var(--border)', color: 'rgba(255,255,255,0.5)' }}
              >
                {e.label}
              </button>
            ))}
          </div>

          <div className="mt-auto">
            <button
              onClick={() => navigate('/dashboard/harvest')}
              className="w-full py-3.5 rounded-full font-sans font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.97] transition-transform duration-200"
              style={{ background: '#1D9E75', color: '#001a10' }}
            >
              Enter the Harvest Room <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </div>

      {/* What's the difference? */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="rounded-3xl p-7 border"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        <h3 className="font-display font-semibold text-base text-white mb-5">What's the difference?</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FlaskConical className="w-4 h-4" style={{ color: 'var(--accent)' }} />
              <p className="font-sans text-sm font-medium text-white/70">Sandbox</p>
            </div>
            <p className="font-sans text-sm text-white/40 leading-relaxed">
              You get ₹50,000 virtual money. You allocate it across asset classes for a specific financial year. You see what actually happened to each allocation month by month. <span className="text-white/60">Best for: learning how different assets behave in different market conditions.</span>
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sprout className="w-4 h-4" style={{ color: '#1D9E75' }} />
              <p className="font-sans text-sm font-medium text-white/70">Harvest Room</p>
            </div>
            <p className="font-sans text-sm text-white/40 leading-relaxed">
              You choose any starting date and run a full multi-year simulation. SIP, lump sum, or freestyle. You see the full arc of your money over years or decades. <span className="text-white/60">Best for: understanding long-term compounding and your own investing behaviour.</span>
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
