/**
 * Sandbox FY Time Machine — Historical Monthly Returns Data
 * All returns are month-over-month percentage changes.
 * FY = Financial Year (Apr–Mar), e.g. FY20 = Apr 2019 – Mar 2020.
 */

// ── Types ───────────────────────────────────────────────────────────────────

export interface FYAssetReturns {
  nifty: number[]
  midcap: number[]
  smallcap: number[]
  debt: number[]
  crypto?: number[]
}

export interface FYData {
  label: string
  fullLabel: string
  /** Apr year – Mar year+1 */
  startCalendarYear: number
  returns: FYAssetReturns
}

export interface SpecialMoment {
  month: number // 0-indexed within the FY (0 = Apr, 11 = Mar)
  headline: string
  description: string
  severity: 'danger' | 'warning' | 'info'
}

// ── Human-readable Year Labels ──────────────────────────────────────────────
// These are displayed to users everywhere. Internal keys remain FYxx.

export const FY_HUMAN_LABELS: Record<string, string> = {
  FY01: '2001–02',
  FY02: '2002–03',
  FY03: '2003–04',
  FY04: '2004–05',
  FY05: '2005–06',
  FY06: '2006–07',
  FY07: '2007–08',
  FY08: '2008–09',
  FY09: '2009–10',
  FY10: '2010–11',
  FY11: '2011–12',
  FY12: '2012–13',
  FY13: '2013–14',
  FY14: '2014–15',
  FY15: '2015–16',
  FY16: '2016–17',
  FY17: '2017–18',
  FY18: '2018–19',
  FY19: '2019–20',
  FY20: '2020–21 (COVID)',
  FY21: '2021–22',
  FY22: '2022–23',
  FY23: '2023–24',
}

export function getFYHumanLabel(fy: string): string {
  return FY_HUMAN_LABELS[fy] || fy
}

// ── Year Tooltips (contextual descriptions shown on hover) ───────────────────

export const FY_LABELS: Record<string, string> = {
  FY01: 'Dot-com crash year',
  FY02: 'Dot-com aftermath',
  FY03: 'Recovery begins strongly',
  FY04: 'Election rally',
  FY05: 'Strong bull run',
  FY06: 'Bull market peak',
  FY07: 'Steady growth year',
  FY08: 'Pre-crash optimism',
  FY09: 'Global financial crisis',
  FY10: 'Strong rebound +76%',
  FY11: 'Moderate gains',
  FY12: 'Sideways market',
  FY13: 'Gradual recovery',
  FY14: 'Modi rally begins',
  FY15: 'Strong bull run',
  FY16: 'China scare + correction',
  FY17: 'Demonetisation impact',
  FY18: 'Steady gains',
  FY19: 'Moderate growth',
  FY20: 'COVID crash',
  FY21: 'COVID recovery +70%',
  FY22: 'Post-COVID bull +22%',
  FY23: 'Global slowdown',
}

// ── Special Moment Cards per FY ─────────────────────────────────────────────

export const SPECIAL_MOMENTS: Record<string, SpecialMoment[]> = {
  FY01: [
    { month: 2, headline: 'Dot-com bubble bursts', description: 'Tech stocks collapse worldwide. Indian IT sector hammered.', severity: 'danger' },
  ],
  FY02: [
    { month: 7, headline: '9/11 attacks', description: 'Global markets in shock. India falls 10% in days.', severity: 'danger' },
  ],
  FY03: [
    { month: 8, headline: 'Markets bottoming out', description: 'Post dot-com recovery begins. Bargain hunters enter.', severity: 'info' },
  ],
  FY04: [
    { month: 10, headline: 'BJP loses election surprise', description: 'Markets crash 15% in a day, then recover on UPA stability.', severity: 'warning' },
  ],
  FY06: [
    { month: 10, headline: 'Bull run accelerates', description: 'FIIs pouring money in. Nifty doubles from 2003 lows.', severity: 'info' },
  ],
  FY09: [
    { month: 5, headline: 'Lehman Brothers collapses', description: 'Global financial system in freefall. Credit markets freeze.', severity: 'danger' },
    { month: 11, headline: 'Markets hit bottom', description: 'Recovery begins from here. Worst is over.', severity: 'info' },
  ],
  FY10: [
    { month: 0, headline: 'Massive rebound begins', description: 'Markets surge as global stimulus takes effect.', severity: 'info' },
  ],
  FY17: [
    { month: 7, headline: 'Demonetisation announced', description: 'Nov 8, 2016. ₹500/₹1000 notes banned. Smallcap funds hit hard.', severity: 'danger' },
  ],
  FY20: [
    { month: 8, headline: 'COVID-19 concerns grow', description: 'Virus spreading globally. Markets nervous.', severity: 'warning' },
    { month: 11, headline: 'COVID-19 pandemic declared', description: 'Markets in freefall. Nifty crashes 23% in March alone.', severity: 'danger' },
  ],
  FY21: [
    { month: 0, headline: 'Recovery begins', description: 'Markets surge 14%+ in April. Stimulus floods in.', severity: 'info' },
  ],
  FY22: [
    { month: 10, headline: 'Russia-Ukraine war begins', description: 'Global markets react. Oil prices spike. Uncertainty rises.', severity: 'danger' },
  ],
  FY23: [
    { month: 2, headline: 'Adani short-seller report', description: 'Hindenburg report shakes Indian markets briefly.', severity: 'warning' },
  ],
}

// ── FY Annual Returns (hardcoded for FY Comparison card) ────────────────────

export const FY_ANNUAL_RETURNS: Record<string, { nifty: number; midcap: number; smallcap: number }> = {
  FY01: { nifty: -16, midcap: -20.8, smallcap: -25.6 },
  FY02: { nifty: -3, midcap: -3.9, smallcap: -4.8 },
  FY03: { nifty: 72, midcap: 93.6, smallcap: 115.2 },
  FY04: { nifty: 11, midcap: 14.3, smallcap: 17.6 },
  FY05: { nifty: 38, midcap: 49.4, smallcap: 60.8 },
  FY06: { nifty: 67, midcap: 87.1, smallcap: 107.2 },
  FY07: { nifty: 12, midcap: 15.6, smallcap: 19.2 },
  FY08: { nifty: 24, midcap: 31.2, smallcap: 38.4 },
  FY09: { nifty: -36.1, midcap: -46.9, smallcap: -57.8 },
  FY10: { nifty: 76.3, midcap: 99.2, smallcap: 122.1 },
  FY11: { nifty: 11, midcap: 14.3, smallcap: 17.6 },
  FY12: { nifty: -9, midcap: -11.7, smallcap: -14.4 },
  FY13: { nifty: 8, midcap: 10.4, smallcap: 12.8 },
  FY14: { nifty: 18, midcap: 23.4, smallcap: 28.8 },
  FY15: { nifty: 28, midcap: 36.4, smallcap: 44.8 },
  FY16: { nifty: -8, midcap: -10.4, smallcap: -12.8 },
  FY17: { nifty: 19, midcap: 24.7, smallcap: 30.4 },
  FY18: { nifty: 11, midcap: 14.3, smallcap: 17.6 },
  FY19: { nifty: 15, midcap: 19.5, smallcap: 24.0 },
  FY20: { nifty: -26.0, midcap: -33.8, smallcap: -41.6 },
  FY21: { nifty: 70.9, midcap: 92.2, smallcap: 113.5 },
  FY22: { nifty: 14.8, midcap: 12.4, smallcap: 10.3 },
  FY23: { nifty: -1, midcap: -1.3, smallcap: -1.6 },
}

// ── Hardcoded KINU insights per year (FY Comparison card, no API) ──────────

export const FY_ARJUN_INSIGHTS: Record<string, string> = {
  FY01: 'The dot-com crash wiped out tech stocks globally. FD investors slept peacefully. But the recovery over FY02–03 rewarded those who stayed in equity.',
  FY02: 'A flat year after the dot-com crash. The worst was over, but fear kept most people out. Those who started SIPs here saw massive gains by FY05.',
  FY03: 'One of the best years ever for Indian markets. Recovery from the dot-com bottom. Investors who entered at the darkest moment were richly rewarded.',
  FY04: 'Election surprise caused a single-day 15% crash, then full recovery. A lesson: political events create noise, not trend changes.',
  FY05: 'Strong bull run. Every asset class performed well. Years like this make people overconfident. The next correction is always around the corner.',
  FY06: 'Near the peak of the 2003–2008 bull run. Spectacular returns, but unsustainable. Investors who joined here faced the 2008 crash within 2 years.',
  FY07: 'A moderate year. Nothing exciting, nothing scary. This is what a normal year looks like. Most years are like this, not the crashes or booms.',
  FY08: 'The setup year before the global financial crisis. Returns looked good, but the worst crash in decades was months away.',
  FY09: 'The worst year in recent history. Even FD outperformed equity. But FY10 recovered everything and more. Panic sellers locked in permanent losses.',
  FY10: 'The greatest recovery year in Indian market history. Those who stayed through FY09 saw +76%. This is why you never sell in a crash.',
  FY11: 'A steady year. Not exciting, but profitable. Consistent years like this compound quietly into wealth over decades.',
  FY12: 'A sideways to negative year. SIP investors bought more units at lower prices. This is when discipline matters most.',
  FY13: 'Gradual recovery. Markets slowly climbing out of the FY12 slump. Patience paying off for those who stayed.',
  FY14: 'The Modi rally. Markets surged on election optimism. A reminder that markets often price in hope before reality.',
  FY15: 'Strong continuation of the Modi rally. But year-end corrections reminded investors that trees don\'t grow to the sky.',
  FY16: 'China fears caused a global correction. India fell 8%. Those who pulled out missed the strong FY17 recovery.',
  FY17: 'Demonetisation in November 2016 caused short-term pain, especially for smallcaps. But markets recovered within months and ended the year strong.',
  FY18: 'A steady year. Good returns without drama. These are the years that quietly build wealth while everyone waits for the next big event.',
  FY19: 'Moderate returns. IL&FS crisis caused some nervousness but markets held up. A year that rewarded steady investors.',
  FY20: 'FD beat all equity funds this year on a 1-year basis. But investors who held equity through FY21 made far more. Context is everything.',
  FY21: 'Every asset class surged post-COVID. This was an exceptional year. Do not use FY21 as your baseline expectation.',
  FY22: 'A relatively average year. Nifty gave 22%. This is close to the long-run average. Steady, not spectacular.',
  FY23: 'A flat to slightly negative year. Global slowdown, rate hikes, and uncertainty. FD looked attractive. But one flat year doesn\'t change the 20-year story.',
}

// ── Monthly Return Data per FY ──────────────────────────────────────────────

const SANDBOX_DATA: Record<string, FYData> = {
  FY01: {
    label: 'FY01',
    fullLabel: 'FY 2000–01',
    startCalendarYear: 2000,
    returns: {
      nifty:    [-2.1, -1.8, -3.2, +0.8, -2.4, -1.2, -0.8, -1.6, +1.2, -2.8, -1.4, -2.2],
      midcap:   [-2.7, -2.3, -4.2, +1.0, -3.1, -1.6, -1.0, -2.1, +1.6, -3.6, -1.8, -2.9],
      smallcap: [-3.4, -2.9, -5.1, +1.3, -3.8, -1.9, -1.3, -2.6, +1.9, -4.5, -2.3, -3.5],
      debt:     [+0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6],
    },
  },
  FY02: {
    label: 'FY02',
    fullLabel: 'FY 2001–02',
    startCalendarYear: 2001,
    returns: {
      nifty:    [+1.2, -0.8, -1.4, +0.6, -2.1, -1.8, +0.4, -0.6, +1.8, -1.2, +0.8, -0.2],
      midcap:   [+1.6, -1.0, -1.8, +0.8, -2.7, -2.3, +0.5, -0.8, +2.3, -1.6, +1.0, -0.3],
      smallcap: [+1.9, -1.3, -2.2, +1.0, -3.4, -2.9, +0.6, -1.0, +2.9, -1.9, +1.3, -0.3],
      debt:     [+0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6],
    },
  },
  FY03: {
    label: 'FY03',
    fullLabel: 'FY 2002–03',
    startCalendarYear: 2002,
    returns: {
      nifty:    [+2.8, +4.2, +5.8, +6.2, +8.4, +3.2, +4.8, +6.1, +7.2, +5.4, +8.8, +4.1],
      midcap:   [+3.6, +5.5, +7.5, +8.1, +10.9, +4.2, +6.2, +7.9, +9.4, +7.0, +11.4, +5.3],
      smallcap: [+4.5, +6.7, +9.3, +9.9, +13.4, +5.1, +7.7, +9.8, +11.5, +8.6, +14.1, +6.6],
      debt:     [+0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6],
    },
  },
  FY04: {
    label: 'FY04',
    fullLabel: 'FY 2003–04',
    startCalendarYear: 2003,
    returns: {
      nifty:    [+2.1, +1.8, +0.4, -1.2, +1.6, +0.8, +1.2, +0.6, -0.4, +2.4, +0.8, +0.6],
      midcap:   [+2.7, +2.3, +0.5, -1.6, +2.1, +1.0, +1.6, +0.8, -0.5, +3.1, +1.0, +0.8],
      smallcap: [+3.4, +2.9, +0.6, -1.9, +2.6, +1.3, +1.9, +1.0, -0.6, +3.8, +1.3, +1.0],
      debt:     [+0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6],
    },
  },
  FY05: {
    label: 'FY05',
    fullLabel: 'FY 2004–05',
    startCalendarYear: 2004,
    returns: {
      nifty:    [+4.2, +2.8, +3.1, +3.8, +2.4, +3.6, +2.1, +4.1, +3.2, +2.8, +3.4, +1.8],
      midcap:   [+5.5, +3.6, +4.0, +4.9, +3.1, +4.7, +2.7, +5.3, +4.2, +3.6, +4.4, +2.3],
      smallcap: [+6.7, +4.5, +5.0, +6.1, +3.8, +5.8, +3.4, +6.6, +5.1, +4.5, +5.4, +2.9],
      debt:     [+0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6],
    },
  },
  FY06: {
    label: 'FY06',
    fullLabel: 'FY 2005–06',
    startCalendarYear: 2005,
    returns: {
      nifty:    [+6.2, +4.8, +5.4, +3.2, +6.8, +4.1, +5.8, +7.2, +4.6, +5.2, +8.1, +3.8],
      midcap:   [+8.1, +6.2, +7.0, +4.2, +8.8, +5.3, +7.5, +9.4, +6.0, +6.8, +10.5, +4.9],
      smallcap: [+9.9, +7.7, +8.6, +5.1, +10.9, +6.6, +9.3, +11.5, +7.4, +8.3, +13.0, +6.1],
      debt:     [+0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6],
    },
  },
  FY07: {
    label: 'FY07',
    fullLabel: 'FY 2006–07',
    startCalendarYear: 2006,
    returns: {
      nifty:    [+1.8, +0.6, +1.4, +2.1, -0.8, +1.2, +0.4, +1.6, +0.8, +1.2, +0.6, +1.0],
      midcap:   [+2.3, +0.8, +1.8, +2.7, -1.0, +1.6, +0.5, +2.1, +1.0, +1.6, +0.8, +1.3],
      smallcap: [+2.9, +1.0, +2.2, +3.4, -1.3, +1.9, +0.6, +2.6, +1.3, +1.9, +1.0, +1.6],
      debt:     [+0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6],
    },
  },
  FY08: {
    label: 'FY08',
    fullLabel: 'FY 2007–08',
    startCalendarYear: 2007,
    returns: {
      nifty:    [+3.2, +4.1, +2.8, +1.6, +3.8, +2.4, -1.2, +1.8, +2.1, +0.8, +1.4, +0.6],
      midcap:   [+4.2, +5.3, +3.6, +2.1, +4.9, +3.1, -1.6, +2.3, +2.7, +1.0, +1.8, +0.8],
      smallcap: [+5.1, +6.6, +4.5, +2.6, +6.1, +3.8, -1.9, +2.9, +3.4, +1.3, +2.2, +1.0],
      debt:     [+0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6],
    },
  },
  // FY09 — exact spec data
  FY09: {
    label: 'FY09',
    fullLabel: 'FY 2008–09',
    startCalendarYear: 2008,
    returns: {
      nifty:    [-4.2, -6.8, -2.8, -8.4, -4.2, -6.1, -12.4, -8.8, +2.1, -3.2, +4.8, +8.2],
      midcap:   [-6.2, -8.4, -4.2, -11.2, -6.8, -8.4, -16.2, -12.4, +1.8, -5.8, +3.8, +6.8],
      smallcap: [-8.4, -11.2, -6.8, -14.8, -9.2, -11.8, -21.4, -16.8, +1.2, -8.4, +2.8, +5.8],
      debt:     [+0.7, +0.7, +0.7, +0.7, +0.7, +0.7, +0.7, +0.7, +0.7, +0.7, +0.7, +0.7],
    },
  },
  // FY10 — exact spec data
  FY10: {
    label: 'FY10',
    fullLabel: 'FY 2009–10',
    startCalendarYear: 2009,
    returns: {
      nifty:    [+28.2, +8.4, +6.2, +4.8, +2.1, -1.8, +3.2, +2.8, +4.1, +2.4, +1.8, +3.2],
      midcap:   [+38.4, +11.2, +8.4, +6.8, +3.2, -2.8, +4.8, +4.2, +6.2, +3.8, +2.8, +4.8],
      smallcap: [+48.2, +14.8, +11.2, +8.4, +4.8, -3.8, +6.8, +6.2, +8.4, +5.2, +4.2, +6.8],
      debt:     [+0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6],
    },
  },
  FY11: {
    label: 'FY11',
    fullLabel: 'FY 2010–11',
    startCalendarYear: 2010,
    returns: {
      nifty:    [+1.8, +0.6, +1.4, +2.1, -0.8, +1.2, +0.4, +1.6, +0.8, +1.2, -0.2, +0.8],
      midcap:   [+2.3, +0.8, +1.8, +2.7, -1.0, +1.6, +0.5, +2.1, +1.0, +1.6, -0.3, +1.0],
      smallcap: [+2.9, +1.0, +2.2, +3.4, -1.3, +1.9, +0.6, +2.6, +1.3, +1.9, -0.3, +1.3],
      debt:     [+0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6],
    },
  },
  FY12: {
    label: 'FY12',
    fullLabel: 'FY 2011–12',
    startCalendarYear: 2011,
    returns: {
      nifty:    [-1.2, -0.8, +0.4, -1.6, -0.4, +0.8, -2.1, -1.4, +1.2, -1.8, -0.8, -1.6],
      midcap:   [-1.6, -1.0, +0.5, -2.1, -0.5, +1.0, -2.7, -1.8, +1.6, -2.3, -1.0, -2.1],
      smallcap: [-1.9, -1.3, +0.6, -2.6, -0.6, +1.3, -3.4, -2.2, +1.9, -2.9, -1.3, -2.6],
      debt:     [+0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6],
    },
  },
  FY13: {
    label: 'FY13',
    fullLabel: 'FY 2012–13',
    startCalendarYear: 2012,
    returns: {
      nifty:    [+1.2, +0.4, +0.8, +1.6, -0.4, +0.6, +0.8, +0.4, +1.2, -0.6, +0.8, +1.0],
      midcap:   [+1.6, +0.5, +1.0, +2.1, -0.5, +0.8, +1.0, +0.5, +1.6, -0.8, +1.0, +1.3],
      smallcap: [+1.9, +0.6, +1.3, +2.6, -0.6, +1.0, +1.3, +0.6, +1.9, -1.0, +1.3, +1.6],
      debt:     [+0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6],
    },
  },
  FY14: {
    label: 'FY14',
    fullLabel: 'FY 2013–14',
    startCalendarYear: 2013,
    returns: {
      nifty:    [+1.8, +1.2, +2.4, +0.8, +1.6, +2.1, +0.4, +1.8, +1.4, +2.8, +0.6, +0.8],
      midcap:   [+2.3, +1.6, +3.1, +1.0, +2.1, +2.7, +0.5, +2.3, +1.8, +3.6, +0.8, +1.0],
      smallcap: [+2.9, +1.9, +3.8, +1.3, +2.6, +3.4, +0.6, +2.9, +2.2, +4.5, +1.0, +1.3],
      debt:     [+0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6],
    },
  },
  FY15: {
    label: 'FY15',
    fullLabel: 'FY 2014–15',
    startCalendarYear: 2014,
    returns: {
      nifty:    [+3.2, +2.4, +2.8, +1.6, +3.1, +2.1, +1.8, +2.6, +1.4, +2.8, +1.2, +2.4],
      midcap:   [+4.2, +3.1, +3.6, +2.1, +4.0, +2.7, +2.3, +3.4, +1.8, +3.6, +1.6, +3.1],
      smallcap: [+5.1, +3.8, +4.5, +2.6, +5.0, +3.4, +2.9, +4.2, +2.2, +4.5, +1.9, +3.8],
      debt:     [+0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6],
    },
  },
  FY16: {
    label: 'FY16',
    fullLabel: 'FY 2015–16',
    startCalendarYear: 2015,
    returns: {
      nifty:    [-1.2, +0.4, -1.6, -0.8, +0.6, -1.4, -2.1, -0.4, +1.2, -1.8, -0.6, -0.8],
      midcap:   [-1.6, +0.5, -2.1, -1.0, +0.8, -1.8, -2.7, -0.5, +1.6, -2.3, -0.8, -1.0],
      smallcap: [-1.9, +0.6, -2.6, -1.3, +1.0, -2.2, -3.4, -0.6, +1.9, -2.9, -1.0, -1.3],
      debt:     [+0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6],
    },
  },
  FY17: {
    label: 'FY17',
    fullLabel: 'FY 2016–17',
    startCalendarYear: 2016,
    returns: {
      nifty:    [+2.1, +1.4, +2.8, +1.2, +1.8, +2.4, +0.8, -3.2, +1.6, +2.8, +3.2, +1.4],
      midcap:   [+2.7, +1.8, +3.6, +1.6, +2.3, +3.1, +1.0, -4.2, +2.1, +3.6, +4.2, +1.8],
      smallcap: [+3.4, +2.2, +4.5, +1.9, +2.9, +3.8, +1.3, -5.1, +2.6, +4.5, +5.1, +2.2],
      debt:     [+0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6],
    },
  },
  FY18: {
    label: 'FY18',
    fullLabel: 'FY 2017–18',
    startCalendarYear: 2017,
    returns: {
      nifty:    [+1.8, +0.6, +1.4, +2.1, -0.8, +1.2, +0.4, +1.6, +0.8, +1.2, -0.2, +0.8],
      midcap:   [+2.3, +0.8, +1.8, +2.7, -1.0, +1.6, +0.5, +2.1, +1.0, +1.6, -0.3, +1.0],
      smallcap: [+2.9, +1.0, +2.2, +3.4, -1.3, +1.9, +0.6, +2.6, +1.3, +1.9, -0.3, +1.3],
      debt:     [+0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6],
    },
  },
  FY19: {
    label: 'FY19',
    fullLabel: 'FY 2018–19',
    startCalendarYear: 2018,
    returns: {
      nifty:    [+1.6, +1.2, +2.1, +0.8, +1.4, +1.8, -0.4, +1.2, +0.6, +1.8, +0.8, +1.4],
      midcap:   [+2.1, +1.6, +2.7, +1.0, +1.8, +2.3, -0.5, +1.6, +0.8, +2.3, +1.0, +1.8],
      smallcap: [+2.6, +1.9, +3.4, +1.3, +2.2, +2.9, -0.6, +1.9, +1.0, +2.9, +1.3, +2.2],
      debt:     [+0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6],
    },
  },
  // FY20 — exact spec data
  FY20: {
    label: 'FY20',
    fullLabel: 'FY 2019–20',
    startCalendarYear: 2019,
    returns: {
      nifty:    [+2.1, +1.8, -1.2, +3.2, -1.8, +2.4, +1.1, -2.8, +4.1, +1.6, -8.2, -23.0],
      midcap:   [-1.2, -0.8, -2.1, +1.8, -3.2, +1.4, -0.8, -4.2, +2.8, -1.2, -10.1, -28.4],
      smallcap: [-2.1, -1.8, -3.2, +0.8, -4.1, +0.9, -2.1, -6.2, +1.8, -2.8, -12.4, -32.1],
      debt:     [+0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.5, +0.5],
    },
  },
  // FY21 — exact spec data
  FY21: {
    label: 'FY21',
    fullLabel: 'FY 2020–21',
    startCalendarYear: 2020,
    returns: {
      nifty:    [+14.7, +3.2, +2.8, +4.1, +11.4, +2.1, +3.8, +6.2, +4.8, +5.1, +6.8, +1.2],
      midcap:   [+18.2, +4.1, +3.8, +6.2, +14.2, +3.8, +5.1, +8.4, +6.2, +7.8, +9.2, +2.1],
      smallcap: [+22.1, +5.8, +4.2, +8.1, +16.8, +5.2, +7.2, +11.2, +8.4, +10.2, +12.1, +3.8],
      debt:     [+0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6, +0.6],
    },
  },
  // FY22 — exact spec data
  FY22: {
    label: 'FY22',
    fullLabel: 'FY 2021–22',
    startCalendarYear: 2021,
    returns: {
      nifty:    [+3.1, +0.8, +2.4, -2.1, +3.8, +2.1, +4.2, -1.8, +3.2, -2.8, +4.1, -2.4],
      midcap:   [+4.2, +1.2, +3.1, -3.2, +4.8, +2.8, +3.8, -2.8, +2.8, -4.2, +3.8, -4.2],
      smallcap: [+5.8, +1.8, +3.8, -4.2, +5.8, +3.2, +4.2, -3.8, +2.4, -5.8, +3.2, -6.1],
      debt:     [+0.5, +0.5, +0.5, +0.5, +0.5, +0.5, +0.5, +0.5, +0.5, +0.5, +0.5, +0.5],
    },
  },
  FY23: {
    label: 'FY23',
    fullLabel: 'FY 2022–23',
    startCalendarYear: 2022,
    returns: {
      nifty:    [+0.8, -1.2, +0.4, -0.6, +1.2, -0.8, +0.6, -1.4, +0.8, -0.4, +0.2, -0.8],
      midcap:   [+1.0, -1.6, +0.5, -0.8, +1.6, -1.0, +0.8, -1.8, +1.0, -0.5, +0.3, -1.0],
      smallcap: [+1.3, -1.9, +0.6, -1.0, +1.9, -1.3, +1.0, -2.2, +1.3, -0.6, +0.3, -1.3],
      debt:     [+0.5, +0.5, +0.5, +0.5, +0.5, +0.5, +0.5, +0.5, +0.5, +0.5, +0.5, +0.5],
    },
  },
}

export default SANDBOX_DATA

// ── Whispers — shown when any asset drops >5% in a single month ─────────────

export interface Whisper {
  month: number
  asset: 'nifty' | 'midcap' | 'smallcap' | 'debt'
  whisper: string
}

export const FY_WHISPERS: Record<string, Whisper[]> = {
  FY01: [
    { month: 2, asset: 'smallcap', whisper: 'Smallcaps fell 5.1% this month as the dot-com crash deepened. FY03 gave +115% to those who stayed. The recovery was explosive.' },
  ],
  FY09: [
    { month: 1, asset: 'nifty', whisper: 'Nifty fell 6.8% this month. Every investor who held through FY09 saw +76% recovery in FY10 — one of the fastest rebounds in history.' },
    { month: 1, asset: 'midcap', whisper: 'Midcaps down 8.4% — painful. But FY10 gave midcap investors +99% from these exact levels.' },
    { month: 1, asset: 'smallcap', whisper: 'Smallcaps crashed 11.2%. Terrifying. But those who held saw +122% in the next 12 months.' },
    { month: 3, asset: 'nifty', whisper: 'Nifty lost 8.4%. This was the month when most retail investors panic-sold. Those who stayed earned it back within 15 months.' },
    { month: 3, asset: 'midcap', whisper: 'Midcaps down 11.2%. At this point, selling felt logical. But FY10 reversed everything for patient investors.' },
    { month: 3, asset: 'smallcap', whisper: 'Smallcaps crashed 14.8%. The worst month for small companies. Those who didn\'t sell saw 122% gains in 12 months.' },
    { month: 4, asset: 'midcap', whisper: 'Midcaps lost another 6.8%. Cumulative losses are gut-wrenching. But the bottom is forming — recovery starts within months.' },
    { month: 4, asset: 'smallcap', whisper: 'Smallcaps down 9.2%. Pain compounding on pain. But this is exactly when the bargain buying opportunity of a decade forms.' },
    { month: 5, asset: 'nifty', whisper: 'Nifty fell 6.1%. The fear in September 2008 was unlike anything seen before. But markets bottomed within 6 months from here.' },
    { month: 5, asset: 'midcap', whisper: 'Midcaps lost 8.4%. Every headline screamed sell. Those who ignored the noise were rewarded enormously.' },
    { month: 5, asset: 'smallcap', whisper: 'Smallcaps down 11.8%. Markets are pricing in the end of the world. They were wrong. Recovery came faster than anyone predicted.' },
    { month: 6, asset: 'nifty', whisper: 'Nifty fell 12.4% — the worst single month of the 2008 crisis. Lehman collapsed. Everyone who held from here was in profit by late 2009.' },
    { month: 6, asset: 'midcap', whisper: 'Midcaps crashed 16.2% in a single month. This was panic. But panic creates the best buying prices.' },
    { month: 6, asset: 'smallcap', whisper: 'Smallcaps fell 21.4% — catastrophic. But FY10 delivered +122% from these lows. The darkest hour was right before dawn.' },
    { month: 7, asset: 'nifty', whisper: 'Nifty down 8.8%. The relentless sell-off continues. Within 6 months, markets start their fastest recovery ever.' },
    { month: 7, asset: 'midcap', whisper: 'Midcaps lost 12.4%. At this point you\'re either out or committed. Those committed saw +99% in 12 months.' },
    { month: 7, asset: 'smallcap', whisper: 'Smallcaps crashed 16.8%. The pain feels permanent. It wasn\'t. FY10 was the greatest recovery year in Indian market history.' },
    { month: 9, asset: 'midcap', whisper: 'Midcaps fell 5.8% even as Nifty stabilized. Small segments recover last but recover hardest. Patience rewards most here.' },
    { month: 9, asset: 'smallcap', whisper: 'Smallcaps down 8.4%. The final leg of despair. From here, the recovery begins in earnest.' },
  ],
  FY16: [
    { month: 6, asset: 'smallcap', whisper: 'China fears hit Indian smallcaps. They fell back to this level but recovered fully within 14 months and outperformed in FY17.' },
  ],
  FY17: [
    { month: 7, asset: 'smallcap', whisper: 'Demonetisation hit smallcaps hard — 5.1% drop. But smallcap recovered fully within 14 months and outperformed largecap in FY18.' },
  ],
  FY20: [
    { month: 10, asset: 'nifty', whisper: 'Nifty fell 8.2% as COVID fears grew. Every investor who held through this was back in profit by September 2020 — 6 months later.' },
    { month: 10, asset: 'midcap', whisper: 'Midcaps dropped 10.1% in February 2020. COVID fear was spreading. By December 2020, midcaps had recovered everything and then some.' },
    { month: 10, asset: 'smallcap', whisper: 'Smallcaps crashed 12.4%. The fear was real. But FY21 delivered +113% to those who didn\'t sell here.' },
    { month: 11, asset: 'nifty', whisper: 'Nifty fell 23% this month alone. Every investor who held through this was back in profit by September 2020 — 6 months later.' },
    { month: 11, asset: 'midcap', whisper: 'Midcaps crashed 28.4% in March 2020. The worst month for midcaps since 2008. FY21 recovery: +92%. Patience was the only strategy.' },
    { month: 11, asset: 'smallcap', whisper: 'Smallcaps fell 32.1% in a single month. The scariest number on this screen. FY21 delivered +113%. Every penny came back and more.' },
  ],
  FY22: [
    { month: 11, asset: 'smallcap', whisper: 'Smallcaps fell 6.1% as Russia-Ukraine war fears peaked. By FY23, markets had absorbed the shock and smallcaps recovered.' },
  ],
}

export function getWhispers(fy: string, month: number): Whisper[] {
  const whispers = FY_WHISPERS[fy]
  if (!whispers) return []
  return whispers.filter(w => w.month === month)
}

// ── KINU Context — hardcoded 60-word context per FY (Message 1 in debrief) ─

export const FY_KINU_CONTEXT: Record<string, string> = {
  FY01: 'FY01 was the dot-com crash year. US tech stocks collapsed, dragging Indian IT with them. Nifty fell 16%. This was the first major crash many investors experienced. Fear was universal. FD investors felt vindicated. But the seeds of the greatest bull run in Indian history were planted in these ashes. FY03 delivered +72%.',
  FY02: 'FY01 aftermath. Markets were flat — Nifty fell just 3%. The dot-com fear lingered, keeping most retail investors away. 9/11 added to the terror. But this was the year to accumulate quietly. Those who started SIPs here captured the entire FY03–FY06 bull run. Patience was being tested. Patience won.',
  FY03: 'One of the greatest years in Indian market history. Nifty surged 72%. Smallcaps gained 115%. The dot-com crash was over. Stimulus, cheap valuations, and returning confidence drove a massive rally. Investors who had survived FY01 and FY02 were richly rewarded. This is what staying invested looks like.',
  FY04: 'The BJP election surprise caused a single-day 15% Nifty crash. Circuit breakers triggered. Then markets recovered completely within weeks. This year taught investors that political events create noise, not permanent damage. Growth was 11% by year-end. Steady, despite the drama.',
  FY05: 'A strong bull run year. Nifty +38%, midcaps +49%. Global liquidity flooding in. India was the darling of emerging markets. Foreign money poured into every segment. Returns looked easy. The danger of years like this: they make you think every year will be this good.',
  FY06: 'The peak of the 2003–2008 bull market. Nifty surged 67%. Smallcaps gained over 107%. Everyone was an investor. The euphoria was intoxicating. But markets that go up this fast always correct. The 2008 crash was brewing under the surface. Greed was in full control.',
  FY07: 'A quiet year. Nifty +12%. No big headlines, no panic, no euphoria. This is what most investing years actually look like. Boring, steady, and profitable. The compounding happens in years like this, when nobody is watching. A reminder that normal is good enough.',
  FY08: 'The last good year before the storm. Nifty +24%. Everything looked fine. The global financial system was already cracking at the seams, but markets hadn\'t noticed yet. Investors who joined here would face a -36% crash within 12 months. Timing teaches humility.',
  FY09: 'The Global Financial Crisis. Lehman Brothers collapsed. Credit markets froze worldwide. Nifty crashed 36%. Midcaps fell 47%. Smallcaps lost 58%. This was the worst year in a generation. Every headline screamed to sell everything. But FY10 gave +76% to those who stayed in.',
  FY10: 'The greatest recovery year in Indian market history. Nifty surged 76%. Smallcaps gained 122%. Global stimulus floods markets. Those who panicked in FY09 locked in permanent losses. Those who stayed — or bought more — saw generational wealth creation. This is the reward for courage.',
  FY11: 'A moderate year. Nifty +11%. After the FY10 euphoria, markets settled into normal territory. Returns were healthy but unremarkable. This is what sustainable investing looks like — steady gains that compound over decades without drama.',
  FY12: 'A testing year. Nifty fell 9%. European debt crisis weighed on global markets. India\'s growth slowed. SIP investors bought more units at lower prices — this is where discipline matters most. FY13 recovered with +8%, and the Modi rally followed.',
  FY13: 'Gradual recovery from the FY12 slump. Nifty +8%. Markets were slowly climbing back. Nothing exciting, nothing scary. This is the boring middle that separates patient investors from impatient ones. The Modi rally of FY14 was months away.',
  FY14: 'The Modi rally began. Nifty surged 18% on election optimism. A reminder that markets price in hope before reality. India\'s reform narrative attracted massive foreign investment. Every asset class performed well. Optimism was back after a difficult FY12.',
  FY15: 'Continuation of the Modi bull run. Nifty +28%. Multiple expansion drove returns as earnings growth lagged. Market breadth was excellent — even smallcaps gained 45%. But trees don\'t grow to the sky, and FY16 brought a -8% correction.',
  FY16: 'China devaluation fears triggered a global sell-off. Nifty fell 8%. Emerging markets were hit hard. India looked vulnerable. But this was a global sentiment shock, not an India problem. Markets recovered in FY17 with +19%. Panic sellers paid a permanent price.',
  FY17: 'Demonetisation in November 2016 caused short-term chaos. Smallcaps were hit hardest. But the economy adapted faster than expected. Nifty ended +19% for the year. The lesson: domestic policy shocks in India create temporary disruption, not structural damage.',
  FY18: 'A steady, unremarkable year. Nifty +11%. After demonetisation drama and the GST rollout, markets settled. Corporate earnings were recovering. This was a year of quiet compounding — no crashes, no euphoria, just the steady wealth-building that most investors miss.',
  FY19: 'The IL&FS crisis caused nervousness in credit markets. But equity markets held up — Nifty +15%. A divergence: debt investors faced real fear while equity investors had a decent year. Diversification across asset classes showed its value clearly.',
  FY20: 'COVID-19 pandemic. The worst single-month crash in Indian market history. Nifty fell 23% in March alone. Global lockdowns. Economic activity stopped. Fear was absolute. FD felt like the only safe choice. But FY21 delivered +70% to those who stayed invested through the panic.',
  FY21: 'The COVID recovery year. Nifty surged 70%. Smallcaps gained 113%. Global stimulus, vaccine optimism, and returning growth drove an extraordinary rally. This was the payoff for surviving FY20. Critical lesson: do not use this year as your baseline expectation. It was exceptional.',
  FY22: 'Post-COVID bull market, then Russia-Ukraine war in February 2022. Oil spiked. Inflation surged globally. Despite the chaos, Nifty still managed +15%. The market\'s ability to absorb geopolitical shocks surprised most observers. India\'s domestic story stayed strong.',
  FY23: 'A flat to negative year. Nifty -1%. Global rate hikes, recession fears, and the Adani short-seller report weighed on sentiment. FD was attractive at 7%+. But one flat year after a 70% rally isn\'t a problem — it\'s normal mean reversion.',
}

// ── Recovery Context — for the golden rule: never show loss without context ──

export const FY_RECOVERY_CONTEXT: Record<string, string> = {
  FY01: 'This FY ended -16%. Investors who held through to FY03 gained +72% — more than recovering every rupee lost.',
  FY02: 'This FY ended -3%. Mild pain, massive reward: FY03 delivered +72% to those who stayed.',
  FY09: 'This FY ended -36%. Investors who held through to FY10 gained +76% on top of this loss — the greatest recovery in Indian history.',
  FY12: 'This FY ended -9%. Within 2 years, the Modi rally pushed Nifty up +18% (FY14). Patience was rewarded.',
  FY16: 'This FY ended -8%. The very next year, FY17, delivered +19%. Those who pulled out missed a near-instant recovery.',
  FY20: 'This FY ended -26%. FY21 delivered +70.9%. Investors who stayed were in heavy profit within 12 months.',
  FY23: 'This FY ended -1%. A flat year after +70% in FY21 is normal mean reversion. Long-term trajectory unchanged.',
}

export function getRecoveryContext(fy: string): string | null {
  return FY_RECOVERY_CONTEXT[fy] || null
}

// ── Optimal Allocations per FY (reasonable, not 100% single-asset tricks) ────

export const FY_OPTIMAL_ALLOCATION: Record<string, {
  nifty: number; midcap: number; smallcap: number; debt: number; result: number
}> = {
  FY01: { nifty: 10, midcap: 0, smallcap: 0, debt: 90, result: 45800 },
  FY02: { nifty: 10, midcap: 0, smallcap: 0, debt: 90, result: 53200 },
  FY03: { nifty: 10, midcap: 30, smallcap: 50, debt: 10, result: 99500 },
  FY04: { nifty: 30, midcap: 30, smallcap: 30, debt: 10, result: 57200 },
  FY05: { nifty: 20, midcap: 30, smallcap: 40, debt: 10, result: 75800 },
  FY06: { nifty: 10, midcap: 30, smallcap: 50, debt: 10, result: 99200 },
  FY07: { nifty: 30, midcap: 30, smallcap: 30, debt: 10, result: 57800 },
  FY08: { nifty: 30, midcap: 30, smallcap: 30, debt: 10, result: 63400 },
  FY09: { nifty: 0, midcap: 0, smallcap: 0, debt: 100, result: 54350 },
  FY10: { nifty: 10, midcap: 30, smallcap: 50, debt: 10, result: 106800 },
  FY11: { nifty: 30, midcap: 30, smallcap: 30, debt: 10, result: 57200 },
  FY12: { nifty: 10, midcap: 0, smallcap: 0, debt: 90, result: 49800 },
  FY13: { nifty: 30, midcap: 30, smallcap: 30, debt: 10, result: 55200 },
  FY14: { nifty: 20, midcap: 30, smallcap: 40, debt: 10, result: 63800 },
  FY15: { nifty: 20, midcap: 30, smallcap: 40, debt: 10, result: 70500 },
  FY16: { nifty: 10, midcap: 0, smallcap: 0, debt: 90, result: 49200 },
  FY17: { nifty: 20, midcap: 30, smallcap: 40, debt: 10, result: 62800 },
  FY18: { nifty: 30, midcap: 30, smallcap: 30, debt: 10, result: 57200 },
  FY19: { nifty: 30, midcap: 30, smallcap: 30, debt: 10, result: 59500 },
  FY20: { nifty: 0, midcap: 0, smallcap: 0, debt: 100, result: 53500 },
  FY21: { nifty: 10, midcap: 30, smallcap: 50, debt: 10, result: 109200 },
  FY22: { nifty: 40, midcap: 30, smallcap: 20, debt: 10, result: 58200 },
  FY23: { nifty: 10, midcap: 0, smallcap: 0, debt: 90, result: 52800 },

}

// ── Crash Recovery Data (for the blurred right panel) ───────────────────────

export interface CrashRecovery {
  eventName: string
  explanation: string
  timeToRecovery: string
  oneYearAfter: string
  threeYearsAfter: string
}

export const FY_CRASH_RECOVERY: Record<string, CrashRecovery> = {
  FY01: {
    eventName: 'Dot-com crash',
    explanation: 'The internet bubble burst. US tech stocks collapsed, dragging Indian IT giants down with them. Nifty fell 16% for the year.',
    timeToRecovery: '24 months',
    oneYearAfter: '+72% (FY03)',
    threeYearsAfter: '+83% cumulative',
  },
  FY02: {
    eventName: '9/11 attacks',
    explanation: 'Terror attacks shocked global markets. India fell 10% in days. But the recovery from dot-com lows was already underway beneath the surface.',
    timeToRecovery: '6 months',
    oneYearAfter: '+72% (FY03)',
    threeYearsAfter: '+121% cumulative',
  },
  FY04: {
    eventName: 'Election surprise crash',
    explanation: 'BJP lost the election unexpectedly. Markets crashed 15% in a single day — circuit breakers triggered. But UPA stability restored confidence within weeks.',
    timeToRecovery: '3 weeks',
    oneYearAfter: '+38% (FY05)',
    threeYearsAfter: '+117% cumulative',
  },
  FY09: {
    eventName: 'Global Financial Crisis',
    explanation: 'Lehman Brothers collapsed in September 2008. The global credit system froze. India\'s Nifty fell 36%. This was the worst crash in a generation.',
    timeToRecovery: '18 months',
    oneYearAfter: '+76% (FY10)',
    threeYearsAfter: '+98% cumulative',
  },
  FY16: {
    eventName: 'China scare',
    explanation: 'China devalued its currency, sending shockwaves through emerging markets. India fell 8%. But this was a sentiment shock, not a structural crisis.',
    timeToRecovery: '8 months',
    oneYearAfter: '+19% (FY17)',
    threeYearsAfter: '+45% cumulative',
  },
  FY17: {
    eventName: 'Demonetisation',
    explanation: '₹500 and ₹1000 notes were banned overnight on Nov 8, 2016. Cash economy froze. Smallcaps were hit hardest. But the economy adapted faster than anyone predicted.',
    timeToRecovery: '5 months',
    oneYearAfter: '+11% (FY18)',
    threeYearsAfter: '+45% cumulative',
  },
  FY20: {
    eventName: 'COVID-19 pandemic',
    explanation: 'COVID-19 was declared a pandemic on March 11, 2020. Global markets lost $9 trillion in weeks. India\'s Nifty fell 38% from its January peak.',
    timeToRecovery: '6 months',
    oneYearAfter: '+70.9% (FY21)',
    threeYearsAfter: '+85% cumulative',
  },
  FY22: {
    eventName: 'Russia-Ukraine war',
    explanation: 'Russia invaded Ukraine in February 2022. Oil prices spiked. Global inflation surged. Markets sold off on geopolitical uncertainty. But India\'s domestic story held.',
    timeToRecovery: '4 months',
    oneYearAfter: '-1% (FY23, flat)',
    threeYearsAfter: '+20% cumulative (est)',
  },
}

// ── Month names ─────────────────────────────────────────────────────────────

const MONTH_NAMES = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar']
const MONTH_NAMES_FULL = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March']

export function getFYMonthName(monthIndex: number): string {
  return MONTH_NAMES[monthIndex] || ''
}

export function getFYMonthNameFull(monthIndex: number): string {
  return MONTH_NAMES_FULL[monthIndex] || ''
}

export function getFYMonthYear(fy: string, monthIndex: number): string {
  const data = SANDBOX_DATA[fy]
  if (!data) return ''
  const startYear = data.startCalendarYear
  const calendarYear = monthIndex < 9 ? startYear : startYear + 1
  return `${MONTH_NAMES_FULL[monthIndex]} ${calendarYear}`
}

// ── Helper functions ────────────────────────────────────────────────────────

export function getMonthlyReturns(fy: string, assetClass: keyof FYAssetReturns): number[] {
  const data = SANDBOX_DATA[fy]
  if (!data) return []
  return data.returns[assetClass]
}

export function getFYEvent(fy: string, monthIndex: number): SpecialMoment | null {
  const events = SPECIAL_MOMENTS[fy]
  if (!events) return null
  return events.find(e => e.month === monthIndex) || null
}

export function getFYLabel(fy: string): string {
  return FY_LABELS[fy] || ''
}

export function getAllFYKeys(): string[] {
  return Object.keys(SANDBOX_DATA)
}

/** Calculate final value for a given allocation and FY */
export function simulateFY(
  fy: string,
  allocation: { nifty: number; midcap: number; smallcap: number; debt: number; crypto?: number },
  totalBudget: number = 50000
): { monthlyValues: { nifty: number; midcap: number; smallcap: number; debt: number; crypto: number; total: number }[]; finalValues: { nifty: number; midcap: number; smallcap: number; debt: number; crypto: number } } {
  const data = SANDBOX_DATA[fy]
  if (!data) return { monthlyValues: [], finalValues: { nifty: 0, midcap: 0, smallcap: 0, debt: 0, crypto: 0 } }

  const cryptoAlloc = allocation.crypto || 0
  const hasCrypto = cryptoAlloc > 0 && data.returns.crypto && data.returns.crypto.length === 12

  const initial = {
    nifty: totalBudget * (allocation.nifty / 100),
    midcap: totalBudget * (allocation.midcap / 100),
    smallcap: totalBudget * (allocation.smallcap / 100),
    debt: totalBudget * (allocation.debt / 100),
    crypto: totalBudget * (cryptoAlloc / 100),
  }

  const current = { ...initial }
  const monthlyValues: { nifty: number; midcap: number; smallcap: number; debt: number; crypto: number; total: number }[] = [
    { ...current, total: current.nifty + current.midcap + current.smallcap + current.debt + current.crypto }
  ]

  for (let m = 0; m < 12; m++) {
    current.nifty *= (1 + data.returns.nifty[m] / 100)
    current.midcap *= (1 + data.returns.midcap[m] / 100)
    current.smallcap *= (1 + data.returns.smallcap[m] / 100)
    current.debt *= (1 + data.returns.debt[m] / 100)
    if (hasCrypto && data.returns.crypto) {
      current.crypto *= (1 + data.returns.crypto[m] / 100)
    }
    monthlyValues.push({
      nifty: current.nifty,
      midcap: current.midcap,
      smallcap: current.smallcap,
      debt: current.debt,
      crypto: current.crypto,
      total: current.nifty + current.midcap + current.smallcap + current.debt + current.crypto,
    })
  }

  return {
    monthlyValues,
    finalValues: { nifty: current.nifty, midcap: current.midcap, smallcap: current.smallcap, debt: current.debt, crypto: current.crypto },
  }
}

// ── Crypto Historical Returns (BTC/INR-adjusted monthly) ────────────────────
// Available FY14–FY23 only. Monthly % returns approximated from BTC/USD * USD/INR.

export const CRYPTO_RETURNS: Record<string, number[]> = {
  FY14: [45.2, -12.3, 8.7, -35.6, 22.1, -8.4, 15.3, -5.2, 42.8, -18.7, 12.4, -6.1],
  FY15: [10.2, -22.5, 8.1, -4.3, 18.7, -14.2, 6.5, -9.8, 35.4, -11.2, 22.3, -7.6],
  FY16: [-15.3, 8.4, -22.1, 12.6, -8.9, 18.3, -5.7, 32.4, -12.8, 9.1, -4.3, 15.8],
  FY17: [22.4, -8.1, 14.6, 8.3, -12.5, 32.1, -6.8, 18.9, -4.2, 45.3, 28.7, -15.4],
  FY18: [18.3, 42.5, -22.8, 15.7, -35.2, 8.4, -18.6, 12.3, -28.4, -15.3, 8.7, -22.1],
  FY19: [-12.4, 8.2, -18.5, 22.3, -8.7, 15.4, -5.2, 32.1, -12.6, 18.7, -9.3, 6.8],
  FY20: [-8.2, 12.4, -5.6, 18.3, -32.7, 8.1, -45.2, 22.5, 38.4, -12.8, 15.3, -8.7],
  FY21: [35.4, 22.8, 18.6, 42.3, 15.7, -12.4, 28.9, 18.5, -8.3, 45.2, -15.6, 22.1],
  FY22: [8.4, -18.2, 22.5, 12.3, -25.4, 15.8, -8.7, 32.1, -18.5, 8.3, -12.4, -22.6],
  FY23: [-15.2, 8.4, -22.8, 12.6, -8.3, 18.7, -12.4, 32.5, -18.2, 8.1, -5.6, 22.3],
}

/** Check if crypto data is available for a given FY */
export function hasCryptoData(fy: string): boolean {
  return fy in CRYPTO_RETURNS
}

/** Get crypto monthly returns for a given FY, or null if unavailable */
export function getCryptoReturns(fy: string): number[] | null {
  return CRYPTO_RETURNS[fy] || null
}
