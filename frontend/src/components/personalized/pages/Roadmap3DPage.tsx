import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../../store/useAppStore'
import { getTrackForFear, isModuleLocked } from '../../../lib/curriculumData'
import { ArrowLeft, Check, Lock, Play, X } from 'lucide-react'

// ── Dust Particles ───────────────────────────────────────────────────────────
function DustParticles() {
  const particles = Array.from({ length: 30 }).map((_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    size: Math.random() * 3 + 1, duration: Math.random() * 25 + 20, delay: Math.random() * -20,
  }))
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(p => (
        <motion.div key={p.id} className="absolute rounded-full bg-[#c0f18e]"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: p.size, height: p.size, filter: 'blur(1px)' }}
          animate={{ y: [0, -80, 0], opacity: [0.05, 0.25, 0.05] }}
          transition={{ duration: p.duration, delay: p.delay, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </div>
  )
}

// ── Rich Interactive Module Content ─────────────────────────────────────────
// ── Main Roadmap Page ────────────────────────────────────────────────────────

import { getModulesForFear } from './LearnPage'

export default function Roadmap3DPage() {
  const navigate = useNavigate()
  const fearType = useAppStore(s => s.fearType) ?? 'loss'
  const completedModules = useAppStore(s => s.completedModules)
  const completeModule = useAppStore(s => s.completeModule)

  const track = getTrackForFear(fearType)
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  // Find the currently active (first incomplete, unlocked) module index
  const activeIdx = track.findIndex(m => !completedModules.includes(m.id) && !isModuleLocked(m, completedModules))
  const currentIdx = activeIdx === -1 ? track.length - 1 : activeIdx

  const [openModule, setOpenModule] = useState<string | null>(null)
  const [pathProgress, setPathProgress] = useState(
    track.filter(m => completedModules.includes(m.id)).length / track.length
  )
  const [celebrating, setCelebrating] = useState<string | null>(null)

  // Auto-scroll to active node on mount
  useEffect(() => {
    const target = nodeRefs.current[currentIdx]
    if (target && scrollRef.current) {
      setTimeout(() => {
        target.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }, 600)
    }
  }, [currentIdx])

  const handleComplete = (moduleId: string, fearProgressIncrement: number, idx: number) => {
    completeModule(moduleId, fearProgressIncrement)
    setCelebrating(moduleId)
    setOpenModule(null)

    // Animate path to next node
    const completedSoFar = track.filter(m => completedModules.includes(m.id) || m.id === moduleId).length
    setPathProgress(completedSoFar / track.length)

    // Camera scroll to next node
    setTimeout(() => {
      setCelebrating(null)
      const nextIdx = idx + 1
      if (nextIdx < track.length) {
        const nextNode = nodeRefs.current[nextIdx]
        if (nextNode && scrollRef.current) {
          nextNode.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
    }, 1200)
  }

  const SPACING = 220
  const totalHeight = track.length * SPACING + 200

  // Zig-zag X positions for the path
  const nodePositions = track.map((_, i) => {
    if (i === 0) return 0
    if (i === track.length - 1) return 0
    return i % 2 === 1 ? 110 : -110
  })

  // Build SVG bezier path
  const cx = 200 // center x in viewBox
  const pathPoints = track.map((_, i) => ({ x: cx + nodePositions[i], y: 80 + i * SPACING }))
  let pathD = `M ${pathPoints[0].x} ${pathPoints[0].y}`
  for (let i = 1; i < pathPoints.length; i++) {
    const prev = pathPoints[i - 1], curr = pathPoints[i]
    const cpY = prev.y + (curr.y - prev.y) * 0.5
    pathD += ` C ${prev.x} ${cpY}, ${curr.x} ${cpY}, ${curr.x} ${curr.y}`
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[250] overflow-hidden flex flex-col"
      style={{ background: 'linear-gradient(180deg, #080c0a 0%, #0d1a12 50%, #080c0a 100%)' }}
    >
      {/* Atmosphere */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(192,241,142,0.08) 0%, transparent 60%)'
      }} />
      <DustParticles />

      {/* Top Bar */}
      <div className="absolute top-0 left-0 w-full p-5 z-[260] pointer-events-none flex items-center justify-between">
        <button onClick={() => navigate('/dashboard/learn')}
          className="pointer-events-auto flex items-center gap-2 font-sans text-xs font-bold text-white/50 hover:text-white transition-colors bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <div className="pointer-events-auto flex items-center gap-3 bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10">
          <div className="w-1.5 h-1.5 rounded-full bg-[#c0f18e] animate-pulse" />
          <span className="font-mono text-[10px] text-white/50 uppercase tracking-widest">
            {completedModules.filter(id => track.some(m => m.id === id)).length} / {track.length} complete
          </span>
        </div>
      </div>

      {/* Scroll Container */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'none' }}>
        <div className="relative mx-auto" style={{ width: '400px', paddingTop: '100px', paddingBottom: '120px' }}>

          {/* SVG Path */}
          <svg
            className="absolute left-0 top-0 pointer-events-none"
            width="400" height={totalHeight}
            style={{ overflow: 'visible' }}
          >
            {/* Ghost trail (full path, dim) */}
            <path d={pathD} fill="none" stroke="rgba(192,241,142,0.06)" strokeWidth="3"
              strokeLinecap="round" strokeLinejoin="round" />
            {/* Wide soft glow track */}
            <path d={pathD} fill="none" stroke="rgba(192,241,142,0.03)" strokeWidth="24"
              strokeLinecap="round" strokeLinejoin="round" />
            {/* Animated progress fill */}
            <motion.path d={pathD} fill="none" stroke="#c0f18e" strokeWidth="3"
              strokeLinecap="round" strokeLinejoin="round"
              initial={{ pathLength: pathProgress }}
              animate={{ pathLength: pathProgress }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
              style={{ filter: 'drop-shadow(0 0 6px rgba(192,241,142,0.6))' }}
            />
          </svg>

          {/* Nodes */}
          {track.map((m, i) => {
            const done = completedModules.includes(m.id)
            const locked = isModuleLocked(m, completedModules)
            const active = !done && !locked
            const isCelebrating = celebrating === m.id
            const nodeX = nodePositions[i]
            const nodeY = 80 + i * SPACING

            return (
              <div
                key={m.id}
                ref={el => { nodeRefs.current[i] = el }}
                className="absolute flex flex-col items-center"
                style={{ top: nodeY, left: `calc(50% + ${nodeX}px)`, transform: 'translateX(-50%)' }}
              >
                {/* Completion celebration burst */}
                <AnimatePresence>
                  {isCelebrating && (
                    <motion.div initial={{ scale: 0, opacity: 1 }} animate={{ scale: 3, opacity: 0 }}
                      exit={{}} transition={{ duration: 0.8 }}
                      className="absolute inset-0 rounded-full bg-[#c0f18e]/30 pointer-events-none"
                    />
                  )}
                </AnimatePresence>

                {/* Step number badge */}
                <div className="mb-3 font-mono text-[9px] text-white/20 uppercase tracking-widest">
                  Step {i + 1}
                </div>

                {/* Node button */}
                <motion.button
                  onClick={() => !locked && (done ? setOpenModule(m.id) : setOpenModule(m.id))}
                  animate={active ? {
                    boxShadow: [
                      '0 0 0px rgba(192,241,142,0)',
                      '0 0 30px rgba(192,241,142,0.35)',
                      '0 0 0px rgba(192,241,142,0)',
                    ]
                  } : {}}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="relative w-16 h-16 rounded-2xl flex items-center justify-center border transition-all duration-300 cursor-pointer"
                  style={{
                    background: done ? '#1D9E75' : active ? 'rgba(192,241,142,0.12)' : 'rgba(255,255,255,0.02)',
                    borderColor: done ? '#1D9E75' : active ? 'rgba(192,241,142,0.5)' : 'rgba(255,255,255,0.06)',
                  }}
                  disabled={locked}
                  whileHover={!locked ? { scale: 1.08 } : {}}
                  whileTap={!locked ? { scale: 0.96 } : {}}
                >
                  {done ? <Check className="w-7 h-7 text-[#0d1a12]" /> :
                    locked ? <Lock className="w-5 h-5 text-white/15" /> :
                      <Play className="w-6 h-6 ml-0.5" style={{ color: '#c0f18e' }} />}
                </motion.button>

                {/* Title card */}
                <motion.div
                  className="mt-3 max-w-[160px] text-center"
                  animate={{ opacity: locked ? 0.3 : 1 }}
                >
                  <p className={`font-sans text-xs font-semibold leading-snug ${done ? 'text-[#1D9E75]' : active ? 'text-white' : 'text-white/30'}`}>
                    {m.title}
                  </p>
                  <p className="font-mono text-[9px] text-white/25 mt-1 uppercase tracking-widest">
                    {m.type} · {m.estimatedMinutes}m
                  </p>
                  {active && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="mt-2 text-[9px] font-mono uppercase tracking-widest text-[#c0f18e]"
                    >
                      ↑ tap to start
                    </motion.div>
                  )}
                </motion.div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Module Panel (Slide-up sheet) */}
      <AnimatePresence>
        {openModule && (() => {
          const mod = track.find(m => m.id === openModule)!
          const modIdx = track.findIndex(m => m.id === openModule)
          const isDone = completedModules.includes(openModule)
          
          // Get rich media content directly from LearnPage dictionary
          const activeFearModules = getModulesForFear(fearType)
          const loadedModule = activeFearModules.find(m => m.id === openModule)
          const content = loadedModule?.content

          return (
            <motion.div
              key="panel"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 z-[270] rounded-t-3xl flex flex-col"
              style={{ background: '#0d1a12', borderTop: '1px solid rgba(192,241,142,0.12)', maxHeight: '85vh', height: '85vh' }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-full bg-white/10" />
              </div>

              <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none', minHeight: 0 }}>
                <div className="px-6 pb-8 pt-2 space-y-6">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-[9px] text-[#c0f18e] uppercase tracking-widest">Step {modIdx + 1}</span>
                        <span className="font-mono text-[9px] text-white/20 uppercase tracking-widest">·</span>
                        <span className="font-mono text-[9px] text-white/30 uppercase tracking-widest">{mod.estimatedMinutes} min</span>
                      </div>
                      <h2 className="font-display font-bold text-xl text-white leading-tight">{mod.title}</h2>
                    </div>
                    <button onClick={() => setOpenModule(null)}
                      className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shrink-0"
                    >
                      <X className="w-3.5 h-3.5 text-white/50" />
                    </button>
                  </div>

                  {/* Rich content */}
                  <div>
                    {content || (
                      <div className="space-y-4 text-sm text-white/60 leading-relaxed">
                        <p>Detailed interactive content coming for this module.</p>
                      </div>
                    )}
                  </div>

                  {/* CTA */}
                  {!isDone ? (
                    <button
                      onClick={() => handleComplete(mod.id, mod.fearProgressIncrement, modIdx)}
                      className="w-full py-4 rounded-2xl font-sans font-bold text-sm text-[#0d1a12] flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
                      style={{ background: 'linear-gradient(135deg, #c0f18e, #1D9E75)' }}
                    >
                      <Check className="w-4 h-4" /> Mark Complete & Continue
                    </button>
                  ) : (
                    <div className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#1D9E75]/10 border border-[#1D9E75]/20">
                      <Check className="w-4 h-4 text-[#1D9E75]" />
                      <span className="text-sm text-[#1D9E75] font-medium">Completed</span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )
        })()}
      </AnimatePresence>
    </motion.div>
  )
}
