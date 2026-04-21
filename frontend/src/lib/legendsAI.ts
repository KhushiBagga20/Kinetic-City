import { callGroq } from './groqPool'

/** Daily wisdom banner — loads once on page mount */
export async function getLegendWisdom(userName: string, fearType: string): Promise<string> {
  const system = 'You are a warm, inspiring financial historian. Output ONLY 1 sentence (max 18 words). No quotes, no emojis, no hashtags. Make it feel personal and empowering for a woman investor.'
  const prompt = `User: ${userName || 'her'}, fear: ${fearType || 'loss'}. Write a daily investing wisdom line in the spirit of great women investors.`
  try { return await callGroq(prompt, system, 'insights') }
  catch { return 'Every rupee you invest today is a vote for your future self.' }
}

/** "What would she tell you?" — personalized per investor */
export async function getLegendAdvice(opts: {
  investorName: string
  investorPhilosophy: string
  userName: string
  monthlyAmount: number
  years: number
  fearType: string
  goals: string
}): Promise<string> {
  const system = `You are ${opts.investorName}, the legendary investor. Speak in first person in her voice and style. Keep it to 2-3 sentences max. Be direct, warm and personal. No markdown, no emojis. Reference specific numbers provided.`
  const prompt = `The user is ${opts.userName || 'a young woman'} investing ₹${opts.monthlyAmount}/month for ${opts.years} years. Their fear is "${opts.fearType}". Their goals: ${opts.goals || 'not set yet'}. My philosophy: "${opts.investorPhilosophy}". What specific advice would I give them?`
  try { return await callGroq(prompt, system, 'insights') }
  catch { return `Stay the course. Your consistent ₹${opts.monthlyAmount} every month is exactly the kind of discipline that builds lasting wealth.` }
}

/** Chat with a legend persona */
export async function chatWithLegend(opts: {
  investorName: string
  investorPhilosophy: string
  investorEra: string
  message: string
  history: { role: string; content: string }[]
}): Promise<string> {
  const system = `You are ${opts.investorName} (${opts.investorEra}), the legendary investor. Philosophy: "${opts.investorPhilosophy}". Speak in first person in her authentic voice. Keep replies to 2-3 sentences. Be direct, wise, occasionally witty. No markdown, no emojis. If asked about modern topics, relate them to your era and philosophy.`
  const hist = opts.history.slice(-6).map(m => `${m.role === 'user' ? 'Visitor' : opts.investorName}: ${m.content}`).join('\n\n')
  const prompt = hist ? `${hist}\n\nVisitor: ${opts.message}\n${opts.investorName}:` : `Visitor: ${opts.message}\n${opts.investorName}:`
  try { return await callGroq(prompt, system, 'kinu') }
  catch { return "That's a question worth sitting with. The best investors I know never rush an answer." }
}

/** Match user to a legend */
export async function matchLegend(opts: {
  userName: string
  fearType: string
  monthlyAmount: number
  years: number
  lifeStage: string | null
}): Promise<{ legendId: string; reason: string }> {
  const system = `You are a financial personality matcher. Given the user profile, pick ONE of these investors: cathie, geraldine, hetty, mellody. Return ONLY valid JSON: {"legendId":"<one of the four>","reason":"<1 sentence why, personal and warm, no markdown>"}`
  const prompt = `User: ${opts.userName || 'her'}, fear: ${opts.fearType || 'loss'}, SIP: ₹${opts.monthlyAmount}/month, horizon: ${opts.years} years, life stage: ${opts.lifeStage || 'working'}. Match to: cathie (disruptive innovation, bold bets), geraldine (dividend value, patience, proved skeptics wrong), hetty (contrarian, buy in crashes, frugal), mellody (long-term value, community impact, steady).`
  try {
    const raw = await callGroq(prompt, system, 'insights')
    const cleaned = raw.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
    return JSON.parse(cleaned)
  } catch {
    return { legendId: 'mellody', reason: 'Your patient, steady approach mirrors Mellody Hobson\'s long-term philosophy perfectly.' }
  }
}
