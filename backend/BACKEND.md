# Unscared — Backend Rules

## Architecture decision
This app has no traditional backend.
Everything runs client-side except one thing: AI API calls.
Those are proxied through a single lightweight edge function to hide the API key.
That's it. No database. No auth. No persistence.

## Stack
- Vercel Edge Functions (one file — api/mentor.ts)
- Claude API claude-sonnet-4-20250514
- No Express, no Node server, no database, no ORM

## Folder structure
backend/ (or api/ if using Vercel conventions)
└── api/
    └── mentor.ts       ← the only backend file

## The one endpoint: POST /api/mentor
Receives:
{
  message: string        // user's question or term
  fearType: string       // 'loss' | 'jargon' | 'scam' | 'trust' | null
  context?: string       // optional — which screen they're on
}

Returns:
{
  reply: string          // Arjun's response, max 60 words
}

Error returns:
{
  error: string
  reply: string          // fallback message so UI never breaks
}

## mentor.ts — complete implementation
import type { VercelRequest, VercelResponse } from '@vercel/node'

const SYSTEM_PROMPT = `You are Arjun, a calm and stoic financial mentor for young Indians aged 18–28.
Rules you never break:
- Never use jargon without immediately explaining it in the same sentence
- Always give rupee amounts, never raw percentages
- Always frame worst cases as survivable and temporary
- Tone is wise older brother, never salesperson, never corporate
- Maximum 60 words per response unless the user explicitly asks for more
- When fear type is loss: lead with survivability and recovery time
- When fear type is jargon: use the simplest possible analogy first
- When fear type is scam: cite SEBI, regulation, or verified data
- When fear type is trust: explain why index funds require no human trust
- When metaphor style is gamer: use game mechanics analogies
- When metaphor style is student: use academic or learning analogies
- When metaphor style is professional: use productivity or business analogies`

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', reply: 'Something went wrong.' })
  }

  const { message, fearType, context } = req.body

  if (!message) {
    return res.status(400).json({ error: 'No message provided', reply: 'Ask me anything.' })
  }

  const userContent = [
    fearType && `[User fear type: ${fearType}]`,
    context && `[Current screen: ${context}]`,
    message
  ].filter(Boolean).join('\n')

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userContent }]
      })
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.error?.message ?? 'Claude API error')
    }

    const reply = data.content?.[0]?.text ?? 'Let me think about that.'
    return res.status(200).json({ reply })

  } catch (err) {
    console.error('Mentor API error:', err)
    return res.status(500).json({
      error: 'API failed',
      reply: 'Markets are unpredictable — and apparently so am I right now. Try again in a moment.'
    })
  }
}

## Environment variables
ANTHROPIC_API_KEY=your_key_here
Add to Vercel dashboard under Project → Settings → Environment Variables.
Never commit this to git. Add .env to .gitignore.

## How the frontend calls this endpoint
// src/lib/claudeAPI.ts
export async function askArjun(
  message: string,
  fearType: string | null,
  context?: string
): Promise<string> {
  const res = await fetch('/api/mentor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, fearType, context })
  })
  const data = await res.json()
  return data.reply
}

## All computation happens on the frontend — never move these to backend
- Monte Carlo simulation (src/lib/monteCarlo.ts)
- FD erosion calculation (src/lib/fdErosion.ts)
- Fear type scoring (src/lib/fearProfiler.ts)
- Number formatting (src/lib/fdErosion.ts → formatINR)

These are pure math functions with no sensitive data.
Running them client-side keeps the app fast, offline-capable, and simple.

## CORS
Vercel handles CORS automatically for same-domain API routes.
No CORS configuration needed.

## Rate limiting
Not required for hackathon.
If deploying to production later, add Vercel's built-in rate limiting
or wrap the endpoint with upstash/ratelimit.

## Deployment
1. Push to GitHub
2. Import repo in Vercel dashboard
3. Add ANTHROPIC_API_KEY in environment variables
4. Deploy — Vercel auto-detects the api/ folder as edge functions
5. Done. No server configuration needed.

## What NOT to build
- No Express server
- No database (Postgres, MongoDB, Supabase — none of it)
- No user accounts or auth
- No storing user answers or fear types
- No analytics backend
- No Redis or caching layer
- No WebSockets
If someone suggests adding any of the above for this hackathon, ignore it.