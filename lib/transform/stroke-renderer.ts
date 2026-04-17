export type Preset = 'pencil' | 'ink' | 'sketchy'

export type RenderMode = 'filter' | 'rough'

export interface PresetConfig {
  label: string
  color: string
  strokeWidth: number
  mode: RenderMode

  // Filter-mode params (clean stroke + feTurbulence + feDisplacementMap)
  // Higher baseFrequency = finer grain. Higher scale = more edge wobble.
  baseFrequency?: number
  numOctaves?: number
  displacementScale?: number

  // Rough-mode params (rough.js path distortion)
  roughness?: number
  bowing?: number
  disableMultiStroke?: boolean
}

export const PRESETS: Record<Preset, PresetConfig> = {
  ink: {
    label: 'Ink',
    color: '#0f0f0f',
    strokeWidth: 1.4,
    mode: 'filter',
    baseFrequency: 0.85,
    numOctaves: 2,
    displacementScale: 0.35,
  },
  pencil: {
    label: 'Pencil',
    color: '#4b4b4b',
    strokeWidth: 1.15,
    mode: 'filter',
    baseFrequency: 1.2,
    numOctaves: 2,
    displacementScale: 0.55,
  },
  sketchy: {
    label: 'Sketchy',
    color: '#111111',
    strokeWidth: 1.5,
    mode: 'rough',
    roughness: 1.4,
    bowing: 1.8,
    disableMultiStroke: false,
  },
}
