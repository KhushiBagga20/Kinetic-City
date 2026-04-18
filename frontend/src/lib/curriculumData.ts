/**
 * Curriculum Data — Structured learning tracks per fear type.
 * Each track has 5 modules with type tags, time estimates,
 * prerequisites, and fear progress increments.
 */

// ── Types ───────────────────────────────────────────────────────────────────

export type ModuleType = 'Concept' | 'Simulation' | 'Quiz' | 'Story' | 'Tool'

export interface CurriculumModule {
  id: string
  title: string
  type: ModuleType
  estimatedMinutes: number
  fearProgressIncrement: number
  prerequisite?: string  // module id that must be completed first
  trackId: FearTrack
}

export type FearTrack = 'loss' | 'jargon' | 'scam' | 'trust'

// ── Track 1 — Loss Avoider ──────────────────────────────────────────────────

export const LOSS_TRACK: CurriculumModule[] = [
  { id: 'loss-1', title: 'Your Brain on Losses', type: 'Concept', estimatedMinutes: 5, fearProgressIncrement: 8, trackId: 'loss' },
  { id: 'loss-2', title: 'The Crash History', type: 'Story', estimatedMinutes: 6, fearProgressIncrement: 10, prerequisite: 'loss-1', trackId: 'loss' },
  { id: 'loss-3', title: 'The Market Rebound', type: 'Concept', estimatedMinutes: 5, fearProgressIncrement: 12, prerequisite: 'loss-2', trackId: 'loss' },
  { id: 'loss-4', title: 'The SIP Engine', type: 'Simulation', estimatedMinutes: 5, fearProgressIncrement: 6, prerequisite: 'loss-3', trackId: 'loss' },
  { id: 'loss-5', title: 'Kinetic: Backtest the Fear', type: 'Tool', estimatedMinutes: 4, fearProgressIncrement: 8, prerequisite: 'loss-4', trackId: 'loss' },
  { id: 'loss-6', title: 'FD Trap Simulation', type: 'Simulation', estimatedMinutes: 8, fearProgressIncrement: 6, prerequisite: 'loss-5', trackId: 'loss' },
  { id: 'loss-7', title: 'Kinetic: Future Projection', type: 'Tool', estimatedMinutes: 4, fearProgressIncrement: 8, prerequisite: 'loss-6', trackId: 'loss' },
  { id: 'loss-8', title: 'Final Boss Authentication', type: 'Quiz', estimatedMinutes: 4, fearProgressIncrement: 6, prerequisite: 'loss-7', trackId: 'loss' },
  { id: 'loss-9', title: 'Your Defensive Stance', type: 'Concept', estimatedMinutes: 3, fearProgressIncrement: 8, prerequisite: 'loss-8', trackId: 'loss' },
  { id: 'loss-10', title: 'The Initiation', type: 'Tool', estimatedMinutes: 2, fearProgressIncrement: 8, prerequisite: 'loss-9', trackId: 'loss' },
]

// ── Track 2 — Clarity Seeker ────────────────────────────────────────────────

export const CLARITY_TRACK: CurriculumModule[] = [
  { id: 'clarity-1', title: 'The Illusion of Complexity', type: 'Concept', estimatedMinutes: 5, fearProgressIncrement: 8, trackId: 'jargon' },
  { id: 'clarity-2', title: 'The only 2 words you need', type: 'Story', estimatedMinutes: 6, fearProgressIncrement: 8, prerequisite: 'clarity-1', trackId: 'jargon' },
  { id: 'clarity-3', title: 'How SIP actually works', type: 'Simulation', estimatedMinutes: 5, fearProgressIncrement: 10, prerequisite: 'clarity-2', trackId: 'jargon' },
  { id: 'clarity-4', title: 'Growth Mathematics', type: 'Tool', estimatedMinutes: 8, fearProgressIncrement: 10, prerequisite: 'clarity-3', trackId: 'jargon' },
  { id: 'clarity-5', title: 'Kinetic: Anti-Jargon Mode', type: 'Tool', estimatedMinutes: 4, fearProgressIncrement: 6, prerequisite: 'clarity-4', trackId: 'jargon' },
  { id: 'clarity-6', title: 'Look at a Fund Sheet', type: 'Concept', estimatedMinutes: 8, fearProgressIncrement: 6, prerequisite: 'clarity-5', trackId: 'jargon' },
  { id: 'clarity-7', title: 'Kinetic: Deep Dive', type: 'Tool', estimatedMinutes: 4, fearProgressIncrement: 8, prerequisite: 'clarity-6', trackId: 'jargon' },
  { id: 'clarity-8', title: 'Final Boss Authentication', type: 'Quiz', estimatedMinutes: 4, fearProgressIncrement: 6, prerequisite: 'clarity-7', trackId: 'jargon' },
  { id: 'clarity-9', title: 'Your Defensive Stance', type: 'Concept', estimatedMinutes: 3, fearProgressIncrement: 8, prerequisite: 'clarity-8', trackId: 'jargon' },
  { id: 'clarity-10', title: 'The Initiation', type: 'Tool', estimatedMinutes: 2, fearProgressIncrement: 8, prerequisite: 'clarity-9', trackId: 'jargon' },
]

// ── Track 3 — Pattern Detector ──────────────────────────────────────────────

export const PATTERN_TRACK: CurriculumModule[] = [
  { id: 'pattern-1', title: 'The Pattern of Deception', type: 'Concept', estimatedMinutes: 5, fearProgressIncrement: 12, trackId: 'scam' },
  { id: 'pattern-2', title: 'The SEBI Shield', type: 'Story', estimatedMinutes: 6, fearProgressIncrement: 8, prerequisite: 'pattern-1', trackId: 'scam' },
  { id: 'pattern-3', title: 'How Money is Actually Held', type: 'Concept', estimatedMinutes: 5, fearProgressIncrement: 8, prerequisite: 'pattern-2', trackId: 'scam' },
  { id: 'pattern-4', title: 'Verify Your App', type: 'Tool', estimatedMinutes: 4, fearProgressIncrement: 6, prerequisite: 'pattern-3', trackId: 'scam' },
  { id: 'pattern-5', title: 'Kinetic: True Data', type: 'Tool', estimatedMinutes: 4, fearProgressIncrement: 14, prerequisite: 'pattern-4', trackId: 'scam' },
  { id: 'pattern-6', title: 'Mathematical Growth', type: 'Simulation', estimatedMinutes: 8, fearProgressIncrement: 6, prerequisite: 'pattern-5', trackId: 'scam' },
  { id: 'pattern-7', title: 'Kinetic: Transparency Engine', type: 'Tool', estimatedMinutes: 4, fearProgressIncrement: 8, prerequisite: 'pattern-6', trackId: 'scam' },
  { id: 'pattern-8', title: 'Final Boss Authentication', type: 'Quiz', estimatedMinutes: 4, fearProgressIncrement: 6, prerequisite: 'pattern-7', trackId: 'scam' },
  { id: 'pattern-9', title: 'Your Defensive Stance', type: 'Concept', estimatedMinutes: 3, fearProgressIncrement: 8, prerequisite: 'pattern-8', trackId: 'scam' },
  { id: 'pattern-10', title: 'The Initiation', type: 'Tool', estimatedMinutes: 2, fearProgressIncrement: 8, prerequisite: 'pattern-9', trackId: 'scam' },
]

// ── Track 4 — Independence Guardian ─────────────────────────────────────────

export const INDEPENDENCE_TRACK: CurriculumModule[] = [
  { id: 'trust-1', title: 'The Human Failure', type: 'Concept', estimatedMinutes: 5, fearProgressIncrement: 8, trackId: 'trust' },
  { id: 'trust-2', title: 'The Autonomous Index', type: 'Concept', estimatedMinutes: 6, fearProgressIncrement: 8, prerequisite: 'trust-1', trackId: 'trust' },
  { id: 'trust-3', title: 'Active vs Passive Race', type: 'Simulation', estimatedMinutes: 5, fearProgressIncrement: 10, prerequisite: 'trust-2', trackId: 'trust' },
  { id: 'trust-4', title: 'Kinetic: Autonomous Control', type: 'Tool', estimatedMinutes: 4, fearProgressIncrement: 8, prerequisite: 'trust-3', trackId: 'trust' },
  { id: 'trust-5', title: 'The Fee Drain', type: 'Simulation', estimatedMinutes: 8, fearProgressIncrement: 12, prerequisite: 'trust-4', trackId: 'trust' },
  { id: 'trust-6', title: 'India\'s GDP vs You', type: 'Story', estimatedMinutes: 8, fearProgressIncrement: 6, prerequisite: 'trust-5', trackId: 'trust' },
  { id: 'trust-7', title: 'Kinetic: The Simulation', type: 'Tool', estimatedMinutes: 4, fearProgressIncrement: 8, prerequisite: 'trust-6', trackId: 'trust' },
  { id: 'trust-8', title: 'Final Boss Authentication', type: 'Quiz', estimatedMinutes: 4, fearProgressIncrement: 6, prerequisite: 'trust-7', trackId: 'trust' },
  { id: 'trust-9', title: 'Your Defensive Stance', type: 'Concept', estimatedMinutes: 3, fearProgressIncrement: 8, prerequisite: 'trust-8', trackId: 'trust' },
  { id: 'trust-10', title: 'The Initiation', type: 'Tool', estimatedMinutes: 2, fearProgressIncrement: 8, prerequisite: 'trust-9', trackId: 'trust' },
]

// ── Crypto Module (standalone, informational only) ──────────────────────────

export const CRYPTO_MODULE: CurriculumModule = {
  id: 'crypto-1',
  title: 'Crypto: what the data actually says',
  type: 'Concept',
  estimatedMinutes: 6,
  fearProgressIncrement: 0, // informational — does not affect fear progress
  trackId: 'loss', // available to all, not tied to a specific track
}

// ── Helpers ─────────────────────────────────────────────────────────────────

export const ALL_TRACKS: Record<FearTrack, CurriculumModule[]> = {
  loss: LOSS_TRACK,
  jargon: CLARITY_TRACK,
  scam: PATTERN_TRACK,
  trust: INDEPENDENCE_TRACK,
}

export const TRACK_NAMES: Record<FearTrack, string> = {
  loss: 'Loss Avoider',
  jargon: 'Clarity Seeker',
  scam: 'Pattern Detector',
  trust: 'Independence Guardian',
}

export const TRACK_COLORS: Record<FearTrack, string> = {
  loss: '#E24B4A',
  jargon: '#378ADD',
  scam: '#EF9F27',
  trust: '#1D9E75',
}

export const TYPE_COLORS: Record<ModuleType, string> = {
  Concept: '#378ADD',
  Simulation: '#1D9E75',
  Quiz: '#EF9F27',
  Story: '#c0f18e',
  Tool: '#E24B4A',
}

export function getTrackForFear(fearType: string): CurriculumModule[] {
  return ALL_TRACKS[fearType as FearTrack] || LOSS_TRACK
}

export function isModuleLocked(
  module: CurriculumModule,
  completedModules: string[]
): boolean {
  if (!module.prerequisite) return false
  return !completedModules.includes(module.prerequisite)
}

export function getNextModule(
  track: CurriculumModule[],
  completedModules: string[]
): CurriculumModule | null {
  return track.find(m => !completedModules.includes(m.id) && !isModuleLocked(m, completedModules)) || null
}
