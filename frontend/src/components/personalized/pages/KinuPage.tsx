import { motion } from 'framer-motion'
import { useRef, useEffect } from 'react'
import { Send, Mic, MicOff, ArrowRight } from 'lucide-react'
import { useAppStore, type FearType } from '../../../store/useAppStore'
import { useKinu } from '../../../hooks/useKinu'

const FIRST_MESSAGES: Record<FearType, string> = {
  loss: "Hey! I know the market feels risky. Tell me what's specifically worrying you — and I'll show you real numbers that put it in perspective.",
  jargon: "No jargon, I promise. What's the one investing term or concept that's been holding you back?",
  scam: "Your skepticism is valid and I respect it. Ask me to prove anything I say — I'll show you the SEBI registration, the clearing house trail, all of it.",
  trust: "You'd rather trust math than people — I think that's smart. Tell me what you want to verify and I'll give you the data.",
}

export default function KinuPage() {
  const fearType = useAppStore(s => s.fearType) ?? 'loss'
  const rawName = useAppStore(s => s.userName)
  const userName = rawName && rawName !== 'Explorer' ? rawName.split(' ')[0] : 'there'

  const greeting = FIRST_MESSAGES[fearType].replace('{name}', userName)
  const { messages, input, setInput, isTyping, isListening, voiceError, sendMessage, startListening, stopListening } = useKinu(greeting)

  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isTyping])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col"
      style={{ height: 'calc(100vh - 140px)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center font-display font-bold text-base"
            style={{ background: 'rgba(192,241,142,0.1)', color: 'var(--accent)', border: '1px solid rgba(192,241,142,0.2)' }}>
            K
          </div>
          {/* Online indicator */}
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
            style={{ background: '#1D9E75', borderColor: 'var(--bg)' }} />
        </div>
        <div>
          <h2 className="font-display font-semibold text-lg text-white tracking-tight">KINU</h2>
          <p className="font-sans text-[10px] uppercase tracking-[0.15em]" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Your AI Financial Mentor
          </p>
        </div>

        {/* Nav hints */}
        <div className="ml-auto hidden sm:flex items-center gap-2">
          {['learn', 'portfolio', 'simulate'].map(hint => (
            <button key={hint}
              onClick={() => sendMessage(`Take me to ${hint}`)}
              className="px-3 py-1.5 rounded-full text-[10px] font-mono uppercase tracking-wider cursor-pointer transition-colors"
              style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.35)', border: '1px solid rgba(255,255,255,0.07)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(192,241,142,0.08)'; e.currentTarget.style.color = '#c0f18e' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = 'rgba(255,255,255,0.35)' }}>
              → {hint}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-1"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.08) transparent' }}>
        {messages.map((msg, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className="flex gap-2.5 max-w-[85%]">
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1 font-display text-[10px] font-bold"
                  style={{ background: 'rgba(192,241,142,0.08)', color: 'var(--accent)' }}>
                  K
                </div>
              )}
              <div>
                <div className="rounded-2xl px-4 py-3"
                  style={{
                    background: msg.role === 'user' ? 'rgba(192,241,142,0.07)' : 'var(--surface)',
                    border: `1px solid ${msg.role === 'user' ? 'rgba(192,241,142,0.15)' : 'var(--border)'}`,
                  }}>
                  <p className="font-sans text-sm leading-relaxed whitespace-pre-wrap"
                    style={{ color: msg.role === 'user' ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.65)' }}>
                    {msg.content}
                  </p>
                </div>
                {/* Nav action chip */}
                {msg.navAction && (
                  <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-sans"
                    style={{ background: 'rgba(192,241,142,0.08)', color: '#c0f18e', border: '1px solid rgba(192,241,142,0.2)' }}>
                    <ArrowRight className="w-3 h-3" />
                    Navigating to {msg.navAction.label}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 font-display text-[10px] font-bold"
              style={{ background: 'rgba(192,241,142,0.08)', color: 'var(--accent)' }}>K</div>
            <div className="rounded-2xl px-4 py-3 flex items-center gap-1.5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              {[0, 1, 2].map(i => (
                <motion.div key={i} className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.18 }} />
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Voice listening indicator */}
      {isListening && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-3 flex items-center gap-2 justify-center">
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map(i => (
              <motion.div key={i} className="w-1 rounded-full" style={{ background: '#c0f18e' }}
                animate={{ height: [6, 18, 6] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.1 }} />
            ))}
          </div>
          <span className="font-sans text-xs" style={{ color: '#c0f18e' }}>Listening…</span>
        </motion.div>
      )}

      {voiceError && (
        <p className="text-xs text-center mb-2" style={{ color: 'rgba(226,75,74,0.8)' }}>{voiceError}</p>
      )}

      {/* Input bar */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input) } }}
          placeholder={isListening ? 'Listening…' : 'Ask KINU or say "take me to learn"…'}
          disabled={isListening}
          className="flex-1 bg-transparent border rounded-2xl px-5 py-3.5 font-sans text-sm text-white outline-none placeholder:text-white/20 transition-[border-color] duration-200"
          style={{ borderColor: isListening ? 'rgba(192,241,142,0.3)' : 'var(--border)' }}
        />

        {/* Voice button */}
        <button
          onClick={isListening ? stopListening : startListening}
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-200 active:scale-95"
          style={{
            background: isListening ? 'rgba(226,75,74,0.15)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${isListening ? 'rgba(226,75,74,0.3)' : 'rgba(255,255,255,0.08)'}`,
            color: isListening ? '#E24B4A' : 'rgba(255,255,255,0.4)',
          }}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Send button */}
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || isTyping}
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 disabled:opacity-30 active:scale-95 transition-all duration-200"
          style={{ background: 'var(--accent)' }}
        >
          <Send className="w-4 h-4 text-[#0a1a00]" />
        </button>
      </div>
    </motion.div>
  )
}
