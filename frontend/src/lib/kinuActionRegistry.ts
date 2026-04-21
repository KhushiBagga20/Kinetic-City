/**
 * kinuActionRegistry — global action map for KINU
 *
 * Pages register callbacks for the actions KINU can trigger on them.
 * The floating KINU button reads from this registry when executing AI-triggered actions.
 *
 * Usage (in a page):
 *   useEffect(() => {
 *     kinuRegistry.register('start_simulation', () => runSimulation())
 *     return () => kinuRegistry.unregister('start_simulation')
 *   }, [runSimulation])
 */

export type KinuActionKey =
  | 'mark_module_complete'
  | 'start_simulation'
  | 'open_portfolio_setup'
  | 'go_to_next_module'
  | 'go_to_prev_module'
  | 'scroll_to_chart'
  | 'run_time_machine'
  | 'run_sandbox'
  | 'show_harvest'

const _registry: Partial<Record<KinuActionKey, () => void>> = {}

export const kinuRegistry = {
  register(key: KinuActionKey, fn: () => void) {
    _registry[key] = fn
  },
  unregister(key: KinuActionKey) {
    delete _registry[key]
  },
  execute(key: string): boolean {
    const fn = _registry[key as KinuActionKey]
    if (fn) {
      fn()
      return true
    }
    return false
  },
  has(key: string): boolean {
    return key in _registry
  },
}
