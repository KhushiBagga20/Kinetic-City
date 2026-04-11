# InvestEase — AI Context

## What we're building
A cinematic financial fear-reduction web app for young Indians (18–28).
NOT a brokerage. A psychological buffer that walks someone from fear → first ₹500 invested.

## Pitch
"Most fintech apps show you the destination. We built the only app that walks next to you through the fear."

## User journey (strict order, never skip)
1. Landing → dark hero, particle background, one CTA button
2. Fear Profiler → 5 questions → outputs fear type (loss / jargon / scam / trust)
3. FD Erosion → animated bar showing savings losing real value to inflation
4. Monte Carlo Chart → fan of 600 simulated SIP paths, rupee-framed worst case
5. First ₹500 Time Machine → 30-second COVID crash + recovery simulation
6. Fear Fingerprint Card → shareable glass summary card, downloadable

## Stack (use exactly this)
- React 18 + Vite + TypeScript
- Tailwind CSS
- Framer Motion (all animations)
- Lenis (smooth scroll)
- Chart.js (fan chart)
- Three.js (particle background ONLY — no terrain)
- Claude API claude-sonnet-4-20250514 (jargon buster + story engine)
- html2canvas (card download)
- Zustand (global state)

## Global state shape
```ts
fearType: 'loss' | 'jargon' | 'scam' | 'trust' | null
monthlyAmount: number  // default 500
years: number          // default 10
currentSavings: number // default 50000
step: 0 | 1 | 2 | 3 | 4 | 5
metaphorStyle: 'gamer' | 'student' | 'professional' | 'generic'
```

Every component receives these as props. Every component calls onComplete() to advance. No component navigates itself.

## Design system
- Background: #0a0a0f
- Glass cards: background rgba(255,255,255,0.04), backdrop-filter blur(20px), border 1px solid rgba(255,255,255,0.08), border-radius 16px
- Accent: #EF9F27 (amber)
- Growth color: #1D9E75 (teal)
- Loss color: #E24B4A (soft red)
- Text primary: rgba(255,255,255,0.92)
- Text secondary: rgba(255,255,255,0.48)
- Font: Inter

## Motion rules
- All card entrances: fade up, y 20→0, opacity 0→1, duration 0.6s, easeOut
- Number changes: always count up, never snap
- Empathy pulse: when showing crash/risk content, page background shifts to rgba(239,159,39,0.04)
- Page transitions: Framer Motion layoutId shared elements

## Math constants (never change these)
- Nifty 50 CAGR: 14% annual
- Nifty 50 std dev: 18% annual
- FD rate: 6.8% annual
- Inflation: 5.8% annual
- Monte Carlo paths: 600
- Monthly mu: Math.log(1.14) / 12
- Monthly sigma: 0.18 / Math.sqrt(12)
- Each monthly step: Math.exp(mu + sigma * boxMuller()) - 1

## Arjun — AI persona (use this system prompt for ALL Claude API calls)
"You are Arjun, a calm stoic financial mentor for young Indians aged 18–28. Never use jargon without explaining it. Always give rupee amounts not percentages. Frame worst cases as survivable and temporary. Tone: wise older brother, not salesperson. Max 60 words unless asked for more. Adapt metaphors to fear type: loss→survivability, jargon→simple analogies, scam→SEBI/regulation facts, trust→index fund math requires no human trust."

## Fear type routing
- loss → show rupee worst case first, then median recovery
- jargon → wrap every term in tap-to-explain tooltip, simpler copy
- scam → show SEBI badges, data source citations
- trust → lead with historical data, minimize AI personality

## Rules for every component
1. Use .glass class for all cards
2. Use Framer Motion for all animations
3. Never hardcode navigation — only call onComplete()
4. Show rupee amounts, never raw percentages to the user
5. Worst case is always framed as: "In the worst case, you'd be down ₹X — historically recovered in Y months"