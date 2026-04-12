import { motion } from 'framer-motion'
import { useRef, useState } from 'react'
import { useAppStore, type FearType } from '../../../store/useAppStore'
import { formatINR } from '../../../lib/formatINR'
import { Check, Download, Copy, ArrowRight, Palette, Type, BarChart3 } from 'lucide-react'
import FearQuote from '../shared/FearQuote'

// ── Fear data ───────────────────────────────────────────────────────────────

const FEAR_NAMES: Record<FearType, string> = {
  loss: 'Loss Avoider', jargon: 'Clarity Seeker', scam: 'Pattern Detector', trust: 'Independence Guardian',
}

const FEAR_COLORS: Record<FearType, string> = {
  loss: '#E24B4A', jargon: '#378ADD', scam: '#EF9F27', trust: '#1D9E75',
}

const HEADLINE_OPTIONS = [
  'I faced my investing fear.',
  'I stopped guessing. I started learning.',
  'My data. My decisions. My growth.',
  'Zero financial advice. Pure financial clarity.',
  'Fear is a signal, not a stop sign.',
  'The market doesn\'t care about feelings. I do.',
]

const STAT_OPTIONS: { key: string; label: string; locked?: boolean }[] = [
  { key: 'fear-type', label: 'Fear type', locked: true },
  { key: 'sip', label: 'Monthly SIP' },
  { key: 'median', label: 'Median outcome' },
  { key: 'streak', label: 'Streak' },
  { key: 'modules', label: 'Modules completed' },
  { key: 'sandbox', label: 'Sandbox result' },
]

const STYLE_OPTIONS: { key: 'dark' | 'minimal' | 'fear'; label: string }[] = [
  { key: 'dark', label: 'Dark' },
  { key: 'minimal', label: 'Minimal' },
  { key: 'fear', label: 'Fear colour' },
]

// ── Style helpers ───────────────────────────────────────────────────────────

function getCardStyles(style: string, fearColor: string) {
  switch (style) {
    case 'minimal':
      return {
        bg: '#0d0d12',
        border: 'rgba(255,255,255,0.04)',
        accentLine: 'rgba(255,255,255,0.12)',
        textPrimary: 'rgba(255,255,255,0.85)',
        textSecondary: 'rgba(255,255,255,0.25)',
        brandColor: 'rgba(255,255,255,0.5)',
      }
    case 'fear':
      return {
        bg: '#0a0a0f',
        border: `${fearColor}25`,
        accentLine: fearColor,
        textPrimary: '#ffffff',
        textSecondary: `${fearColor}70`,
        brandColor: fearColor,
      }
    default: // dark
      return {
        bg: '#0a0a0f',
        border: 'rgba(255,255,255,0.08)',
        accentLine: '#c0f18e',
        textPrimary: '#ffffff',
        textSecondary: 'rgba(255,255,255,0.3)',
        brandColor: '#c0f18e',
      }
  }
}

// ── Component ───────────────────────────────────────────────────────────────

export default function MyCardPage() {
  const fearType = useAppStore(s => s.fearType) ?? 'loss'
  const monthlyAmount = useAppStore(s => s.monthlyAmount)
  const years = useAppStore(s => s.years)
  const simulationResult = useAppStore(s => s.simulationResult)
  const sandboxResult = useAppStore(s => s.sandboxResult)
  const completedModules = useAppStore(s => s.completedModules)
  const streakDays = useAppStore(s => s.streakDays)
  const setDashboardSection = useAppStore(s => s.setDashboardSection)
  const rawName = useAppStore(s => s.userName)
  const displayName = rawName && rawName !== 'Explorer' ? rawName : ''

  // Card customisation state
  const cardStyle = useAppStore(s => s.cardStyle)
  const setCardStyle = useAppStore(s => s.setCardStyle)
  const cardHeadline = useAppStore(s => s.cardHeadline)
  const setCardHeadline = useAppStore(s => s.setCardHeadline)
  const cardVisibleStats = useAppStore(s => s.cardVisibleStats)
  const setCardVisibleStats = useAppStore(s => s.setCardVisibleStats)

  const cardRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [customHeadline, setCustomHeadline] = useState('')
  const [useCustomHeadline, setUseCustomHeadline] = useState(false)

  const color = FEAR_COLORS[fearType]
  const styles = getCardStyles(cardStyle, color)
  const hasSimulation = !!simulationResult
  const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  const headline = useCustomHeadline ? customHeadline : (cardHeadline || HEADLINE_OPTIONS[0])

  const toggleStat = (key: string) => {
    if (key === 'fear-type') return // locked
    const next = cardVisibleStats.includes(key)
      ? cardVisibleStats.filter(s => s !== key)
      : [...cardVisibleStats, key]
    setCardVisibleStats(next)
  }

  const statValues: Record<string, string> = {
    'fear-type': FEAR_NAMES[fearType],
    'sip': `₹${monthlyAmount.toLocaleString('en-IN')}/mo`,
    'median': simulationResult ? formatINR(simulationResult.p50) : '—',
    'streak': `${streakDays} day${streakDays !== 1 ? 's' : ''}`,
    'modules': `${completedModules.length} done`,
    'sandbox': sandboxResult ? formatINR(sandboxResult.finalValue) : '—',
  }

  const statLabels: Record<string, string> = {
    'fear-type': 'Fear type',
    'sip': 'Monthly SIP',
    'median': 'Median outcome',
    'streak': 'Learning streak',
    'modules': 'Modules',
    'sandbox': 'Sandbox result',
  }

  const shareText = `I'm a ${FEAR_NAMES[fearType]}. I simulated investing ₹${monthlyAmount.toLocaleString('en-IN')}/month for ${years} years and my median outcome is ${simulationResult ? formatINR(simulationResult.p50) : '—'}. Try Kinetic →`

  const handleDownload = async () => {
    if (!cardRef.current) return
    setDownloading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const canvas = await html2canvas(cardRef.current, {
        backgroundColor: styles.bg,
        scale: 3,
        useCORS: true,
      })
      const link = document.createElement('a')
      link.download = `kinetic-${fearType}-card.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Failed to generate card image:', err)
    } finally {
      setDownloading(false)
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = shareText
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8 items-start">

        {/* ── LEFT: Card Preview ─────────────────────────────────────────── */}
        <div className="flex justify-center lg:justify-start lg:sticky lg:top-6">
          <div
            ref={cardRef}
            className="relative overflow-hidden transition-[border-color,background-color] duration-300"
            style={{
              width: '400px',
              height: '600px',
              background: styles.bg,
              border: `1px solid ${styles.border}`,
              borderRadius: '24px',
            }}
          >
            {/* Noise texture */}
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\' opacity=\'0.4\'/%3E%3C/svg%3E")',
              backgroundSize: '128px 128px',
            }} />

            <div className="relative h-full flex flex-col px-8 py-8">
              {/* Top */}
              <div className="flex justify-between items-start mb-10">
                <p className="text-[10px] font-sans font-bold tracking-[0.2em] uppercase" style={{ color: styles.brandColor }}>KINETIC</p>
                <div className="w-3 h-3 rounded-full" style={{ background: color }} />
              </div>

              {/* Fear type name */}
              {displayName && (
                <p className="font-display font-medium text-sm mb-1" style={{ color: `${styles.textPrimary}80` }}>
                  {displayName}
                </p>
              )}
              <h2 className="font-display font-bold text-3xl mb-3 leading-tight" style={{ color: styles.textPrimary }}>
                {FEAR_NAMES[fearType]}
              </h2>
              <div className="h-[2px] w-full mb-8" style={{ background: styles.accentLine }} />

              {/* Stats */}
              <div className="space-y-5 flex-1">
                {cardVisibleStats.map(key => (
                  <div key={key} className="flex justify-between">
                    <span className="font-sans text-xs" style={{ color: styles.textSecondary }}>{statLabels[key]}</span>
                    <span className="font-mono text-sm" style={{ color: key === 'fear-type' ? color : `${styles.textPrimary}b3` }}>
                      {statValues[key]}
                    </span>
                  </div>
                ))}
              </div>

              {/* Headline */}
              <div className="mt-auto">
                <p className="font-sans text-sm italic mb-6" style={{ color: `${styles.textPrimary}66` }}>{headline}</p>
                <div className="flex justify-between items-end">
                  <p className="text-[9px] font-sans" style={{ color: styles.brandColor }}>kinetic.in</p>
                  <p className="text-[9px] font-sans" style={{ color: styles.textSecondary }}>{today}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Customisation Panel ───────────────────────────────────── */}
        <div className="space-y-6">
          <div>
            <h2 className="font-display font-semibold text-2xl text-white mb-2 tracking-tight">{displayName ? `${displayName}'s Fear Fingerprint` : 'Your Fear Fingerprint'}</h2>
            <p className="font-sans text-sm text-white/40">Customise your card, then download or share.</p>
            <FearQuote context="card" variant="subtle" className="mt-3" />
          </div>

          {/* 1. Card Style */}
          <div className="rounded-3xl p-6 border space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Palette className="w-3.5 h-3.5 text-white/25" />
              <p className="font-sans text-xs text-white/40 uppercase tracking-wider font-bold">Card style</p>
            </div>
            <div className="flex gap-2">
              {STYLE_OPTIONS.map(opt => (
                <button
                  key={opt.key}
                  onClick={() => setCardStyle(opt.key)}
                  className="flex-1 py-3 rounded-xl font-sans text-sm font-medium border transition-[background-color,border-color,color] duration-200"
                  style={{
                    background: cardStyle === opt.key ? 'rgba(192,241,142,0.06)' : 'transparent',
                    borderColor: cardStyle === opt.key ? 'rgba(192,241,142,0.2)' : 'var(--border)',
                    color: cardStyle === opt.key ? 'var(--accent)' : 'rgba(255,255,255,0.35)',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Headline */}
          <div className="rounded-3xl p-6 border space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2 mb-1">
              <Type className="w-3.5 h-3.5 text-white/25" />
              <p className="font-sans text-xs text-white/40 uppercase tracking-wider font-bold">Headline</p>
            </div>
            <div className="space-y-2">
              {HEADLINE_OPTIONS.map((h, i) => (
                <button
                  key={i}
                  onClick={() => { setCardHeadline(h); setUseCustomHeadline(false) }}
                  className="w-full text-left py-2.5 px-3.5 rounded-xl font-sans text-sm border transition-[background-color,border-color,color] duration-200"
                  style={{
                    background: !useCustomHeadline && (cardHeadline || HEADLINE_OPTIONS[0]) === h ? 'rgba(192,241,142,0.06)' : 'transparent',
                    borderColor: !useCustomHeadline && (cardHeadline || HEADLINE_OPTIONS[0]) === h ? 'rgba(192,241,142,0.18)' : 'var(--border)',
                    color: !useCustomHeadline && (cardHeadline || HEADLINE_OPTIONS[0]) === h ? 'var(--accent)' : 'rgba(255,255,255,0.4)',
                  }}
                >
                  {h}
                </button>
              ))}
              <div className="pt-2">
                <input
                  type="text"
                  value={customHeadline}
                  onChange={e => { setCustomHeadline(e.target.value); setUseCustomHeadline(true) }}
                  placeholder="Write your own..."
                  className="w-full bg-transparent border rounded-xl px-4 py-3 font-sans text-sm text-white outline-none placeholder:text-white/15 focus:border-[rgba(192,241,142,0.25)] transition-[border-color] duration-200"
                  style={{ borderColor: useCustomHeadline ? 'rgba(192,241,142,0.18)' : 'var(--border)' }}
                />
              </div>
            </div>
          </div>

          {/* 3. Visible Stats */}
          <div className="rounded-3xl p-6 border space-y-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2 mb-1">
              <BarChart3 className="w-3.5 h-3.5 text-white/25" />
              <p className="font-sans text-xs text-white/40 uppercase tracking-wider font-bold">Visible stats</p>
            </div>
            <div className="space-y-2">
              {STAT_OPTIONS.map(opt => {
                const isOn = cardVisibleStats.includes(opt.key)
                return (
                  <button
                    key={opt.key}
                    onClick={() => toggleStat(opt.key)}
                    disabled={opt.locked}
                    className="w-full flex items-center justify-between p-3 rounded-xl border transition-[background-color,border-color] duration-200"
                    style={{
                      background: isOn ? 'rgba(29,158,117,0.04)' : 'transparent',
                      borderColor: isOn ? 'rgba(29,158,117,0.15)' : 'var(--border)',
                      cursor: opt.locked ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <span className="font-sans text-sm" style={{ color: isOn ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)' }}>
                      {opt.label}
                      {opt.locked && <span className="text-[9px] ml-2 text-white/15">(always on)</span>}
                    </span>
                    <div className="w-5 h-5 rounded border flex items-center justify-center" style={{ borderColor: isOn ? 'var(--teal)' : 'var(--border)' }}>
                      {isOn && <Check className="w-3 h-3" style={{ color: 'var(--teal)' }} />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Download */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full py-4 rounded-full font-sans font-bold text-sm text-[#0a1a00] flex items-center justify-center gap-2 active:scale-[0.97] disabled:opacity-50 transition-[opacity,transform] duration-200 box-glow"
            style={{ background: 'var(--accent)' }}
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Generating your card...' : 'Download my card'}
          </button>

          {/* Share text */}
          <div className="rounded-3xl p-6 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <p className="font-sans text-xs text-white/30 mb-3">Share your journey:</p>
            <p className="font-sans text-sm text-white/55 leading-relaxed mb-4">{shareText}</p>
            <button onClick={handleCopy} className="flex items-center gap-2 text-sm font-sans font-medium transition-[color] duration-200" style={{ color: copied ? 'var(--teal)' : 'var(--accent)' }}>
              <Copy className="w-3.5 h-3.5" />
              {copied ? 'Copied!' : 'Copy text'}
            </button>
          </div>

          {/* Prompt if no simulation */}
          {!hasSimulation && (
            <div className="rounded-3xl p-6 border" style={{ background: 'var(--surface)', borderColor: 'var(--accent)', borderStyle: 'dashed' }}>
              <p className="font-sans text-sm text-white/50 mb-4">Run your simulation first to complete your card.</p>
              <button
                onClick={() => setDashboardSection('simulation')}
                className="px-6 py-3 rounded-full font-sans font-bold text-sm text-[#0a1a00] flex items-center gap-2 active:scale-[0.97] transition-transform duration-200"
                style={{ background: 'var(--accent)' }}
              >
                Go to My Simulation <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
