import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../../store/useAppStore'
import { getTrackForFear } from '../../../lib/curriculumData'
import { ArrowLeft, Check, Activity } from 'lucide-react'
import { getModulesForFear } from './LearnPage'
import { generateKinuChat } from '../../../lib/kinuAI'

// --- Playful SVG Components ---
function InteractiveSnowball() {
  const [size, setSize] = useState(1)
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-[#0a1a00]/30 rounded-3xl border border-[#c0f18e]/20 my-8">
      <motion.svg
        width={100 + size * 10}
        height={100 + size * 10}
        viewBox="0 0 100 100"
        className="mb-6 drop-shadow-[0_0_15px_rgba(192,241,142,0.4)]"
      >
        <circle cx="50" cy="50" r="45" fill="#c0f18e" opacity="0.9" />
        <path d="M 20 40 Q 50 20 80 40" fill="none" stroke="#fff" strokeWidth="4" opacity="0.3" strokeLinecap="round" />
        <path d="M 30 60 Q 50 80 70 60" fill="none" stroke="#fff" strokeWidth="3" opacity="0.2" strokeLinecap="round" />
      </motion.svg>
      <p className="font-sans text-sm text-[#c0f18e] mb-4 font-bold tracking-widest uppercase">Snowball Accelerator</p>
      <input
        type="range" min="1" max="20" value={size} onChange={(e) => setSize(Number(e.target.value))}
        className="w-48 h-2 rounded-full appearance-none cursor-pointer mb-2"
        style={{ background: 'rgba(192,241,142,0.2)', accentColor: '#c0f18e' }}
      />
      <p className="font-mono text-xs text-white/40">Drag to compound</p>
    </div>
  )
}

function PanicSlider() {
  const [panic, setPanic] = useState(50)
  const isPanic = panic > 75

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-[#1a0a0a]/30 rounded-3xl border border-[#E24B4A]/20 my-8">
      <motion.svg
        width="150" height="80" viewBox="0 0 150 80"
        animate={{ scale: isPanic ? 0.9 : 1, y: isPanic ? 5 : 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 10 }}
      >
        <path d="M 10 40 Q 40 10 75 40 T 140 40" fill="none" stroke={isPanic ? "#E24B4A" : "#1D9E75"} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
      </motion.svg>
      <p className="font-sans text-sm text-center mb-6 mt-4" style={{ color: isPanic ? '#E24B4A' : '#1D9E75' }}>
        {isPanic ? "You panic sold! Locked in losses." : "Holding steady through the dip."}
      </p>
      <input
        type="range" min="0" max="100" value={panic} onChange={(e) => setPanic(Number(e.target.value))}
        className="w-48 h-2 rounded-full appearance-none cursor-pointer"
        style={{ background: 'rgba(226,75,74,0.2)', accentColor: isPanic ? '#E24B4A' : '#1D9E75' }}
      />
      <p className="font-mono text-xs text-white/40 mt-4">Pressure level</p>
    </div>
  )
}

export default function ModuleJourney() {
  const navigate = useNavigate()
  const activeModuleId = useAppStore(s => s.activeModuleId)
  const fearType = useAppStore(s => s.fearType) ?? 'loss'
  const completeModule = useAppStore(s => s.completeModule)
  const completedModules = useAppStore(s => s.completedModules)

  const track = getTrackForFear(fearType)

  // AI State
  const [kinuReaction, setKinuReaction] = useState<string | null>(null)
  const [kinuLoading, setKinuLoading] = useState(false)

  const askKinu = async (feeling: string) => {
    setKinuLoading(true)
    setKinuReaction(null)
    try {
      const data = await generateKinuChat({
        message: `The user just read the module '${activeModuleId}' and felt: '${feeling}'. Give them a very brief (2 sentences max), encouraging and insightful response tailored to their fear type.`,
        fear_type: fearType,
        context: 'module_journey_feedback',
        conversation_history: [],
      })
      setKinuReaction(data.reply)
    } catch {
      setKinuReaction("I'm having trouble connecting to my servers right now, but keep going! You're doing great.")
    } finally {
      setKinuLoading(false)
    }
  }

  // Security check: must be valid module, valid track
  const isModuleValid = activeModuleId && track.some(m => m.id === activeModuleId)
  const activeModuleIndex = track.findIndex(m => m.id === activeModuleId)

  useEffect(() => {
    // Basic guard
    if (!activeModuleId) {
      navigate('/dashboard/learn', { replace: true })
    }
  }, [activeModuleId, navigate])

  if (!activeModuleId || !isModuleValid) return null

  const currentModule = track[activeModuleIndex]
  const isCompleted = completedModules.includes(currentModule.id)
  
  // Real Content extraction
  const contentModules = getModulesForFear(fearType)
  const contentModule = contentModules.find(m => m.id === activeModuleId)

  // Example Live Context based on Fear Type
  const liveContextMap: Record<string, string> = {
    'loss': 'Markets saw a sudden 1.2% dip today. This module is perfectly timed to help you understand why your instincts want to sell, and why holding is statistically safer right now.',
    'jargon': 'There is a lot of buzz today around "XIRR" in the news. This module will help you speak the language effortlessly.',
    'scam': 'A new crypto phishing scam is trending today. Master this module to build your impenetrable filter.',
    'trust': 'Active funds generally underperformed the Nifty 50 again this week. This module shows you why automation beats speculation.'
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-[300] bg-[var(--bg)] overflow-y-auto pb-[120px]"
    >
      {/* Immersive Top Bar */}
      <div className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <button
          onClick={() => navigate('/dashboard/learn')}
          className="flex items-center gap-2 font-sans text-sm font-medium text-white/50 hover:text-white/80 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Exit Journey
        </button>
        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-white/30 uppercase tracking-widest">{currentModule.id}</span>
          <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center font-mono text-[10px] text-white/50 bg-white/5">
            {activeModuleIndex + 1}/{track.length}
          </div>
        </div>
      </div>

      {/* Experiential Content */}
      <div className="w-full">
        <div className="max-w-2xl mx-auto px-6 py-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display font-semibold text-3xl md:text-5xl text-white tracking-tight mb-6 leading-tight"
          >
            {currentModule.title}
          </motion.h1>

          <div className="space-y-16 mt-12 pb-48">
            
            {/* 1. Live AI News Impact Context */}
            <motion.div 
              initial={{ opacity: 0, y: 30, filter: 'blur(10px)' }} 
              whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }} 
              viewport={{ once: true, margin: "-10%" }} 
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="rounded-2xl p-6 relative overflow-hidden group"
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}
            >
              {/* Glassmorphic hover spot */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
              
              <div className="flex items-center gap-2 mb-3">
                <Activity className="w-4 h-4 text-[#378ADD] animate-pulse" />
                <h4 className="font-mono text-xs text-[#378ADD] uppercase tracking-widest">Live Context</h4>
              </div>
              <p className="font-sans text-sm text-white/80 leading-relaxed font-light">
                {liveContextMap[fearType]}
              </p>
            </motion.div>

            {/* 2. Main Content Module (Cinematic Reveal) */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true, margin: "-5%" }} 
              transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
            >
              {contentModule ? contentModule.content : (
                <div className="flex flex-col gap-8">
                   {currentModule.id.includes('loss') ? <PanicSlider /> : <InteractiveSnowball />}
                   <p className="font-sans text-lg text-white/80 leading-relaxed font-light">Immersive content loading...</p>
                </div>
              )}
            </motion.div>

            {/* 3. Embedded KINU Micro-Interaction */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-10%" }}
              transition={{ duration: 0.6 }}
              className="flex gap-4 p-6 rounded-3xl bg-[#0a0a0f]/50 border border-white/5 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-20" />
              
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-display text-sm font-bold shrink-0 self-start mt-1" style={{ background: 'rgba(192,241,142,0.1)', color: 'var(--accent)', border: '1px solid rgba(192,241,142,0.2)' }}>
                K
              </div>
              <div className="flex-1">
                {!kinuReaction && !kinuLoading ? (
                  <>
                    <p className="font-sans text-sm md:text-base text-white/70 italic mb-4">"Alright, you made it through this module. How did that sit with you?"</p>
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => askKinu("I'm confused")} className="px-4 py-2 rounded-full text-xs font-sans border border-white/10 text-white/50 hover:bg-white/10 hover:text-white transition-colors cursor-pointer">I'm confused 🤔</button>
                      <button onClick={() => askKinu("Makes sense")} className="px-4 py-2 rounded-full text-xs font-sans border border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/5 hover:bg-[var(--accent)]/15 transition-colors shadow-[0_0_15px_rgba(192,241,142,0.1)] cursor-pointer">Makes sense 💡</button>
                    </div>
                  </>
                ) : kinuLoading ? (
                  <div className="flex gap-2 mt-4">
                    {[0, 1, 2].map(dot => (
                      <motion.div key={dot} className="w-2 h-2 rounded-full bg-[var(--accent)] shadow-[0_0_10px_rgba(192,241,142,0.5)]"
                        animate={{ opacity: [0.2, 1, 0.2], scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.2, repeat: Infinity, delay: dot * 0.2 }}
                      />
                    ))}
                  </div>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <p className="font-sans text-sm md:text-base text-white/90 leading-relaxed font-light">
                      {kinuReaction}
                    </p>
                    <button onClick={() => setKinuReaction(null)} className="mt-4 text-[10px] uppercase tracking-widest text-white/30 hover:text-white/50 transition-colors">Reset</button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Persistent Bottom Completion Bar */}
      <motion.div 
        initial={{ y: 100 }} 
        animate={{ y: 0 }} 
        transition={{ delay: 0.5, type: 'spring', damping: 20 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-sm rounded-[32px] p-2 bg-[#050508]/90 backdrop-blur-2xl border border-white/10 flex items-center justify-between shadow-[0_20px_40px_rgba(0,0,0,0.8)] z-[400]"
      >
        <div className="px-4 flex items-center gap-2">
           <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shadow-[0_0_10px_rgba(192,241,142,0.5)] animate-pulse" />
           <span className="font-mono text-[10px] uppercase tracking-widest text-[var(--accent)]">Journey Active</span>
        </div>
        <button
          onClick={() => {
            if (!isCompleted) completeModule(currentModule.id, currentModule.fearProgressIncrement)
            navigate('/dashboard/learn')
          }}
          className="px-6 py-3 rounded-full font-sans text-sm font-bold active:scale-[0.97] transition-[transform,background-color] duration-200 flex items-center gap-2 bg-[var(--accent)] text-[#0a1a00] hover:bg-opacity-90 cursor-pointer"
        >
          {isCompleted ? 'Return' : 'Mark Complete'} <Check className="w-4 h-4" />
        </button>
      </motion.div>
    </motion.div>
  )
}
