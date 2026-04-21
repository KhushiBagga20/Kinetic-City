import { motion } from 'framer-motion'
import { useState } from 'react'
import { Sparkles, Heart, Shield, TrendingUp, Users } from 'lucide-react'
import CareerBreakPlanner from '../women/CareerBreakPlanner'
import SalaryGapSimulator from '../women/SalaryGapSimulator'
import SHGCircle from '../women/SHGCircle'
import VoucherLoop from '../women/VoucherLoop'
import LongevityRetirement from '../women/LongevityRetirement'
import WomenLegends from '../women/WomenLegends'

const SECTIONS = [
  { id: 'legends', label: 'Legends', icon: Sparkles, color: '#FBBF24' },
  { id: 'tools', label: 'My Tools', icon: Shield, color: '#c0f18e' },
  { id: 'community', label: 'Community', icon: Users, color: '#A78BFA' },
]

export default function HerJourneyPage() {
  const [activeSection, setActiveSection] = useState('legends')

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="max-w-5xl mx-auto"
    >
      {/* ── Warm hero header ─────────────────────────────────────────────── */}
      <div className="relative mb-8 rounded-3xl overflow-hidden p-8 md:p-10"
        style={{
          background: 'linear-gradient(135deg, rgba(251,191,36,0.06) 0%, rgba(167,139,250,0.06) 50%, rgba(251,113,133,0.06) 100%)',
          border: '1px solid rgba(251,191,36,0.1)',
        }}>
        {/* Decorative sparkles */}
        <motion.div className="absolute top-6 right-8 pointer-events-none"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}>
          <Sparkles className="w-5 h-5" style={{ color: '#FBBF24' }} />
        </motion.div>
        <motion.div className="absolute bottom-8 right-24 pointer-events-none"
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: 1 }}>
          <Heart className="w-4 h-4" style={{ color: '#FB7185' }} />
        </motion.div>

        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full" style={{ background: '#FBBF24' }} />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: '#FBBF24' }}>
            Her Journey
          </span>
        </div>
        <h1 className="font-display font-bold text-3xl md:text-4xl text-white mb-2">
          Your financial story,{' '}
          <span style={{ color: '#FBBF24' }}>rewritten.</span>
        </h1>
        <p className="font-sans text-sm leading-relaxed max-w-lg" style={{ color: 'rgba(255,255,255,0.45)' }}>
          Tools, insights, and inspiration built for the realities women face —
          from career breaks to the pay gap, from community savings to retirement planning.
        </p>
      </div>

      {/* ── Section tabs ─────────────────────────────────────────────────── */}
      <div className="flex gap-2 mb-8 overflow-x-auto pb-1">
        {SECTIONS.map(s => {
          const isActive = activeSection === s.id
          return (
            <button
              key={s.id}
              onClick={() => setActiveSection(s.id)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-sans font-medium transition-all duration-200 shrink-0"
              style={{
                background: isActive ? `${s.color}12` : 'rgba(255,255,255,0.03)',
                color: isActive ? s.color : 'rgba(255,255,255,0.4)',
                border: `1px solid ${isActive ? `${s.color}25` : 'rgba(255,255,255,0.06)'}`,
              }}
              onMouseEnter={e => {
                if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }
              }}
              onMouseLeave={e => {
                if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)' }
              }}
            >
              <s.icon className="w-4 h-4" />
              {s.label}
            </button>
          )
        })}
      </div>

      {/* ── Section content ──────────────────────────────────────────────── */}
      <motion.div
        key={activeSection}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="space-y-10"
      >
        {activeSection === 'legends' && <WomenLegends />}

        {activeSection === 'tools' && (
          <>
            <SalaryGapSimulator />
            <CareerBreakPlanner />
            <LongevityRetirement />
            <VoucherLoop />
          </>
        )}

        {activeSection === 'community' && <SHGCircle />}
      </motion.div>
    </motion.div>
  )
}
