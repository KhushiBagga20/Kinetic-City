/**
 * Module-level signal for triggering the new-user onboarding flow.
 *
 * Why a module variable instead of Zustand / sessionStorage?
 *  - Zustand: Firebase's onAuthStateChanged listener races and overwrites flags.
 *  - sessionStorage: React StrictMode double-mounts clear the flag on the 2nd mount.
 *  - Module variable: Written synchronously before navigate, consumed once
 *    in useState initializer — no async gaps, no double-read problem.
 */

let _pending = false

export function scheduleOnboarding(): void {
  _pending = true
}

/** Consume the flag (resets it). Returns true only the first time after scheduleOnboarding(). */
export function consumeOnboardingSignal(): boolean {
  if (_pending) {
    _pending = false
    return true
  }
  return false
}
