import { create } from 'zustand'
import type { Preset } from '@/lib/transform'

export type { Preset }

export type IconSource = 'lucide' | 'golden'

interface IconState {
  selectedIcon: string | null
  preset: Preset
  search: string
  source: IconSource
  roughnessByIcon: Record<string, number>
  titleByIcon: Record<string, string>
  selectIcon: (id: string | null) => void
  setPreset: (p: Preset) => void
  setSearch: (s: string) => void
  setSource: (s: IconSource) => void
  setRoughness: (iconId: string, value: number) => void
  setTitle: (iconId: string, value: string) => void
}

export const useIconStore = create<IconState>((set) => ({
  selectedIcon: null,
  preset: 'ink',
  search: '',
  source: 'lucide',
  roughnessByIcon: {},
  titleByIcon: {},
  selectIcon: (id) => set({ selectedIcon: id }),
  setPreset: (p) => set({ preset: p }),
  setSearch: (s) => set({ search: s }),
  setSource: (s) => set({ source: s }),
  setRoughness: (iconId, value) =>
    set((state) => ({
      roughnessByIcon: { ...state.roughnessByIcon, [iconId]: value },
    })),
  setTitle: (iconId, value) =>
    set((state) => ({
      titleByIcon: { ...state.titleByIcon, [iconId]: value },
    })),
}))
