import { create } from 'zustand'
import type { Preset } from '@/lib/transform'

export type { Preset }

interface IconState {
  selectedIcon: string | null
  preset: Preset
  search: string
  selectIcon: (id: string | null) => void
  setPreset: (p: Preset) => void
  setSearch: (s: string) => void
}

export const useIconStore = create<IconState>((set) => ({
  selectedIcon: null,
  preset: 'ink',
  search: '',
  selectIcon: (id) => set({ selectedIcon: id }),
  setPreset: (p) => set({ preset: p }),
  setSearch: (s) => set({ search: s }),
}))
