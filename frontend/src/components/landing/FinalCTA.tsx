import { motion } from 'framer-motion'
import { useAppStore } from '../../store/useAppStore'

export default function FinalCTA() {
  const setView = useAppStore(state => state.setView)

  return (
    <section className="py-36 md:py-52 px-6 text-center relative overflow-hidden border-t border-white/[0.06]">
      {/* Radial glow backdrop */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] bg-[var(--color-primary-fixed)]/[0.07] blur-[120px] rounded-full" />
      </div>

      <motion.h2
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: "easeOut" as const }}
        className="font-display font-semibold italic tracking-[-0.03em] text-white relative z-10"
        style={{ fontSize: 'clamp(2.5rem, 8vw, 6rem)' }}
      >
        READY TO GO<br />KINETIC?
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" as const }}
        className="font-sans text-white/50 text-base md:text-lg max-w-xl mx-auto mt-6 mb-12 leading-relaxed relative z-10"
      >
        Join 40,000+ institutions and professional traders building their future on the Kinetic Architect system.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" as const }}
        className="relative z-10"
      >
        <button
          onClick={() => setView('dashboard')}
          className="bg-[var(--color-primary-fixed)] hover:bg-[#b4e882] text-[#0a1a00] font-sans font-bold text-sm px-12 py-4 rounded-full transition-all duration-200 box-glow active:scale-[0.97]"
        >
          Initialize Your Account
        </button>
      </motion.div>
    </section>
  )
}
