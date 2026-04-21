/**
 * AI Pool — Routes all AI calls through Azure OpenAI (GPT-4o).
 * Single endpoint, single key, no rotation needed — Azure has enterprise-grade limits.
 */

export type AIArea = 'kinu' | 'simulation' | 'quotes' | 'curriculum' | 'news'

const env = (import.meta as any).env || {}

// ── Azure OpenAI Config ──────────────────────────────────────────────────────
const AZURE_API_KEY = env.VITE_AZURE_OPENAI_API_KEY || ''
const AZURE_ENDPOINT = env.VITE_AZURE_OPENAI_ENDPOINT || ''

// ── Serialization queue (prevents browser from firing 20 calls at once) ──────

const MIN_GAP_MS = 300 // Azure can handle high throughput
let lastCallFinishedAt = 0
let activeRequests = 0
const waitQueue: Array<() => void> = []

function acquireSlot(): Promise<void> {
  return new Promise(resolve => {
    const attempt = () => {
      if (activeRequests === 0) {
        const now = Date.now()
        const wait = Math.max(0, lastCallFinishedAt + MIN_GAP_MS - now)
        activeRequests++
        setTimeout(resolve, wait)
      } else {
        waitQueue.push(attempt)
      }
    }
    attempt()
  })
}

function releaseSlot() {
  lastCallFinishedAt = Date.now()
  activeRequests = Math.max(0, activeRequests - 1)
  const next = waitQueue.shift()
  if (next) next()
}

// ── Session cache ────────────────────────────────────────────────────────────

const sessionCache = new Map<string, string>()

function cacheKey(prompt: string, system: string) {
  let hash = 0
  const str = system + prompt
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return `cached::${hash}`
}

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms))

// ── Azure OpenAI Fetcher ─────────────────────────────────────────────────────

async function callAzure(prompt: string, system: string): Promise<string> {
  const res = await fetch(AZURE_ENDPOINT, {
    method: 'POST',
    headers: {
      'api-key': AZURE_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
    }),
  })

  if (!res.ok) {
    const errorBody = await res.text().catch(() => '')
    throw new Error(`Azure OpenAI error ${res.status}: ${errorBody.slice(0, 200)}`)
  }

  const data = await res.json()
  const text = data.choices?.[0]?.message?.content || ''
  if (!text) throw new Error('Empty response from Azure OpenAI')
  return text.replace(/^\"|\"$|`/g, '').trim()
}

// ── Core Orchestrator ────────────────────────────────────────────────────────

export async function callGroq(
  prompt: string,
  systemInstruction: string,
  _area: AIArea = 'kinu',
): Promise<string> {
  if (!AZURE_API_KEY || !AZURE_ENDPOINT) {
    throw new Error('Azure OpenAI not configured. Set VITE_AZURE_OPENAI_API_KEY and VITE_AZURE_OPENAI_ENDPOINT in frontend/.env')
  }

  const key = cacheKey(prompt, systemInstruction)
  if (sessionCache.has(key)) return sessionCache.get(key)!

  await acquireSlot()
  try {
    let attempts = 0

    while (attempts < 5) {
      attempts++
      try {
        const result = await callAzure(prompt, systemInstruction)
        sessionCache.set(key, result)
        return result
      } catch (err: any) {
        const msg = String(err?.message || '')
        if (msg.includes('429') || msg.includes('rate')) {
          console.warn(`[AzureAI] Rate limited. Waiting 3s... (Attempt ${attempts}/5)`)
          await sleep(3000)
          continue
        }
        throw err
      }
    }

    throw new Error('Azure OpenAI rate limited after 5 retries.')
  } finally {
    releaseSlot()
  }
}

export const isGroqConfigured = Boolean(AZURE_API_KEY && AZURE_ENDPOINT)
export function getKeyCount(): number { return AZURE_API_KEY ? 1 : 0 }
