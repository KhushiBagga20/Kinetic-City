import { motion } from 'framer-motion'
import { FlaskConical, Sparkles, Hourglass, ArrowRight, Zap } from 'lucide-react'

export default function FeatureModules() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full">

      {/* ── Sandbox Simulation ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.35, ease: 'easeOut' as const }}
        className="bg-[#071a1f] border border-white/[0.06] hover:border-white/10 transition-colors rounded-3xl p-7 flex flex-col justify-between min-h-[280px] group cursor-pointer"
      >
        <div>
          <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/[0.06] flex items-center justify-center mb-6">
            <FlaskConical className="w-5 h-5 text-[#c0f18e]" />
          </div>
          <h3 className="font-display text-xl text-white font-medium mb-3 tracking-tight">
            Sandbox Simulation
          </h3>
          <p className="font-sans text-[13px] text-white/40 leading-relaxed">
            Test complex strategies with zero risk using our institutional market engine.
          </p>
        </div>

        <div className="flex items-center text-[9px] font-sans font-black tracking-[0.2em] text-[#c0f18e] mt-6 uppercase">
          Initialize Session
          <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1.5 transition-transform duration-200" />
        </div>
      </motion.div>

      {/* ── AI Intelligence Summary (lime inverse card) ──────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.45, ease: 'easeOut' as const }}
        className="bg-[#c0f18e] rounded-3xl p-7 flex flex-col justify-between min-h-[280px] relative overflow-hidden"
      >
        {/* Highlight streak */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-white/25 rounded-full blur-2xl" />

        <div>
          <div className="flex justify-between items-start mb-6">
            <div className="w-10 h-10 rounded-2xl bg-[#0a2000]/10 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-[#0a2000]" />
            </div>
            <span className="bg-[#0a2000]/10 text-[#0a2000] text-[8px] font-black tracking-[0.2em] px-2.5 py-1 rounded-md">
              LIVE AI
            </span>
          </div>

          <h3 className="font-display text-xl font-bold text-[#061000] mb-4 tracking-tight">
            AI Intelligence Summary
          </h3>

          <div className="border-l-[2px] border-[#0a2000]/20 pl-4">
            <p className="font-sans text-[13px] text-[#0a2000]/75 leading-relaxed font-medium">
              "Your concentration in Small Caps is 12% above benchmark. Recommend hedging with Large Cap Value."
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#0a2000]/15">
          <span className="text-[9px] font-sans font-black tracking-[0.15em] text-[#0a2000]/55 uppercase">
            Health Score: 94/100
          </span>
          <Zap className="w-4 h-4 text-[#0a2000]/55" />
        </div>
      </motion.div>

      {/* ── Time Harvest Machine ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.55, ease: 'easeOut' as const }}
        className="bg-[#071a1f] border border-white/[0.06] hover:border-white/10 transition-colors rounded-3xl p-7 flex flex-col justify-between min-h-[280px] group cursor-pointer"
      >
        <div>
          <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/[0.06] flex items-center justify-center mb-6">
            <Hourglass className="w-5 h-5 text-[#c0f18e]" />
          </div>
          <h3 className="font-display text-xl text-white font-medium mb-3 tracking-tight">
            Time Harvest Machine
          </h3>
          <p className="font-sans text-[13px] text-white/40 leading-relaxed">
            Visualize 30-year projections with dynamic compounding variables and tax-loss harvesting.
          </p>
        </div>

        <div className="flex items-center text-[9px] font-sans font-black tracking-[0.2em] text-[#c0f18e] mt-6 uppercase">
          Open Projections
          <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1.5 transition-transform duration-200" />
        </div>
      </motion.div>
    </div>
  )
}
