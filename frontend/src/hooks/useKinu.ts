/**
 * useKinu — KINU AI hook with smart navigation + full app context + action system
 *
 * KINU can now:
 *   1. Reply with rich, personalised advice (full Zustand context injected)
 *   2. Navigate anywhere in the app (navigate_to from AI)
 *   3. Trigger app actions (mark_module_complete, start_simulation, go_to_next_module, etc.)
 *
 * Action callbacks are injected via the `actions` parameter — each page wires up
 * the actions it supports, KINU calls them automatically.
 */
import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../store/useAppStore'
import { generateKinuChatWithNav, buildAppContext, KINU_SECTIONS, KINU_ACTIONS } from '../lib/kinuAI'
import { kinuRegistry } from '../lib/kinuActionRegistry'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface KinuMessage {
  role: 'user' | 'assistant'
  content: string
  navAction?: { section: string; label: string }
  appAction?: { key: string; label: string }
}

/** Map of action key → callback. Pages pass in the actions they support. */
export type KinuActionMap = Partial<Record<string, () => void>>

// ── Speech recognition shim ───────────────────────────────────────────────────

function getSpeechRecognition(): (new () => SpeechRecognition) | null {
  if (typeof window === 'undefined') return null
  return window.SpeechRecognition || window.webkitSpeechRecognition || null
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useKinu(initialGreeting: string, actions: KinuActionMap = {}) {
  const navigate = useNavigate()

  // Pull full app state for rich context
  const store = useAppStore()
  const {
    fearType, userName, monthlyAmount, years, currentSavings,
    streakDays, fearProgress, completedModules, goals,
    simulationResult, portfolioSetup, selectedFund, xpPoints,
    dashboardSection,
  } = store

  const [messages, setMessages] = useState<KinuMessage[]>([
    { role: 'assistant', content: initialGreeting },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)

  // Execute navigation
  const executeNav = useCallback((section: string) => {
    useAppStore.getState().setDashboardSection(section)
    navigate(`/dashboard/${section}`)
  }, [navigate])

  // Execute an app action — tries global registry first, then local map, then nav fallback
  const executeAction = useCallback((actionKey: string) => {
    // 1. Try the global registry (pages register their own handlers)
    if (kinuRegistry.execute(actionKey)) return

    // 2. Try the locally passed-in actions map
    const handler = actions[actionKey]
    if (handler) { handler(); return }

    // 3. Navigation fallbacks for actions that map to a section
    const actionToNav: Record<string, string> = {
      open_portfolio_setup: 'portfolio',
      run_time_machine: 'time-machine',
      run_sandbox: 'sandbox',
      show_harvest: 'harvest',
    }
    const fallbackNav = actionToNav[actionKey]
    if (fallbackNav) executeNav(fallbackNav)
  }, [actions, executeNav])

  // Send a message (text or transcription)
  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return

    const userMsg: KinuMessage = { role: 'user', content: trimmed }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsTyping(true)
    setVoiceError(null)

    try {
      // Build rich system context from full app state
      const appContext = buildAppContext({
        fearType, userName, monthlyAmount, years, currentSavings,
        streakDays, fearProgress, completedModules,
        goals: goals.map(g => ({ name: g.name, targetAmount: g.targetAmount, targetYears: g.targetYears })),
        simulationResult: simulationResult
          ? { p50: simulationResult.p50, totalInvested: simulationResult.totalInvested }
          : null,
        portfolioSetup, selectedFund, xpPoints, dashboardSection,
      })

      const history = [...messages, userMsg].slice(-10).map(m => ({
        role: m.role,
        content: m.content,
      }))

      const { reply, navigate_to, action } = await generateKinuChatWithNav({
        message: trimmed,
        appContext,
        conversation_history: history,
      })

      const sectionInfo = navigate_to ? KINU_SECTIONS[navigate_to] : null
      const actionInfo = action ? KINU_ACTIONS[action] : null

      // Build display suffix
      let suffix = ''
      if (sectionInfo) suffix += `\n\n↗ Taking you to ${sectionInfo.label}…`
      if (actionInfo) suffix += `\n⚡ ${actionInfo.label}…`

      const assistantMsg: KinuMessage = {
        role: 'assistant',
        content: `${reply}${suffix}`,
        navAction: sectionInfo ? { section: navigate_to!, label: sectionInfo.label } : undefined,
        appAction: actionInfo ? { key: action!, label: actionInfo.label } : undefined,
      }
      setMessages(prev => [...prev, assistantMsg])

      // Execute navigation after letting the user read the reply
      if (navigate_to) {
        setTimeout(() => executeNav(navigate_to), 2500)
      }

      // Execute app action after a slightly longer delay (let message settle)
      if (action) {
        setTimeout(() => executeAction(action), navigate_to ? 3000 : 1200)
      }
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I'm having trouble reaching my servers. Try again in a moment.",
      }])
    } finally {
      setIsTyping(false)
    }
  }, [
    messages, fearType, userName, monthlyAmount, years, currentSavings,
    streakDays, fearProgress, completedModules, goals, simulationResult,
    portfolioSetup, selectedFund, xpPoints, dashboardSection,
    executeNav, executeAction,
  ])

  // Voice input via Web Speech API
  const startListening = useCallback(() => {
    const SR = getSpeechRecognition()
    if (!SR) {
      setVoiceError('Voice input not supported in this browser.')
      return
    }

    if (recognitionRef.current) recognitionRef.current.stop()

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
