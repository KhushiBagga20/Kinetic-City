import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../../store/useAppStore'

// ── Mock data ────────────────────────────────────────────────────────────────

const MOCK_CIRCLE_MEMBERS = [
  { name: 'Priya S.',  city: 'Mumbai',    modulesCompleted: 6, streak: 12, fearType: 'loss'   },
  { name: 'Ananya K.', city: 'Bengaluru', modulesCompleted: 4, streak: 7,  fearType: 'jargon' },
  { name: 'Meena R.',  city: 'Chennai',   modulesCompleted: 8, streak: 21, fearType: 'trust'  },
  { name: 'Sunita P.', city: 'Delhi',     modulesCompleted: 2, streak: 3,  fearType: 'scam'   },
  { name: 'Ritu D.',   city: 'Pune',      modulesCompleted: 7, streak: 14, fearType: 'loss'   },
]

const CIRCLE_MILESTONES = [
  'Ananya completed her first simulation',
  'Meena hit a 21-day streak',
  'Priya set her first financial goal',
  'Sunita killed 5 jargon terms today',
]

const FEAR_COLORS: Record<string, string> = {
  loss:   '#E24B4A',
  jargon: '#378ADD',
  scam:   '#EF9F27',
  trust:  '#1D9E75',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateId() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

function getInitials(name: string) {
  return name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase()
}

// ── QR visual (deterministic pseudo-random grid from seed string) ─────────────

function QRVisual({ seed }: { seed: string }) {
  const SIZE = 80
  const CELL = 4
  const count = SIZE / CELL   // 20 cells per axis

  const cells: boolean[] = []
  for (let i = 0; i < count * count; i++) {
    const charCode = seed.charCodeAt(i % seed.length) || 75
    cells.push(Math.sin(charCode * (i + 1)) > 0)
  }

  return (
    <div
      style={{
        width: SIZE,
        height: SIZE,
        display: 'grid',
        gridTemplateColumns: `repeat(${count}, ${CELL}px)`,
        gap: 0,
        borderRadius: 4,
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {cells.map((dark, i) => (
        <div
          key={i}
          style={{
            width: CELL,
            height: CELL,
            background: dark ? '#ffffff' : 'transparent',
          }}
        />
      ))}
    </div>
  )
}

// ── Card wrapper shared across sections ──────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 24,
  padding: '20px 24px',
}

// ── Tab button ───────────────────────────────────────────────────────────────

function TabBtn({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '6px 18px',
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 0.2s',
        background: active ? 'rgba(255,255,255,0.12)' : 'transparent',
        color: active ? '#fff' : 'rgba(255,255,255,0.45)',
        border: active ? '1px solid rgba(255,255,255,0.18)' : '1px solid transparent',
      }}
    >
      {label}
    </button>
  )
}

// ── Join / Create screen ──────────────────────────────────────────────────────

function JoinCreateScreen({
  onJoined,
}: {
  onJoined: () => void
}) {
  const setCircle = useAppStore(s => s.setCircle)
  const [joinCode, setJoinCode] = useState('')
  const [nameInput, setNameInput] = useState('')

  const handleJoin = () => {
    if (!joinCode.trim()) return
    setCircle(joinCode.trim(), 'My Circle')
    onJoined()
  }

  const handleCreate = () => {
    if (!nameInput.trim()) return
    setCircle(generateId(), nameInput.trim())
    onJoined()
  }

  const qrSeed = nameInput || 'KINETIC'

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
    >
      {/* Header */}
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#fff', margin: 0 }}>
          Your Circle
        </h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
          10–15 women. Private. Judgment-free.
        </p>
      </div>

      {/* Two side-by-side cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Join */}
        <div style={cardStyle}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 12 }}>
            Join a Circle
          </p>
          <input
            value={joinCode}
            onChange={e => setJoinCode(e.target.value)}
            placeholder="Enter Circle code"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: 13,
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: 12,
            }}
          />
          <button
            onClick={handleJoin}
            style={{
              width: '100%',
              padding: '10px 0',
              borderRadius: 12,
              background: 'rgba(55,138,221,0.85)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              border: 'none',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Join
          </button>
        </div>

        {/* Create */}
        <div style={cardStyle}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 12 }}>
            Create a Circle
          </p>
          <input
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            placeholder="Name your circle (e.g. Delhi Savers)"
            style={{
              width: '100%',
              padding: '10px 14px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
              fontSize: 13,
              outline: 'none',
              boxSizing: 'border-box',
              marginBottom: 12,
            }}
          />
          <button
            onClick={handleCreate}
            style={{
              width: '100%',
              padding: '10px 0',
              borderRadius: 12,
              background: 'rgba(29,158,117,0.85)',
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              border: 'none',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            Create
          </button>
        </div>
      </div>

      {/* QR section */}
      <div
        style={{
          ...cardStyle,
          display: 'flex',
          alignItems: 'center',
          gap: 20,
        }}
      >
        {/* QR visual */}
        <div
          style={{
            background: 'rgba(255,255,255,0.9)',
            borderRadius: 8,
            padding: 6,
            flexShrink: 0,
          }}
        >
          <QRVisual seed={qrSeed} />
        </div>

        {/* Copy */}
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 6 }}>
            Invite at your next SHG meeting
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.55 }}>
            Show this code at your next SHG meeting. Each member scans to join your Circle.
          </p>
        </div>
      </div>
    </motion.div>
  )
}

// ── Members tab ───────────────────────────────────────────────────────────────

function MembersTab() {
  const userName      = useAppStore(s => s.userName)
  const completedMods = useAppStore(s => s.completedModules)
  const streakDays    = useAppStore(s => s.streakDays)
  const fearType      = useAppStore(s => s.fearType) ?? 'loss'

  const me = {
    name:             userName || 'You',
    city:             'My City',
    modulesCompleted: completedMods.length,
    streak:           streakDays,
    fearType,
    isMe:             true,
  }

  const allMembers = [
    me,
    ...MOCK_CIRCLE_MEMBERS.map(m => ({ ...m, isMe: false })),
  ]

  const totalModules  = allMembers.reduce((a, m) => a + m.modulesCompleted, 0)
  const longestStreak = Math.max(...allMembers.map(m => m.streak))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {allMembers.map((m, i) => (
        <motion.div
          key={m.name + i}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05, duration: 0.25 }}
          style={{
            ...cardStyle,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            border: m.isMe
              ? `1px solid ${FEAR_COLORS[m.fearType] ?? '#378ADD'}55`
              : '1px solid rgba(255,255,255,0.08)',
            background: m.isMe
              ? `rgba(${hexToRgb(FEAR_COLORS[m.fearType] ?? '#378ADD')},0.08)`
              : 'rgba(255,255,255,0.04)',
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: (FEAR_COLORS[m.fearType] ?? '#378ADD') + '33',
              border: `2px solid ${FEAR_COLORS[m.fearType] ?? '#378ADD'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 700,
              color: FEAR_COLORS[m.fearType] ?? '#378ADD',
              flexShrink: 0,
            }}
          >
            {getInitials(m.name)}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: '#fff' }}>{m.name}</span>
              {m.isMe && (
                <span style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: FEAR_COLORS[m.fearType],
                  background: FEAR_COLORS[m.fearType] + '22',
                  borderRadius: 99,
                  padding: '2px 8px',
                }}>You</span>
              )}
            </div>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
              {m.city}
            </p>
          </div>

          {/* Stats */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>
              {m.modulesCompleted} modules
            </p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
              🔥 {m.streak} day streak
            </p>
          </div>
        </motion.div>
      ))}

      {/* Collective stats */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: allMembers.length * 0.05 + 0.1 }}
        style={{
          ...cardStyle,
          background: 'rgba(29,158,117,0.08)',
          border: '1px solid rgba(29,158,117,0.2)',
        }}
      >
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 10, fontWeight: 600 }}>
          CIRCLE STRENGTH
        </p>
        <div style={{ display: 'flex', gap: 32 }}>
          <div>
            <p style={{ fontSize: 22, fontWeight: 800, color: '#1D9E75' }}>{totalModules}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>total modules</p>
          </div>
          <div>
            <p style={{ fontSize: 22, fontWeight: 800, color: '#EF9F27' }}>{longestStreak}</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>longest streak</p>
          </div>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'flex-end' }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'right', fontStyle: 'italic' }}>
              Your circle is stronger together
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

// ── Milestones tab ────────────────────────────────────────────────────────────

function MilestonesTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {CIRCLE_MILESTONES.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08, duration: 0.3 }}
          style={{
            ...cardStyle,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#1D9E75',
              flexShrink: 0,
            }}
          />
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.85)', margin: 0 }}>
            {item}
          </p>
        </motion.div>
      ))}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: CIRCLE_MILESTONES.length * 0.08 + 0.1 }}
        style={{
          fontSize: 13,
          color: 'rgba(255,255,255,0.35)',
          textAlign: 'center',
          marginTop: 8,
          fontStyle: 'italic',
        }}
      >
        Be the next milestone ✨
      </motion.p>
    </div>
  )
}

// ── Ask the Room tab ──────────────────────────────────────────────────────────

function AskRoomTab() {
  const [question, setQuestion] = useState('')
  const [posted, setPosted]     = useState(false)
  const textareaRef             = useRef<HTMLTextAreaElement>(null)

  const handlePost = () => {
    if (!question.trim()) return
    setPosted(true)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={cardStyle}>
        <textarea
          ref={textareaRef}
          value={question}
          onChange={e => setQuestion(e.target.value)}
          rows={4}
          placeholder="Ask your circle anything about investing..."
          style={{
            width: '100%',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 12,
            color: '#fff',
            fontSize: 14,
            padding: '12px 14px',
            outline: 'none',
            resize: 'none',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
            lineHeight: 1.6,
          }}
        />
        <button
          onClick={handlePost}
          style={{
            marginTop: 12,
            padding: '10px 24px',
            borderRadius: 12,
            background: posted ? 'rgba(29,158,117,0.7)' : 'rgba(55,138,221,0.85)',
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            cursor: posted ? 'default' : 'pointer',
            border: 'none',
            transition: 'all 0.2s',
          }}
        >
          {posted ? '✓ Posted' : 'Post to Circle'}
        </button>
      </div>

      <AnimatePresence>
        {posted && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35 }}
            style={{
              ...cardStyle,
              background: 'rgba(29,158,117,0.08)',
              border: '1px solid rgba(29,158,117,0.25)',
            }}
          >
            {/* Avatar + name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(29,158,117,0.2)',
                  border: '2px solid #1D9E75',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#1D9E75',
                  flexShrink: 0,
                }}
              >
                MR
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: 13, color: '#fff', margin: 0 }}>Meena R.</p>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Chennai · just now</p>
              </div>
            </div>
            <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', lineHeight: 1.65, margin: 0 }}>
              "I was nervous too at first. I started with ₹100 and now I handle all our household investments.{' '}
              <span style={{ color: '#fff', fontWeight: 600 }}>Just start.</span>"
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center', lineHeight: 1.6 }}>
        Responses from real community members may take 24–48 hours.
        <br />This is a judgment-free space.
      </p>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function SHGCircle() {
  const circleId    = useAppStore(s => s.circleId)
  const storeName   = useAppStore(s => s.circleName)
  const _setCircle  = useAppStore(s => s.setCircle)

  const [joined,     setJoined]   = useState(!!circleId)
  const [activeTab,  setActiveTab] = useState<'members' | 'milestones' | 'ask'>('members')

  // When joining / creating, sync the local `joined` flag
  const handleJoined = () => setJoined(true)

  // Derive display name for the dashboard header
  const displayName = storeName || 'My Circle'

  return (
    <div
      style={{
        ...cardStyle,
        padding: '28px 28px',
      }}
    >
      {/* Section label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'rgba(29,158,117,0.15)',
            border: '1px solid rgba(29,158,117,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
          }}
        >
          🤝
        </div>
        <div>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 600, letterSpacing: '0.05em', margin: 0 }}>
            SHG CIRCLE
          </p>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#fff', margin: 0 }}>
            {joined ? displayName : 'Community'}
          </h3>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!joined ? (
          <JoinCreateScreen key="join" onJoined={handleJoined} />
        ) : (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0 }}>
                  {displayName}
                </h2>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#1D9E75',
                    background: 'rgba(29,158,117,0.15)',
                    borderRadius: 99,
                    padding: '3px 10px',
                    border: '1px solid rgba(29,158,117,0.25)',
                  }}
                >
                  Your Circle
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>
                {MOCK_CIRCLE_MEMBERS.length + 1} members · All investing together
              </p>
            </div>

            {/* Tabs */}
            <div
              style={{
                display: 'flex',
                gap: 4,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 999,
                padding: 4,
                marginBottom: 20,
                width: 'fit-content',
              }}
            >
              <TabBtn label="Members"     active={activeTab === 'members'}     onClick={() => setActiveTab('members')} />
              <TabBtn label="Milestones"  active={activeTab === 'milestones'}  onClick={() => setActiveTab('milestones')} />
              <TabBtn label="Ask the Room" active={activeTab === 'ask'}        onClick={() => setActiveTab('ask')} />
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              {activeTab === 'members' && (
                <motion.div key="members" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <MembersTab />
                </motion.div>
              )}
              {activeTab === 'milestones' && (
                <motion.div key="milestones" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <MilestonesTab />
                </motion.div>
              )}
              {activeTab === 'ask' && (
                <motion.div key="ask" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <AskRoomTab />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Utility ───────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `${r},${g},${b}`
}
