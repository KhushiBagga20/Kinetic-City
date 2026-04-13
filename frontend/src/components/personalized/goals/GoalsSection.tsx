import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../../store/useAppStore'
import GoalCard from './GoalCard'
import GoalCreation from './GoalCreation'
import { Plus } from 'lucide-react'

export default function GoalsSection() {
  const goals = useAppStore(s => s.goals)
  const [showCreate, setShowCreate] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="font-sans text-xs text-white/25 uppercase tracking-wider">Goals</p>
        <span className="font-mono text-[10px] text-white/15">{goals.length} {goals.length === 1 ? 'goal' : 'goals'}</span>
      </div>

      {/* Goal cards — or empty state */}
      <div className="space-y-3">
        {goals.length === 0 ? (
          <div className="rounded-2xl p-5 border text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <p className="font-sans text-sm text-white/35 mb-1">No goals yet.</p>
            <p className="font-sans text-xs text-white/20">Goals help you track what your SIP is building toward.</p>
          </div>
        ) : (
          goals.map(goal => <GoalCard key={goal.id} goal={goal} />)
        )}
      </div>

      {/* Creation flow */}
      <AnimatePresence>
        {showCreate && <GoalCreation onClose={() => setShowCreate(false)} />}
      </AnimatePresence>

      {/* Add button */}
      {!showCreate && (
        <button
          onClick={() => setShowCreate(true)}
          className="w-full mt-3 rounded-2xl p-4 border text-center transition-all duration-200 hover:border-white/14"
          style={{
            background: 'transparent',
            borderColor: 'var(--border)',
            borderStyle: 'dashed',
          }}
        >
          <div className="flex items-center justify-center gap-2">
            <Plus className="w-4 h-4 text-white/20" />
            <span className="font-sans text-sm text-white/25">Add a goal</span>
          </div>
        </button>
      )}
    </div>
  )
}
