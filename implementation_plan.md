# Kinetic — 14 Fixes Implementation Plan

## Execution Phases

### Phase A — Quick Bug Fixes (FIX 1, 6, 8, 9, 10, 12, 13)
These are isolated bugs that can be fixed without touching other features.

#### FIX 1 — Module Count Bug
- **File**: `PersonalizedDashboard.tsx` (profile dropdown)
- **Change**: Filter `completedModules` by `fearType` prefix. Show "X of 10" instead of raw count
- **Also**: Deduplicate `completedModules` on every write in `useAppStore.ts`

#### FIX 6 — Portfolio ₹14L Jump
- **File**: `PortfolioPage.tsx`
- **Change**: Use `portfolioSetupDate` (ISO string) as start date. If `monthsElapsed < 3`, show empty state card instead of chart
- **Also**: Ensure `sipSetupDate` is set to `new Date().toISOString()` at SIP setup completion

#### FIX 8 — Holdings Sort
- **File**: `PortfolioPage.tsx`
- **Change**: Sort holdings by `getCurrentValue(h)` descending. Group "Your Stocks" above fund constituents

#### FIX 9 — Simulate Dropdown Hover
- **File**: `PersonalizedDashboard.tsx`
- **Change**: Add 150ms hover delay timeout. Apply `onMouseEnter`/`onMouseLeave` to both nav item AND dropdown panel

#### FIX 10 — Goal Progress Bar
- **Files**: `GoalCard.tsx`, `GoalsSection.tsx`
- **Change**: Calculate `currentValue` from portfolio proportional allocation. Minimum 3px visual fill. Never show "₹X short" in danger colour

#### FIX 12 — Toggle Button CSS
- **File**: `index.css` + any component with toggles
- **Change**: Track = pill (border-radius: 12px), thumb = circle. Search all toggle/switch instances

#### FIX 13 — Sandbox Blank Screen
- **File**: `Sandbox.tsx`
- **Change**: Chart destroy before recreate, interval cleanup, NaN guards, ErrorBoundary wrap, month overflow guard

---

### Phase B — Dashboard Changes (FIX 3, 4, 5, 11)
These modify the dashboard home and navbar.

#### FIX 3 — Replace Portfolio Pulse with "Your Next Step"
- **File**: `DashboardHome.tsx`
- **Change**: Remove `PortfolioPulse` import/usage. Create `NextStepCard.tsx` with contextual logic

#### FIX 4 — "Learn First" Quick Access
- **File**: `DashboardHome.tsx`
- **Change**: Add compact Learn shortcut card below Next Step card

#### FIX 5 — Market Pulse Clickable Popup
- **File**: `MarketPulseBoard.tsx`
- **Change**: Add click handler per row, render `StockDetailPopup` via portal

#### FIX 11 — Profile Avatar Redesign
- **File**: `PersonalizedDashboard.tsx`
- **Change**: Redesign avatar circle with fear type colour, hover ring, dropdown layout fixes

---

### Phase C — Portfolio & Goals (FIX 7)
#### FIX 7 — Stock Selection in Setup
- **File**: `PortfolioPage.tsx`
- **Change**: Add stock search step after fund selection, chip UI, allocation sliders

---

### Phase D — Learn Overhaul (FIX 2, 14)
These are the largest changes.

#### FIX 2 — Expand to 10 Modules
- **File**: `curriculumData.ts`
- **Change**: Add modules 6-10 per track with interactive content definitions

#### FIX 14 — Learn Section UX
- **File**: `LearnPage.tsx`
- **Change**: Progress header card, module card redesign, content panel, keyboard nav, mobile accordion

---

## Verification Plan
- `npx tsc --noEmit` — zero errors
- Browser test: navigate all pages, verify no console errors
- Module count shows correct "X of 10"
- Portfolio shows ₹500 not ₹14L for new users
- Market Pulse rows open popup
- Goals show non-empty progress bar
- Sandbox does not blank out
- Simulate dropdown does not flicker
