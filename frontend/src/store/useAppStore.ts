import { create } from 'zustand'

interface AppState {
  view: 'landing' | 'dashboard'
  setView: (view: 'landing' | 'dashboard') => void
}

export const useAppStore = create<AppState>((set) => ({
  view: 'landing',
  setView: (view) => set({ view })
}))
