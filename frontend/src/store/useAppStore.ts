import { create } from 'zustand'
import {
  fetchUser,
  fetchPortfolioSummary,
  fetchHoldings,
  type UserData,
  type MetricItem,
  type HoldingsData,
} from '../lib/api'
import { auth, db, isFirebaseConfigured } from '../lib/firebase'
import { doc, setDoc, getDoc } from 'firebase/firestore'
import { onAuthStateChanged } from 'firebase/auth'


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
  isAuthLoading: boolean
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

  // ── Gamification ──────────────────────────────────────────────────────────
  xpPoints: number
  acknowledgedStreakMilestones: number[]
  dailyActions: { date: string; completed: string[] }
  addXP: (amount: number) => void
  acknowledgeMilestone: (n: number) => void
  completeDailyAction: (action: string) => void

  // ── Onboarding ─────────────────────────────────────────────────────────────
  hasCompletedOnboarding: boolean
  setOnboardingComplete: () => void

  // ── KINU ──────────────────────────────────────────────────────────────────
  kinuIntroSeen: boolean
  setKinuIntroSeen: () => void

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

  // ── Women's Journey ────────────────────────────────────────────────────────
  userGender: 'female' | 'male' | 'other' | null
  lifeStage: 'student' | 'working_single' | 'newly_married' |
             'planning_family' | 'career_break' | 'returning_work' |
             'single_income' | 'financial_reset' | 'pre_retirement' | null
  setUserGender: (g: 'female' | 'male' | 'other') => void
  setLifeStage: (s: string) => void

  // ── SHG Circle ─────────────────────────────────────────────────────────────
  circleId: string | null
  circleName: string | null
  circleMembers: { name: string; modulesCompleted: number; streak: number }[]
  setCircle: (id: string, name: string) => void

  // ── Voucher / rewards ──────────────────────────────────────────────────────
  voucherPoints: number
  addVoucherPoints: (n: number) => void
  pendingVoucher: { amount: number; partner: string } | null
  setPendingVoucher: (v: { amount: number; partner: string } | null) => void

  // ── Reset ─────────────────────────────────────────────────────────────────
  reset: () => void
}

// ── Store ────────────────────────────────────────────────────────────────────

// Clear any stale localStorage cache from previous persist-enabled builds
if (typeof window !== 'undefined') {
  localStorage.removeItem('kinetic-app-state')
}

// Dev helper: expose store for console testing (e.g. window.__KINETIC_STORE.getState().setUserGender('female'))
// Assigned after store creation below

export const useAppStore = create<AppState>()(
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
      isAuthLoading: true,
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
        get().completeDailyAction('learning')
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

      // ── Gamification ────────────────────────────────────────────────────────
      xpPoints: 0,
      acknowledgedStreakMilestones: [],
      dailyActions: { date: '', completed: [] },
      addXP: (amount) => set(state => ({ xpPoints: state.xpPoints + amount })),
      acknowledgeMilestone: (n) => set(state => ({ acknowledgedStreakMilestones: [...state.acknowledgedStreakMilestones, n] })),
      completeDailyAction: (action) => {
        const state = get()
        const today = new Date().toDateString()
        const current = state.dailyActions.date === today
          ? state.dailyActions
          : { date: today, completed: [] }
        if (current.completed.includes(action)) return
        const newCompleted = [...current.completed, action]
        
        const xpGained = newCompleted.length === 3 ? 50 : 0
        set({ 
          dailyActions: { date: today, completed: newCompleted },
          xpPoints: state.xpPoints + xpGained
        })
      },

      // ── Onboarding ───────────────────────────────────────────────────────────
      hasCompletedOnboarding: false,
      setOnboardingComplete: () => set({ hasCompletedOnboarding: true }),

      // ── KINU ─────────────────────────────────────────────────────────────────
      kinuIntroSeen: false,
      setKinuIntroSeen: () => set({ kinuIntroSeen: true }),

      // ── Dashboard Section ───────────────────────────────────────────────────
      dashboardSection: 'home',
      setDashboardSection: (dashboardSection) => {
        set({ dashboardSection })
        if (dashboardSection === 'portfolio') {
          get().completeDailyAction('portfolio')
        }
        // Keep the URL in sync when components call this directly (without using navigate())
        const targetPath = `/dashboard/${dashboardSection}`
        if (window.location.pathname !== targetPath) {
          window.history.pushState({}, '', targetPath)
        }
      },
      activeModuleId: null,
      setActiveModuleId: (activeModuleId) => set({ activeModuleId }),

      // ── Simulation Result ───────────────────────────────────────────────────
      simulationResult: null,
      setSimulationResult: (simulationResult) => {
        set({ simulationResult })
        get().completeDailyAction('simulation')
      },

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

      // ── Women's Journey ──────────────────────────────────────────────────────
      userGender: (typeof window !== 'undefined' ? localStorage.getItem('kinetic-userGender') as any : null) || null,
      lifeStage: (typeof window !== 'undefined' ? localStorage.getItem('kinetic-lifeStage') as any : null) || null,
      setUserGender: (userGender) => {
        if (typeof window !== 'undefined') localStorage.setItem('kinetic-userGender', userGender)
        set({ userGender })
      },
      setLifeStage: (lifeStage) => {
        if (typeof window !== 'undefined') localStorage.setItem('kinetic-lifeStage', lifeStage)
        set({ lifeStage: lifeStage as any })
      },

      // ── SHG Circle ────────────────────────────────────────────────────────────
      circleId: null,
      circleName: null,
      circleMembers: [],
      setCircle: (circleId, circleName) => set({ circleId, circleName }),

      // ── Voucher / rewards ─────────────────────────────────────────────────────
      voucherPoints: 0,
      addVoucherPoints: (n) => set(s => ({ voucherPoints: s.voucherPoints + n })),
      pendingVoucher: null,
      setPendingVoucher: (pendingVoucher) => set({ pendingVoucher }),

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
    })
)

// Dev: expose store on window for console testing
if (typeof window !== 'undefined') {
  (window as any).__KINETIC_STORE = useAppStore
}

// ── Firebase Sync Sync ───────────────────────────────────────────────────────
if (isFirebaseConfigured && auth && db) {
  // 1. Listen to Auth changes to hydrate local state from remote
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // User logged in — fetch their document
      const docRef = doc(db, 'users', user.uid)
      const docSnap = await getDoc(docRef)
      if (docSnap.exists()) {
        const data = docSnap.data()
        // Skip Firestore hydration of hasCompletedOnboarding for users in a
        // fresh signup flow (isNewUser=true was set before the auth call).
        // This prevents Firebase IndexedDB cache from hiding the onboarding.
        const isSigningUp = useAppStore.getState().isNewUser
        // Hydrate the store with remote data (merging over defaults)
        useAppStore.setState({
          isAuthLoading: false,
          isAuthenticated: true,
          ...(data.hasCompletedOnboarding === true && !isSigningUp ? {
            isNewUser: false,
            hasCompletedOnboarding: true,
          } : {}),
          userId: user.uid,
          userEmail: user.email || '',
          userName: data.userName || '',
          fearType: data.fearType || null,
          metaphorStyle: data.metaphorStyle || null,
          portfolioSetup: data.portfolioSetup || false,
          fearProgress: data.fearProgress || 0,
          completedModules: data.completedModules || [],
          streakDays: data.streakDays || 0,
          cryptoEnabled: data.cryptoEnabled || false,
          userGender: data.userGender || null,
          lifeStage: data.lifeStage || null,
        })
      } else {
        // First login, they have no doc yet (handled in SignUp)
        useAppStore.setState({ isAuthLoading: false, isAuthenticated: true, userId: user.uid, userEmail: user.email || '' })
      }
    } else {
      // User logged out
      useAppStore.getState().reset()
      useAppStore.setState({ isAuthLoading: false, isAuthenticated: false, userId: '', userEmail: '' })
    }
  })

  // 2. Subscribe to Zustand changes and sync vital fields up to Firestore
  useAppStore.subscribe((state, prevState) => {
    // Only sync if authenticated
    if (!state.isAuthenticated || !state.userId) return;

    // We don't want to sync constantly on every single keystroke.
    // Check if critical fields actually changed:
    const criticalFieldsChanged = 
      state.fearType !== prevState.fearType ||
      state.metaphorStyle !== prevState.metaphorStyle ||
      state.portfolioSetup !== prevState.portfolioSetup ||
      state.fearProgress !== prevState.fearProgress ||
      state.completedModules.length !== prevState.completedModules.length ||
      state.streakDays !== prevState.streakDays ||
      state.cryptoEnabled !== prevState.cryptoEnabled ||
      state.hasCompletedOnboarding !== prevState.hasCompletedOnboarding ||
      state.userGender !== prevState.userGender ||
      state.lifeStage !== prevState.lifeStage;

    if (criticalFieldsChanged) {
      const docRef = doc(db, 'users', state.userId)
      // Non-blocking fire-and-forget sync
      setDoc(docRef, {
        fearType: state.fearType,
        metaphorStyle: state.metaphorStyle,
        portfolioSetup: state.portfolioSetup,
        fearProgress: state.fearProgress,
        completedModules: state.completedModules,
        streakDays: state.streakDays,
        cryptoEnabled: state.cryptoEnabled,
        userName: state.userName,
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        userGender: state.userGender,
        lifeStage: state.lifeStage,
        lastSync: new Date().toISOString()
      }, { merge: true }).catch(err => {
        console.error('Failed to sync state to Firebase:', err)
      })
    }
  })
}
