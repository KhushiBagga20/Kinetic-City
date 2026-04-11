import { motion } from 'framer-motion'
import { TrendingUp, Zap } from 'lucide-react'

const metrics = [
  {
    title: 'CURRENT VALUE',
    value: '₹1,84,20,500',
    subtext: '+₹4,20,100 (2.4%)',
    subtextColor: 'text-[var(--color-primary-fixed)]',
    icon: <TrendingUp className="w-3 h-3 mr-1.5" />
  },
  {
    title: 'TOTAL RETURNS',
    value: '+₹42,84,200',
    subtext: '12.4% vs last quarter',
    subtextColor: 'text-white/40',
    icon: null
  },
  {
    title: 'XIRR',
    value: '24.8%',
    subtext: 'Outperforming Index',
    subtextColor: 'text-[var(--color-primary-fixed)]',
    icon: <Zap className="w-3 h-3 mr-1.5" />
  },
  {
    title: "DAY'S P&L",
    value: '+₹12,400',
    subtext: '+0.8% today',
    subtextColor: 'text-white/40',
    icon: null
  }
]

export default function MetricsGrid() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {metrics.map((metric, i) => (
        <motion.div
          key={metric.title}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.08 + i * 0.06, ease: "easeOut" as const }}
          className="bg-[#071619] border border-white/[0.06] rounded-2xl p-5 md:p-6 hover:border-white/10 transition-colors"
        >
          <p className="text-[9px] font-sans tracking-[0.18em] text-white/40 uppercase mb-4">
            {metric.title}
          </p>
          <p className="font-display font-semibold text-white tracking-tight mb-2"
            style={{ fontSize: 'clamp(1.2rem, 2.5vw, 1.75rem)' }}
          >
            {metric.value}
          </p>
          <div className={`flex items-center text-[11px] font-sans font-medium ${metric.subtextColor}`}>
            {metric.icon}
            {metric.subtext}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
