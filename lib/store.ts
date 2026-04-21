import { create } from 'zustand'
import type { Preset } from '@/lib/transform'

export type { Preset }

interface IconState {
  selectedIcon: string | null
  preset: Preset
  search: string
  roughnessByIcon: Record<string, number>
  titleByIcon: Record<string, string>
  selectIcon: (id: string | null) => void
  setPreset: (p: Preset) => void
  setSearch: (s: string) => void
  setRoughness: (iconId: string, value: number) => void
  setTitle: (iconId: string, value: string) => void
}

export const useIconStore = create<IconState>((set) => ({
  selectedIcon: null,
  preset: 'ink',
  search: '',
  roughnessByIcon: {},
  titleByIcon: {},
  selectIcon: (id) => set({ selectedIcon: id }),
  setPreset: (p) => set({ preset: p }),
  setSearch: (s) => set({ search: s }),
  setRoughness: (iconId, value) =>
    set((state) => ({
      roughnessByIcon: { ...state.roughnessByIcon, [iconId]: value },
    })),
  setTitle: (iconId, value) =>
    set((state) => ({
      titleByIcon: { ...state.titleByIcon, [iconId]: value },
    })),
}))
