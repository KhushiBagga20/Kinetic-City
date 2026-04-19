/**
 * useKinu — shared KINU hook with voice input + nav routing
 * Handles: speech recognition, AI calls, navigation intent parsing
 */
import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { generateKinuChat } from '../lib/kinuAI'

// ── Navigation intent map ─────────────────────────────────────────────────────
// Keywords → route the user to a dashboard section

const NAV_INTENTS: { keywords: string[]; section: string; label: string }[] = [
  { keywords: ['learn', 'module', 'lesson', 'study', 'course', 'track'], section: 'learn', label: 'Learn' },
  { keywords: ['simulate', 'sandbox', 'practice', 'crash', 'test'], section: 'sandbox', label: 'Simulator' },
  { keywords: ['portfolio', 'holdings', 'investments', 'stocks', 'funds'], section: 'portfolio', label: 'Portfolio' },
  { keywords: ['time machine', 'backtest', 'history', 'historical'], section: 'time-machine', label: 'Time Machine' },
  { keywords: ['kinu', 'chat', 'talk', 'ask', 'mentor', 'help me'], section: 'kinu', label: 'KINU Chat' },
  { keywords: ['card', 'my card', 'badge', 'profile card', 'investor card'], section: 'my-card', label: 'My Card' },
  { keywords: ['home', 'dashboard', 'main', 'start', 'overview'], section: 'home', label: 'Home' },
  { keywords: ['harvest', 'tax', 'loss harvest'], section: 'harvest', label: 'Harvest' },
  { keywords: ['roadmap', 'journey', 'map', 'path'], section: 'roadmap', label: 'Roadmap' },
]

// ── Types ─────────────────────────────────────────────────────────────────────

export interface KinuMessage {
  role: 'user' | 'assistant'
  content: string
  navAction?: { section: string; label: string }
}

// ── Speech recognition shim ───────────────────────────────────────────────────

function getSpeechRecognition(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useKinu(initialGreeting: string) {
  const navigate = useNavigate()
  const fearType = useAppStore(s => s.fearType) ?? 'loss'
  const userName = useAppStore(s => s.userName) || 'there'

  const [messages, setMessages] = useState<KinuMessage[]>([
    { role: 'assistant', content: initialGreeting },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Detect navigation intent in user message
  const detectNav = (text: string): { section: string; label: string } | null => {
    const lower = text.toLowerCase()
    for (const intent of NAV_INTENTS) {
      if (intent.keywords.some(k => lower.includes(k))) return intent
    }
    return null
  }

  // Execute navigation
  const executeNav = (section: string) => {
    useAppStore.getState().setDashboardSection(section)
    navigate(`/dashboard/${section}`)
  }

  // Send a message (text or transcription)
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return

    const navIntent = detectNav(trimmed)
    const userMsg: KinuMessage = { role: 'user', content: trimmed }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)
    setVoiceError(null)

    try {
      const history = [...messages, userMsg].slice(-8).map(m => ({
        role: m.role,
        content: m.content,
      }))

      // Build a rich system context so KINU focuses on the app
      const appContext = `You are KINU, the AI mentor inside Kinetic City — a financial fear-fixing app. 
You are fully integrated into the app. You can navigate users to: Learn (modules), Simulator (sandbox), Portfolio, Time Machine (backtest), My Card, Home dashboard, Harvest (tax loss), and the Roadmap.
The user's fear profile is "${fearType}". Their name is "${userName}".
Keep replies under 3 sentences. Be direct, empathetic, and concrete. Use rupee amounts and real data.
If the user asks to go somewhere or do something in the app, confirm you're taking them there.
Never mention "general" or "curriculum" modes. You are always app-focused.`

      const data = await generateKinuChat({
        message: trimmed,
        fear_type: fearType,
        context: appContext,
        conversation_history: history,
      })

      const assistantMsg: KinuMessage = {
        role: 'assistant',
        content: navIntent
          ? `${data.reply}\n\n↗ Taking you to ${navIntent.label}…`
          : data.reply,
        navAction: navIntent ?? undefined,
      }
      setMessages(prev => [...prev, assistantMsg])

      // Execute navigation after a brief delay so user sees the message
      if (navIntent) {
        setTimeout(() => executeNav(navIntent.section), 1200)
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble reaching my servers. Try again in a moment.",
      }])
    } finally {
      setIsTyping(false)
    }
  }, [messages, fearType, navigate])

  // Voice input via Web Speech API
  const startListening = useCallback(() => {
    const SR = getSpeechRecognition()
    if (!SR) {
      setVoiceError('Voice input not supported in this browser.')
      return
    }

    if (recognitionRef.current) {
      recognitionRef.current.stop()
    }

    const rec = new SR()
    rec.lang = 'en-IN'
    rec.continuous = false
    rec.interimResults = false

    rec.onstart = () => {
      setIsListening(true)
      setVoiceError(null)
    }

    rec.onresult = (e: SpeechRecognitionEvent) => {
      const transcript = e.results[0]?.[0]?.transcript ?? ''
      if (transcript) {
        setInput(transcript)
        sendMessage(transcript)
      }
    }

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      setVoiceError(e.error === 'no-speech' ? 'No speech detected — try again.' : `Voice error: ${e.error}`)
      setIsListening(false)
    }

    rec.onend = () => setIsListening(false)

    recognitionRef.current = rec
    rec.start()
  }, [sendMessage])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }, [])

  return {
    messages, input, setInput, isTyping,
    isListening, voiceError,
    sendMessage, startListening, stopListening,
    fearType, userName,
  }
}
