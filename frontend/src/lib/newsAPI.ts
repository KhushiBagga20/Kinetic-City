// ── News API — fetches Indian market news from backend ─────────────────────

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// ── Types ────────────────────────────────────────────────────────────────────

export interface NewsItem {
  title:     string
  summary:   string
  source:    string
  time:      string
  sentiment: 'positive' | 'negative' | 'neutral'
  category:  'market' | 'macro' | 'sector' | 'commodity'
  impact:    string
  url?:      string
}

// ── Fallback static news when the backend is offline ─────────────────────────

const FALLBACK_NEWS: NewsItem[] = [
  {
    title:     'NIFTY 50 holds above 22,000 amid global uncertainty',
    summary:   'Indian benchmark indices remained resilient as domestic institutional buying offset FII outflows.',
    source:    'ET Markets',
    time:      'Today',
    sentiment: 'neutral',
    category:  'market',
    impact:    'SIP investors benefit from continued accumulation at stable levels.',
  },
  {
    title:     'RBI keeps repo rate unchanged at 6.5%',
    summary:   'The Monetary Policy Committee voted to hold rates, keeping borrowing costs steady for Indian consumers and businesses.',
    source:    'RBI',
    time:      'Today',
    sentiment: 'positive',
    category:  'macro',
    impact:    'Stable EMIs; debt fund investors may see steady returns.',
  },
  {
    title:     'IT sector outperforms as US tech spending rebounds',
    summary:   'Infosys and TCS led gains in the IT index after positive guidance from US enterprise clients.',
    source:    'Moneycontrol',
    time:      'Today',
    sentiment: 'positive',
    category:  'sector',
    impact:    'Tech-heavy portfolios may see near-term tailwinds.',
  },
  {
    title:     'Gold prices rise on safe-haven demand',
    summary:   'MCX Gold touched ₹72,000/10g as geopolitical tensions pushed investors toward safety.',
    source:    'CNBC TV18',
    time:      'Today',
    sentiment: 'neutral',
    category:  'commodity',
    impact:    'Gold allocation in portfolios adds stability during volatility.',
  },
  {
    title:     'Midcap rally continues; index up 2.3% this week',
    summary:   'Midcap and smallcap indices outperformed the large-cap benchmark for the third consecutive week.',
    source:    'Business Standard',
    time:      'Today',
    sentiment: 'positive',
    category:  'market',
    impact:    'Investors with diversified SIPs are seeing above-average returns.',
  },
]

// ── Fear-type framing helper ──────────────────────────────────────────────────

const FEAR_FRAMINGS: Record<string, (item: NewsItem) => string> = {
  loss: (item) => item.sentiment === 'negative'
    ? `This dip is temporary. Long-term SIPs have always recovered — ${item.impact}`
    : `Good news for long-term holders: ${item.impact}`,
  jargon: (item) => `In plain English: ${item.impact}`,
  scam: (item) => `Verified from ${item.source}. ${item.impact}`,
  trust: (item) => `Data shows: ${item.impact}`,
}

/**
 * Returns a fear-type–specific framing of a news item's impact.
 * Falls back to the raw impact string if no framing is found.
 */
export function getFearFraming(item: NewsItem, fearType: string): string {
  const framer = FEAR_FRAMINGS[fearType]
  return framer ? framer(item) : item.impact
}

// ── Fetch helpers ─────────────────────────────────────────────────────────────

/**
 * Fetch market news from the backend, falling back to static items on error.
 */
export async function fetchMarketNews(fearType?: string): Promise<NewsItem[]> {
  try {
    const url = fearType
      ? `${API_BASE}/api/news?fear_type=${fearType}`
      : `${API_BASE}/api/news`
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data: NewsItem[] = await res.json()
    return Array.isArray(data) && data.length > 0 ? data : FALLBACK_NEWS
  } catch {
    return FALLBACK_NEWS
  }
}

/**
 * Fetch a short news context string for KINU's chat context.
 * Returns an empty string if the backend is unavailable.
 */
export async function fetchKinuNewsContext(): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/api/news/context`, {
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return ''
    const data = await res.json()
    return typeof data?.context === 'string' ? data.context : ''
  } catch {
    return ''
  }
}
