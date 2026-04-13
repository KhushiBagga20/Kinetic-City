/**
 * crashData.ts — Complete historical crash data for Indian markets (2000–2024)
 *
 * Every crash has been accompanied by a recovery.
 * This file is the single source of truth for all crash-related features
 * across the KINETIC app: Sandbox, CrashTimeline, Learn Page, Risk Horizon,
 * Time Machine, and Monte Carlo overlays.
 */

// ── Types ───────────────────────────────────────────────────────────────────

export interface CrashEvent {
  name: string
  startDate: string       // "Mon-YYYY"
  bottomDate: string
  recoveryDate: string
  niftyPeakToDrop: number // percentage, negative
  recoveryMonths: number
  recoveryGain: number    // % gain from bottom to recovery
  nextYearReturn: number  // Nifty return in the FY after crash
  cause: string
  lessonFromKinu: string
  whisper: string
  severity: 'moderate' | 'severe' | 'extreme'
  fyStart: string         // e.g. "FY01"
  fyEnd: string           // e.g. "FY04"
}

// ── All 11 Crashes ──────────────────────────────────────────────────────────

export const CRASH_HISTORY: CrashEvent[] = [
  {
    name: 'Dot-com Bust',
    startDate: 'Feb-2000',
    bottomDate: 'Sep-2001',
    recoveryDate: 'Jan-2004',
    niftyPeakToDrop: -56,
    recoveryMonths: 28,
    recoveryGain: 127,
    nextYearReturn: 72,
    cause: 'Global technology bubble collapse wiped out overvalued internet stocks worldwide.',
    lessonFromKinu: 'The investors who held through 2001 saw Nifty give 72% the very next year.',
    whisper: 'This is the dot-com crash — one of the worst in history. It took 28 months to recover. The following three years gave investors 200%+.',
    severity: 'extreme',
    fyStart: 'FY00',
    fyEnd: 'FY04',
  },
  {
    name: '9/11 Shock',
    startDate: 'Sep-2001',
    bottomDate: 'Sep-2001',
    recoveryDate: 'Nov-2001',
    niftyPeakToDrop: -18,
    recoveryMonths: 2,
    recoveryGain: 22,
    nextYearReturn: 4,
    cause: 'September 11 terrorist attacks triggered a sharp global market panic.',
    lessonFromKinu: 'Markets recovered within 2 months. The fastest recovery in this entire list.',
    whisper: '9/11 shocked global markets. Recovery took just 2 months. Panic selling here locked in a loss that patience would have avoided.',
    severity: 'moderate',
    fyStart: 'FY02',
    fyEnd: 'FY02',
  },
  {
    name: '2004 Election Shock',
    startDate: 'May-2004',
    bottomDate: 'May-2004',
    recoveryDate: 'Aug-2004',
    niftyPeakToDrop: -17,
    recoveryMonths: 3,
    recoveryGain: 21,
    nextYearReturn: 38,
    cause: 'Unexpected UPA election victory triggered circuit breakers on Sensex — two halts in one day.',
    lessonFromKinu: 'The market recovered in 3 months and went on to give 38% the following year.',
    whisper: 'Circuit breakers triggered today. The market recovered fully in 3 months and then rallied 38% the year after.',
    severity: 'moderate',
    fyStart: 'FY05',
    fyEnd: 'FY05',
  },
  {
    name: '2006 Mid-year Correction',
    startDate: 'May-2006',
    bottomDate: 'Jun-2006',
    recoveryDate: 'Nov-2006',
    niftyPeakToDrop: -29,
    recoveryMonths: 5,
    recoveryGain: 40,
    nextYearReturn: 12,
    cause: 'Global emerging market sell-off triggered by rising US interest rates.',
    lessonFromKinu: 'A 29% fall recovered in 5 months. Investors who held made 40% from the bottom.',
    whisper: 'Global sell-off hitting India hard. This recovered in just 5 months and gave 40% returns from the bottom.',
    severity: 'moderate',
    fyStart: 'FY07',
    fyEnd: 'FY07',
  },
  {
    name: '2008 Global Financial Crisis',
    startDate: 'Jan-2008',
    bottomDate: 'Mar-2009',
    recoveryDate: 'Nov-2010',
    niftyPeakToDrop: -60,
    recoveryMonths: 32,
    recoveryGain: 176,
    nextYearReturn: 76,
    cause: 'Lehman Brothers collapsed, triggering the worst global financial crisis since the Great Depression.',
    lessonFromKinu: 'The worst crash in modern history. FY10 gave 76% to everyone who held. The recovery was worth more than the crash cost.',
    whisper: 'This is 2008 — the worst crash in a generation. It felt like the world was ending. FY10 gave 76% to investors who stayed.',
    severity: 'extreme',
    fyStart: 'FY08',
    fyEnd: 'FY11',
  },
  {
    name: '2010 Mini Correction',
    startDate: 'Nov-2010',
    bottomDate: 'Dec-2011',
    recoveryDate: 'Nov-2013',
    niftyPeakToDrop: -28,
    recoveryMonths: 24,
    recoveryGain: 39,
    nextYearReturn: 8,
    cause: 'Euro zone debt crisis and domestic inflation concerns dragged Indian markets lower.',
    lessonFromKinu: 'A slow grind down, but a steady climb back. SIP investors averaged down beautifully during this period.',
    whisper: 'Euro crisis and inflation weighing on markets. SIP investors who kept investing through this dip came out significantly ahead.',
    severity: 'moderate',
    fyStart: 'FY11',
    fyEnd: 'FY14',
  },
  {
    name: '2015-2016 China Crash',
    startDate: 'Mar-2015',
    bottomDate: 'Feb-2016',
    recoveryDate: 'Sep-2016',
    niftyPeakToDrop: -23,
    recoveryMonths: 7,
    recoveryGain: 30,
    nextYearReturn: 19,
    cause: "China's stock market collapse and commodity price crash hit global emerging markets.",
    lessonFromKinu: '7 months to full recovery. The following year gave 19%. A sharp, short pain.',
    whisper: "China's market collapse is hitting India. Recovery came in 7 months. The next year gave 19%.",
    severity: 'moderate',
    fyStart: 'FY16',
    fyEnd: 'FY17',
  },
  {
    name: '2016 Demonetisation',
    startDate: 'Nov-2016',
    bottomDate: 'Dec-2016',
    recoveryDate: 'Apr-2017',
    niftyPeakToDrop: -8,
    recoveryMonths: 4,
    recoveryGain: 11,
    nextYearReturn: 28,
    cause: 'Government announced overnight demonetisation of ₹500 and ₹1000 notes, shocking domestic markets.',
    lessonFromKinu: 'A uniquely Indian shock. Recovery in 4 months, then 28% the following year.',
    whisper: 'Demonetisation announced. Markets in shock. This recovered in 4 months and then gave 28% the year after.',
    severity: 'moderate',
    fyStart: 'FY17',
    fyEnd: 'FY17',
  },
  {
    name: '2018 IL&FS Crisis',
    startDate: 'Sep-2018',
    bottomDate: 'Oct-2018',
    recoveryDate: 'Jun-2019',
    niftyPeakToDrop: -15,
    recoveryMonths: 8,
    recoveryGain: 18,
    nextYearReturn: 12,
    cause: 'IL&FS debt default triggered a credit crisis in NBFCs, spreading fear across Indian markets.',
    lessonFromKinu: 'A domestic crisis, quickly contained. 8 months to recovery.',
    whisper: 'IL&FS default shocking the credit markets. This was contained within 8 months.',
    severity: 'moderate',
    fyStart: 'FY19',
    fyEnd: 'FY19',
  },
  {
    name: 'COVID-19 Crash',
    startDate: 'Jan-2020',
    bottomDate: 'Mar-2020',
    recoveryDate: 'Sep-2020',
    niftyPeakToDrop: -38,
    recoveryMonths: 6,
    recoveryGain: 68,
    nextYearReturn: 70,
    cause: 'COVID-19 declared a global pandemic. The fastest 30%+ decline in market history.',
    lessonFromKinu: 'The fastest crash AND the fastest recovery. 6 months. FY21 gave 70% to those who held.',
    whisper: 'COVID-19 has crashed markets globally. This is the fastest recovery in this list — 6 months. FY21 gave 70% to investors who stayed.',
    severity: 'extreme',
    fyStart: 'FY20',
    fyEnd: 'FY21',
  },
  {
    name: '2022 Rate Hike Sell-off',
    startDate: 'Jan-2022',
    bottomDate: 'Jun-2022',
    recoveryDate: 'Nov-2022',
    niftyPeakToDrop: -16,
    recoveryMonths: 5,
    recoveryGain: 19,
    nextYearReturn: -1,
    cause: 'US Federal Reserve aggressive rate hikes triggered global foreign investor sell-off.',
    lessonFromKinu: 'A global macro shock that hit India relatively mildly. Recovery in 5 months.',
    whisper: 'Rate hike fears driving FII sell-off. India recovered in 5 months — faster than most global markets.',
    severity: 'moderate',
    fyStart: 'FY22',
    fyEnd: 'FY23',
  },
]

// ── Summary Statistics ──────────────────────────────────────────────────────

export const CRASH_SUMMARY_STATS = {
  totalCrashes: 11,
  averageRecoveryMonths: Math.round(
    CRASH_HISTORY.reduce((s, c) => s + c.recoveryMonths, 0) / CRASH_HISTORY.length
  ),
  worstDrop: -60,
  bestPostCrashReturn: 76,
  allRecovered: true,
} as const

// ── Date Parsing Helpers ────────────────────────────────────────────────────

const MONTH_MAP: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
}

function parseDateStr(dateStr: string): { month: number; year: number } {
  const [mon, yr] = dateStr.split('-')
  return { month: MONTH_MAP[mon] || 1, year: parseInt(yr, 10) }
}


// ── FY-to-Crash Mapping  ───────────────────────────────────────────────────
// Pre-built for sandbox FY mapping as specified in the prompt

const FY_CRASH_MAP: Record<string, { crashIndex: number; monthStart?: number }[]> = {
  FY01: [{ crashIndex: 0 }],                       // Dot-com Bust ongoing
  FY02: [{ crashIndex: 1, monthStart: 5 }],        // 9/11 (Sep = month 5 in FY)
  FY05: [{ crashIndex: 2, monthStart: 1 }],        // Election Shock (May = month 1)
  FY07: [{ crashIndex: 3, monthStart: 1 }],        // 2006 Mid-year Correction
  FY08: [{ crashIndex: 4 }],                       // Pre-GFC
  FY09: [{ crashIndex: 4, monthStart: 5 }],        // GFC (Sep=month5 to Feb=month10)
  FY10: [{ crashIndex: 4 }],                       // GFC recovery
  FY11: [{ crashIndex: 5 }],                       // 2010 correction start
  FY12: [{ crashIndex: 5, monthStart: 4 }],        // Euro zone crisis
  FY16: [{ crashIndex: 6 }],                       // China Crash
  FY17: [{ crashIndex: 7, monthStart: 7 }, { crashIndex: 6 }], // Demonetisation + China tail
  FY19: [{ crashIndex: 8, monthStart: 5 }],        // IL&FS crisis
  FY20: [{ crashIndex: 9, monthStart: 9 }],        // COVID crash (Jan=month9)
  FY21: [{ crashIndex: 9 }],                       // COVID recovery
  FY22: [{ crashIndex: 10, monthStart: 9 }],       // Rate hike sell-off (Jan=month9)
}

// ── Query Functions ─────────────────────────────────────────────────────────

/**
 * Returns the crash if this FY + month is a crash start month.
 */
export function getCrashForFYMonth(fy: string, month: number): CrashEvent | null {
  const mappings = FY_CRASH_MAP[fy]
  if (!mappings) return null

  for (const m of mappings) {
    if (m.monthStart !== undefined && m.monthStart === month) {
      return CRASH_HISTORY[m.crashIndex]
    }
  }
  return null
}

/**
 * Returns crash + how many months into it we are, if currently inside a crash period.
 */
export function getActiveCrash(fy: string, month: number): { crash: CrashEvent; monthsIn: number } | null {
  const mappings = FY_CRASH_MAP[fy]
  if (!mappings) return null

  for (const m of mappings) {
    const crash = CRASH_HISTORY[m.crashIndex]
    const startParsed = parseDateStr(crash.startDate)
    const recoveryParsed = parseDateStr(crash.recoveryDate)

    // Convert current fy+month to calendar date
    const fyNum = parseInt(fy.replace('FY', ''), 10)
    const startCalYear = fyNum < 50 ? 2000 + fyNum - 1 : 1900 + fyNum - 1
    const calMonth = month < 9 ? month + 4 : month - 8
    const calYear = month < 9 ? startCalYear : startCalYear + 1

    // Check if current date falls within crash start → recovery
    const currentTs = calYear * 12 + calMonth
    const crashStartTs = startParsed.year * 12 + startParsed.month
    const crashEndTs = recoveryParsed.year * 12 + recoveryParsed.month

    if (currentTs >= crashStartTs && currentTs <= crashEndTs) {
      return { crash, monthsIn: currentTs - crashStartTs + 1 }
    }
  }
  return null
}

/**
 * Returns all crashes that touch this FY.
 */
export function getCrashesInFY(fy: string): CrashEvent[] {
  const mappings = FY_CRASH_MAP[fy]
  if (!mappings) return []
  const seen = new Set<number>()
  const result: CrashEvent[] = []
  for (const m of mappings) {
    if (!seen.has(m.crashIndex)) {
      seen.add(m.crashIndex)
      result.push(CRASH_HISTORY[m.crashIndex])
    }
  }
  return result
}

/**
 * For Risk Horizon chart annotations — find crash by calendar start year.
 */
export function getCrashByYear(startYear: number): CrashEvent | null {
  return CRASH_HISTORY.find(c => {
    const parsed = parseDateStr(c.startDate)
    return parsed.year === startYear
  }) || null
}

/**
 * Get all crashes keyed by their start calendar year (for Risk Horizon).
 */
export function getCrashByCalendarYear(year: number): CrashEvent[] {
  return CRASH_HISTORY.filter(c => {
    const start = parseDateStr(c.startDate)
    const recovery = parseDateStr(c.recoveryDate)
    return year >= start.year && year <= recovery.year
  })
}

/**
 * Get the calendar year range a crash spans (for Monte Carlo overlay).
 */
export function getCrashCalendarRange(crash: CrashEvent): { startYear: number; startMonth: number; endYear: number; endMonth: number } {
  const start = parseDateStr(crash.startDate)
  const end = parseDateStr(crash.recoveryDate)
  return {
    startYear: start.year,
    startMonth: start.month,
    endYear: end.year,
    endMonth: end.month,
  }
}

/**
 * FY string to starting calendar year (for Sandbox → Time Machine linking).
 */
export function fyToCalendarYear(fy: string): number {
  const num = parseInt(fy.replace('FY', ''), 10)
  return num < 50 ? 2000 + num - 1 : 1900 + num - 1
}
