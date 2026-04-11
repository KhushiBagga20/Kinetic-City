import { motion } from 'framer-motion'
import { Bell } from 'lucide-react'

export default function Insights() {
  return (
    <section id="insights" className="py-28 md:py-40 px-6 md:px-12 container mx-auto max-w-7xl border-t border-white/[0.06]">
      <div className="flex flex-col xl:flex-row items-start justify-between gap-16 xl:gap-20">

        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, ease: "easeOut" as const }}
          className="xl:w-[40%] w-full"
        >
          <span className="text-[9px] font-sans font-bold tracking-[0.22em] text-[var(--color-primary-fixed)] uppercase mb-6 block">
            The Interface
          </span>
          <h2
            className="font-display font-semibold leading-[0.92] tracking-[-0.025em] text-white mb-16"
            style={{ fontSize: 'clamp(2rem, 5vw, 3.8rem)' }}
          >
            INSIGHTS THAT<br />MOVE MARKETS
          </h2>

          <div className="space-y-12">
            <div className="flex items-start gap-6">
              <span className="font-display italic font-semibold text-2xl text-[var(--color-primary-fixed)] shrink-0 mt-0.5">01</span>
              <div>
                <h4 className="font-display text-xl text-white mb-2 font-medium">Predictive Analytics</h4>
                <p className="font-sans text-sm text-white/50 leading-[1.7]">
                  AI-driven sentiment analysis that filters noise to show you what actually matters.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-6">
              <span className="font-display italic font-semibold text-2xl text-[var(--color-primary-fixed)] shrink-0 mt-0.5">02</span>
              <div>
                <h4 className="font-display text-xl text-white mb-2 font-medium">Dynamic Portfolio View</h4>
                <p className="font-sans text-sm text-white/50 leading-[1.7]">
                  Visualize risk and return across every asset class in one fluid architectural dashboard.
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right — Dashboard Preview */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" as const }}
          className="xl:w-[58%] w-full"
        >
          <div className="bg-[#0d2329] border border-white/[0.06] rounded-3xl overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.7)]">
            {/* Window bar */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/[0.05] bg-[#0a1e24]">
              <div className="flex gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-400/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400/70" />
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/70" />
              </div>
              <div className="font-mono text-[9px] text-white/30 tracking-widest">KINETIC_TERMINAL_v4.2</div>
            </div>

            <div className="p-6 md:p-8">
              {/* KPI Row */}
              <div className="grid grid-cols-3 gap-4 mb-10">
                {[
                  { label: 'SHARPE INDEX', val: '$128.42', change: '+2.4%', pos: true },
                  { label: 'VOLATILITY', val: '14.22', change: '-0.1%', pos: false },
                  { label: 'YIELD', val: '4.88%', change: '+3.2%', pos: true }
                ].map(kpi => (
                  <div key={kpi.label} className="bg-[#071619] border border-white/[0.05] rounded-lg p-4">
                    <p className="text-[8px] font-sans tracking-widest text-[#4a7b82] uppercase mb-2">{kpi.label}</p>
                    <p className="font-display text-lg text-white mb-1 font-medium">{kpi.val}</p>
                    <p className={`text-[10px] font-mono font-bold ${kpi.pos ? 'text-[var(--color-primary-fixed)]' : 'text-red-400'}`}>{kpi.change}</p>
                  </div>
                ))}
              </div>

              {/* Chart */}
              <div className="relative h-52 w-full">
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="lgInsights" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#c0f18e" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#c0f18e" stopOpacity="0" />
                    </linearGradient>
                    <filter id="softGlow">
                      <feGaussianBlur stdDeviation="1.5" result="blur"/>
                      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                    </filter>
                  </defs>
                  <motion.path
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                    d="M 0 80 Q 25 80 50 55 T 100 30 L 100 100 L 0 100 Z"
                    fill="url(#lgInsights)"
                  />
                  <motion.path
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.4, ease: 'easeInOut', delay: 0.3 }}
                    d="M 0 80 Q 25 80 50 55 T 100 30"
                    fill="none"
                    stroke="#c0f18e"
                    strokeWidth="0.8"
                    filter="url(#softGlow)"
                  />
                </svg>

                {/* Floating tooltip */}
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.95 }}
                  whileInView={{ opacity: 1, y: 0, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 1.2, duration: 0.4, type: 'spring' }}
                  className="absolute left-[55%] bottom-[55%] bg-[#061316]/95 border border-white/10 backdrop-blur-md rounded-2xl p-3.5 flex items-start gap-3 w-44 shadow-xl pointer-events-none"
                >
                  <div className="w-6 h-6 rounded-full bg-[var(--color-primary-fixed)]/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Bell className="w-3 h-3 text-[var(--color-primary-fixed)]" />
                  </div>
                  <div>
                    <p className="text-[9px] font-sans font-bold text-white mb-0.5">Market Alert</p>
                    <p className="text-[8px] text-white/50 leading-snug">KINETIC_INDEX matches criteria (0.98 confidence)</p>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
