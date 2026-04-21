// ── Page title management ────────────────────────────────────────────────────

const BASE = 'KINETIC'

const SECTION_TITLES: Record<string, string> = {
  home:          'Dashboard',
  portfolio:     'Portfolio',
  simulation:    'My Simulation',
  'time-machine':'Time Machine',
  sandbox:       'Sandbox',
  harvest:       'Harvest Room',
  historical:    'Historical Simulators',
  learn:         'Learn',
  compare:       'Compare',
  calculators:   'Calculators',
  'fear-profile':'Fear Profile',
  kinu:          'KINU',
  'my-card':     'My Card',
  profile:       'Profile',
  'module-reader':'Learning',
  roadmap:       'Roadmap',
  'her-journey': 'Her Journey',
}

/** Set the browser tab title for a given dashboard section. */
export function setPageTitle(section: string): void {
  const label = SECTION_TITLES[section]
  document.title = label ? `${label} — ${BASE}` : BASE
}

/** Set the browser tab title for the marketing landing page. */
export function setLandingTitle(): void {
  document.title = `${BASE} — The Future of Finance`
}
