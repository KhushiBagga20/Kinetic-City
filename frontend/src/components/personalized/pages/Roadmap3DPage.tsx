import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../../../store/useAppStore'
import { getTrackForFear, isModuleLocked, TRACK_COLORS } from '../../../lib/curriculumData'
import { ArrowLeft, Check, Lock, Play } from 'lucide-react'

export default function Roadmap3DPage() {
  const navigate = useNavigate()
  const fearType = useAppStore(s => s.fearType) ?? 'loss'
  const completedModules = useAppStore(s => s.completedModules)
  
  const track = getTrackForFear(fearType)
  const accentColor = '#c0f18e' // Always natural, positive green instead of fear-based reds
  const completedColor = '#1D9E75' // Deep earthy forest green

  const SPACING_Y = 180
  const MAX_X = 140

  // Calculate coordinates for nodes
  const nodes = track.map((m, i) => {
    let x = 0
    if (i !== 0 && i !== track.length - 1) {
       x = (i % 2 !== 0) ? MAX_X : -MAX_X
    }
    const y = i * SPACING_Y
    return { x, y, data: m, index: i }
  })

  // Generate SVG smooth bezier path connecting all nodes
  let pathD = `M ${nodes[0].x} ${nodes[0].y}`
  for (let i = 1; i < nodes.length; i++) {
    const prev = nodes[i - 1]
    const curr = nodes[i]
    // Control points halfway vertically
    const cpY = prev.y + (curr.y - prev.y) / 2
    pathD += ` C ${prev.x} ${cpY}, ${curr.x} ${cpY}, ${curr.x} ${curr.y}`
  }

  const totalHeight = (nodes.length - 1) * SPACING_Y + 300

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[250] bg-[#0d1410] overflow-hidden flex flex-col"
    >
      {/* Top Bar Overlay */}
      <div className="absolute top-0 left-0 w-full p-6 z-[260] pointer-events-none flex items-center justify-between">
        <button 
          onClick={() => navigate('/dashboard/learn')}
          className="pointer-events-auto flex items-center gap-2 font-sans text-sm font-bold text-white/50 hover:text-white transition-colors bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 shadow-xl"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </button>
      </div>

      {/* 3D Scrolling Container Wrapper */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden pt-[20vh] pb-[40vh]" style={{ perspective: '1200px' }}>
        
        {/* The 3D Ground Plane */}
        <div 
          className="relative mx-auto"
          style={{
            width: '600px',
            height: `${totalHeight}px`,
            transform: 'rotateX(55deg) rotateZ(-35deg) scale(1.1)',
            transformStyle: 'preserve-3d',
            transformOrigin: 'top center'
          }}
        >
          {/* Ambient Ground Grid */}
          <div className="absolute inset-0 pointer-events-none opacity-10" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.2) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}/>

          {/* SVG Connecting Path */}
          <svg className="absolute top-0 left-1/2 overflow-visible pointer-events-none" style={{ transform: 'translateX(-50%)' }}>
            {/* Background Track (Soft earthen path) */}
            <path 
              d={pathD}
              fill="none"
              stroke="rgba(192,241,142,0.03)"
              strokeWidth="28"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Inner Core Track */}
            <path 
              d={pathD}
              fill="none"
              stroke="rgba(192,241,142,0.1)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Active Highlight (Flowing natural progress) */}
            <motion.path 
              d={pathD}
              fill="none"
              stroke={accentColor}
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 0.6 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 4, ease: "easeInOut" }}
            />
          </svg>

          {/* Nodes placed on the plane */}
          {nodes.map(node => {
            const m = node.data
            const done = completedModules.includes(m.id)
            const locked = isModuleLocked(m, completedModules)
            const active = !done && !locked

            return (
              <div 
                key={m.id}
                className="absolute flex flex-col items-center justify-center font-sans"
                style={{ 
                  top: node.y, 
                  left: `calc(50% + ${node.x}px)`, 
                  transform: 'translate(-50%, -50%)',
                  transformStyle: 'preserve-3d'
                }}
              >
                {/* 
                  The Counter-rotation:
                  Because the ground is rotateX(55) rotateZ(-35), we reverse it entirely on the node
                  so it stands perfectly upright (billboarding).
                  We rotateZ(35) first, then rotateX(-55).
                */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: active ? [0, -10, 0] : 0, opacity: 1 }}
                  transition={{ 
                     y: active ? { repeat: Infinity, duration: 3, ease: 'easeInOut' } : { duration: 0.5 },
                     opacity: { duration: 0.5, delay: node.index * 0.1 }
                  }}
                  className="relative group cursor-pointer flex flex-col items-center"
                  style={{ transform: 'rotateZ(35deg) rotateX(-55deg)', transformOrigin: 'bottom center' }}
                  onClick={() => !locked && navigate(`/dashboard/module/${m.id}`)}
                >
                  
                  {/* Floating Title */}
                  <div className={`mb-4 w-48 text-center transition-opacity duration-300 ${locked ? 'opacity-30' : 'opacity-100 group-hover:-translate-y-2'}`} style={{ transitionProperty: 'opacity, transform' }}>
                    <div className="bg-[#0a0a0f]/80 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl">
                      <p className="font-bold text-white text-sm leading-tight drop-shadow-md">{m.title}</p>
                      <p className="font-mono text-[9px] text-white/50 mt-1 uppercase tracking-wider">{m.type} • {m.estimatedMinutes}m</p>
                    </div>
                    {/* Shadow connector stick */}
                    <div className="w-0.5 h-6 mx-auto bg-gradient-to-b from-white/20 to-transparent mt-1" />
                  </div>

                  {/* 3D Physical Node Base */}
                  <div className="relative">
                    {/* Soft ambient floor shadow */}
                    <div className="absolute -bottom-2 -left-1/2 w-[200%] h-[200%] bg-black/40 blur-xl rounded-full" style={{ transform: 'rotateX(75deg)' }} />
                    
                    {/* The Button (Glassy, natural stone feel) */}
                    <div className="w-20 h-20 rounded-[28px] flex items-center justify-center border shadow-[0_15px_35px_rgba(0,0,0,0.3),inset_0_2px_15px_rgba(192,241,142,0.1)] transition-colors duration-300 relative overflow-hidden backdrop-blur-md" 
                      style={{ 
                        background: done ? completedColor : locked ? 'rgba(255,255,255,0.02)' : 'rgba(192,241,142,0.08)',
                        borderColor: done ? completedColor : active ? 'rgba(192,241,142,0.4)' : 'rgba(255,255,255,0.05)',
                      }}
                    >
                      {active && <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent mix-blend-overlay" />}
                      
                      {done ? (
                        <Check className="w-8 h-8" style={{ color: '#0d1410' }} />
                      ) : locked ? (
                        <Lock className="w-6 h-6 text-white/20" />
                      ) : (
                        <Play className="w-7 h-7" style={{ color: accentColor, marginLeft: '4px', opacity: 0.9 }} />
                      )}
                    </div>
                  </div>

                </motion.div>
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
