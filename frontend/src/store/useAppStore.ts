import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  fetchUser,
  fetchPortfolioSummary,
  fetchHoldings,
  type UserData,
  type MetricItem,
  type HoldingsData,
} from '../lib/api'

// ── Types ────────────────────────────────────────────────────────────────────

export type FearType = 'loss' | 'jargon' | 'scam' | 'trust'
export type MetaphorStyle = 'gamer' | 'student' | 'professional' | 'generic'

export interface SimulationResult {
  p10: number
  p50: number
  p90: number
  totalInvested: number
}

export interface TimeMachineResult {
  finalValue: number
  totalInvested: number
  didWithdraw: boolean
}

export interface SandboxResult {
  year: string
  allocation: { nifty: number; midcap: number; smallcap: number; debt: number }
  finalValue: number
  totalInvested: number
  kinuDebrief: string
  didPullOut: boolean
}

export interface HarvestResult {
  era: string
  budget: number
  style: 'lumpsum' | 'sip' | 'freestyle'
  allocation: Record<string, number>
  finalValue: number
  totalInvested: number
  kinuInsights: string
  date: string
}

export interface Goal {
  id: string
  name: string
  targetAmount: number
  targetYears: number
  category: 'emergency' | 'car' | 'house' | 'retirement' | 'wedding' | 'education' | 'other'
  requiredMonthlySIP: number
  currentValue: number
  createdAt: string
  linkedSIPAmount: number
}

export interface ManualHolding {
  id: string
  type: 'index_fund' | 'stock' | 'debt_fund' | 'gold_etf'
  name: string
  symbol?: string
  amountInvested: number
  units?: number
  buyDate: string
  buyNav?: number
  buyPrice?: number
}

// ── Store types ─────────────────────────────────────────────────────────────

interface AppState {
  // ── View ──────────────────────────────────────────────────────────────────
  view: 'landing' | 'quiz' | 'dashboard' | 'signup' | 'personalized-dashboard'
  setView: (view: AppState['view']) => void

  // ── User Mode ─────────────────────────────────────────────────────────────
  isNewUser: boolean
  setIsNewUser: (v: boolean) => void

  // ── Fear Profile ──────────────────────────────────────────────────────────
  fearType: FearType | null
  metaphorStyle: MetaphorStyle | null
  setFearProfile: (fearType: FearType, metaphorStyle: MetaphorStyle) => void

  // ── User Profile ──────────────────────────────────────────────────────────
  userName: string
  userEmail: string
  guestId: string
  userId: string
  setUserProfile: (name: string, email: string, guestId: string) => void
  setUserId: (id: string) => void

  // ── Auth ───────────────────────────────────────────────────────────────────
  isAuthenticated: boolean
  signOut: () => void

  // ── Portfolio Setup ────────────────────────────────────────────────────────
  portfolioSetup: boolean
  setPortfolioSetup: (v: boolean) => void
  selectedFund: string
  setSelectedFund: (v: string) => void
  sipDate: number
  setSipDate: (v: number) => void
  portfolioSetupDate: string
  setPortfolioSetupDate: (v: string) => void

  // ── Simulation Inputs ─────────────────────────────────────────────────────
  monthlyAmount: number
  years: number
  currentSavings: number
  setMonthlyAmount: (v: number) => void
  setYears: (v: number) => void
  setCurrentSavings: (v: number) => void

  // ── Journey Step ──────────────────────────────────────────────────────────
  step: number
  setStep: (v: number) => void

  // ── Fear Progress ─────────────────────────────────────────────────────────
  fearProgress: number
  completedModules: string[]
  completeModule: (moduleId: string, fearProgressIncrement?: number) => void
  incrementFearProgress: (amount: number) => void

  // ── Streak ────────────────────────────────────────────────────────────────
  streakDays: number
  lastVisitDate: string
  updateStreak: () => void

  // ── Empathy Pulse ─────────────────────────────────────────────────────────
  empathyPulse: boolean
  setEmpathyPulse: (v: boolean) => void

  // ── Dashboard Section ─────────────────────────────────────────────────────
  dashboardSection: string
  setDashboardSection: (section: string) => void
  activeModuleId: string | null
  setActiveModuleId: (id: string | null) => void

  // ── Simulation Result ─────────────────────────────────────────────────────
  simulationResult: SimulationResult | null
  setSimulationResult: (result: SimulationResult) => void

  // ── Time Machine Result ───────────────────────────────────────────────────
  timeMachineResult: TimeMachineResult | null
  setTimeMachineResult: (result: TimeMachineResult) => void

  // ── Sandbox Result ────────────────────────────────────────────────────────
  sandboxResult: SandboxResult | null
  setSandboxResult: (result: SandboxResult) => void

  // ── Risk Horizon ──────────────────────────────────────────────────────────
  riskHorizonYears: number
  setRiskHorizonYears: (v: number) => void

  // ── Age Allocation ────────────────────────────────────────────────────────
  userAge: number
  setUserAge: (v: number) => void

  // ── Portfolio Pulse ────────────────────────────────────────────────────────
  portfolioPulseView: 'day' | 'total'
  setPortfolioPulseView: (v: 'day' | 'total') => void

  // ── Card Customisation (Fix 4) ─────────────────────────────────────────────
  cardStyle: 'dark' | 'minimal' | 'fear'
  setCardStyle: (v: 'dark' | 'minimal' | 'fear') => void
  cardHeadline: string
  setCardHeadline: (v: string) => void
  cardVisibleStats: string[]
  setCardVisibleStats: (v: string[]) => void

  // ── Crypto (Fix 5) ─────────────────────────────────────────────────────────
  cryptoEnabled: boolean
  setCryptoEnabled: (v: boolean) => void

  // ── Harvest Room (Fix 6) ───────────────────────────────────────────────────
  harvestResults: HarvestResult[]
  addHarvestResult: (result: HarvestResult) => void

  // ── Dashboard Data (returning user) ───────────────────────────────────────
  user: UserData | null
  metrics: MetricItem[] | null
  holdings: HoldingsData | null
  loading: boolean
  error: string | null
  fetchDashboardData: () => Promise<void>

  // ── News (session-only, not persisted) ─────────────────────────────────────
  newsItems: any[]
  newsLastFetched: number | null

  // ── Convenience aliases ──────────────────────────────────────────────────────────
  setSipSetupDate: (v: string) => void
  resetForNewUser: () => void

  // ── Goals ──────────────────────────────────────────────────────────────────
  goals: Goal[]
  activeGoalId: string | null
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'requiredMonthlySIP' | 'currentValue'>) => void
  updateGoalProgress: (id: string, currentValue: number) => void
  removeGoal: (id: string) => void

  // ── Manual Portfolio ────────────────────────────────────────────────────────
  manualHoldings: ManualHolding[]
  addHolding: (holding: Omit<ManualHolding, 'id'>) => void
  removeHolding: (id: string) => void

  // ── Watchlist ──────────────────────────────────────────────────────────────
  watchlist: string[]
  toggleWatchlist: (symbol: string) => void

  // ── Reset ─────────────────────────────────────────────────────────────────
  reset: () => void
}

// ── Store ────────────────────────────────────────────────────────────────────

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // ── View ────────────────────────────────────────────────────────────────
      view: 'landing',
      setView: (view) => {
        set({ view })
        if (view === 'dashboard' && !get().isNewUser && !get().user) {
          get().fetchDashboardData()
        }
      },

      // ── User Mode ───────────────────────────────────────────────────────────
      isNewUser: false,
      setIsNewUser: (v) => set({ isNewUser: v }),

      // ── Fear Profile ────────────────────────────────────────────────────────
      fearType: null,
      metaphorStyle: null,
      setFearProfile: (fearType, metaphorStyle) => set({ fearType, metaphorStyle }),

      // ── User Profile ────────────────────────────────────────────────────────
      userName: '',
      userEmail: '',
      guestId: '',
      userId: '',
      setUserProfile: (userName, userEmail, guestId) => set({ userName, userEmail, guestId }),
      setUserId: (userId) => set({ userId }),

      // ── Auth ─────────────────────────────────────────────────────────────────
      isAuthenticated: false,
      signOut: () => set({ userEmail: '', userId: '', isAuthenticated: false }),

      // ── Portfolio Setup ──────────────────────────────────────────────────────
      portfolioSetup: false,
      setPortfolioSetup: (portfolioSetup) => set({ portfolioSetup }),
      selectedFund: '',
      setSelectedFund: (selectedFund) => set({ selectedFund }),
      sipDate: 5,
      setSipDate: (sipDate) => set({ sipDate }),
      portfolioSetupDate: '',
      setPortfolioSetupDate: (portfolioSetupDate) => set({ portfolioSetupDate }),

      // ── Simulation Inputs ───────────────────────────────────────────────────
      monthlyAmount: 500,
      years: 10,
      currentSavings: 50000,
      setMonthlyAmount: (monthlyAmount) => set({ monthlyAmount }),
      setYears: (years) => set({ years }),
      setCurrentSavings: (currentSavings) => set({ currentSavings }),

      // ── Journey Step ────────────────────────────────────────────────────────
      step: 0,
      setStep: (step) => set({ step }),

      // ── Fear Progress ───────────────────────────────────────────────────────
      fearProgress: 20,
      completedModules: [],
      completeModule: (moduleId, fearProgressIncrement) => {
        const s = get()
        const deduped = [...new Set(s.completedModules)]
        if (deduped.includes(moduleId)) return
        const increment = fearProgressIncrement ?? 10
        set({
          completedModules: [...deduped, moduleId],
          fearProgress: Math.min(100, s.fearProgress + increment),
        })
      },
      incrementFearProgress: (amount) => {
        set({ fearProgress: Math.min(100, get().fearProgress + amount) })
      },

      // ── Streak ──────────────────────────────────────────────────────────────
      streakDays: 0,
      lastVisitDate: '',
      updateStreak: () => {
        const s = get()
        const today = new Date().toISOString().split('T')[0]
        if (s.lastVisitDate === today) return
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
        const newStreak = s.lastVisitDate === yesterday ? s.streakDays + 1 : 1
        set({ streakDays: newStreak, lastVisitDate: today })
      },

      // ── Empathy Pulse ───────────────────────────────────────────────────────
      empathyPulse: false,
      setEmpathyPulse: (empathyPulse) => set({ empathyPulse }),

      // ── Dashboard Section ───────────────────────────────────────────────────
      dashboardSection: 'home',
      setDashboardSection: (dashboardSection) => set({ dashboardSection }),
      activeModuleId: null,
      setActiveModuleId: (activeModuleId) => set({ activeModuleId }),

      // ── Simulation Result ───────────────────────────────────────────────────
      simulationResult: null,
      setSimulationResult: (simulationResult) => set({ simulationResult }),

      // ── Time Machine Result ─────────────────────────────────────────────────
      timeMachineResult: null,
      setTimeMachineResult: (timeMachineResult) => set({ timeMachineResult }),

      // ── Sandbox Result ──────────────────────────────────────────────────────
      sandboxResult: null,
      setSandboxResult: (sandboxResult) => set({ sandboxResult }),

      // ── Risk Horizon ────────────────────────────────────────────────────────
      riskHorizonYears: 7,
      setRiskHorizonYears: (riskHorizonYears) => set({ riskHorizonYears }),

      // ── Age Allocation ──────────────────────────────────────────────────────
      userAge: 22,
      setUserAge: (userAge) => set({ userAge }),

      // ── Portfolio Pulse ─────────────────────────────────────────────────────
      portfolioPulseView: 'day',
      setPortfolioPulseView: (portfolioPulseView) => set({ portfolioPulseView }),

      // ── Card Customisation ──────────────────────────────────────────────────
      cardStyle: 'dark',
      setCardStyle: (cardStyle) => set({ cardStyle }),
      cardHeadline: '',
      setCardHeadline: (cardHeadline) => set({ cardHeadline }),
      cardVisibleStats: ['fear-type', 'sip', 'median', 'streak'],
      setCardVisibleStats: (cardVisibleStats) => set({ cardVisibleStats }),

      // ── Crypto ───────────────────────────────────────────────────────────────
      cryptoEnabled: false,
      setCryptoEnabled: (cryptoEnabled) => set({ cryptoEnabled }),

      // ── Harvest Room ────────────────────────────────────────────────────────
      harvestResults: [],
      addHarvestResult: (result) => set({ harvestResults: [...get().harvestResults, result] }),

      // ── News (session-only) ─────────────────────────────────────────────────
      newsItems: [],
      newsLastFetched: null,

      // ── Convenience aliases ──────────────────────────────────────────────────
      setSipSetupDate: (v) => set({ portfolioSetupDate: v }),
      resetForNewUser: () => set({
        fearProgress: 0, completedModules: [], simulationResult: null,
        timeMachineResult: null, sandboxResult: null, streakDays: 0,
        lastVisitDate: '', dashboardSection: 'home', harvestResults: [],
      }),

      // ── Goals ────────────────────────────────────────────────────────────────
      goals: [],
      activeGoalId: null,
      addGoal: (goalInput) => {
        const r = 0.14 / 12
        const n = goalInput.targetYears * 12
        const requiredMonthlySIP = goalInput.targetAmount / (((Math.pow(1 + r, n) - 1) / r) * (1 + r))
        const goal: Goal = {
          ...goalInput,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          requiredMonthlySIP: Math.round(requiredMonthlySIP),
          currentValue: 0,
        }
        set({ goals: [...get().goals, goal] })
      },
      updateGoalProgress: (id, currentValue) => set({
        goals: get().goals.map(g => g.id === id ? { ...g, currentValue } : g),
      }),
      removeGoal: (id) => set({ goals: get().goals.filter(g => g.id !== id) }),

      // ── Manual Portfolio ──────────────────────────────────────────────────────
      manualHoldings: [],
      addHolding: (holdingInput) => {
        const holding: ManualHolding = {
          ...holdingInput,
          id: crypto.randomUUID(),
        }
        set({ manualHoldings: [...get().manualHoldings, holding] })
      },
      removeHolding: (id) => set({ manualHoldings: get().manualHoldings.filter(h => h.id !== id) }),

      // ── Watchlist ──────────────────────────────────────────────────────────────
      watchlist: [],
      toggleWatchlist: (symbol) => {
        const current = get().watchlist
        set({ watchlist: current.includes(symbol) ? current.filter(s => s !== symbol) : [...current, symbol] })
      },

      // ── Reset ───────────────────────────────────────────────────────────────
      reset: () => set({
        view: 'landing', step: 0, fearType: null, userName: '', fearProgress: 0,
        completedModules: [], simulationResult: null, timeMachineResult: null,
        sandboxResult: null, streakDays: 0, lastVisitDate: '', dashboardSection: 'home',
        harvestResults: [], cryptoEnabled: false, goals: [], manualHoldings: [], watchlist: [],
      }),

      // ── Dashboard Data (returning user) ─────────────────────────────────────
      user: null,
      metrics: null,
      holdings: null,
      loading: false,
      error: null,
      fetchDashboardData: async () => {
        set({ loading: true, error: null })
        try {
          const [user, metrics, holdings] = await Promise.all([
            fetchUser(),
            fetchPortfolioSummary(),
            fetchHoldings(),
          ])
          set({ user, metrics, holdings, loading: false })
        } catch (err) {
          console.error('Failed to fetch dashboard data:', err)
          set({
            error: 'Could not connect to Kinetic API',
            loading: false,
            user: {
              name: 'Jais',
              greeting: 'Portfolio data unavailable — backend offline.',
              tip: {
                title: 'Note',
                message: 'Start the backend with: cd backend && python3 -m uvicorn main:app --port 8000',
              },
            },
          })
        }
      },
    }),
    {
      name: 'kinetic-app-state',
      version: 1,  // bump this to clear any stale persisted state
      partialize: (state) => ({
        fearType: state.fearType,
        metaphorStyle: state.metaphorStyle,
        userName: state.userName,
        userEmail: state.userEmail,
        guestId: state.guestId,
        userId: state.userId,
        isAuthenticated: state.isAuthenticated,
        portfolioSetup: state.portfolioSetup,
        selectedFund: state.selectedFund,
        sipDate: state.sipDate,
        portfolioSetupDate: state.portfolioSetupDate,
        monthlyAmount: state.monthlyAmount,
        years: state.years,
        currentSavings: state.currentSavings,
        // NOTE: view and step are intentionally excluded —
        // they must always reset on a fresh page load so the
        // app starts at the landing page, not mid-quiz.
        fearProgress: state.fearProgress,
        completedModules: state.completedModules,
        streakDays: state.streakDays,
        lastVisitDate: state.lastVisitDate,
        simulationResult: state.simulationResult,
        timeMachineResult: state.timeMachineResult,
        sandboxResult: state.sandboxResult,
        riskHorizonYears: state.riskHorizonYears,
        userAge: state.userAge,
        portfolioPulseView: state.portfolioPulseView,
        dashboardSection: state.dashboardSection,
        // Fix 4 — Card customisation
        cardStyle: state.cardStyle,
        cardHeadline: state.cardHeadline,
        cardVisibleStats: state.cardVisibleStats,
        // Fix 5 — Crypto
        cryptoEnabled: state.cryptoEnabled,
        // Fix 6 — Harvest
        harvestResults: state.harvestResults,
        // Goals & Portfolio
        goals: state.goals,
        manualHoldings: state.manualHoldings,
        watchlist: state.watchlist,
      }),
    }
  )
)
