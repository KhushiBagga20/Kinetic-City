import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../../store/useAppStore'
import { getTrackForFear } from '../../../lib/curriculumData'
import { ArrowLeft, Check, FastForward } from 'lucide-react'

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

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

export default function ModuleJourney() {
  const navigate = useNavigate()
  const activeModuleId = useAppStore(s => s.activeModuleId)
  const fearType = useAppStore(s => s.fearType) ?? 'loss'
  const metaphorStyle = useAppStore(s => s.metaphorStyle) ?? 'generic'
  const completeModule = useAppStore(s => s.completeModule)
  const completedModules = useAppStore(s => s.completedModules)

  const track = getTrackForFear(fearType)
  const [step, setStep] = useState(0)

  // AI State
  const [kinuReaction, setKinuReaction] = useState<string | null>(null)
  const [kinuLoading, setKinuLoading] = useState(false)

  const askKinu = async (feeling: string) => {
    setKinuLoading(true)
    setKinuReaction(null)
    try {
      const res = await fetch(`${API_BASE}/api/mentor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `The user just read the module '${activeModuleId}' and felt: '${feeling}'. Give them a very brief (2 sentences max), encouraging and insightful response tailored to their fear type.`,
          fear_type: fearType,
          metaphor_style: metaphorStyle,
          context: 'module_journey_feedback',
          conversation_history: [],
        }),
      })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
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

  // Fake narrative parts for the journey
  const narrative = [
    { text: "Welcome to the real game. We're going to break down how to actually build wealth without being glued to a screen." },
    { type: "widget", widget: currentModule.id.includes('loss') ? <PanicSlider /> : <InteractiveSnowball /> },
    { text: "It's all about making the math invisible. KINU handles the tracking, you just handle the consistency." }
  ]

  const handleNext = () => {
    if (step < narrative.length - 1) {
      setStep(s => s + 1)
    } else {
      if (!isCompleted) {
        completeModule(currentModule.id, currentModule.fearProgressIncrement)
      }
      navigate('/dashboard/learn')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: 20 }}
      className="fixed inset-0 z-[300] flex flex-col pt-[60px]"
      style={{ background: 'var(--bg)' }}
    >
      {/* Immersive Top Bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-xl">
        <button
          onClick={() => navigate('/dashboard/learn')}
          className="flex items-center gap-2 font-sans text-sm font-medium text-white/50 hover:text-white/80 transition-colors"
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

      {/* Scrolling Experiential Content */}
      <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
        <div className="max-w-2xl mx-auto px-6 py-16">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display font-semibold text-3xl md:text-5xl text-white tracking-tight mb-6 leading-tight"
          >
            {currentModule.title}
          </motion.h1>

          <div className="space-y-12 mt-12 pb-32">
            <AnimatePresence>
              {narrative.slice(0, step + 1).map((n, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30, filter: 'blur(5px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  {n.type === 'widget' ? (
                    n.widget
                  ) : (
                    <p className="font-sans text-lg md:text-xl text-white/80 leading-relaxed font-light">
                      {n.text}
                    </p>
                  )}

                  {/* KINU Pop-in Response (Faux) */}
                  {i === Math.floor(narrative.length / 2) && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.8, type: 'spring' }}
                      className="mt-6 flex gap-3 p-4 rounded-2xl bg-white/5 border border-white/10"
                    >
                      <div className="w-8 h-8 rounded-full flex items-center justify-center font-display text-[10px] font-bold shrink-0" style={{ background: 'rgba(192,241,142,0.08)', color: 'var(--accent)' }}>
                        K
                      </div>
                      <div className="flex-1">
                        {!kinuReaction && !kinuLoading ? (
                          <>
                            <p className="font-sans text-sm text-white/70 italic">"How are you feeling about this?"</p>
                            <div className="flex gap-2 mt-3">
                              <button onClick={() => askKinu("I'm confused")} className="px-3 py-1.5 rounded-full text-xs font-sans border border-white/10 text-white/50 hover:bg-white/5 transition-colors">I'm confused 🤔</button>
                              <button onClick={() => askKinu("Makes sense")} className="px-3 py-1.5 rounded-full text-xs font-sans border border-[var(--accent)] text-[var(--accent)] bg-[var(--accent)]/10 hover:bg-[var(--accent)]/20 transition-colors">Makes sense 💡</button>
                            </div>
                          </>
                        ) : kinuLoading ? (
                          <div className="flex gap-1.5 mt-2">
                            {[0, 1, 2].map(dot => (
                              <motion.div key={dot} className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]"
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{ duration: 1.2, repeat: Infinity, delay: dot * 0.2 }}
                              />
                            ))}
                          </div>
                        ) : (
                          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="font-sans text-sm text-white/80 leading-relaxed">
                            {kinuReaction}
                          </motion.p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Bottom Floating Action Bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-sm rounded-[32px] p-2 bg-[#0a0a0f]/90 backdrop-blur-xl border border-white/10 flex items-center justify-between shadow-2xl">
        <div className="px-4 font-mono text-[10px] uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
          {step < narrative.length - 1 ? `Step ${step + 1} / ${narrative.length}` : 'Ready'}
        </div>
        <button
          onClick={handleNext}
          className="px-6 py-3 rounded-full font-sans text-sm font-bold active:scale-[0.97] transition-[transform,background-color] duration-200 flex items-center gap-2"
          style={{ background: step < narrative.length - 1 ? 'rgba(255,255,255,0.08)' : 'var(--accent)', color: step < narrative.length - 1 ? 'white' : '#0a1a00' }}
        >
          {step < narrative.length - 1 ? (
            <>Next <FastForward className="w-3.5 h-3.5" /></>
          ) : (
            <>Complete <Check className="w-4 h-4" /></>
          )}
        </button>
      </div>
    </motion.div>
  )
}
