import { motion } from 'framer-motion'
import { useAppStore } from '../../store/useAppStore'
import { BookOpen, ArrowRight } from 'lucide-react'
import { getTrackForFear } from '../../lib/curriculumData'

/* ── Topic pills for beginners ───────────────────────────────────────────── */

const BEGINNER_TOPICS = [
  { label: 'What is SIP', moduleIndex: 0 },
  { label: 'Index Funds', moduleIndex: 1 },
  { label: 'Market crashes', moduleIndex: 2 },
  { label: 'Expense ratio', moduleIndex: 3 },
]

/* ── Component ───────────────────────────────────────────────────────────── */

export default function LearnShortcutCard() {
  const completedModules = useAppStore(s => s.completedModules)
  const fearType = useAppStore(s => s.fearType) ?? 'loss'
  const setDashboardSection = useAppStore(s => s.setDashboardSection)

  const track = getTrackForFear(fearType)
  const trackModules = [...new Set(completedModules || [])].filter(m => track.some(tm => tm.id === m))
  const trackCount = trackModules.length
  const hasCompletedBasics = trackCount >= 5

  const nextModuleIndex = Math.min(trackCount, track.length - 1)
  const nextModule = track[nextModuleIndex]
  const nextModuleName = nextModule.title

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.08 }}
      className="rounded-2xl p-4 border"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {!hasCompletedBasics ? (
        /* ── Beginner state: topic pills ─────────────────────────────── */
        <>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-3.5 h-3.5 text-white/25" />
            <p className="font-sans text-[14px] font-medium text-white/60">Learn before you invest</p>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            {BEGINNER_TOPICS.map(topic => (
              <button
                key={topic.label}
                onClick={() => setDashboardSection('learn')}
                className="px-3 py-1.5 rounded-lg font-sans text-[12px] border transition-all duration-200 hover:border-white/14"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderColor: 'var(--border)',
                  color: 'rgba(255,255,255,0.45)',
                }}
              >
                {topic.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => setDashboardSection('learn')}
            className="font-sans text-[12px] font-medium flex items-center gap-1 transition-colors hover:opacity-80"
            style={{ color: 'var(--accent)', minHeight: 'auto' }}
          >
            See full curriculum <ArrowRight className="w-3 h-3" />
          </button>
        </>
      ) : (
        /* ── Advanced state: next module ──────────────────────────────── */
        <>
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-3.5 h-3.5 text-white/25" />
            <p className="font-sans text-[14px] font-medium text-white/60">Continue your track</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-sans text-[13px] text-white/70 truncate">{nextModuleName}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-0.5 rounded font-sans text-[10px]"
                  style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)' }}>
                  {nextModule.type}
                </span>
                <span className="font-sans text-[10px] text-white/20">{nextModule.estimatedMinutes} min</span>
              </div>
            </div>

            <button
              onClick={() => setDashboardSection('learn')}
              className="px-4 py-2 rounded-full font-sans text-[12px] font-medium transition-all duration-200 hover:opacity-90 shrink-0"
              style={{ background: 'var(--accent)', color: '#0a1a00' }}
            >
              Resume →
            </button>
          </div>
        </>
      )}
    </motion.div>
  )
}
