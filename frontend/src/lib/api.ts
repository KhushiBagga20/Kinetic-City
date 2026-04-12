// ── Kinetic API Client ──────────────────────────────────────────────────────
// All calls go to the FastAPI backend. Data shapes match the API responses.

const BASE = 'http://localhost:8000'

// ── Types ───────────────────────────────────────────────────────────────────

export interface UserData {
  name: string
  greeting: string
  tip: { title: string; message: string }
}

export interface MetricItem {
  title: string
  value: string
  subtext: string
  highlight: boolean
}

export interface ChartPoint {
  time: string
  value: number
}

export interface HoldingTicker {
  symbol: string
  sector: string
  price: string
  change: string
  positive: boolean
  time: string
}

export interface DividendTicker {
  symbol: string
  sector: string
  price: string
  dividendPerShare: string
  date: string
}

export interface HoldingsData {
  hotTicker: HoldingTicker
  dividendAlert?: DividendTicker
}

// ── Fetchers ────────────────────────────────────────────────────────────────

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`)
  if (!res.ok) throw new Error(`API ${path} returned ${res.status}`)
  return res.json()
}

export async function fetchUser(): Promise<UserData> {
  return get<UserData>('/api/user')
}

export async function fetchPortfolioSummary(): Promise<MetricItem[]> {
  const data = await get<{ metrics: MetricItem[] }>('/api/portfolio/summary')
  return data.metrics
}

export async function fetchChartData(period: string = '1Y'): Promise<ChartPoint[]> {
  const data = await get<{ data: ChartPoint[] }>(`/api/portfolio/chart?period=${period}`)
  return data.data
}

export async function fetchHoldings(): Promise<HoldingsData> {
  return get<HoldingsData>('/api/portfolio/holdings')
}

// ── Sandbox & Instinct Debrief ──────────────────────────────────────────────

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API ${path} returned ${res.status}`)
  return res.json()
}

export async function postCreateUser(data: {
  name: string
  email: string
  fear_type: string
  metaphor_style: string
  password?: string
  guest_id?: string
}): Promise<{ success: boolean; user_id: string }> {
  return post('/api/user', data)
}

export async function postSignIn(data: {
  email: string
  password: string
}): Promise<{ success: boolean; user_id: string; name: string; fear_type: string | null }> {
  return post('/api/signin', data)
}

export async function postSandboxDebrief(data: {
  year: string
  allocation: { nifty: number; midcap: number; smallcap: number; debt: number }
  final_values: { nifty: number; midcap: number; smallcap: number; debt: number }
  did_pull_out: boolean
  pulled_out_month?: number | null
  fear_type: string
}): Promise<{ debrief: string }> {
  return post('/api/sandbox-debrief', data)
}

export async function postInstinctDebrief(data: {
  start_year: number
  monthly_amount: number
  did_withdraw: boolean
  withdraw_month?: number | null
  fear_type: string
  final_value: number
  total_invested: number
}): Promise<{ debrief: string }> {
  return post('/api/instinct-debrief', data)
}

export async function postSandboxAdvice(data: {
  year: string
  user_allocation: { nifty: number; midcap: number; smallcap: number; debt: number }
  optimal_allocation: { nifty: number; midcap: number; smallcap: number; debt: number }
  user_result: number
  optimal_result: number
  total_invested: number
  fear_type: string
  did_pull_out: boolean
}): Promise<{ advice: string }> {
  return post('/api/sandbox-advice', data)
}

export async function postHarvestDebrief(data: {
  era: string
  era_years: number
  budget: number
  style: string
  allocation: Record<string, number>
  final_value: number
  total_invested: number
  fear_type: string
}): Promise<{ insights: string }> {
  return post('/api/harvest-debrief', data)
}

export async function postFearQuote(data: {
  fear_type: string
  user_name?: string
  context?: string
}): Promise<{ quote: string }> {
  return post('/api/fear-quote', data)
}
