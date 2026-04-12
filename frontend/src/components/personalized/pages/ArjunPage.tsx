import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { useAppStore, type FearType } from '../../../store/useAppStore'
import { Send } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// ── Fear-specific content ───────────────────────────────────────────────────

const FIRST_MESSAGES: Record<FearType, string> = {
  loss: "Hey {name}. I know the market feels risky right now. Let's talk about what's actually scared you — and whether it's worth being scared of.",
  jargon: "Hey {name}. No jargon. Promise. What's the one investing term that's confused you the most?",
  scam: "Hey {name}. Your skepticism is valid. I'm not here to sell you anything. Ask me to prove anything I say.",
  trust: "Hey {name}. I get it — you'd rather trust math than people. Good news: that's exactly what we do here. What do you want to verify first?",
}

const SUGGESTED_QUESTIONS: Record<FearType, string[]> = {
  loss: [
    "What's the worst that could actually happen to my ₹500?",
    "Has anyone ever lost everything in a mutual fund?",
    "How long do market crashes actually last?",
    "What's the difference between a crash and a correction?",
  ],
  jargon: [
    "What is a NAV in plain English?",
    "Explain SIP like I'm 15",
    "What does XIRR actually mean for me?",
    "Why do people say 'diversify'?",
  ],
  scam: [
    "How do I know a mutual fund is legitimate?",
    "What does SEBI actually do?",
    "Can a fund company run away with my money?",
    "Where is my money actually stored?",
  ],
  trust: [
    "What is an index fund and who controls it?",
    "Can a fund manager secretly change where my money goes?",
    "What happens if the AMC shuts down?",
    "How is an index fund different from a stock?",
  ],
}

// ── Types ───────────────────────────────────────────────────────────────────

interface Message {
  role: 'user' | 'assistant'
  content: string
}

// ── Component ───────────────────────────────────────────────────────────────

export default function ArjunPage() {
  const fearType = useAppStore(s => s.fearType) ?? 'loss'
  const metaphorStyle = useAppStore(s => s.metaphorStyle) ?? 'generic'
  const rawName = useAppStore(s => s.userName)
  const userName = rawName && rawName !== 'Explorer' ? rawName.split(' ')[0] : 'there'

  const firstMsg = FIRST_MESSAGES[fearType].replace('{name}', userName)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: firstMsg },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isTyping])

  const sendMessage = async (text: string) => {
    if (!text.trim()) return
    setError(null)

    const userMsg: Message = { role: 'user', content: text.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)

    // Build history (last 6 messages)
    const history = [...messages, userMsg].slice(-6).map(m => ({
      role: m.role,
      content: m.content,
    }))

    try {
      const res = await fetch(`${API_BASE}/api/mentor`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          fear_type: fearType,
          metaphor_style: metaphorStyle,
          context: 'arjun_chat_page',
          conversation_history: history,
        }),
      })

      if (!res.ok) throw new Error('API error')

      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setError('Arjun is currently offline. Make sure the backend is running on port 8000.')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble connecting right now. Please make sure the backend server is running. In the meantime, feel free to explore the Learn section — it has answers to many common questions.",
      }])
    } finally {
      setIsTyping(false)
      inputRef.current?.focus()
    }
  }

  const hasConversation = messages.length > 1

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}
      className="flex flex-col" style={{ height: 'calc(100vh - 140px)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full flex items-center justify-center font-display font-bold text-sm" style={{ background: 'rgba(192,241,142,0.08)', color: 'var(--accent)' }}>
          A
        </div>
        <div>
          <h2 className="font-display font-semibold text-lg text-white tracking-tight">Arjun</h2>
          <p className="font-sans text-[11px] text-white/30">Your financial mentor</p>
        </div>
      </div>

      {/* Chat area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2" style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.1) transparent' }}>
        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className="flex gap-2.5 max-w-[85%] md:max-w-[70%]">
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1 font-display text-[10px] font-bold" style={{ background: 'rgba(192,241,142,0.08)', color: 'var(--accent)' }}>
                  A
                </div>
              )}
              <div
                className="rounded-2xl px-4 py-3 border"
                style={{
                  background: 'var(--surface)',
                  borderColor: msg.role === 'user' ? 'var(--border)' : 'var(--border)',
                  borderLeft: msg.role === 'user' ? '3px solid var(--accent)' : undefined,
                }}
              >
                <p className="font-sans text-sm text-white/65 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Suggested questions — show after first message only */}
        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 ml-10">
            {SUGGESTED_QUESTIONS[fearType].map((q, i) => (
              <button key={i} onClick={() => sendMessage(q)}
                className="px-3.5 py-2 rounded-full text-xs font-sans border transition-[background-color,border-color] duration-200 hover:border-[var(--border-bright)]"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'rgba(255,255,255,0.5)' }}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Typing indicator */}
        {isTyping && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1 font-display text-[10px] font-bold" style={{ background: 'rgba(192,241,142,0.08)', color: 'var(--accent)' }}>
              A
            </div>
            <div className="rounded-2xl px-4 py-3 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} className="w-2 h-2 rounded-full" style={{ background: 'var(--accent)' }}
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {error && (
          <p className="font-sans text-xs text-center" style={{ color: 'var(--danger)' }}>{error}</p>
        )}
      </div>

      {/* "What Arjun can help with" — only when conversation is empty */}
      <AnimatePresence>
        {!hasConversation && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            {['Explain any investing term', 'Sanity-check any financial decision', 'Help you understand your simulation results'].map((text, i) => (
              <div key={i} className="rounded-2xl p-4 border text-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
                <p className="font-sans text-xs text-white/35">{text}</p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input bar */}
      <div className="flex gap-3">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') sendMessage(input) }}
          placeholder="Ask Arjun anything..."
          className="flex-1 bg-transparent border rounded-full px-5 py-3.5 font-sans text-sm text-white outline-none placeholder:text-white/20 focus:border-[var(--border-bright)] transition-[border-color] duration-200"
          style={{ borderColor: 'var(--border)' }}
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || isTyping}
          className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 disabled:opacity-30 active:scale-[0.95] transition-[opacity,transform] duration-200"
          style={{ background: 'var(--accent)' }}
        >
          <Send className="w-4 h-4 text-[#0a1a00]" />
        </button>
      </div>
    </motion.div>
  )
}
