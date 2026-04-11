import { motion } from 'framer-motion'
import { Zap, Shield, Globe } from 'lucide-react'

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } }
}

export default function Features() {
  const cards = [
    {
      icon: <Zap className="w-5 h-5 text-[var(--color-primary-fixed)]" />,
      title: "Kinetic Speed",
      desc: "Execute trades with sub-millisecond precision. Our proprietary matching engine processes 1M+ transactions per second."
    },
    {
      icon: <Shield className="w-5 h-5 text-[var(--color-primary-fixed)]" />,
      title: "Architectural Security",
      desc: "Multi-signature MPC custody and end-to-end encryption. Your security isn't a feature; it's our foundation."
    },
    {
      icon: <Globe className="w-5 h-5 text-[var(--color-primary-fixed)]" />,
      title: "Global Access",
      desc: "Transact across 150+ countries and 50+ fiat currencies instantly. Boundaries are for maps, not for your money."
    }
  ]

  return (
    <section className="py-28 md:py-40 px-6 md:px-12 container mx-auto max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end mb-20 gap-10">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, ease: "easeOut" as const }}
          className="font-display font-semibold leading-[0.95] tracking-[-0.025em] text-white"
          style={{ fontSize: 'clamp(2.2rem, 5vw, 4rem)' }}
        >
          ENGINEERED FOR<br />THE NEXT ERA
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" as const }}
          className="font-sans text-white/50 text-base leading-relaxed max-w-sm"
        >
          Our protocol minimizes latency while maximizing cryptographic integrity, ensuring your assets move as fast as your ambition.
        </motion.p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {cards.map((card) => (
          <motion.div
            key={card.title}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={itemVariants}
            className="bg-white/[0.03] rounded-3xl p-8 md:p-10 border border-white/[0.06] hover:bg-white/[0.055] hover:border-white/10 transition-all duration-500 group cursor-default"
          >
            <div className="w-11 h-11 rounded-2xl bg-[var(--color-primary-fixed)]/10 flex items-center justify-center mb-8 border border-[var(--color-primary-fixed)]/15">
              {card.icon}
            </div>

            <h3 className="font-display text-xl text-white font-medium mb-4 tracking-tight">{card.title}</h3>

            <p className="font-sans text-sm leading-[1.75] text-white/50">
              {card.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
