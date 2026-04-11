# InvestEase — Prompt Library

## Rule: always start every Antigravity session with this
"Read PROJECT_CONTEXT.md before doing anything. Every component must follow the design system, motion rules, and onComplete() contract defined there."

---

## Project setup
"Set up a React 18 + Vite + TypeScript project called investease. Install: tailwindcss, framer-motion, lenis, chart.js, three, html2canvas, zustand. Create src/store/appState.ts with a Zustand store matching the global state shape in PROJECT_CONTEXT.md. Create src/styles/globals.css with the design system CSS variables and a .glass utility class. Create a basic App.tsx that renders a step-based router: step 0 = Landing, step 1 = FearProfiler, step 2 = FDErosion, step 3 = MonteCarloChart, step 4 = TimeMachine, step 5 = FingerprintCard. Each step renders the matching component which calls onComplete() to advance."

---

## Landing screen
"Build src/components/Landing.tsx. Dark obsidian background #0a0a0f. Three.js particle background: 800 amber-colored (#EF9F27) floating dots, slow upward drift, subtle rotation, fixed position behind everything. Hero text centered: large headline 'Your money is shrinking. You just can't see it.' in white, subtext 'Find out your investor fear type in 60 seconds.' in rgba(255,255,255,0.48). One amber CTA button that calls onComplete(). Framer Motion fade-in on mount."

---

## Fear profiler
"Build src/components/FearProfiler.tsx. 5 questions shown one at a time with Framer Motion slide transitions. Questions:
1. 'When you hear the market crashed 20%, your first thought is?' → options: I lost money (loss+3), I don't know what that means (jargon+3), Someone is manipulating it (scam+3), I'd never trust a fund manager (trust+3)
2. 'What do you do in free time?' → Gaming (gamer metaphor), Studying (student metaphor), Working/grinding (professional metaphor), Chilling/reels (generic metaphor)
3. 'You see a mutual fund ad. You think?' → What if I lose it all (loss+3), What even is a mutual fund (jargon+3), This is a scam (scam+3), They'll take fees and ghost me (trust+3)
4. 'You have ₹10,000 right now, you'd?' → Put in FD (loss+2,jargon+1), Keep in savings (jargon+2), Keep as cash (scam+2,trust+1), Invest only if friend recommends (trust+2)
5. 'Biggest reason you haven't invested yet?' → Fear of losing (loss+3), Don't understand it (jargon+3), Feels like a trap (scam+3), Don't know who to trust (trust+3)
Score all answers, highest total = fear type. Save fearType and metaphorStyle to Zustand. Show a reveal screen with the fear type name, a positive reframe line, and a colored glass card. Then call onComplete()."

---

## FD erosion visualizer
"Build src/components/FDErosion.tsx. Use currentSavings from Zustand store. Show two animated bars side by side over 10 years. Left bar: FD nominal value growing at 6.8% annually (green label 'Your FD says'). Right bar: real purchasing power shrinking — same money at 6.8% minus 5.8% inflation = 1% real return (red label 'What it actually buys'). Animate bars growing/shrinking simultaneously on mount using Framer Motion. Below show: 'Meanwhile a Nifty 50 SIP would have grown to ₹X' calculated at 14% CAGR. All values in INR formatted as Lakh/Crore where relevant. Empathy pulse amber background shift on this screen. Continue button calls onComplete()."

---

## Monte Carlo fan chart
"Build src/components/MonteCarloChart.tsx. Implement the Monte Carlo simulation in a separate src/lib/monteCarlo.ts file:
- boxMuller() function for Gaussian random numbers
- mu = Math.log(1.14)/12, sigma = 0.18/Math.sqrt(12)
- Each month: val = (val + monthlyAmount) * (1 + Math.exp(mu + sigma*boxMuller()) - 1)
- Run 600 paths over years*12 months
- Extract p10, p50, p90 paths by finding closest path to each percentile of final values
- Also track invested line: i * monthlyAmount per month
Use Chart.js to render a line chart. All 600 paths in rgba(255,255,255,0.05). p10 path in rgba(226,75,74,0.8) dashed. p50 path in #378ADD solid bold. p90 path in rgba(29,158,117,0.8). Invested line in rgba(239,159,39,0.6) dashed. Below the chart show three glass stat cards: Median outcome (p50 final value in INR), Worst case (p10), Best case (p90). Worst case must say 'In the worst case, you'd be ₹X below your investment — historically Nifty 50 recovered from such drops within 14 months.' Sliders for monthlyAmount (₹500–₹10,000) and years (3–20) that re-run simulation on change. onComplete() on continue."

---

## First ₹500 time machine
"Build src/components/TimeMachine.tsx. This is the most important screen. Simulate ₹500/month SIP from January 2015 to December 2024 using these approximate real Nifty 50 annual returns by year: 2015: 26%, 2016: 3%, 2017: 28%, 2018: 3%, 2019: 12%, 2020: 15% (includes -38% crash in March then recovery), 2021: 24%, 2022: 4%, 2023: 20%, 2024: 8%. Convert to monthly returns as annualReturn/12. Show a large animated counter of the portfolio value. Play through all 120 months at 60ms per month interval when user clicks 'Start Time Machine'. When reaching March 2020 (month 63), pause for 1 second, flash the portfolio value in red, show overlay text 'COVID crash — down ₹1,200 — most people withdrew here', then resume and show recovery. End state: show final portfolio value, total invested (₹60,000), profit in teal, and a message 'If you had withdrawn in March 2020, you'd have locked in a loss. Staying invested turned fear into ₹X profit.' onComplete() shows continue button after animation completes."

---

## Fear fingerprint card
"Build src/components/FingerprintCard.tsx. A shareable card (fixed 400x600px dimensions for consistent download) showing: top — app name 'InvestEase' in small amber text. Large center — the user's fear type name (from Zustand). Below — their metaphor style badge. Three stats in glass mini-cards: Monthly SIP, Median 10yr outcome, Worst case survival note. Bottom — 'I faced my investing fear. You can too.' in italic. Entire card uses the glass design system on #0a0a0f background. Use html2canvas to capture the card div and download as PNG when user clicks 'Download My Card'. Also a 'Start Investing' ghost button below the card that links to Zerodha/Groww. Framer Motion scale-up entrance animation."

---

## Arjun jargon buster (add to any screen)
"Add a floating Arjun mentor button to [ComponentName]. Fixed position bottom-right, amber circular button with a subtle pulse animation. On click, opens a glass panel with a text input. On submit, call the Claude API:
fetch('https://api.anthropic.com/v1/messages', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, system: 'You are Arjun, a calm stoic financial mentor for young Indians aged 18–28. Never use jargon without explaining it. Always give rupee amounts not percentages. Frame worst cases as survivable. Max 60 words.', messages: [{role:'user', content: userMessage}] }) })
Show response in the glass panel. Loading state: show pulsing dots. The fearType from Zustand is appended to every message as '[User fear type: X]' prefix."

---

## Empathy pulse (add to any screen)
"Add empathy pulse to [ComponentName]. When [specific trigger condition], animate the page background from transparent to rgba(239,159,39,0.04) over 1.2 seconds using Framer Motion animate on a full-screen fixed div with pointerEvents none. Reverse when condition clears."

---

## Lenis smooth scroll setup
"Add Lenis smooth scrolling to App.tsx. Initialize Lenis on mount, run its raf loop with requestAnimationFrame, destroy on unmount. Apply to the main scroll container."

---

## Debug prompt (use when something breaks)
"Do not change any component's props interface, onComplete() signature, Zustand store shape, or CSS design system variables. Fix only the specific broken behavior: [describe bug]. Show me only the changed lines."

---

## Polish pass (run last, never first)
"Do a polish pass on [ComponentName]. Do not change any logic or data. Only: ensure all card entrances use Framer Motion fade-up (y:20→0, opacity:0→1, 0.6s easeOut). Ensure all number displays count up from 0 using Framer Motion useMotionValue and useTransform. Ensure all hover states on buttons and cards feel responsive. Ensure the empathy pulse is present on any screen showing loss/crash content."