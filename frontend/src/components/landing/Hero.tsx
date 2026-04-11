import { motion } from 'framer-motion'
import { Play } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } }
}

export default function Hero() {
  const setView = useAppStore(state => state.setView)

  return (
    <section className="relative min-h-screen flex items-center px-6 md:px-12 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row items-center justify-between w-full gap-16 pt-24 pb-16">
        
        {/* Left Content */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className="lg:w-[55%] w-full"
        >
          <motion.div variants={itemVariants} className="mb-8">
            <span className="text-[10px] font-sans font-bold tracking-[0.25em] text-[var(--color-primary-fixed)] uppercase">
              The Architectural Standard
            </span>
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="font-display font-semibold leading-[0.92] tracking-[-0.03em] mb-8 text-white"
            style={{ fontSize: 'clamp(3rem, 8vw, 7rem)' }}
          >
            THE FUTURE<br />
            OF FINANCE IS<br />
            <span className="text-[var(--color-primary-fixed)]">KINETIC</span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="font-sans text-base md:text-lg text-white/60 leading-[1.7] max-w-md mb-10"
          >
            Experience institutional-grade infrastructure reimagined for the modern architect of wealth. Precise, fluid, and powerful.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
          >
            <button
              onClick={() => setView('dashboard')}
              className="bg-[var(--color-primary-fixed)] hover:bg-[#b4e882] text-[#0a1a00] font-sans font-semibold text-sm px-8 py-3.5 rounded-full transition-all duration-200 box-glow active:scale-[0.97] text-center"
            >
              Get Started
            </button>

            <button className="flex items-center justify-center gap-3 px-8 py-3.5 rounded-full border border-white/15 text-white/80 hover:text-white hover:bg-white/5 transition-all duration-200 active:scale-[0.97]">
              <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0">
                <Play fill="#00161b" className="w-3 h-3 ml-0.5" />
              </span>
              <span className="font-sans font-medium text-sm">Watch Ecosystem</span>
            </button>
          </motion.div>
        </motion.div>

        {/* Right — Floating Data Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" as const }}
          className="lg:w-[42%] w-full flex justify-end"
        >
          <div className="glass rounded-[20px] p-6 md:p-8 w-full max-w-[360px] border border-white/[0.07] relative">
            {/* Ambient glow behind card */}
            <div className="absolute -inset-8 bg-[var(--color-primary-fixed)]/5 blur-[60px] rounded-[40px] -z-10" />

            <div className="flex justify-between items-start mb-8">
              <div>
                <p className="text-[9px] font-sans tracking-[0.2em] text-white/40 uppercase mb-2">Global Liquidity</p>
                <h3 className="font-display text-[2.5rem] text-white font-semibold tracking-tight leading-none">$4.2T</h3>
              </div>
              <div className="text-[10px] font-sans font-bold text-[var(--color-primary-fixed)] bg-[var(--color-primary-fixed)]/10 px-2.5 py-1 rounded-md mt-1 border border-[var(--color-primary-fixed)]/20">
                +18.4%
              </div>
            </div>

            {/* Bar chart */}
            <div className="flex items-end h-20 gap-1.5">
              {[0.35, 0.45, 0.5, 0.62, 0.72, 0.85, 1.0].map((val, i) => (
                <motion.div
                  key={i}
                  initial={{ scaleY: 0 }}
                  animate={{ scaleY: 1 }}
                  transition={{ duration: 0.6, delay: 0.7 + i * 0.08, ease: 'easeOut' }}
                  style={{
                    height: `${val * 100}%`,
                    opacity: 0.25 + val * 0.75,
                    transformOrigin: 'bottom'
                  }}
                  className="flex-1 bg-[var(--color-primary-fixed)] rounded-t-sm"
                />
              ))}
            </div>

            {/* Bottom label row */}
            <div className="flex justify-between mt-3 pt-3 border-t border-white/[0.05]">
              <span className="text-[9px] font-mono text-white/30 tracking-wider">7D PERFORMANCE</span>
              <span className="text-[9px] font-mono text-[var(--color-primary-fixed)]">LIVE</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
