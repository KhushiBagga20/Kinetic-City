import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { useAppStore, type FearType } from '../../../store/useAppStore'

const KINU_GREETINGS: Record<FearType, string> = {
  loss: "I know the idea of losing money feels terrifying. Let's look at what actually happens when markets dip — with real rupee numbers.",
  jargon: "No jargon here, I promise. Ask me anything about investing and I'll explain it like we're having chai together.",
  scam: "Healthy skepticism is a superpower. Let me show you exactly how regulated mutual funds work — no trust required, just facts.",
  trust: "You don't have to trust me or anyone. Let me show you how index funds work — no human decisions involved, just math.",
}

export default function KinuFloatingButton() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'kinu'; text: string }>>([])
  const [input, setInput] = useState('')
  const fearType = useAppStore(s => s.fearType) ?? 'loss'
  const userName = useAppStore(s => s.userName) || 'there'

  async function handleSend() {
    if (!input.trim()) return
    const userText = input.trim()
    setInput('')
    
    // Add user message immediately
    setMessages(m => [
      ...m,
      { role: 'user', text: userText }
    ])

    // Build chat history
    const history = messages.map(m => ({
      role: m.role === 'kinu' ? 'assistant' : 'user',
      content: m.text
    }))

    try {
      const { generateKinuChat } = await import('../../../lib/kinuAI')
      const data = await generateKinuChat({
        message: userText,
        fear_type: fearType,
        context: 'Floating button chat overlay',
        conversation_history: history,
      })
      
      setMessages(m => [
        ...m,
        { role: 'kinu', text: data.reply }
      ])
    } catch (err: any) {
      console.error(err)
      setMessages(m => [
        ...m,
        { role: 'kinu', text: "I'm having trouble connecting to my neural network. Please check your API permissions." }
      ])
    }
  }

  return (
    <>
      {/* Floating button */}
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 300, damping: 20 }}
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 active:scale-95"
        style={{
          background: 'var(--color-primary-fixed)',
          color: '#0a1a00',
        }}
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>

      {/* Full-screen chat overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex flex-col"
            style={{ background: '#00161b' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(192,241,142,0.12)' }}>
                  <MessageCircle className="w-5 h-5 text-[var(--color-primary-fixed)]" />
                </div>
                <div>
                  <h2 className="font-display text-base text-white font-semibold">KINU</h2>
                  <p className="text-[10px] font-sans text-white/35 uppercase tracking-[0.1em]">Kinetic Intelligence Neural User</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
              {/* Initial greeting */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="max-w-[80%] rounded-2xl rounded-tl-md px-5 py-4"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <p className="text-xs font-sans text-white/65 leading-relaxed">
                  Hey {userName}! {KINU_GREETINGS[fearType]}
                </p>
              </motion.div>

              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`max-w-[80%] rounded-2xl px-5 py-4 ${msg.role === 'user' ? 'ml-auto rounded-tr-md' : 'rounded-tl-md'}`}
                  style={{
                    background: msg.role === 'user'
                      ? 'rgba(192,241,142,0.08)'
                      : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${msg.role === 'user' ? 'rgba(192,241,142,0.15)' : 'rgba(255,255,255,0.06)'}`,
                  }}
                >
                  <p className="text-xs font-sans text-white/65 leading-relaxed">{msg.text}</p>
                </motion.div>
              ))}
            </div>

            {/* Input */}
            <div className="px-6 py-4 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
              <form
                onSubmit={(e) => { e.preventDefault(); handleSend() }}
                className="flex items-center gap-3"
              >
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Ask KINU anything..."
                  className="flex-1 px-5 py-3.5 rounded-2xl font-sans text-sm text-white placeholder-white/25 outline-none"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}
                />
                <button
                  type="submit"
                  className="w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-95"
                  style={{
                    background: input.trim() ? 'var(--color-primary-fixed)' : 'rgba(255,255,255,0.04)',
                    color: input.trim() ? '#0a1a00' : 'rgba(255,255,255,0.25)',
                  }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
