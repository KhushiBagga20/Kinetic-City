import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useRef, useState, useMemo } from 'react'
import { CRASH_HISTORY, type CrashEvent } from '../../lib/crashData'

// ── Severity → circle size ──────────────────────────────────────────────────

const SEVERITY_SIZE: Record<CrashEvent['severity'], number> = {
  moderate: 6,
  severe: 10,
  extreme: 14,
}

const getShortName = (name: string) => {
  const n = name.toLowerCase()
  if (n.includes('dot-com')) return 'Dot-com'
  if (n.includes('9/11')) return '9/11'
  if (n.includes('2004')) return '2004 Elec.'
  if (n.includes('2006')) return '2006'
  if (n.includes('2008')) return '2008 GFC'
  if (n.includes('2010')) return '2010'
  if (n.includes('2015') || n.includes('chinese')) return '2015-16'
  if (n.includes('demonet')) return 'Demonet.'
  if (n.includes('il&fs')) return 'IL&FS'
  if (n.includes('covid')) return 'COVID-19'
  if (n.includes('2022')) return '2022'
  return name.length > 10 ? name.slice(0, 10) : name
}

// ── Tooltip Component ───────────────────────────────────────────────────────

function CrashTooltip({ crash, position }: { crash: CrashEvent; position: 'above' | 'below' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: position === 'above' ? 8 : -8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: position === 'above' ? 8 : -8, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute z-50 w-[280px] rounded-2xl overflow-hidden pointer-events-none"
      style={{
        [position === 'above' ? 'bottom' : 'top']: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginBottom: position === 'above' ? '12px' : undefined,
        marginTop: position === 'below' ? '12px' : undefined,
      }}
    >
      {/* Top half — danger tinted */}
      <div className="p-4" style={{ background: 'rgba(226,75,74,0.08)', borderBottom: '1px solid rgba(226,75,74,0.12)' }}>
        <p className="font-display font-semibold text-sm text-white mb-1">{crash.name}</p>
        <p className="font-mono text-[10px] text-white/30 mb-2">{crash.startDate} → {crash.recoveryDate}</p>
        <p className="font-sans text-xs text-white/50 leading-relaxed mb-2">{crash.cause}</p>
        <div className="flex items-center gap-3">
          <div>
            <p className="text-[8px] font-sans text-white/25 uppercase">Drop</p>
            <p className="font-mono text-sm font-bold" style={{ color: 'var(--danger)' }}>{crash.niftyPeakToDrop}%</p>
          </div>
        </div>
      </div>
      {/* Bottom half — teal tinted */}
      <div className="p-4" style={{ background: 'rgba(29,158,117,0.06)' }}>
        <div className="flex items-center gap-4 mb-3">
          <div>
            <p className="text-[8px] font-sans text-white/25 uppercase">Recovery</p>
            <p className="font-mono text-sm font-bold" style={{ color: 'var(--teal)' }}>{crash.recoveryMonths} months</p>
          </div>
          <div>
            <p className="text-[8px] font-sans text-white/25 uppercase">Next year</p>
            <p className="font-mono text-sm font-bold" style={{ color: 'var(--teal)' }}>
              {crash.nextYearReturn > 0 ? '+' : ''}{crash.nextYearReturn}%
            </p>
          </div>
        </div>
        <p className="font-sans text-[11px] text-white/40 leading-relaxed italic">{crash.lessonFromKinu}</p>
      </div>
    </motion.div>
  )
}

// ── Desktop V-Shape ─────────────────────────────────────────────────────────

function CrashV({
  crash,
  index,
  totalCrashes,
  containerWidth,
  isInView,
}: {
  crash: CrashEvent
  index: number
  totalCrashes: number
  containerWidth: number
  isInView: boolean
}) {
  const [hovered, setHovered] = useState(false)

  // Position each V evenly across the timeline
  const spacing = containerWidth / (totalCrashes + 1)
  const cx = spacing * (index + 1)

  // Depth proportional to drop severity (normalized)
  const maxDrop = 60
  const depth = (Math.abs(crash.niftyPeakToDrop) / maxDrop) * 60 + 20
  const circleR = SEVERITY_SIZE[crash.severity]

  // Base Y for the horizontal line
  const baseY = 150
  const bottomY = baseY + depth

  // Stagger offsets
  const yOffsets = [30, 55, 80]
  const labelY = baseY - yOffsets[index % 3]
  const textAnchor = index === 0 ? 'start' : index === totalCrashes - 1 ? 'end' : 'middle'

  // V-shape points
  const leftX = cx - 18
  const rightX = cx + 18

  // Animation timing
  const baseDelay = 0.8 + index * 0.2
  const redDuration = 0.3
  const pauseAfterRed = 0.4
  const greenDelay = baseDelay + redDuration + pauseAfterRed
  const greenDuration = 0.8

  return (
    <g
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ cursor: 'pointer' }}
    >
      {/* Red descent line */}
      <motion.line
        x1={leftX} y1={baseY} x2={cx} y2={bottomY}
        stroke="var(--danger)" strokeWidth="2" strokeLinecap="round"
        strokeOpacity={0.6}
        initial={{ pathLength: 0 }}
        animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: redDuration, delay: baseDelay, ease: 'easeOut' }}
      />

      {/* Bottom circle */}
      <motion.circle
        cx={cx} cy={bottomY} r={circleR}
        fill="var(--danger)" fillOpacity={0.3}
        stroke="var(--danger)" strokeWidth="1.5"
        initial={{ scale: 0, opacity: 0 }}
        animate={isInView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
        transition={{ duration: 0.3, delay: baseDelay + redDuration }}
      />

      {/* Teal recovery line */}
      <motion.line
        x1={cx} y1={bottomY} x2={rightX} y2={baseY}
        stroke="var(--teal)" strokeWidth="2" strokeLinecap="round"
        strokeOpacity={0.8}
        initial={{ pathLength: 0 }}
        animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: greenDuration, delay: greenDelay, ease: 'easeOut' }}
      />

      {/* Breakthrough glow at the top of recovery */}
      <motion.circle
        cx={rightX} cy={baseY} r={6}
        fill="var(--teal)" fillOpacity={0}
        initial={{ fillOpacity: 0, r: 4 }}
        animate={isInView ? { fillOpacity: [0, 0.4, 0], r: [4, 12, 8] } : {}}
        transition={{ duration: 1.5, delay: greenDelay + greenDuration, ease: 'easeOut' }}
      />

      {/* Labels above V */}
      <motion.g
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.4, delay: baseDelay + 0.3 }}
      >
        <text
          x={cx} y={labelY}
          textAnchor={textAnchor}
          className="font-sans"
          style={{ fontSize: '9px', fontWeight: 600, fill: 'rgba(255,255,255,0.6)', letterSpacing: '0.08em', textTransform: 'uppercase' }}
        >
          {getShortName(crash.name)}
        </text>
        <text
          x={cx} y={labelY} dy="11"
          textAnchor={textAnchor}
          className="font-mono"
          style={{ fontSize: '8px', fill: 'var(--danger)' }}
        >
          {crash.niftyPeakToDrop}% {crash.recoveryMonths}m
        </text>
      </motion.g>

      {/* Hover tooltip — rendered as HTML overlay via foreignObject */}
      {hovered && (
        <foreignObject x={cx - 140} y={baseY - 240} width={280} height={230} style={{ overflow: 'visible' }}>
          <AnimatePresence>
            <CrashTooltip crash={crash} position="above" />
          </AnimatePresence>
        </foreignObject>
      )}
    </g>
  )
}

// ── Mobile Crash Bar ────────────────────────────────────────────────────────

function CrashBar({ crash, index, isInView }: { crash: CrashEvent; index: number; isInView: boolean }) {
  const [expanded, setExpanded] = useState(false)
  const barWidth = Math.abs(crash.niftyPeakToDrop) / 60 * 100
  const circleR = SEVERITY_SIZE[crash.severity]

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      className="rounded-xl p-4 border cursor-pointer"
      style={{ background: 'var(--surface)', borderColor: expanded ? 'rgba(29,158,117,0.2)' : 'var(--border)' }}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="rounded-full" style={{
            width: circleR * 2 + 4,
            height: circleR * 2 + 4,
            background: crash.severity === 'extreme' ? 'rgba(226,75,74,0.2)' : 'rgba(226,75,74,0.1)',
            border: '1px solid rgba(226,75,74,0.3)',
          }} />
          <p className="font-sans text-xs font-medium text-white/70">{crash.name}</p>
        </div>
        <p className="font-mono text-[10px] text-white/25">{crash.startDate}</p>
      </div>

      {/* Bar visualization */}
      <div className="flex items-center gap-1 h-3 mb-1">
        <motion.div
          className="h-full rounded-l-sm"
          style={{ background: 'var(--danger)', opacity: 0.6 }}
          initial={{ width: 0 }}
          animate={isInView ? { width: `${barWidth * 0.5}%` } : {}}
          transition={{ duration: 0.3, delay: index * 0.08 + 0.3 }}
        />
        <motion.div
          className="h-full rounded-r-sm"
          style={{ background: 'var(--teal)', opacity: 0.8 }}
          initial={{ width: 0 }}
          animate={isInView ? { width: `${barWidth * 0.5}%` } : {}}
          transition={{ duration: 0.8, delay: index * 0.08 + 0.7 }}
        />
        <div className="flex-1" />
        <span className="font-mono text-[9px] shrink-0" style={{ color: 'var(--danger)' }}>{crash.niftyPeakToDrop}%</span>
        <span className="font-mono text-[9px] shrink-0" style={{ color: 'var(--teal)' }}>{crash.recoveryMonths}m</span>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 mt-3" style={{ borderTop: '1px solid var(--border)' }}>
              {/* Top: what happened */}
              <div className="rounded-lg p-3 mb-2" style={{ background: 'rgba(226,75,74,0.05)' }}>
                <p className="font-sans text-[10px] text-white/40 leading-relaxed">{crash.cause}</p>
              </div>
              {/* Bottom: what came after */}
              <div className="rounded-lg p-3" style={{ background: 'rgba(29,158,117,0.05)' }}>
                <div className="flex gap-4 mb-2">
                  <div>
                    <p className="text-[8px] font-sans text-white/25 uppercase">Recovery</p>
                    <p className="font-mono text-xs font-bold" style={{ color: 'var(--teal)' }}>{crash.recoveryMonths}m</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-sans text-white/25 uppercase">Next year</p>
                    <p className="font-mono text-xs font-bold" style={{ color: 'var(--teal)' }}>
                      {crash.nextYearReturn > 0 ? '+' : ''}{crash.nextYearReturn}%
                    </p>
                  </div>
                </div>
                <p className="font-sans text-[10px] text-white/35 italic leading-relaxed">{crash.lessonFromKinu}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ── Main Component ──────────────────────────────────────────────────────────

export default function CrashTimeline() {
  const containerRef = useRef<HTMLDivElement>(null)
  const isInView = useInView(containerRef, { once: true, margin: '-80px' })

  // Timeline dimensions (dynamic based on crashes length)
  const crashes = useMemo(() => CRASH_HISTORY, [])
  const allVsDelay = 0.8 + crashes.length * 0.2 + 1.2 // time for all Vs to finish
  
  const minGap = 80
  const svgWidth = Math.max(900, (crashes.length + 1) * minGap)
  const svgHeight = 270
  const baseY = 150

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="rounded-3xl p-6 md:p-8 border"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      {/* Desktop: SVG timeline */}
      <div className="hidden md:block overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
        <div style={{ minWidth: `${svgWidth}px` }}>
          <svg
            viewBox={`-80 0 ${svgWidth + 160} ${svgHeight}`}
            className="w-full"
            style={{ overflow: 'visible' }}
          >
            {/* Timeline baseline */}
            <motion.line
              x1={20} y1={baseY} x2={svgWidth - 20} y2={baseY}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="1"
              strokeLinecap="round"
              initial={{ pathLength: 0 }}
              animate={isInView ? { pathLength: 1 } : { pathLength: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
            />

            {/* Year markers along baseline */}
            {[2000, 2004, 2008, 2012, 2016, 2020, 2024].map((year, i) => {
              const x = 20 + ((year - 2000) / 24) * (svgWidth - 40)
              return (
                <motion.g
                  key={year}
                  initial={{ opacity: 0 }}
                  animate={isInView ? { opacity: 1 } : {}}
                  transition={{ delay: 0.3 + i * 0.05 }}
                >
                  <line x1={x} y1={baseY - 3} x2={x} y2={baseY + 3} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                  <text x={x} y={baseY + 16} textAnchor="middle"
                    style={{ fontSize: '8px', fill: 'rgba(255,255,255,0.2)', fontFamily: 'Inter, monospace' }}>
                    {year}
                  </text>
                </motion.g>
              )
            })}

            {/* Crash V-shapes */}
            {crashes.map((crash, i) => (
              <CrashV
                key={crash.name}
                crash={crash}
                index={i}
                totalCrashes={crashes.length}
                containerWidth={svgWidth - 40}
                isInView={isInView}
              />
            ))}
          </svg>
        </div>
      </div>

      {/* Mobile: vertical list */}
      <div className="md:hidden space-y-2">
        {crashes.map((crash, i) => (
          <CrashBar key={crash.name} crash={crash} index={i} isInView={isInView} />
        ))}
      </div>

      {/* Bottom tagline */}
      <motion.p
        className="font-sans text-sm text-center mt-8 leading-relaxed max-w-xl mx-auto"
        style={{ color: 'var(--accent)' }}
        initial={{ opacity: 0, y: 10 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6, delay: allVsDelay }}
      >
        Every single crash on this chart recovered. Every one. The only investors who lost were those who sold at the bottom.
      </motion.p>
    </motion.div>
  )
}
