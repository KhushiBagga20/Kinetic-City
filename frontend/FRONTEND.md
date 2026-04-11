# Unscared — Frontend Rules

## Stack
- React 18 + Vite + TypeScript
- Tailwind CSS (utility classes only, no custom config unless necessary)
- Framer Motion (ALL animations — never use CSS transitions or keyframes directly)
- Lenis (smooth scroll, initialized once in App.tsx)
- Chart.js (Monte Carlo fan chart only)
- Three.js (particle background only — no other 3D)
- html2canvas (Fear Fingerprint card download)
- Zustand (global state — one store, no context API)

## Folder structure
src/
├── components/
│   ├── Landing.tsx
│   ├── FearProfiler.tsx
│   ├── FDErosion.tsx
│   ├── MonteCarloChart.tsx
│   ├── TimeMachine.tsx
│   ├── FingerprintCard.tsx
│   └── shared/
│       ├── GlassCard.tsx
│       ├── JargonTerm.tsx
│       ├── ArjunMentor.tsx
│       └── ParticleBackground.tsx
├── store/
│   └── appState.ts
├── lib/
│   ├── monteCarlo.ts
│   ├── fdErosion.ts
│   ├── fearProfiler.ts
│   └── claudeAPI.ts
├── styles/
│   └── globals.css
└── App.tsx

## Global state (Zustand — never use local state for these)
fearType: 'loss' | 'jargon' | 'scam' | 'trust' | null
monthlyAmount: number        // default 500
years: number                // default 10
currentSavings: number       // default 50000
step: 0 | 1 | 2 | 3 | 4 | 5 | 6
metaphorStyle: 'gamer' | 'student' | 'professional' | 'generic'
empathyPulse: boolean        // true when showing crash/loss content

## Component contract (every component must follow this)
- Receives AppState values as props via useAppState() hook
- Calls onComplete() to advance — never navigates itself
- Never manages step directly
- Uses .glass class for all card surfaces
- Uses Framer Motion for every visible animation
- Formats all money as ₹X.XX L or ₹X.XX Cr using formatINR() from lib/fdErosion.ts

## Design tokens (never hardcode these values — use CSS variables)
--bg: #0a0a0f
--surface: rgba(255,255,255,0.04)
--surface-hover: rgba(255,255,255,0.07)
--border: rgba(255,255,255,0.08)
--border-bright: rgba(255,255,255,0.16)
--text-primary: rgba(255,255,255,0.92)
--text-secondary: rgba(255,255,255,0.48)
--accent: #EF9F27
--teal: #1D9E75
--danger: #E24B4A
--blue: #378ADD
--radius-sm: 8px
--radius-md: 16px
--radius-lg: 24px

## Glass card style (use this exact CSS — never improvise)
background: rgba(255,255,255,0.04);
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
border: 1px solid rgba(255,255,255,0.08);
border-radius: 16px;

On hover:
border-color: rgba(255,255,255,0.16);
transform: scale(1.01);
transition: all 0.2s ease;

## Animation rules
All entrances:
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.6, ease: 'easeOut' }}

Step transitions (wrap in AnimatePresence):
initial={{ opacity: 0, x: 40 }}
animate={{ opacity: 1, x: 0 }}
exit={{ opacity: 0, x: -40 }}
transition={{ duration: 0.4 }}

Number counters:
Always use Framer Motion useMotionValue + animate() to count up from 0
Never snap a number to its final value

Empathy pulse:
When empathyPulse === true, animate a fixed full-screen div:
background rgba(239,159,39,0.03), transition 1.2s ease
pointerEvents none, zIndex -1

Hover states:
Buttons: opacity 0.85 on hover, scale(0.98) on active
Cards: border brightens, scale(1.01)

## Scroll behavior
Initialize Lenis in App.tsx on mount:
const lenis = new Lenis()
function raf(time) { lenis.raf(time); requestAnimationFrame(raf) }
requestAnimationFrame(raf)
Destroy on unmount.

## Three.js particle background rules
- 800 particles, color #EF9F27, size 0.08, opacity 0.4
- Slow upward drift, subtle y-axis rotation
- Fixed position, zIndex 0, pointerEvents none
- Renders behind everything
- Initialized once, never re-rendered on state change
- Disposed properly on unmount (renderer.dispose())

## Chart.js rules (Monte Carlo only)
- All 600 simulation paths: rgba(255,255,255,0.05), lineWidth 1
- p10 path: rgba(226,75,74,0.8), dashed [4,3], lineWidth 2
- p50 path: #378ADD, solid, lineWidth 2.5
- p90 path: rgba(29,158,117,0.8), solid, lineWidth 2
- Invested line: rgba(239,159,39,0.6), dashed [6,4], lineWidth 1.5
- No Chart.js default legend — build custom HTML legend
- responsive: true, maintainAspectRatio: false
- Canvas wrapped in div with explicit height (300px)

## Money formatting (always use this function)
function formatINR(val: number): string {
  if (val >= 1e7) return `₹${(val / 1e7).toFixed(2)} Cr`
  if (val >= 1e5) return `₹${(val / 1e5).toFixed(2)} L`
  return `₹${Math.round(val).toLocaleString('en-IN')}`
}

## Worst case framing (never show raw percentages to users)
Always say:
"In the worst case, your portfolio could be [₹X] below what you invested —
historically Nifty 50 recovered from such drops within 14 months."
Never say: "You could lose 18%"

## What NOT to do
- No white or light backgrounds anywhere
- No CSS keyframes — use Framer Motion only
- No react-router — step-based rendering in App.tsx only
- No context API — Zustand only
- No Three.js terrain or data-bound 3D — particles only
- No inline styles for colors — use CSS variables
- No emoji in UI — geometric shapes or SVG only
- No percentage-framed loss language to users