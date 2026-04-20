import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { Mic, MicOff, Send, X, ArrowRight } from 'lucide-react'
import { useAppStore, type FearType } from '../../../store/useAppStore'
import { useKinu } from '../../../hooks/useKinu'

const GREETINGS: Record<FearType, string> = {
  loss: "Hey! Markets dip, people panic, SIPs win. What's worrying you right now?",
  jargon: "No jargon — promise. What investing term or concept has been confusing you?",
  scam: "Skepticism is a superpower. Ask me anything and I'll prove it with SEBI data.",
  trust: "Math over humans, always. What do you want to verify today?",
}

// Quick nav shortcuts shown in the overlay
const NAV_SHORTCUTS = [
  { label: 'Modules', cmd: 'take me to learn' },
  { label: 'Simulator', cmd: 'open simulator' },
  { label: 'Portfolio', cmd: 'show my portfolio' },
  { label: 'Time Machine', cmd: 'open time machine' },
]

// ── Addition B: contextual nudge per section ──────────────────────────────────
const NUDGE_MAP: Record<string, string> = {
  'time-machine': 'How does this simulation work?',
  'learn': 'Quiz me on this module',
  'portfolio': 'Is my allocation healthy?',
  'sandbox': 'Explain what just happened',
}

// ── Addition C: contextual chips per section ──────────────────────────────────
const CONTEXT_CHIPS: Record<string, string[]> = {
  'time-machine': ['Why did the market crash?', 'Should I have stayed invested?'],
  'learn': ['Explain this simply', 'Give me an example'],
  'portfolio': ["What's a good allocation?", 'How do I calculate XIRR?'],
}

export default function KinuFloatingButton() {
  const [open, setOpen] = useState(false)
  const fearType = useAppStore(s => s.fearType) ?? 'loss'
  const dashboardSection = useAppStore(s => s.dashboardSection)
  const kinuIntroSeen = useAppStore(s => s.kinuIntroSeen)
  const setKinuIntroSeen = useAppStore(s => s.setKinuIntroSeen)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const greeting = GREETINGS[fearType]
  const { messages, input, setInput, isTyping, isListening, voiceError, sendMessage, startListening, stopListening } = useKinu(greeting)

  // ── Addition A state ────────────────────────────────────────────────────────
  const [showTooltip, setShowTooltip] = useState(false)

  // ── Addition B state ────────────────────────────────────────────────────────
  const [nudgeKey, setNudgeKey] = useState(dashboardSection)

  // ── Addition D state ────────────────────────────────────────────────────────
  const [shouldPulse, setShouldPulse] = useState(true)

  // ── Derived values ──────────────────────────────────────────────────────────
  const nudgeText = NUDGE_MAP[dashboardSection] ?? null
  const contextChips = CONTEXT_CHIPS[dashboardSection] ?? ["What's the safest investment?", 'Explain SIP to me']

  // ── Effect: focus/scroll on open ───────────────────────────────────────────
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300)
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    }
  }, [open, messages])

  // ── Addition A: first-time tooltip ─────────────────────────────────────────
  useEffect(() => {
    if (kinuIntroSeen || open) return
    const show = setTimeout(() => setShowTooltip(true), 3000)
    const hide = setTimeout(() => { setShowTooltip(false); setKinuIntroSeen() }, 8000)
    return () => { clearTimeout(show); clearTimeout(hide) }
  }, [kinuIntroSeen, open])

  // ── Addition B: nudge key sync ──────────────────────────────────────────────
  useEffect(() => { setNudgeKey(dashboardSection) }, [dashboardSection])

  // ── Addition D: pulse ring resets per section ───────────────────────────────
  useEffect(() => {
    setShouldPulse(true)
    const t = setTimeout(() => setShouldPulse(false), 30000)
    return () => clearTimeout(t)
  }, [dashboardSection])

  // ── Handler: open overlay (clears tooltip + marks intro seen) ───────────────
  function openOverlay() {
    setOpen(true)
    setShowTooltip(false)
    setKinuIntroSeen()
  }

  return (
    <>
      {/* ── Addition A: first-time tooltip ─────────────────────────────────── */}
      <AnimatePresence>
        {showTooltip && !open && (
          <motion.div
            key="kinu-tooltip"
            initial={{ scale: 0.8, opacity: 0, y: 0 }}
            animate={{ scale: 1, opacity: 1, y: -8 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            onClick={openOverlay}
            className="fixed bottom-24 right-6 z-[201] px-4 py-2.5 rounded-2xl text-[13px] text-white/80 whitespace-nowrap cursor-pointer relative"
            style={{ background: '#0f2a1f', border: '1px solid rgba(192,241,142,0.2)' }}
          >
            Ask me anything about investing →
            {/* Arrow pointing down-right toward FAB */}
            <div
              className="absolute -bottom-1.5 right-6 w-3 h-3 rotate-45"
              style={{
                background: '#0f2a1f',
                borderRight: '1px solid rgba(192,241,142,0.2)',
                borderBottom: '1px solid rgba(192,241,142,0.2)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Addition B: contextual nudge pill ──────────────────────────────── */}
      <AnimatePresence mode="wait">
        {!open && nudgeText && (
          <motion.button
            key={nudgeKey}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
            onClick={() => { setOpen(true); setTimeout(() => setInput(nudgeText), 350) }}
            className="fixed bottom-7 right-20 z-[199] rounded-full px-3 py-1.5 text-[12px] whitespace-nowrap cursor-pointer"
            style={{
              background: 'rgba(192,241,142,0.08)',
              border: '1px solid rgba(192,241,142,0.15)',
              color: '#c0f18e',
            }}
          >
            {nudgeText}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Floating K button — hidden when overlay is open */}
      <AnimatePresence>
        {!open && (
          <motion.button
            key="fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
            onClick={openOverlay}
            className="fixed bottom-6 right-6 z-[200] w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl cursor-pointer"
            style={{ background: 'var(--accent)', color: '#0a1a00' }}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
          >
            <span className="font-display font-black text-xl">K</span>
            {/* ── Addition D: pulse ring only when fresh ───────────────────── */}
            {shouldPulse && (
              <motion.div
                className="absolute inset-0 rounded-2xl"
                style={{ border: '2px solid var(--accent)' }}
                animate={{ scale: [1, 1.25], opacity: [0.4, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
              />
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat overlay (slides up from bottom) */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="overlay"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', stiffness: 280, damping: 28 }}
            className="fixed bottom-4 right-4 z-[300] flex flex-col rounded-3xl overflow-hidden shadow-2xl"
            style={{
              width: 'min(420px, calc(100vw - 32px))',
              height: 'min(600px, calc(100vh - 80px))',
              background: '#0a0a0f',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0d0d14' }}>
              <div className="relative">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-display font-bold"
                  style={{ background: 'rgba(192,241,142,0.1)', color: '#c0f18e', fontSize: 15 }}>
                  K
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2"
                  style={{ background: '#1D9E75', borderColor: '#0d0d14' }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display font-semibold text-sm text-white">KINU</p>
                <p className="font-sans text-[10px] truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {isListening ? '🎙 Listening…' : 'Your AI Financial Mentor'}
                </p>
              </div>
              <button onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
                style={{ color: 'rgba(255,255,255,0.35)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.8)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Addition C: contextual chips + nav shortcuts ──────────────── */}
            <div className="flex flex-col gap-0 px-4 pt-2.5 shrink-0"
              style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              {/* Context chips */}
              <div className="flex gap-2 flex-wrap mb-3">
                {contextChips.map(chip => (
                  <button key={chip} onClick={() => sendMessage(chip)}
                    className="rounded-full px-3 py-1.5 text-[12px] text-white/60 border cursor-pointer transition-colors"
                    style={{ background: 'rgba(192,241,142,0.05)', borderColor: 'rgba(192,241,142,0.12)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(192,241,142,0.1)'; e.currentTarget.style.color = '#c0f18e' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(192,241,142,0.05)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)' }}>
                    {chip}
                  </button>
                ))}
              </div>
              {/* Nav shortcuts */}
              <div className="flex gap-2 pb-2.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
                {NAV_SHORTCUTS.map(s => (
                  <button key={s.label}
                    onClick={() => sendMessage(s.cmd)}
                    className="shrink-0 px-3 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wider cursor-pointer transition-colors whitespace-nowrap"
                    style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.4)', border: '1px solid rgba(255,255,255,0.07)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(192,241,142,0.08)'; e.currentTarget.style.color = '#c0f18e'; e.currentTarget.style.borderColor = 'rgba(192,241,142,0.2)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.4)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}>
                    → {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
              style={{ scrollbarWidth: 'none' }}>
              {messages.map((msg, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className="max-w-[85%]">
                    <div className="rounded-2xl px-4 py-2.5"
                      style={{
                        background: msg.role === 'user' ? 'rgba(192,241,142,0.07)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${msg.role === 'user' ? 'rgba(192,241,142,0.15)' : 'rgba(255,255,255,0.07)'}`,
                      }}>
                      <p className="font-sans text-xs leading-relaxed whitespace-pre-wrap"
                        style={{ color: msg.role === 'user' ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.65)' }}>
                        {msg.content}
                      </p>
                    </div>
                    {msg.navAction && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
                        className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-sans"
                        style={{ background: 'rgba(192,241,142,0.08)', color: '#c0f18e', border: '1px solid rgba(192,241,142,0.2)' }}>
                        <ArrowRight className="w-3 h-3" />
                        Going to {msg.navAction.label}
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="rounded-2xl px-4 py-2.5 flex items-center gap-1.5"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: '#c0f18e' }}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }} />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Listening wave */}
            <AnimatePresence>
              {isListening && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="flex items-center justify-center gap-1 py-2"
                  style={{ background: 'rgba(192,241,142,0.04)' }}>
                  {[0, 1, 2, 3, 4].map(i => (
                    <motion.div key={i} className="w-1 rounded-full" style={{ background: '#c0f18e' }}
                      animate={{ height: [4, 14, 4] }}
                      transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.08 }} />
                  ))}
                  <span className="ml-2 font-sans text-[11px]" style={{ color: '#c0f18e' }}>Listening…</span>
                </motion.div>
              )}
            </AnimatePresence>

            {voiceError && (
              <p className="text-[10px] text-center px-4 pb-1" style={{ color: 'rgba(226,75,74,0.7)' }}>{voiceError}</p>
            )}

            {/* Input bar */}
            <div className="flex gap-2 px-4 py-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(input) } }}
                placeholder={isListening ? 'Listening…' : 'Ask or say "go to learn"…'}
                disabled={isListening}
                className="flex-1 bg-transparent border rounded-xl px-4 py-2.5 font-sans text-xs text-white outline-none placeholder:text-white/20 transition-[border-color] duration-200"
                style={{ borderColor: isListening ? 'rgba(192,241,142,0.3)' : 'rgba(255,255,255,0.1)' }}
              />
              <button
                onClick={isListening ? stopListening : startListening}
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 active:scale-95 cursor-pointer"
                style={{
                  background: isListening ? 'rgba(226,75,74,0.12)' : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${isListening ? 'rgba(226,75,74,0.25)' : 'rgba(255,255,255,0.08)'}`,
                  color: isListening ? '#E24B4A' : 'rgba(255,255,255,0.4)',
                }}>
                {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isTyping || isListening}
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 disabled:opacity-30 active:scale-95 transition-all duration-200 cursor-pointer"
                style={{ background: 'var(--accent)' }}>
                <Send className="w-3.5 h-3.5 text-[#0a1a00]" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
