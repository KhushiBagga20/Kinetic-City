import { motion } from 'framer-motion'

export default function Partners() {
  const partners = [
    "ORBITAL",
    "VERTEX CAPITAL",
    "NEXUS LABS",
    "SYNTHETIC",
    "PRISM INSTITUTIONAL"
  ]

  return (
    <section className="border-t border-b border-white/5 bg-[var(--color-surface-container-low)]">
      <div className="container mx-auto px-6 py-12 md:py-16">
        <div className="flex flex-wrap justify-center md:justify-between items-center gap-8 md:gap-4 opacity-50">
          {partners.map((partner, i) => (
            <motion.div
              key={partner}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              className="font-display font-medium tracking-[0.15em] text-sm md:text-base text-white/80"
            >
              {partner}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
