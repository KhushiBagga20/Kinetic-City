import { callGroq } from './groqPool';

// ── App Sections KINU can navigate to ────────────────────────────────────────

export const KINU_SECTIONS: Record<string, { label: string; description: string }> = {
  home:           { label: 'Home',         description: 'Dashboard overview and progress summary' },
  learn:          { label: 'Learn',        description: 'Fear-specific learning modules and roadmap' },
  simulation:     { label: 'Simulation',   description: 'Monte Carlo SIP simulator — run wealth projections' },
  sandbox:        { label: 'Sandbox',      description: 'Pick any market year and invest with fake money' },
  'time-machine': { label: 'Time Machine', description: 'Survive historical crashes: 2008, 2020, dot-com' },
  portfolio:      { label: 'Portfolio',    description: 'Your holdings, SIP setup and fund selection' },
  harvest:        { label: 'Harvest Room', description: 'Tax-loss harvesting simulator' },
  roadmap:        { label: 'Roadmap',      description: 'Your step-by-step investing journey map' },
  'my-card':      { label: 'My Card',      description: 'Your investor identity card' },
  kinu:           { label: 'KINU Chat',    description: 'Full-screen KINU conversation' },
  compare:        { label: 'Compare',      description: 'Compare SIP vs FD vs lumpsum' },
  calculators:    { label: 'Calculators',  description: 'XIRR, goal and compound interest calculators' },
  historical:     { label: 'Historical',   description: 'Historical market performance by decade' },
  'fear-profile': { label: 'Fear Profile', description: 'See and retake your fear profile quiz' },
}

// ── Actions KINU can trigger ──────────────────────────────────────────────────

export const KINU_ACTIONS: Record<string, { label: string; description: string }> = {
  mark_module_complete:   { label: 'Mark Module Complete', description: 'Mark the currently open learning module as done' },
  start_simulation:       { label: 'Start Simulation',    description: 'Trigger the SIP Monte Carlo simulation with current settings' },
  open_portfolio_setup:   { label: 'Open Portfolio Setup', description: 'Navigate to portfolio and begin SIP/fund setup' },
  go_to_next_module:      { label: 'Next Module',         description: 'Navigate to the next module in the track' },
  go_to_prev_module:      { label: 'Previous Module',     description: 'Navigate to the previous module in the track' },
  scroll_to_chart:        { label: 'Scroll to Chart',     description: 'Scroll to the simulation or portfolio chart' },
  run_time_machine:       { label: 'Run Time Machine',    description: 'Start the Time Machine crash simulation' },
  run_sandbox:            { label: 'Run Sandbox',         description: 'Start a sandbox market simulation' },
  show_harvest:           { label: 'Open Harvest Room',   description: 'Open the tax-loss harvesting simulator' },
}

// ── Response type ─────────────────────────────────────────────────────────────

export interface KinuResponse {
  reply: string
  navigate_to: string | null
  action: string | null
}

// ── Full app context builder ──────────────────────────────────────────────────

export function buildAppContext(state: {
  fearType: string | null
  userName: string
  monthlyAmount: number
  years: number
  currentSavings: number
  streakDays: number
  fearProgress: number
  completedModules: string[]
  goals: { name: string; targetAmount: number; targetYears: number }[]
  simulationResult: { p50: number; totalInvested: number } | null
  portfolioSetup: boolean
  selectedFund?: string
  xpPoints?: number
  dashboardSection?: string
  currentModuleTitle?: string
}): string {
  const sectionList = Object.entries(KINU_SECTIONS)
    .map(([key, v]) => `  • "${key}" → ${v.label}: ${v.description}`)
    .join('\n')

  const actionList = Object.entries(KINU_ACTIONS)
    .map(([key, v]) => `  • "${key}" → ${v.label}: ${v.description}`)
    .join('\n')

  const goalsSummary = state.goals.length === 0
    ? 'No goals set yet.'
    : state.goals.map(g => `${g.name} (₹${g.targetAmount.toLocaleString('en-IN')} in ${g.targetYears}y)`).join(', ')

  const simSummary = state.simulationResult
    ? `Median outcome: ₹${state.simulationResult.p50.toLocaleString('en-IN')} on ₹${state.simulationResult.totalInvested.toLocaleString('en-IN')} invested`
    : 'Not run yet'

  return `You are KINU — the AI financial mentor inside Kinetic City, a fear-fixing investing app for young Indians.

## User Profile (REAL DATA — use this for specific, personal advice)
- Name: ${state.userName || 'there'}
- Fear Type: ${state.fearType || 'loss'} (this shapes ALL your advice)
- Monthly SIP: ₹${state.monthlyAmount.toLocaleString('en-IN')}
- Investment Horizon: ${state.years} years
- Current Savings: ₹${state.currentSavings.toLocaleString('en-IN')}
- Portfolio Setup: ${state.portfolioSetup ? `Yes (${state.selectedFund || 'fund selected'})` : 'Not set up yet'}
- Streak: ${state.streakDays} day${state.streakDays !== 1 ? 's' : ''}
- Fear Progress: ${state.fearProgress}%
- Modules Completed: ${state.completedModules.length} module${state.completedModules.length !== 1 ? 's' : ''}
- Goals: ${goalsSummary}
- Simulation: ${simSummary}
- XP Points: ${state.xpPoints ?? 0}
- Current Page: ${state.dashboardSection || 'home'}${state.currentModuleTitle ? `\n- Reading Module: "${state.currentModuleTitle}"` : ''}

## App Sections You Can Navigate To (navigate_to field)
${sectionList}

## App Actions You Can Trigger (action field — use these to DO things for the user)
${actionList}

## Your Rules
1. Keep replies to 2-3 sentences MAX. Be direct, warm, and concrete. Use ₹ amounts and real percentages.
2. If the user wants to go somewhere → set navigate_to. If they want you to DO something → set action.
3. You can set BOTH navigate_to AND action if appropriate (e.g., go to simulation AND start it).
4. NEVER use markdown headers, bullet points, hashtags, or emojis in your reply text.
5. Address the user's fear type naturally — do not mention "fear type" explicitly.
6. Use the user's real data (SIP amount, goals, streak) to give hyper-personalised advice.
7. Be proactive: if the user seems stuck or asks about a topic, suggest the relevant section or action.`
}

// ── Structured chat response (navigation + actions) ───────────────────────────

export async function generateKinuChatWithNav(data: {
  message: string
  appContext: string
  conversation_history: { role: string; content: string }[]
}): Promise<KinuResponse> {
  const actionKeys = Object.keys(KINU_ACTIONS).map(k => `"${k}"`).join(' | ')
  const sectionKeys = Object.keys(KINU_SECTIONS).map(k => `"${k}"`).join(' | ')

  const systemPrompt = `${data.appContext}

## Output Format (CRITICAL — return ONLY this JSON, nothing else)
{
  "reply": "Your conversational response (2-3 sentences, no markdown)",
  "navigate_to": ${sectionKeys} | null,
  "action": ${actionKeys} | null
}

Rules for navigate_to:
- "take me to learn" / "go to modules" → "learn"
- "show my portfolio" / "set up SIP" / "how do I set up my SIP" → "portfolio"
- "run a simulation" / "simulate" / "what will I have" → "simulation"
- "crash test" / "what if 2008" → "time-machine"
- "sandbox" / "try sandbox" → "sandbox"
- "compare" / "SIP vs FD" → "compare"
- "home" / "back" / "dashboard" → "home"
- Pure questions → null

Rules for action:
- "mark this done" / "complete this module" / "I'm done" → "mark_module_complete"
- "start the simulation" / "run it" / "go ahead and simulate" → "start_simulation"
- "next module" / "what's next" (when in module reader) → "go_to_next_module"
- "previous module" / "go back one" (when in module reader) → "go_to_prev_module"
- "show me the chart" / "scroll to chart" → "scroll_to_chart"
- "start time machine" / "run the crash" → "run_time_machine"
- Questions / explanations / pure conversation → null`

  const historyBlock = data.conversation_history
    .slice(-8)
    .map(m => `${m.role === 'user' ? 'User' : 'Kinu'}: ${m.content}`)
    .join('\n\n')

  const prompt = historyBlock
    ? `${historyBlock}\n\nUser: ${data.message}\nKinu:`
    : `User: ${data.message}\nKinu:`

  try {
    const raw = await callGroq(prompt, systemPrompt, 'kinu')

    // Strip markdown fences if the model wraps in ```json
    let cleaned = raw.trim()
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    }

    const parsed = JSON.parse(cleaned)

    const navigate_to = parsed.navigate_to && KINU_SECTIONS[parsed.navigate_to]
      ? parsed.navigate_to
      : null

    const action = parsed.action && KINU_ACTIONS[parsed.action]
      ? parsed.action
      : null

    return { reply: parsed.reply || '', navigate_to, action }
  } catch {
    return {
      reply: "I'm having a moment — try again in a second.",
      navigate_to: null,
      action: null,
    }
  }
}

// ── Fear quote generation ─────────────────────────────────────────────────────

export async function generateFearQuote(data: {
  fear_type: string
  user_name?: string
  context?: string
}): Promise<{ quote: string }> {
  try {
    const system = 'You are Kinu, a concise, highly intelligent AI financial mentor. You speak with calm authority, empathy, and absolute clarity. Output ONLY a single punchy, empowering quote (1 to 2 sentences max) directly addressing this fear. No quotes, hashtags, emojis, or introductory text.'
    const prompt = `User: ${data.user_name || 'Friend'}\nFear: ${data.fear_type}\nContext: ${data.context || 'General'}\nGenerate a powerful, personalized mentor quote.`
    const quote = await callGroq(prompt, system, 'quotes')
    return { quote }
  } catch {
    const fallbacks: Record<string, string> = {
      loss:   'Market downturns are not losses. They are discounts waiting to be seized.',
      scam:   'Skepticism is your armor. Trust only the math, never the promise.',
      jargon: 'Complexity is a disguise for high fees. True wealth is built on simple principles.',
      trust:  'Nobody cares more about your money than you do. Own your independence.',
    }
    return { quote: fallbacks[data.fear_type] || 'Take a deep breath. You are in control of your financial destiny.' }
  }
}

// ── Contextual page insight ───────────────────────────────────────────────────

export async function generatePageInsight(data: {
  page: string
  fearType: string
  userName: string
  extraContext?: string
}): Promise<{ insight: string }> {
  try {
    const system = `You are Kinu, a calm, warm AI financial mentor in Kinetic City app for young Indians. 
Output ONLY 1-2 sentences. No markdown, no emojis, no headers. Be concrete and encouraging. Reference specific numbers or context if given.`
    const prompt = `Page: ${data.page}\nUser fear: ${data.fearType}\nUser: ${data.userName || 'there'}${data.extraContext ? `\nContext: ${data.extraContext}` : ''}\nGive a brief, helpful, specific insight relevant to what the user is doing on this page right now.`
    const insight = await callGroq(prompt, system, 'insights')
    return { insight }
  } catch {
    return { insight: '' }
  }
}

// ── Legacy alias (keeps old callers working) ──────────────────────────────────

export async function generateKinuChat(data: {
  message: string
  fear_type: string
  context?: string
  conversation_history: { role: string; content: string }[]
}): Promise<{ reply: string }> {
  const result = await generateKinuChatWithNav({
    message: data.message,
    appContext: data.context || '',
    conversation_history: data.conversation_history,
  })
  return { reply: result.reply }
}
