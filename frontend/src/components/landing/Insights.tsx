import { motion } from 'framer-motion'

const testimonials = [
  {
    quote: "I used to check my portfolio every time there was a news alert. Kinetic didn't just give me an app; they gave me a different perspective. I finally sleep through market dips.",
    name: 'Priya Bhatia',
    role: 'Software Engineer, Bangalore',
    initials: 'AB',
  },
  {
    quote: "The Fear Type analysis made a wake-up call. I realised I was 'taking' in fixed deposits while actually doing nothing useful for my money. Kinetic made the transition real, not scary.",
    name: 'Neha Sharma',
    role: 'Marketing Lead, Mumbai',
    initials: 'NS',
  },
]

export default function Insights() {
  return (
    <section id="community" className="py-28 md:py-40 px-6 md:px-12 border-t border-white/[0.06]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col xl:flex-row items-start justify-between gap-16 xl:gap-20">

          {/* Left — Counter + Desc */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, ease: 'easeOut' as const }}
            className="xl:w-[42%] w-full"
          >
            <span className="text-[9px] font-sans font-bold tracking-[0.22em] text-[var(--color-primary-fixed)] uppercase mb-6 block">
              The Community
            </span>

            <h2
              className="font-display font-semibold leading-[0.92] tracking-[-0.025em] text-white mb-8"
              style={{ fontSize: 'clamp(2.5rem, 6vw, 5rem)' }}
            >
              <span className="text-[var(--color-primary-fixed)]">45,000+</span><br />
              Indians breaking<br />the cycle.
            </h2>

            <p className="font-sans text-white/55 text-base leading-[1.7] max-w-sm">
              Grown 9× in 6 years of operation. Join a community of first-time investors who have tried and are here for a clear, evidence-based strategy.
            </p>
          </motion.div>

          {/* Right — Testimonials */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' as const }}
            className="xl:w-[55%] w-full flex flex-col gap-5"
          >
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 0.6, delay: 0.1 + i * 0.15, ease: 'easeOut' as const }}
                className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-8 hover:bg-white/[0.05] hover:border-white/10 transition-[background-color,border-color] duration-500"
              >
                {/* Quote */}
                <p className="font-sans text-[15px] text-white/75 leading-[1.75] mb-6 italic">
                  "{t.quote}"
                </p>

                {/* Author */}
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[var(--color-primary-fixed)]/15 border border-[var(--color-primary-fixed)]/20 flex items-center justify-center shrink-0">
                    <span className="font-display text-xs font-bold text-[var(--color-primary-fixed)]">{t.initials}</span>
                  </div>
                  <div>
                    <p className="font-sans text-sm font-semibold text-white">{t.name}</p>
                    <p className="font-sans text-[11px] text-white/40">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </div>
    </section>
  )
}
