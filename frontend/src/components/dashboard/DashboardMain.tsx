import { motion } from 'framer-motion'
import WelcomeHeader from './WelcomeHeader'
import MetricsGrid from './MetricsGrid'
import PerformanceChart from './PerformanceChart'
import FeatureModules from './FeatureModules'
import LowerWidgets from './LowerWidgets'

export default function DashboardMain() {
  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="max-w-[1400px] mx-auto px-6 md:px-12 py-8 pb-24 space-y-6"
    >
      <WelcomeHeader />
      <MetricsGrid />
      <PerformanceChart />
      <FeatureModules />
      <LowerWidgets />
    </motion.main>
  )
}
